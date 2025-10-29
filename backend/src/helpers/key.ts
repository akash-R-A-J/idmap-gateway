import pino from "pino";
import { pool } from "../config/db.js";

const logger = pino({ name: "getKeyByUserId" });

/**
 * @function getKeyByUserId
 * @description
 * Fetches the user's DKG-generated key record from the database.
 *
 * @param userId - The unique ID of the user (string)
 * @returns The user's key record if found, otherwise `null`
 */
export const getKeyByUserId = async (userId: string) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM key_schema.keys WHERE userId = $1;`,
      [userId]
    );

    if (rows.length === 0) {
      logger.warn({ userId }, "No key found for user");
      return null;
    }

    logger.info({ userId }, "Key record retrieved successfully");
    return rows[0];
  } catch (error) {
    logger.error({ userId, error }, "Database query failed in getKeyByUserId");
    return null;
  }
};
