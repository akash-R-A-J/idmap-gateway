import type { Request, Response } from "express";
import { getUserById } from "../helpers/users.js";
import { getCredentialByUserId } from "../helpers/credentials.js";
import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

interface BodyInputType {
  toAddress: String;
  lamports: number;
}

// used for storing webauthn challenge temporary for verification
export const sendCredMap = new Map<
  string,
  PublicKeyCredentialRequestOptionsJSON
>();

export const sendInputMap = new Map<string, BodyInputType>();

// will create a webauthn challenge and send it back to the client
export const sendOptionController = async (req: Request, res: Response) => {
  const { toAddress, lamports }: BodyInputType = req.body;
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(403).json({ message: "invalid user" });
    }

    // get the user
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const credentials = await getCredentialByUserId(userId);
    if (!credentials || credentials.length === 0) {
      return res.status(404).json({ message: "invalid credentials" });
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.id as Base64URLString,
      transports: cred.transports as AuthenticatorTransportFuture[],
    }));

    //   generate challenege for user
    const sendOptions = await generateAuthenticationOptions({
      rpID: process.env.rpID as string,
      allowCredentials: allowCredentials ?? undefined,
    });

    //   add challenge and user input in the temporary map
    sendCredMap.set(userId, sendOptions);
    sendInputMap.set(userId, { toAddress, lamports });

    console.log(
      "sending challenege to the user for verification during send txn",
      sendOptions
    );

    res.status(200).json({ options: sendOptions });
  } catch (error) {
    console.error("error generating challenge during send txn", error);
    res.status(500).json({ message: "server error" });
  }
};
