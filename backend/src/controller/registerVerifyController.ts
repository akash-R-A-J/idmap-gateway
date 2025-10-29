import type { Request, Response } from "express";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { pool } from "../config/db.js";
import { credentialMap } from "./registerOptionController.js";
import { createClient } from "redis";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { getRedisClient } from "../config/redis.js";

  // TODO: add zod validation
export const registerVerifyController = async (req: Request, res: Response) => {
  const { e, signed } = req.body;
  const email = e.toLowerCase();

  if (!email || !signed) {
    return res.status(401).json({ message: "invalid credentials" });
  }

  try {

    const options = credentialMap.get(email);
    if (!options?.challenge) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const verification = await verifyRegistrationResponse({
      response: signed,
      expectedChallenge: options.challenge,
      expectedOrigin: process.env.origin as string,
      expectedRPID: process.env.rpID as string,
    });

    let userId;
    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      // store user in the database -> TODO: alter user table
      const { rows: users } = await pool.query(
        `INSERT INTO user_schema.users (email) VALUES ($1) RETURNING id;`,
        [email]
      );

      // only for debugging
      console.log("users: ", users);
      console.log("users[0]: ", users[0]);

      userId = users[0].id; // check this out

      // store credential in the database
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
          options.user.id,
          credentialDeviceType,
          credentialBackedUp,
          credential.transports,
        ]
      );

      console.log("✅ Saved credential:", rows[0]);
    } else {
      return res.status(403).json({ message: "invalid credentials" });
    }

    // ✅ Step 2: Generate session
    const redisClient = getRedisClient();
    await redisClient.connect();
    
    const sessionId = `session-${randomUUID()}`;
    const dkgPayload = {
      id: Date.now(),
      action: "startdkg",
      session: sessionId,
    };

    console.log("🚀 Starting DKG for session:", sessionId);

    // ✅ Step 3: Publish DKG start
    await redisClient.publish("dkg-start", JSON.stringify(dkgPayload));

    // ✅ Step 4: Collect results
    const EXPECTED_PARTICIPANTS = parseInt(process.env.EXPECTED_PARTICIPANTS || "2");
    const pubkeyPromise = new Promise<string>((resolve, reject) => {
      const sub = redisClient.duplicate();

      sub.on("error", (err) => {
        console.error("Redis subscriber error:", err);
        reject(err);
      });

      sub.connect().then(async () => {
        const received: Record<number, string> = {};

        await sub.subscribe("dkg-result", async (message) => {
          try {
            const parsed = JSON.parse(message);

            if (
              parsed.result_type === "dkg-result" &&
              parsed.id === dkgPayload.id
            ) {
              console.log(
                `🧩 Received public key from server ${parsed.server_id}: ${parsed.data}`
              );

              received[parsed.server_id] = parsed.data;

              if (Object.keys(received).length === EXPECTED_PARTICIPANTS) {
                console.log("✅ All DKG results received.");

                await sub.unsubscribe("dkg-result");
                await sub.quit(); // ✅ safer than disconnect()

                // Validate that all pubkeys match
                const uniqueKeys = new Set(Object.values(received));
                if (uniqueKeys.size > 1) {
                  return reject(new Error("Mismatched DKG public keys"));
                }

                const finalPubkey = Object.values(received)[0];
                if (finalPubkey) {
                  resolve(finalPubkey);
                } else {
                  reject(new Error("No public key received from participants"));
                }
              }
            }
          } catch (err) {
            console.error("Error parsing dkg-result:", err);
            await sub.unsubscribe("dkg-result");
            await sub.quit();
            reject(err);
          }
        });
      });
    });

    const sharedPubkey = await pubkeyPromise;
    console.log("✅ DKG complete. Shared public key:", sharedPubkey);

    // ✅ Step 5: Save session and group public key info
    await pool.query(
      `INSERT INTO key_schema.keys (sessionId, userId, solanaAddress, created_at)
       VALUES ($1, $2, $3, NOW());`,
      [sessionId, userId, sharedPubkey]
    );

    // create jwt token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Registered Successfully",
      verified,
      sessionId,
      publicKey: sharedPubkey,
      token,
    });
  } catch (error) {
    console.error("❌ Error during challenge verification or DKG:", error);
    return res.status(500).json({ message: "server error", error });
  }
};
