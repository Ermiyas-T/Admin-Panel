import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "",
  COOKIE_SECURE: process.env.COOKIE_SECURE || "",
};
