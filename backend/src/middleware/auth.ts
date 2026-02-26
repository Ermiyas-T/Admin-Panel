// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export const authenticate = (
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
    const { userId, permissions } = verifyToken(token);
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
