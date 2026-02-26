import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import healthRouter from "./routes/health";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import authRoute from "./routes/auth.routes";
import postRouter from "./routes/post.routes";

const app: Application = express();

// Middleware
app.use(morgan("dev"));
app.use(cors()); // Enable CORS for all routes (adjust in production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRouter); // Import post routes
// 404 handler for unmatched routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
