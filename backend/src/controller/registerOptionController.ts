import type { Request, Response } from "express";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { pool } from "../config/db.js";
import logger from "../config/logger.js";

export const credentialMap = new Map<string, PublicKeyCredentialCreationOptionsJSON>();

/**
 * Controller: registerOptionController
 * ------------------------------------
 * Handles generation of WebAuthn registration (attestation) options.
 * 1. Validates email input
 * 2. Checks if user already exists in DB
 * 3. Generates a WebAuthn registration challenge
 * 4. Caches challenge in memory for later verification
 */
export const registerOptionController = async (req: Request, res: Response) => {
  const { e }: { e: string } = req.body;

  if (!e) {
    logger.warn("Registration attempt with missing email field");
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const email = e.toLowerCase();

  try {
    // Check if user already exists
    const { rows } = await pool.query(
      `SELECT * FROM user_schema.users WHERE email = $1;`,
      [email]
    );

    if (rows.length !== 0) {
      logger.warn(`Registration attempt for existing user: ${email}`);
      return res
        .status(400)
        .json({ message: "User already exists, please sign in instead." });
    }

    // Generate WebAuthn registration challenge
    const options: PublicKeyCredentialCreationOptionsJSON =
      await generateRegistrationOptions({
        rpName: process.env.RP_NAME as string, // moved to .env
        rpID: process.env.RP_ID as string, // from env (domain)
        userName: email,
        attestationType: "direct",
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
        },
      });

    credentialMap.set(email, options);
    logger.info(`Registration challenge generated for user: ${email}`);

    res.status(200).json({ options });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      "Error in registerOptionController"
    );
    res.status(500).json({ message: "Server error" });
  }
};
