import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

// Access token payload - minimal data (no permissions)
export interface AccessTokenPayload {
  userId: string;
  type: "access";
  iat?: number;
  exp?: number;
}

// Refresh token payload
export interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
  iat?: number;
  exp?: number;
}

// Legacy payload (for backward compatibility during transition)
export interface LegacyJwtPayload {
  userId: string;
  permissions: string[];
}

// Union type for token verification
export type JwtPayload = AccessTokenPayload | RefreshTokenPayload | LegacyJwtPayload;

// Type guards
export function isAccessToken(payload: JwtPayload): payload is AccessTokenPayload {
  return "type" in payload && payload.type === "access";
}

export function isRefreshToken(payload: JwtPayload): payload is RefreshTokenPayload {
  return "type" in payload && payload.type === "refresh";
}

export function isLegacyToken(payload: JwtPayload): payload is LegacyJwtPayload {
  return "permissions" in payload && !("type" in payload);
}

/**
 * Generate access token (short-lived, contains only userId)
 */
export const signAccessToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as any };
  return jwt.sign({ userId, type: "access" }, env.JWT_SECRET, options);
};

/**
 * Generate refresh token (long-lived, stored in Redis)
 */
export const signRefreshToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as any };
  return jwt.sign({ userId, type: "refresh" }, env.JWT_SECRET, options);
};

/**
 * Legacy token signer (for backward compatibility)
 */
export const signToken = (payload: LegacyJwtPayload): string => {
  const options: SignOptions = { expiresIn: "1d" };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Verify any token type
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

/**
 * Get token expiry in seconds (for client response)
 */
export const getTokenExpirySeconds = (tokenType: "access" | "refresh"): number => {
  const expiry = tokenType === "access" ? env.JWT_ACCESS_EXPIRY : env.JWT_REFRESH_EXPIRY;
  // Parse expiry string (e.g., "15m" -> 900 seconds)
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 900;
  }
};
