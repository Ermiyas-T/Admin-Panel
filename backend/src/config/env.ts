import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface Env {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
}

// Validate required variables and provide defaults
function getEnv(): Env {
  const { NODE_ENV, PORT, DATABASE_URL, JWT_SECRET } = process.env;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return {
    NODE_ENV: NODE_ENV || "development",
    PORT: parseInt(PORT || "3001", 10),
    DATABASE_URL,
    JWT_SECRET,
  };
}

export const env = getEnv();
