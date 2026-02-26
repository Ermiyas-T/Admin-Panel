import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

interface ErrorWithStatus extends Error {
  status?: number;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Default to 500 internal server error
  const status = err.status || 500;
  const message = err.message || "Something went wrong";

  res.status(status).json({
    message,
    // In development, include stack trace for debugging
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
