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
 *
 * Workflow:
 *   1. Verify user's WebAuthn registration (challenge validation)
 *   2. Create user record in PostgreSQL
 *   3. Trigger DKG across distributed servers using Redis pub/sub
 *   4. Wait for all DKG participants to return consistent shared public key
 *   5. Store the resulting group public key in DB
 *   6. Issue JWT for client authentication
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
    // --- Step 1: Validate challenge ---
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

    // --- Step 4: Initialize Redis + start DKG ---
    const redisClient = getRedisClient();

    const sessionId = `session-${randomUUID()}`;
    const dkgPayload = {
      id: Date.now(), // node backend id
      action: "startdkg",
      session: sessionId,
    };

    logger.info({ sessionId }, "Publishing DKG start event");
    await redisClient.publish("dkg-start", JSON.stringify(dkgPayload));

    const EXPECTED_PARTICIPANTS = parseInt(
      process.env.EXPECTED_PARTICIPANTS || "2"
    );

    // --- Step 5: Collect DKG results ---
    // const sharedPubkey = await new Promise<string>((resolve, reject) => {
    //   const sub = redisClient.duplicate();
    //   const received: Record<number, string> = {}; // Stores server_id → public_key mappings

    //   sub.on("error", (err) => {
    //     logger.error({ err }, "Redis subscriber error");
    //     reject(err);
    //   });

    //   sub.connect().then(async () => {
    //     await sub.subscribe("dkg-result", async (message) => {
    //       try {
    //         const parsed = JSON.parse(message);

    //         if (
    //           parsed.result_type === "dkg-result" &&
    //           parsed.id === dkgPayload.id
    //         ) {
    //           logger.debug(
    //             {
    //               server_id: parsed.server_id,
    //               pubkey: parsed.data,
    //             },
    //             "Received DKG result"
    //           );

    //           received[parsed.server_id] = parsed.data;

    //           if (Object.keys(received).length === EXPECTED_PARTICIPANTS) {
    //             await sub.unsubscribe("dkg-result");
    //             await sub.quit();

    //             const uniqueKeys = new Set(Object.values(received));
    //             if (uniqueKeys.size > 1) {
    //               logger.error("Mismatched DKG public keys across servers");
    //               return reject(new Error("Mismatched DKG public keys"));
    //             }

    //             const finalPubkey = Object.values(received)[0];
    //             if (finalPubkey) {
    //               resolve(finalPubkey);
    //             } else {
    //               reject(new Error("No public key received from participants"));
    //             }
    //           }
    //         }
    //       } catch (err) {
    //         logger.error({ err }, "Error parsing DKG result message");
    //         await sub.unsubscribe("dkg-result");
    //         await sub.quit();
    //         reject(err);
    //       }
    //     });
    //   });
    // });

    const sharedPubkey = await new Promise<string>(async (resolve, reject) => {
      const sub = createClient({url: process.env.REDIS_URL as string});
      const received: Record<number, string> = {};

      try {
        await sub.connect();

        await sub.subscribe("dkg-result", async (message) => {
          try {
            const parsed = JSON.parse(message);

            if (
              parsed.result_type === "dkg-result" &&
              parsed.id === dkgPayload.id
            ) {
              logger.debug(
                { server_id: parsed.server_id, pubkey: parsed.data },
                "Received DKG result"
              );

              received[parsed.server_id] = parsed.data;

              if (Object.keys(received).length === EXPECTED_PARTICIPANTS) {
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

                resolve(finalPubkey);
              }
            }
          } catch (err) {
            reject(err);
          }
        });
      } catch (err) {
        logger.error({ err }, "Redis subscriber connection error");
        reject(err);
      } finally {
        // Always clean up, even if error occurs
        sub.on("end", () => logger.debug("Redis subscriber closed"));
        setTimeout(async () => {
          if (sub.isOpen) {
            await sub.quit();
          }
        }, 5000); // close after short delay
      }
    });

    logger.info(
      { sharedPubkey },
      "DKG complete, received final group public key"
    );

    // --- Step 2: Create user record ---
    const { rows: users } = await pool.query(
      `INSERT INTO user_schema.users (email) VALUES ($1) RETURNING id;`,
      [email]
    );
    const userId = users[0].id;

    // --- Step 3: Save credential ---
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

    // --- Step 6: Save key info ---
    await pool.query(
      `INSERT INTO key_schema.keys (sessionId, userId, solanaAddress, created_at)
       VALUES ($1, $2, $3, NOW());`,
      [sessionId, userId, sharedPubkey]
    );

    // --- Step 7: Generate JWT ---
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
    logger.error(
      { err: error },
      "Error during registration verification or DKG process"
    );
    return res.status(500).json({ message: "server error" });
  }
};
