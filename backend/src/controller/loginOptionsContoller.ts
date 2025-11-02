import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "../helpers/users.js";
import { generateChallenge } from "../helpers/webauthn.js";
import logger from "../config/logger.js";

/**
 * Controller: loginOptionsController
 * ----------------------------------
 * Handles WebAuthn login initiation by:
 * 1. Validating user email
 * 2. Fetching user details from database
 * 3. Generating a WebAuthn challenge
 * 4. Signing a temporary JWT (for client verification flow)
 */

/**
 * Adding logger to check for latency
 */
export const loginOptionsController = async (req: Request, res: Response) => {
  const { e } = req.body;

  // Basic input validation
  if (!e) {
    logger.warn("Login attempt with missing email field");
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const email = e.toLowerCase();

  try {
    // Fetch user from DB
    logger.info("getting use by email");
    const user = await getUserByEmail(email);
    logger.info("got the user");
    const userId = user?.id;

    if (!userId) {
      logger.warn(`Login attempt with unregistered email: ${email}`);
      return res.status(404).json({ message: "Invalid credentials" });
    }

    // Generate WebAuthn challenge
    logger.info("generating challenge for user");
    const authOptions = await generateChallenge(userId);
    logger.info("challenge generated");
    if (!authOptions) {
      throw new Error("Failed to generate WebAuthn challenge during login");
    }

    // Sign a short-lived JWT
    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    logger.info(`Challenge generated for user: ${email}`);

    // Respond with challenge and token
    res.status(200).json({ options: authOptions, token });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      "Error in loginOptionsController"
    );
    res.status(500).json({ message: "Server error" });
  }
};
