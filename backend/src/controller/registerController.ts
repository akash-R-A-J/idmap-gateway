import type { Request, Response } from "express";
import { hash } from "argon2";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

// username, email, password -> string
interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export const registerController = async (req: Request, res: Response) => {
  const { username, email, password }: RegisterInput = req.body;

  console.log(username, email, password);
  try {
    // check if user already exists or not
    if (!(username && email && password)) {
      return res.status(400).json({ message: "invalid input" });
    }

    const nEmail = email.toLowerCase();
    const { rows } = await pool.query(
      `SELECT * FROM user_schema.users WHERE email = $1;`,
      [nEmail]
    );

    if (rows.length !== 0) {
      return res
        .status(400)
        .json({ message: "user already exist, try signing in." });
    }

    const nUsername = username.trim();
    const hashedPassword = await hash(password);

    const { rows: users } = await pool.query(
      `INSERT INTO user_schema.users (username, email, password) VALUES ($1, $2, $3) RETURNING id;`,
      [nUsername, nEmail, hashedPassword]
    );
    
    const token = jwt.sign(
          { userId: users[0].id },
          process.env.JWT_SECRET as string,
          { expiresIn: "1h" }
        );

    res
      .status(200)
      .json({ message: "user registered successfully.", userId: users[0].id, token });
  } catch (error) {
    console.error("error registering user", error);
    res.status(500).json({ message: "server error", error });
  }
};
