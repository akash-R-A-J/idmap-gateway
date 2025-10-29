import { createClient } from "redis";

/**
 * --------------------------------------------------------------------
 * Redis Client Manager
 * --------------------------------------------------------------------
 * This module ensures that only a single Redis client instance
 * is created and reused across the entire application.
 * 
 * The connection is established once and remains active while
 * the application is running. On shutdown, it will gracefully close.
 * --------------------------------------------------------------------
 */

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Returns a connected Redis client instance.
 * If not already connected, it initializes the connection.
 */
export const getRedisClient = (): ReturnType<typeof createClient> => {
  if (!redisClient) {
    redisClient = createClient({ url: REDIS_URL });

    // Attach connection event listeners (optional but useful for monitoring)
    redisClient.on("connect", () => {
      console.log("Redis client connected");
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redisClient.on("end", () => {
      console.log("Redis client disconnected");
    });
  }

  return redisClient;
};

/**
 * Gracefully close Redis connection when the process exits.
 */
process.on("SIGINT", async () => {
  if (redisClient) {
    console.log("Closing Redis client connection...");
    await redisClient.quit();
  }
  process.exit(0);
});
