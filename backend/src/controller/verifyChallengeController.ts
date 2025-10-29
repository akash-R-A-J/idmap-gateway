import type { Request, Response } from "express";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { pool } from "../config/db.js";
import { credentialMap } from "./createChallengeController.js";
import { createClient } from "redis";
import { randomUUID } from "crypto";

export const verifyChallenge = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: "invalid credentials" });
  }

  const redisClient = createClient({ url: "redis://localhost:6379" });

  try {
    await redisClient.connect();

    const options = credentialMap.get(userId);
    if (!options?.challenge) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: options.challenge,
      expectedOrigin: process.env.origin as string,
      expectedRPID: process.env.rpID as string,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
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
      credentialMap.delete(userId);
    }

    // ✅ Step 2: Generate session
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
    const EXPECTED_PARTICIPANTS = 2;
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

    // ✅ Step 5: Save session info
    await pool.query(
      `INSERT INTO key_schema.keys (sessionId, userId, solanaAddress, created_at)
       VALUES ($1, $2, $3, NOW());`,
      [sessionId, userId, sharedPubkey]
    );

    return res.status(200).json({
      message: "DKG successfully started and completed",
      verified,
      sessionId,
      publicKey: sharedPubkey,
    });
  } catch (error) {
    console.error("❌ Error during challenge verification or DKG:", error);
    return res.status(500).json({ message: "server error", error });
  } finally {
    if (redisClient.isOpen) await redisClient.quit();
  }
};
