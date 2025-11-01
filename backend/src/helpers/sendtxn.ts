import pino from "pino";
import { getRedisClient } from "../config/redis.js";
import { createClient } from "redis";

const logger = pino({ name: "sendTxnToServer" });

/**
 * --------------------------------------------------------------------
 * Configuration Constants
 * --------------------------------------------------------------------
 * ACTION: The Redis action type for this operation.
 * BACKEND_ID: Identifier for this backend instance.
 * TOTAL_NODES: Expected number of signing nodes in the DKG network.
 *
 * ⚠️ Move the following constants to `.env` for production:
 *    - REDIS_ACTION="sign"
 *    - BACKEND_ID=0
 *    - TOTAL_NODES=2
 * --------------------------------------------------------------------
 */
const ACTION = process.env.REDIS_ACTION || "sign";
const BACKEND_ID = parseInt(process.env.BACKEND_ID || "0");
const TOTAL_NODES = parseInt(process.env.TOTAL_NODES || "2");

/**
 * Tracks partial signatures received for each user during signing.
 * Key: userId → Value: number of received partial signatures.
 */
const signResults = new Map<string, number>();

/**
 * --------------------------------------------------------------------
 * @function sendTxnToServer
 * --------------------------------------------------------------------
 * Publishes a signing request to DKG nodes over Redis Pub/Sub,
 * and listens for their partial signatures. Once all are received,
 * resolves with the aggregated signature.
 *
 * @param userId  - Unique identifier for the user
 * @param message - Base64 encoded Solana transaction message
 * @param session - Identifier for the DKG session
 * @returns Promise<string | null> - Aggregated signature or null
 * --------------------------------------------------------------------
 */
export const sendTxnToServer = async (
  userId: string,
  message: string,
  session: string
): Promise<string | null> => {
  const pub = await getRedisClient();
  const sub = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });
  await sub.connect();

  try {
    logger.info("Connected to Redis");

    return new Promise(async (resolve, reject) => {
      signResults.set(userId, 0);

      await sub.subscribe("sign-result", async (msg) => {
        try {
          const data = JSON.parse(msg);

          // Ignore irrelevant results
          if (data.id !== BACKEND_ID) return;

          // Handle valid signature result
          if (data.result_type === "sign-result") {
            const currentCount = (signResults.get(userId) || 0) + 1;
            signResults.set(userId, currentCount);

            logger.info(
              {
                node: data.server_id,
                count: `${currentCount}/${TOTAL_NODES}`,
                partialSig: data.data,
              },
              "Received partial signature"
            );

            if (currentCount === TOTAL_NODES) {
              logger.info({ userId, session }, "All signatures received");
              signResults.delete(userId);

              await sub.unsubscribe("sign-result");
              await pub.disconnect();
              await sub.disconnect();

              return resolve(data.data);
            }
          }

          // Handle signing error
          else if (data.result_type === "sign-error") {
            logger.error(
              { node: data.server_id, error: data.error },
              "Node reported signing failure"
            );

            signResults.delete(userId);
            await sub.unsubscribe("sign-result");
            // await pub.disconnect();
            await sub.disconnect();

            return reject(new Error(data.error));
          }
        } catch (err) {
          logger.error({ err }, "Error handling sign-result message");
        }
      });

      // Publish signing request
      const signPayload = { id: BACKEND_ID, action: ACTION, session, message };
      logger.info({ signPayload }, "Publishing sign-start to Redis");

      await pub.publish("sign-start", JSON.stringify(signPayload));
    });
  } catch (err) {
    logger.error({ err }, "Error during sendTxnToServer");

    try {
      // await pub.disconnect();
      await sub.disconnect();
    } catch (closeErr) {
      logger.warn({ closeErr }, "Error disconnecting Redis clients");
    }

    return null;
  }
};
