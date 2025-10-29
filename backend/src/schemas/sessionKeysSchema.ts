import { pool } from "../config/db.js";

export const initKeyDB = async () => {
  try {
    await pool.query("BEGIN");

    await pool.query(`
          CREATE SCHEMA IF NOT EXISTS key_schema;
        `);

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
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error creating share table", error);
  }
};
