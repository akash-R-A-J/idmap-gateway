import type { Request, Response } from "express";
import { generateChallenge } from "../helpers/webauthn.js";


// will create a webauthn challenge and send it back to the client
export const sendOptionController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(403).json({ message: "invalid user" });
    }

    const sendOptions = await generateChallenge(userId);
    if (!sendOptions) {
      throw Error("error generating webauthn challenege during login");
    }

    res.status(200).json({ options: sendOptions });
  } catch (error) {
    console.error("error generating challenge during send txn", error);
    res.status(500).json({ message: "server error" });
  }
};
