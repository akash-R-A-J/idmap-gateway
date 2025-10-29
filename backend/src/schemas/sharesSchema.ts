import { pool } from "../config/db.js";

export const initShareDB = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE SCHEMA IF NOT EXISTS share_schema;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS share_schema.shares (
        id SERIAL PRIMARY KEY,
        nodeId BIGINT NOT NULL,
        sessionId TEXT NOT NULL,
        solanaAddress TEXT NOT NULL,
        encryptedShare BYTEA NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating share table", error);
  } finally {
    client.release();
  }
};
