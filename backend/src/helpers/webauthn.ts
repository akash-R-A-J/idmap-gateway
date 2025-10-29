import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import {
  getCredentialByIdAndUserId,
  getCredentialByUserId,
  updateCounter,
} from "./credentials.js";
import logger from "../config/logger.js";

/**
 * --------------------------------------------------------------------
 * WebAuthn Challenge Manager
 * --------------------------------------------------------------------
 * This module handles WebAuthn challenge generation and verification.
 * It uses `@simplewebauthn/server` for secure credential validation.
 *
 * Key Steps:
 * 1. Generate challenge during login / transaction signing
 * 2. Verify the signed challenge and update authenticator counter
 * --------------------------------------------------------------------
 */

/**
 * Temporary in-memory map to store challenges for users.
 * Key: userId
 * Value: PublicKeyCredentialRequestOptionsJSON
 */
const credMap = new Map<string, PublicKeyCredentialRequestOptionsJSON>();

/**
 * --------------------------------------------------------------------
 * generateChallenge
 * --------------------------------------------------------------------
 * Generates a WebAuthn authentication challenge for the given user.
 *
 * @param userId - Unique user identifier
 * @returns Promise<PublicKeyCredentialRequestOptionsJSON | null>
 * --------------------------------------------------------------------
 */
export const generateChallenge = async (userId: string) => {
  try {
    const credentials = await getCredentialByUserId(userId);

    if (!credentials || credentials.length === 0) {
      logger.warn({ userId }, "No credentials found for user");
      return null;
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.id as Base64URLString,
      transports: cred.transports as AuthenticatorTransportFuture[],
    }));

    // Generate WebAuthn authentication options
    const authOptions = await generateAuthenticationOptions({
      rpID: process.env.RP_ID as string,
      allowCredentials: allowCredentials ?? undefined,
    });

    credMap.set(userId, authOptions);

    logger.info(
      { userId, challenge: authOptions.challenge },
      "Generated WebAuthn challenge for user"
    );

    return authOptions;
  } catch (error) {
    logger.error({ userId, error }, "Error generating WebAuthn challenge");
    return null;
  }
};

/**
 * --------------------------------------------------------------------
 * verifyChallenge
 * --------------------------------------------------------------------
 * Verifies a signed WebAuthn challenge for a given user.
 * If successful, it updates the credential counter.
 *
 * @param userId - User ID whose challenge is being verified
 * @param signed - The signed WebAuthn response object
 * @returns Promise<boolean | null> - Returns true if verified, null if failed
 * --------------------------------------------------------------------
 */
export const verifyChallenge = async (userId: string, signed: any) => {
  try {
    // Retrieve stored challenge
    const options = credMap.get(userId);
    if (!options) {
      logger.warn({ userId }, "No challenge found for user");
      return null;
    }

    const credential = await getCredentialByIdAndUserId({
      id: signed.id,
      userId,
    });

    if (!credential) {
      logger.warn({ userId }, "Credential not found for verification");
      return null;
    }

    // Perform WebAuthn response verification
    const verification = await verifyAuthenticationResponse({
      response: signed,
      expectedChallenge: options.challenge,
      expectedOrigin: process.env.ORIGIN as string,
      expectedRPID: process.env.RP_ID as string,
      credential: {
        id: credential.id,
        publicKey: Uint8Array.from(credential.publickey),
        counter: Number(credential.counter),
        transports: credential.transports,
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      logger.warn({ userId }, "WebAuthn verification failed");
      return null;
    }

    const { newCounter } = authenticationInfo;

    // Cleanup and update counter
    credMap.delete(userId);
    await updateCounter(credential.id, newCounter);

    logger.info(
      { userId, credentialId: credential.id },
      "Verification successful and counter updated"
    );

    return verified;
  } catch (error) {
    logger.error({ userId, error }, "Error verifying WebAuthn challenge");
    return null;
  }
};
