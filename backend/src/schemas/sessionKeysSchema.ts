import { pool } from "../config/db.js";

export const initKeyDB = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
          CREATE SCHEMA IF NOT EXISTS key_schema;
        `);

    await client.query(`
          CREATE TABLE IF NOT EXISTS key_schema.keys (
            id SERIAL PRIMARY KEY,
            userId BIGINT NOT NULL,
            sessionId TEXT NOT NULL,
            solanaAddress TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating share table", error);
  } finally {
    client.release();
  }
};
