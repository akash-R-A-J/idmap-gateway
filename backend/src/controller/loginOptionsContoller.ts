import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "../helpers/users.js";
import { generateChallenge } from "../helpers/webauthn.js";

// returns webauthn challenge for users to sign
export const loginOptionsController = async (req: Request, res: Response) => {
  const { e } = req.body;
  const email = e.toLowerCase();
  
  if (!email) {
    return res.status(400).json({ message: "invalid credential" });
  }

  try {
    const user = await getUserByEmail(email.toLowerCase());
    const userId = user.id;
    if (!userId) {
      return res.status(404).json({ message: "invalid credentials" });
    }

    const authOptions = await generateChallenge(userId);
    if(!authOptions){
      throw Error("error generating webauthn challenege during login");
    }
    
    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    console.log(
      "sending challenge to the user for verification during login",
      authOptions
    );
    res.status(200).json({ options: authOptions, token });
  } catch (error) {
    console.error("error in login-options controller", error);
    res.status(500).json({ message: "server error", error });
  }
};
