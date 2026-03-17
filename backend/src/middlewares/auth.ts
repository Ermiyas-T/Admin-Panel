// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, isAccessToken, isLegacyToken } from "../utils/jwt";
import cacheService from "../services/cache.service";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    // Validate it's an access token (new format) or legacy token
    if (!isAccessToken(payload) && !isLegacyToken(payload)) {
      return res.status(401).json({ message: "Invalid token type" });
    }

    const userId = payload.userId;

    // Get permissions from cache (or legacy token)
    let permissions: string[];
    if (isLegacyToken(payload)) {
      // Legacy token - permissions embedded in token
      permissions = payload.permissions;
    } else {
      // New token - fetch from Redis cache
      const cachedPermissions = await cacheService.getPermissions(userId);
      if (!cachedPermissions) {
        // Cache miss - user may need to re-login
        return res.status(401).json({ message: "Session expired, please login again" });
      }
      permissions = cachedPermissions;
    }

    // Attach user info to request object for downstream middleware/routes
    req.user = {
      id: userId,
      permissions,
    };
    next();
  } catch (error) {
    // Token invalid or expired
    return res.status(401).json({ message: "Unauthorized" });
  }
};
