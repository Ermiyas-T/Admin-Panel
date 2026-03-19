import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { verifyToken, isRefreshToken } from "../utils/jwt";
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setAuthCookies,
} from "../utils/authCookies";

const authService = new AuthService();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await authService.registerUser(email, password);
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await authService.loginUser(email, password);
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(200).json({
      message: "Login successful",
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken =
      (req.cookies?.refreshToken as string | undefined) || req.body?.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken);
    
    if (!isRefreshToken(payload)) {
      return res.status(401).json({ message: "Invalid token type" });
    }

    // Get new access token
    const result = await authService.refreshAccessToken(payload.userId, refreshToken);
    setAccessTokenCookie(res, result.accessToken);
    
    res.status(200).json({
      message: "Token refreshed",
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user - invalidate refresh token
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    await authService.logoutUser(req.user.id);
    clearAuthCookies(res);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's permissions (for client sync)
 */
export const getMyPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const permissions = await authService.getPermissions(req.user.id);
    
    res.status(200).json({
      permissions,
      // Include a timestamp for cache validation on client
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
