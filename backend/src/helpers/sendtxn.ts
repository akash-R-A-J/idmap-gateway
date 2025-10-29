import { getRedisClient } from "../config/redis.js";

/**
 * --------------------------------------------------------------------
 * Configuration Constants
 * --------------------------------------------------------------------
 * ACTION: The Redis action type for this operation.
 * BACKEND_ID: Identifier for this backend instance.
 * TOTAL_NODES: Expected number of signing nodes in the DKG network.
 * --------------------------------------------------------------------
 */
const ACTION = "sign";
const BACKEND_ID = 0;
const TOTAL_NODES = 2;

/**
 * Used to track how many partial signatures have been received
 * for each user during a signing session.
 *
 * Key: userId
 * Value: number of signatures received
 */
const signResults = new Map<string, number>();

/**
 * --------------------------------------------------------------------
 * sendTxnToServer
 * --------------------------------------------------------------------
 * Sends a signing request to all DKG nodes through Redis Pub/Sub.
 * Waits until all partial signatures are received or an error occurs.
 *
 * @param userId  - Unique identifier for the user
 * @param message - The message or transaction to be signed
 * @param session - Identifier for the DKG session
 * @returns Promise<string | null> - The aggregated signature or null on failure
 * --------------------------------------------------------------------
 */
export const sendTxnToServer = async (
  userId: string,
  message: string,
  session: string
): Promise<string | null> => {
  const pub = getRedisClient();
  const sub = getRedisClient();

  try {
    // Connect both publisher and subscriber to Redis
    await pub.connect();
    await sub.connect();

    console.log("Connected to Redis");

    return new Promise(async (resolve, reject) => {
      // Initialize tracking for this user's signature count
      signResults.set(userId, 0);

      // Subscribe to the "sign-result" channel to receive responses
      await sub.subscribe("sign-result", async (msg) => {
        try {
          const data = JSON.parse(msg);

          // Ignore results not meant for this backend
          if (data.id !== BACKEND_ID) return;

          // Handle valid signature results
          if (data.result_type === "sign-result") {
            const currentCount = (signResults.get(userId) || 0) + 1;
            signResults.set(userId, currentCount);

            console.log(
              `Signature ${currentCount}/${TOTAL_NODES} from node ${data.server_id}:`,
              data.data
            );

            // If all signatures are received, resolve with the result
            if (currentCount === TOTAL_NODES) {
              signResults.delete(userId);
              await sub.unsubscribe("sign-result");
              await pub.disconnect();
              await sub.disconnect();
              resolve(data.data);
            }
          }

          // Handle signing errors
          else if (data.result_type === "sign-error") {
            console.error(
              `Signing failed on node ${data.server_id}:`,
              data.error
            );
            signResults.delete(userId);
            await sub.unsubscribe("sign-result");
            await pub.disconnect();
            await sub.disconnect();
            reject(new Error(data.error));
          }
        } catch (err) {
          console.error("Error handling sign-result message:", err);
        }
      });

      // Prepare the signing request payload
      const signPayload = {
        id: BACKEND_ID,
        action: ACTION,
        session,
        message,
      };

      // Publish the signing request to all DKG nodes
      console.log("Publishing sign-start:", signPayload);
      await pub.publish("sign-start", JSON.stringify(signPayload));
    });
  } catch (err) {
    console.error("Error sending message to servers:", err);

    // Safely disconnect Redis clients on failure
    try {
      await pub.disconnect();
      await sub.disconnect();
    } catch {
      return null;
    }
    return null;
  }
};
