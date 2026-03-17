import bcrypt from "bcrypt";
import prisma from "../config/db";
import { signAccessToken, signRefreshToken, JwtPayload } from "../utils/jwt";
import cacheService from "./cache.service";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    permissions: string[];
  };
}

export class AuthService {
  // Register a new user
  async registerUser(email: string, password: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    return { id: user.id, email: user.email };
  }

  /**
   * Fetch user permissions from database
   * (Used on login and cache miss)
   */
  private async fetchUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Gather all permissions from all roles
    const permissionStrings: string[] = [];
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        const perm = rp.permission;
        permissionStrings.push(`${perm.action}:${perm.subject}`);
      }
    }
    // Remove duplicates
    return [...new Set(permissionStrings)];
  }

  /**
   * Get permissions with cache fallback
   */
  async getPermissions(userId: string): Promise<string[]> {
    // Try cache first
    const cached = await cacheService.getPermissions(userId);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from DB
    const permissions = await this.fetchUserPermissions(userId);
    
    // Cache for next time
    await cacheService.cachePermissions(userId, permissions);
    
    return permissions;
  }

  /**
   * Login user and return access + refresh tokens
   */
  async loginUser(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Compare password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    // Get permissions (with caching)
    const permissions = await this.getPermissions(user.id);

    // Generate tokens
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token in Redis
    await cacheService.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: { id: user.id, email: user.email, permissions },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: string, refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    // Validate refresh token exists in Redis
    const isValid = await cacheService.validateRefreshToken(userId, refreshToken);
    if (!isValid) {
      throw new Error("Invalid or expired refresh token");
    }

    // Get permissions (with caching)
    const permissions = await this.getPermissions(userId);

    // Generate new access token
    const accessToken = signAccessToken(userId);

    return {
      accessToken,
      expiresIn: 900,
    };
  }

  /**
   * Logout user - invalidate refresh token
   */
  async logoutUser(userId: string): Promise<void> {
    await cacheService.clearUserCache(userId);
  }

  /**
   * Invalidate permissions cache for a user
   * (Call this when user's roles/permissions change)
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    await cacheService.invalidatePermissions(userId);
    await cacheService.incrementPermissionVersion(userId);
  }
}
