import { createClient } from "redis";
import logger from "../config/logger.js"; // assuming you have a pino logger setup

/**
 * --------------------------------------------------------------------
 * Redis Client Manager
 * --------------------------------------------------------------------
 * Purpose:
 *   - Maintain a single shared Redis client instance across the app.
 *   - Prevent multiple connections to Redis (which can waste resources).
 * 
 * Features:
 *   - Lazy initialization (connect only when first needed)
 *   - Event listeners for connection monitoring
 *   - Graceful shutdown on SIGINT (Ctrl+C / process termination)
 * 
 * Environment Variables:
 *   - REDIS_URL: Redis connection string (e.g., redis://localhost:6379)
 * --------------------------------------------------------------------
 */

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Singleton Redis client instance (initialized lazily)
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * getRedisClient()
 * --------------------------------------------------------------------
 * Returns a connected Redis client.
 * If not already initialized, creates a new one and connects it.
 * 
 * @returns Redis client instance
 * --------------------------------------------------------------------
 */

export const getRedisClient = async () => {
  try {
    // if already open, reuse
    if (redisClient && redisClient.isOpen) return redisClient;

    // if closed or undefined, create new client
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries) => {
          // exponential backoff (up to 5s)
          return Math.min(retries * 100, 5000);
        },
      },
    });

    // logs
    redisClient.on("connect", () => logger.info("✅ Redis connected"));
    redisClient.on("ready", () => logger.info("🟢 Redis ready"));
    redisClient.on("end", () => logger.warn("⚠️ Redis connection closed"));
    redisClient.on("reconnecting", () => logger.info("🔁 Reconnecting to Redis..."));
    redisClient.on("error", (err) =>
      logger.error({ err }, "❌ Redis client error")
    );

    // connect (if not already)
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // keep alive (optional)
    setInterval(async () => {
      if (redisClient?.isOpen) {
        try {
          await redisClient.ping();
        } catch (err) {
          logger.warn("Redis ping failed, reconnecting...");
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



// export const getRedisClient = (): ReturnType<typeof createClient> => {
//   if (!redisClient) {
//     redisClient = createClient({ url: REDIS_URL });

//     // --- Event listeners for visibility and debugging ---
//     redisClient.on("connect", () => {
//       logger.info(`Connected to Redis at ${REDIS_URL}`);
//     });

//     redisClient.on("error", (err) => {
//       logger.error({ err }, "Redis connection error");
//     });

//     redisClient.on("end", () => {
//       logger.warn("Redis client disconnected");
//     });

//     // 👇 Auto-connect once
//     redisClient.connect().catch((err) => {
//       logger.error({ err }, "Redis connection error during initial connect");
//     });
//   }

//   return redisClient;
// };


/**
 * Graceful shutdown handler
 * --------------------------------------------------------------------
 * Closes the Redis connection when the Node.js process is terminated.
 * Ensures no dangling connections remain.
 * --------------------------------------------------------------------
 */
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
