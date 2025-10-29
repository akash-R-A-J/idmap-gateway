import { pool } from "../config/db.js";
import logger from "../config/logger.js";

/**
 * Credential Service
 * ------------------
 * Handles database operations for user WebAuthn credentials.
 * Includes functions to:
 *  - Fetch credentials by user ID
 *  - Fetch a specific credential by ID and user ID
 *  - Update credential counters after successful authentications
 */

/**
 * Fetch all credentials for a given user.
 */
export const getCredentialByUserId = async (userId: string) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM credential_schema.credentials WHERE userId = $1;`,
      [userId]
    );
    return rows;
  } catch (error) {
    logger.error(error, "Error fetching credentials using userId");
    return null;
  }
};

/**
 * Fetch a specific credential by credential ID and user ID.
 */
export const getCredentialByIdAndUserId = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM credential_schema.credentials WHERE id = $1 AND userId = $2;`,
      [id, userId]
    );
    return rows[0];
  } catch (error) {
    logger.error(error, "Error fetching credential by ID and userId");
    return null;
  }
};

/**
 * Update the counter for a credential (used in replay attack prevention).
 */
export const updateCounter = async (id: string, newCounter: number) => {
  try {
    const { rows } = await pool.query(
      `UPDATE credential_schema.credentials 
       SET counter = $1 
       WHERE id = $2 
       RETURNING *;`,
      [newCounter, id]
    );
    return rows[0];
  } catch (error) {
    logger.error(error, "Error updating counter in updateCounter");
    return null;
  }
};
