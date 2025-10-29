import type { Request, Response } from "express";
import { verifyChallenge } from "../helpers/webauthn.js";
import logger from "../config/logger.js";

/**
 * Controller: loginVerifyController
 * ---------------------------------
 * Handles verification of the signed WebAuthn challenge:
 * 1. Extracts `signed` challenge data from request body
 * 2. Retrieves user ID from authenticated request
 * 3. Verifies the WebAuthn challenge response
 * 4. Returns success if verification passes
 */
export const loginVerifyController = async (req: Request, res: Response) => {
  try {
    const { signed } = req.body;

    // Ensure the user is authenticated
    const userId = req.userId;
    if (!userId) {
      logger.warn("User ID missing in loginVerifyController");
      return res.status(404).json({ message: "Invalid credentials" });
    }

    // Verify the WebAuthn challenge
    const verified = await verifyChallenge(userId, signed);
    if (!verified) {
      logger.warn(`Challenge verification failed for userId: ${userId}`);
      return res.status(403).json({ message: "Invalid credentials" });
    }

    logger.info(`User ${userId} successfully logged in`);
    res.status(200).json({ verified, message: "Login successful" });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      "Error in loginVerifyController"
    );
    res.status(500).json({ message: "Server error" });
  }
};
