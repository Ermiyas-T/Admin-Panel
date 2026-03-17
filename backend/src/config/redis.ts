import Redis from "ioredis";
import { env } from "./env";

// Track Redis connection status
export let isRedisConnected = false;
export let isRedisAvailable = false;

// Create Redis client with connection pooling
export const redis = new Redis({
  host: env.REDIS_HOST || "localhost",
  port: parseInt(env.REDIS_PORT || "6379"),
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    // Reconnect after 1s, 2s, 3s...
    const delay = Math.min(times * 1000, 3000);
    return delay;
  },
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

// Connection event listeners
redis.on("connect", () => {
  console.log("✅ Redis connected");
  isRedisConnected = true;
  isRedisAvailable = true;
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
  isRedisConnected = false;
  // Don't set isRedisAvailable to false immediately - allow retries
});

redis.on("close", () => {
  console.log("⚠️  Redis connection closed");
  isRedisConnected = false;
});

redis.on("ready", () => {
  console.log("✅ Redis ready");
  isRedisAvailable = true;
});

// Graceful shutdown
export const closeRedis = async () => {
  await redis.quit();
  console.log("Redis connection closed gracefully");
};

export default redis;
