import type { Request, Response } from "express";
import pino from "pino";
import { generateChallenge } from "../helpers/webauthn.js";

const logger = pino({ name: "sendOptionController" });

/**
 * @description
 * Generates a WebAuthn challenge for a logged-in user.
 * Used during the login or transaction signing flow to verify user presence via WebAuthn.
 */
export const sendOptionController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    // Ensure the request has a valid authenticated user
    if (!userId) {
      logger.warn("Missing userId in request");
      return res.status(403).json({ message: "invalid user" });
    }

    // Generate a WebAuthn challenge specific to this user
    const sendOptions = await generateChallenge(userId);

    if (!sendOptions) {
      logger.error({ userId }, "Failed to generate WebAuthn challenge");
      throw new Error("error generating WebAuthn challenge during login");
    }

    logger.info({ userId }, "WebAuthn challenge generated successfully");
    return res.status(200).json({ options: sendOptions });
  } catch (error) {
    logger.error({ error }, "Error generating challenge during send transaction");
    return res.status(500).json({ message: "server error" });
  }
};
