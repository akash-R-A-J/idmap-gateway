import type { Request, Response } from "express";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { pool } from "../config/db.js";
import { credentialMap } from "./registerOptionController.js";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { getRedisClient } from "../config/redis.js";
import logger from "../config/logger.js";

/**
 * Controller: registerVerifyController
 * ------------------------------------
 * Handles WebAuthn registration verification and initializes a DKG session.
 * 1. Verifies signed registration response
 * 2. Stores user and credential data in PostgreSQL
 * 3. Starts a DKG session via Redis Pub/Sub
 * 4. Aggregates DKG results and saves shared public key
 */
export const registerVerifyController = async (req: Request, res: Response) => {
  const { e, signed } = req.body;

  if (!e || !signed) {
    logger.warn("Registration verification attempt with missing fields");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const email = e.toLowerCase();

  try {
    const options = credentialMap.get(email);
    if (!options?.challenge) {
      logger.warn(`Missing WebAuthn challenge for email: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify WebAuthn challenge response
    const verification = await verifyRegistrationResponse({
      response: signed,
      expectedChallenge: options.challenge,
      expectedOrigin: process.env.ORIGIN as string,
      expectedRPID: process.env.RP_ID as string,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      logger.warn(`Invalid registration verification for user: ${email}`);
      return res.status(403).json({ message: "Invalid credentials" });
    }

    logger.info(`WebAuthn registration verified for ${email}`);

    // Step 1: Store user in the database
    const { rows: users } = await pool.query(
      `INSERT INTO user_schema.users (email) VALUES ($1) RETURNING id;`,
      [email]
    );

    const userId = users[0]?.id;
    if (!userId) throw new Error("Failed to create user record");

    // Step 2: Store credential details
    const { credential, credentialDeviceType, credentialBackedUp } =
      registrationInfo;

    const { rows } = await pool.query(
      `INSERT INTO credential_schema.credentials 
         (id, publicKey, counter, userId, webauthnUserId, deviceType, backedUp, transports)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        credential.id,
        Buffer.from(credential.publicKey),
        credential.counter,
        userId,
        options.user?.id ?? null,
        credentialDeviceType,
        credentialBackedUp,
        credential.transports,
      ]
    );

    logger.info({ credentialId: rows[0].id }, `Credential saved for ${email}`);

    // Step 3: Start DKG session
    const redisClient = getRedisClient();
    await redisClient.connect();

    const sessionId = `session-${randomUUID()}`;
    const dkgPayload = {
      id: Date.now(),
      action: "startdkg",
      session: sessionId,
    };

    logger.info(`Starting DKG for session: ${sessionId}`);
    await redisClient.publish("dkg-start", JSON.stringify(dkgPayload));

    // Step 4: Listen for DKG results
    const EXPECTED_PARTICIPANTS = parseInt(
      process.env.EXPECTED_PARTICIPANTS || "2",
      10
    );
    const sub = redisClient.duplicate();
    const received: Record<number, string> = {};

    const pubkeyPromise = new Promise<string>((resolve, reject) => {
      sub
        .connect()
        .then(async () => {
          await sub.subscribe("dkg-result", async (message) => {
            try {
              const parsed = JSON.parse(message);

              if (
                parsed.result_type === "dkg-result" &&
                parsed.id === dkgPayload.id
              ) {
                received[parsed.server_id] = parsed.data;
                logger.debug(
                  `Received DKG pubkey from node ${parsed.server_id}`
                );

                if (Object.keys(received).length === EXPECTED_PARTICIPANTS) {
                  await sub.unsubscribe("dkg-result");
                  await sub.quit();

                  const uniqueKeys = new Set(Object.values(received));
                  if (uniqueKeys.size > 1) {
                    return reject(new Error("Mismatched DKG public keys"));
                  }

                  const finalPubkey = Object.values(received)[0];
                  if (finalPubkey) {
                    resolve(finalPubkey);
                  } else {
                    reject(
                      new Error("No public key received from participants")
                    );
                  }
                }
              }
            } catch (err) {
              await sub.unsubscribe("dkg-result");
              await sub.quit();
              reject(err);
            }
          });
        })
        .catch((err) => reject(err));
    });

    const sharedPubkey = await pubkeyPromise;
    logger.info(`DKG complete. Shared public key generated for ${email}`);

    // Step 5: Save group key
    await pool.query(
      `INSERT INTO key_schema.keys (sessionId, userId, solanaAddress, created_at)
       VALUES ($1, $2, $3, NOW());`,
      [sessionId, userId, sharedPubkey]
    );

    // Step 6: Issue session JWT
    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    logger.info(
      `User ${email} registered successfully with session ${sessionId}`
    );

    return res.status(200).json({
      message: "Registered successfully",
      verified,
      sessionId,
      publicKey: sharedPubkey,
      token,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      "Error during registration verification or DKG"
    );
    return res.status(500).json({ message: "Server error" });
  }
};
