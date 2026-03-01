import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import healthRouter from "./routes/health";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import authRoute from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import userRouter from "./routes/user.routes";
import roleRouter from "./routes/role.routes";
import permissionRouter from "./routes/permission.routes";
import userRoleRouter from "./routes/userRole.routes";

const app: Application = express();

// Middleware
app.use(morgan("dev"));
app.use(cors()); // Enable CORS for all routes (adjust in production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRouter);
app.use("/api/users", userRouter);
app.use("/api/roles", roleRouter);
app.use("/api/permissions", permissionRouter);
app.use("/api/user-roles", userRoleRouter);
// 404 handler for unmatched routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
