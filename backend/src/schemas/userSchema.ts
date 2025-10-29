import { pool } from "../config/db.js";

export const initUserDB = async () => {
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS user_schema;`);

    // TODO: alter this table, and remove username and password
    await pool.query(`CREATE TABLE IF NOT EXISTS user_schema.users (
        id BIGSERIAL PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,    
        created_at TIMESTAMPTZ DEFAULT NOW()
    );`);
  } catch (error) {
    console.error("error creating user table", error);
  }
};
