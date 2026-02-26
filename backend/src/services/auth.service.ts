import bcrypt from "bcrypt";
import prisma from "../config/db";
import { signToken, JwtPayload } from "../utils/jwt";

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

  // Login user and return JWT
  async loginUser(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
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
      throw new Error("Invalid credentials");
    }

    // Compare password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    // Gather all permissions from all roles
    const permissionStrings: string[] = [];
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        const perm = rp.permission;
        permissionStrings.push(`${perm.action}:${perm.subject}`);
      }
    }
    // Remove duplicates (if same permission appears in multiple roles)
    const uniquePermissions = [...new Set(permissionStrings)];

    // Create JWT payload
    const payload: JwtPayload = {
      userId: user.id,
      permissions: uniquePermissions,
    };

    const token = signToken(payload);

    return {
      token,
      user: { id: user.id, email: user.email, permissions: uniquePermissions },
    };
  }
}
