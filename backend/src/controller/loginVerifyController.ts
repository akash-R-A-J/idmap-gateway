import type { Request, Response } from "express";
import { verifyChallenge } from "../helpers/webauthn.js";

// TODO: add zod validation
export const loginVerifyController = async (req: Request, res: Response) => {
  try {
    const { signed } = req.body;

    const userId = req.userId;
    if (!userId) {
      console.log("userId not found in loginVerifyController");
      return res.status(404).json({ message: "invalid credentials" });
    }
    
    const verified = await verifyChallenge(userId, signed);
    if(!verified){
      return res.status(403).json({message: "invalid credentials"});
    }

    res.status(200).json({ verified, message: "login successful" });
  } catch (error) {
    console.error("error in loginVerifyController", error);
    res.status(500).json({ message: "server error" });
  }
};
