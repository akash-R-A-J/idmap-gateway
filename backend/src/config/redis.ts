import { createClient } from "redis";
import logger from "../config/logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  try {
    if (redisClient && redisClient.isOpen) return redisClient;

    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
      },
    });

    redisClient.on("connect", () => logger.info("✅ Redis connected"));
    redisClient.on("ready", () => logger.info("🟢 Redis ready"));
    redisClient.on("end", () => logger.warn("⚠️ Redis connection closed"));
    redisClient.on("reconnecting", () => logger.info("🔁 Reconnecting to Redis..."));
    redisClient.on("error", (err) =>
      logger.error({ err }, "❌ Redis client error")
    );

    await redisClient.connect();

    // Optional ping keep-alive
    setInterval(async () => {
      if (redisClient?.isOpen) {
        try {
          await redisClient.ping();
        } catch (err) {
          logger.warn("Redis ping failed, attempting reconnect...");
          try {
            await redisClient.connect();
          } catch (e) {
            logger.error({ err: e }, "Redis reconnect failed");
          }
        }
      }
    }, 60000);

    return redisClient;
  } catch (err) {
    logger.error({ err }, "Failed to connect Redis");
    throw err;
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  if (redisClient) {
    logger.info("Closing Redis client connection...");
    try {
      await redisClient.quit();
      logger.info("Redis client closed successfully.");
    } catch (err) {
      logger.error({ err }, "Error closing Redis client");
    }
  }
  process.exit(0);
});
