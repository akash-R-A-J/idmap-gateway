import { pool } from "../config/db.js";
import logger from "../config/logger.js";

/**
 * --------------------------------------------------------------------
 * initKeyDB
 * --------------------------------------------------------------------
 * Initializes the `key_schema` and its associated `keys` table.
 * Ensures the schema exists and creates the table if it does not already exist.
 *
 * Columns:
 * - id: Primary key (auto-increment)
 * - userId: References the user associated with this key
 * - sessionId: Identifier for the DKG or signing session
 * - solanaAddress: Solana wallet address for the user
 * - created_at: Timestamp for when the key was created
 * --------------------------------------------------------------------
 */
export const initKeyDB = async () => {
  try {
    await pool.query("BEGIN");

    // Create schema if it does not exist
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS key_schema;
    `);

    // Create keys table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS key_schema.keys (
        id SERIAL PRIMARY KEY,
        userId BIGINT NOT NULL,
        sessionId TEXT NOT NULL,
        solanaAddress TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query("COMMIT");
    logger.info("key_schema.keys table initialized successfully");
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error({ error }, "Error creating key_schema.keys table");
  }
};
