import express, { Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import healthRouter from "./routes/health";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app: Application = express();

// Middleware
app.use(cors()); // Enable CORS for all routes (adjust in production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api/health", healthRouter);

// 404 handler for unmatched routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
