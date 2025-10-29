import { pool } from "../config/db.js";

// get yser by id
export const getUserById = async (id: string) => {
  const query = `SELECT * FROM user_schema.users WHERE id = $1;`;
  return await getUser({ query, value: id });
};

// get user by email
export const getUserByEmail = async (email: string) => {
  const query = `SELECT * FROM user_schema.users WHERE email = $1;`;
  return await getUser({ query, value: email });
};

const getUser = async ({ query, value }: { query: string; value: string }) => {
  try {
    const { rows } = await pool.query(query, [value]);
    return rows[0];
  } catch (error) {
    console.error("error fetching user by id", error);
    return null;
  }
};
