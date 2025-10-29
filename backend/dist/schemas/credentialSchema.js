import { pool } from "../config/db.js";
export const initCredentialDB = async () => {
    try {
        await pool.query(`CREATE SCHEMA IF NOT EXISTS credential_schema;`);
        await pool.query(`CREATE TABLE IF NOT EXISTS credential_schema.credentials (
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
    );`);
    }
    catch (error) {
        console.error("error creating credential table", error);
    }
};
//# sourceMappingURL=credentialSchema.js.map