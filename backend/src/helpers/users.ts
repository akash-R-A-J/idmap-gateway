import { pool } from "../config/db.js";
import logger from "../config/logger.js";

/**
 * --------------------------------------------------------------------
 * User Repository
 * --------------------------------------------------------------------
 * Handles all database operations related to user data.
 * Each function queries the `user_schema.users` table.
 * --------------------------------------------------------------------
 */

/**
 * Fetch a user by their unique ID.
 *
 * @param id - The user's unique identifier
 * @returns Promise<object | null> - The user record or null if not found
 */
export const getUserById = async (id: string) => {
  const query = `SELECT * FROM user_schema.users WHERE id = $1;`;
  return await getUser({ query, value: id });
};

/**
 * Fetch a user by their email address.
 *
 * @param email - The user's email
 * @returns Promise<object | null> - The user record or null if not found
 */
export const getUserByEmail = async (email: string) => {
  const query = `SELECT * FROM user_schema.users WHERE email = $1;`;
  return await getUser({ query, value: email });
};

/**
 * Helper function for executing a single-user query.
 *
 * @param query - SQL query string
 * @param value - Parameter value for the query
 * @returns Promise<object | null> - The queried user or null if failed
 */
const getUser = async ({ query, value }: { query: string; value: string }) => {
  try {
    logger.info("fetching user from the db");
    const { rows } = await pool.query(query, [value]);
    logger.info("fetched user");
    return rows[0];
  } catch (error) {
    logger.error({ error, value }, "Error fetching user from database");
    return null;
  }
};
