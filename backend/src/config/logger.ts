import pino from "pino";

/**
 * Logger Configuration
 * --------------------
 * Uses Pino for fast, structured logging.
 * - In development: pretty-prints with colors and timestamps.
 * - In production: outputs JSON logs for performance and compatibility with log aggregators.
 */

const isProd = process.env.NODE_ENV === "production";

// Configure pretty-print transport for development
const transport = !isProd
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,            // Enable colors in terminal
        translateTime: "SYS:standard", // Add readable timestamps
        ignore: "pid,hostname",    // Clean output
      },
    })
  : undefined;

// Initialize logger
const logger = pino(
  {
    level: isProd ? "info" : "debug", // Log more details in dev mode
  },
  transport
);

export default logger;
