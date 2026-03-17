import "dotenv/config";
import { env } from "./config/env";
import app from "./app";
import { closeRedis } from "./config/redis";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    console.log("HTTP server closed");
    await closeRedis();
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(async () => {
    console.log("HTTP server closed");
    await closeRedis();
    console.log("Process terminated");
    process.exit(0);
  });
});
