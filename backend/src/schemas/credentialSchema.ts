import { pool } from "../config/db.js";
import  logger  from "../config/logger.js";

/**
 * --------------------------------------------------------------------
 * initCredentialDB
 * --------------------------------------------------------------------
 * Initializes the `credential_schema` and its associated `credentials` table.
 * Ensures the schema exists and creates the table if it does not already exist.
 *
 * Columns:
 * - id: Primary key for credential (string)
 * - publicKey: WebAuthn public key (binary)
 * - userId: References user ID from user_schema.users
 * - webauthnUserId: WebAuthn-specific user identifier
 * - counter: Prevents replay attacks (incremented after each auth)
 * - deviceType: Type of device used for credential
 * - backedUp: Indicates if the credential is backed up
 * - transports: List of supported authenticator transports
 * - created_at: Timestamp when credential was registered
 * --------------------------------------------------------------------
 */
export const initCredentialDB = async () => {
  try {
    // Create schema if it doesn't exist
    await pool.query(`CREATE SCHEMA IF NOT EXISTS credential_schema;`);

    // Create credentials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS credential_schema.credentials (
        id TEXT PRIMARY KEY,
        publicKey BYTEA NOT NULL,
        userId BIGINT NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
        webauthnUserId TEXT NOT NULL,
        counter BIGINT,
        deviceType VARCHAR(32),
        backedUp BOOLEAN,
        transports TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (webauthnUserId, userId)
      );
    `);

    logger.info("credential_schema.credentials table initialized successfully");
  } catch (error) {
    logger.error({ error }, "Error creating credential table");
  }
};
