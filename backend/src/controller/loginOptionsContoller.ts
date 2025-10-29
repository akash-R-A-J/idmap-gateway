import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { getCredentialByUserId } from "../helpers/credentials.js";
import { getUserByEmail } from "../helpers/users.js";

// temporary map for verification of user
export const loginCredMap = new Map<
  string,
  PublicKeyCredentialRequestOptionsJSON
>();

export const loginOptionsController = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await getUserByEmail(email.toLowerCase());
    const userId = user.id;
    if (!userId) {
      return res.status(404).json({ message: "invalid credentials" });
    }

    const credentials = await getCredentialByUserId(userId);
    if (!credentials || credentials.length === 0) {
      console.log("credentials not found for user in loginOptionsCredential");
      return res.status(404).json({ message: "invalid credentials" });
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.id as Base64URLString,
      transports: cred.transports as AuthenticatorTransportFuture[],
    }));

    // generate challenge for login
    const authOptions = await generateAuthenticationOptions({
      rpID: process.env.rpID as string,
      allowCredentials: allowCredentials ?? undefined,
    });

    loginCredMap.set(userId, authOptions);
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
