import { Pool } from "pg";
import logger from "../config/logger.js";
import "dotenv/config";

// Check for required env variable
if (!process.env.PG_URL) {
  logger.warn("PG_URL not found in environment. Using fallback local connection string.");
}

export const pool = new Pool({
  connectionString:
    process.env.PG_URL as string || "postgresql://postgres:password@localhost:5433/idmap_db",
});

pool
  .connect()
  .then(() => logger.info("Connected to PostgreSQL successfully"))
  .catch((err) => logger.error("PostgreSQL connection error:", err));
