import type { Request, Response } from "express";
import pino from "pino";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { pool } from "../config/db.js";
import { credentialMap } from "./registerOptionController.js";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { getRedisClient } from "../config/redis.js";
import { createClient } from "redis";

// Create logger instance
const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

/**
 * --------------------------------------------------------------------
 * registerVerifyController
 * --------------------------------------------------------------------
 * Handles WebAuthn registration verification + Distributed Key Generation (DKG)
 * --------------------------------------------------------------------
 */
export const registerVerifyController = async (req: Request, res: Response) => {
  const { e, signed } = req.body;
  const email = e?.toLowerCase();

  if (!email || !signed) {
    logger.warn("Missing credentials in request body");
    return res.status(401).json({ message: "invalid credentials" });
  }

  try {
    // Step 1: Validate challenge
    const options = credentialMap.get(email);
    if (!options?.challenge) {
      logger.warn({ email }, "Challenge not found for user");
      return res.status(401).json({ message: "invalid credentials" });
    }

    const verification = await verifyRegistrationResponse({
      response: signed,
      expectedChallenge: options.challenge,
      expectedOrigin: process.env.ORIGIN as string,
      expectedRPID: process.env.RP_ID as string,
    });

    const { verified, registrationInfo } = verification;
    if (!verified || !registrationInfo) {
      logger.warn({ email }, "WebAuthn verification failed");
      return res.status(403).json({ message: "invalid credentials" });
    }

    // Step 2: Initialize Redis
    const redisClient = await getRedisClient();

    const sessionId = `session-${randomUUID()}`;
    const dkgPayload = {
      id: Date.now(),
      action: "startdkg",
      session: sessionId,
    };

    const EXPECTED_PARTICIPANTS = parseInt(
      process.env.EXPECTED_PARTICIPANTS || "2"
    );

    // Step 3: Subscribe to DKG results before publishing start event
    const sharedPubkey = await new Promise<string>(async (resolve, reject) => {
      const sub = createClient({ url: process.env.REDIS_URL as string });
      const received: Record<number, string> = {};

      try {
        await sub.connect();

        // Timeout protection
        const timeout = setTimeout(async () => {
          logger.error("Timeout: No DKG result received within 5 seconds");
          try {
            await sub.unsubscribe("dkg-result");
            await sub.quit();
          } catch (err) {
            logger.warn({ err }, "Error during Redis cleanup after timeout");
          }
          reject(new Error("Timeout waiting for DKG results"));
        }, 5000);

        await sub.subscribe("dkg-result", async (message) => {
          try {
            const parsed = JSON.parse(message);
            logger.info(
              {
                id: parsed.id,
                server_id: parsed.server_id,
                pubkey: parsed.data,
              },
              "Received payload from Rust servers"
            );

            if (
              parsed.result_type === "dkg-result" &&
              parsed.id === dkgPayload.id
            ) {
              received[parsed.server_id] = parsed.data;

              if (Object.keys(received).length === EXPECTED_PARTICIPANTS) {
                clearTimeout(timeout);
                await sub.unsubscribe("dkg-result");

                const uniqueKeys = new Set(Object.values(received));
                if (uniqueKeys.size > 1) {
                  logger.error("Mismatched DKG public keys across servers");
                  throw new Error("Mismatched DKG public keys");
                }

                const finalPubkey = Object.values(received)[0];
                if (!finalPubkey) {
                  throw new Error("No public key received from participants");
                }

                await sub.quit();
                resolve(finalPubkey);
              }
            }
          } catch (err) {
            clearTimeout(timeout);
            try {
              await sub.quit();
            } catch {}
            reject(err);
          }
        });

        // Step 4: Publish DKG start event AFTER subscriber is ready
        logger.info({ sessionId }, "Publishing DKG start event");
        await redisClient.publish("dkg-start", JSON.stringify(dkgPayload));
      } catch (err) {
        logger.error({ err }, "Redis subscriber connection error");
        reject(err);
      } finally {
        sub.on("end", () => logger.debug("Redis subscriber closed"));
        setTimeout(async () => {
          if (sub.isOpen) await sub.quit();
        }, 5000);
      }
    });

    logger.info({ sharedPubkey }, "DKG complete, received final group public key");

    // Step 5: Create user record
    const { rows: users } = await pool.query(
      `INSERT INTO user_schema.users (email) VALUES ($1) RETURNING id;`,
      [email]
    );
    const userId = users[0].id;

    // Step 6: Save credential
    const { credential, credentialDeviceType, credentialBackedUp } =
      registrationInfo;
    await pool.query(
      `INSERT INTO credential_schema.credentials 
        (id, publicKey, counter, userId, webauthnUserId, deviceType, backedUp, transports)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [
        credential.id,
        Buffer.from(credential.publicKey),
        credential.counter,
        userId,
        options.user.id,
        credentialDeviceType,
        credentialBackedUp,
        credential.transports,
      ]
    );

    logger.info({ email }, "User and credential saved successfully");

    // Step 7: Save key info
    await pool.query(
      `INSERT INTO key_schema.keys (sessionId, userId, solanaAddress, created_at)
       VALUES ($1, $2, $3, NOW());`,
      [sessionId, userId, sharedPubkey]
    );

    // Step 8: Generate JWT
    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    logger.info({ email, sessionId }, "User registered successfully");
    return res.status(200).json({
      message: "Registered Successfully",
      verified,
      publicKey: sharedPubkey,
      token,
    });
  } catch (error) {
    logger.error({ err: error }, "Error during registration verification or DKG process");
    return res.status(500).json({ message: "server error" });
  }
};
