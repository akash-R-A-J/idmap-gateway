// import type { Request, Response } from "express";
// import { verify } from "argon2";
// import jwt from "jsonwebtoken";
// import { pool } from "../config/db.js";

// // input type
// interface LoginInput {
//   email: string;
//   password: string;
// }

// export const loginController = async (req: Request, res: Response) => {
//   const { email, password }: LoginInput = req.body;

//   if (!(email && password)) {
//     return res.status(400).json({ message: "invalid email or password." });
//   }

//   const nEmail = email.toLowerCase();

//   try {
//     // get the user from the db
//     const { rows } = await pool.query(
//       `SELECT * FROM user_schema.users WHERE email = $1;`,
//       [nEmail]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "invalid credentials." });
//     }

//     const user = rows[0];
//     const matched = await verify(user.password, password);

//     if (!matched) {
//       return res.status(401).json({ message: "invalid username or password." });
//     }

//     const token = jwt.sign(
//       { userId: user.id },
//       process.env.JWT_SECRET as string,
//       { expiresIn: "1h" }
//     );

//     res.status(200).json({ token, message: "login successful" });
//   } catch (error) {
//     console.error("login error", error);
//     res.status(500).json({ message: "server error", error });
//   }
// };
