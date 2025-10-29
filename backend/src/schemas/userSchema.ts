import { pool } from "../config/db.js";
import logger from "../config/logger.js";

/**
 * --------------------------------------------------------------------
 * initUserDB
 * --------------------------------------------------------------------
 * Initializes the `user_schema` and its associated `users` table.
 * Ensures the schema exists and creates the table if it does not already exist.
 *
 * Columns:
 * - id: Primary key (auto-increment)
 * - email: Unique user email
 * - created_at: Timestamp for when the user record was created
 * --------------------------------------------------------------------
 */
export const initUserDB = async () => {
  try {
    // Create schema if it doesn't exist
    await pool.query(`CREATE SCHEMA IF NOT EXISTS user_schema;`);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_schema.users (
        id BIGSERIAL PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    logger.info("user_schema.users table initialized successfully");
  } catch (error) {
    logger.error({ error }, "Error creating user_schema.users table");
  }
};
