import { cose } from "@simplewebauthn/server/helpers";
import { pool } from "../config/db.js";

export const getCredentialByUserId = async (userId: string) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM credential_schema.credentials WHERE userId = $1;`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error("error getting credentials using userId", error);
    return null;
  }
};

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
    console.error("error getting credentials by id and userid", error);
    return null;
  }
};

export const updateCounter = async (id: string, newCounter: number) => {
  try {
    const { rows } = await pool.query(
      `UPDATE credential_schema.credentials SET counter = $1 WHERE id = $2 RETURNING *;`,
      [newCounter, id]
    );
    return rows[0];
  } catch (error) {
    console.error("error updating counter in updateCounter", error);
    return null;
  }
};
