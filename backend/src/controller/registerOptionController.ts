import type { Request, Response } from "express";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { pool } from "../config/db.js";

export let credentialMap = new Map<
  string,
  PublicKeyCredentialCreationOptionsJSON
>();

// email -> string

// create challenege for client to sign for verification
export const registerOptionController = async (req: Request, res: Response) => {
  const { e }: {e: String} = req.body;
  const email = e.toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "invalid credential" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_schema.users WHERE email = $1;`,
      [email]
    );

    if (rows.length !== 0) {
      return res
        .status(400)
        .json({ message: "user already exist, try signing in." });
    }

    // change the rpName
    // TODO : exclude already added authenticator using excludeCredentials
    const options: PublicKeyCredentialCreationOptionsJSON =
      await generateRegistrationOptions({
        rpName: "hello",
        rpID: process.env.rpID as string,
        userName: email,
        attestationType: "direct",
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required", // can be preferred
          // authenticatorAttachment: can be 'platform' or 'cross-platform'
        },
        // preferredAuthenticatorType: 'securityKey' | 'localdevice' | 'remoteDevice' // select any one from these
      });

    credentialMap.set(email, options);
    res.status(200).json({ options });
  } catch (error) {
    console.error("error adding webauthn", error);
    res.status(500).json({ message: "server error" });
  }
};
