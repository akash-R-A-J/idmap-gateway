import { createClient } from "redis";
import bs58 from "bs58";

// constants — ideally move redis_url to .env
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const ACTION = "sign";
const BACKEND_ID = 0;
const TOTAL_NODES = 2;

// used to track number of signatures per user
const signResults = new Map<string, number>();

export const sendTxnToServer = async (
  userId: string,
  message: string,
  session: string
): Promise<string | null> => {
  const pub = createClient({ url: REDIS_URL });
  const sub = createClient({ url: REDIS_URL });

  try {
    await pub.connect();
    await sub.connect();

    console.log("✅ Connected to Redis");

    return new Promise(async (resolve, reject) => {
      signResults.set(userId, 0);

      // subscribe for results
      await sub.subscribe("sign-result", async (msg) => {
        try {
          const data = JSON.parse(msg);

          if (data.id !== BACKEND_ID) return; // ignore unrelated responses

          if (data.result_type === "sign-result") {
            const currentCount = (signResults.get(userId) || 0) + 1;
            signResults.set(userId, currentCount);

            console.log(
              `✅ Signature ${currentCount}/${TOTAL_NODES} from node ${data.server_id}:`,
              data.data
            );

            if (currentCount === TOTAL_NODES) {
              signResults.delete(userId);
              await sub.unsubscribe("sign-result");
              await pub.disconnect();
              await sub.disconnect();
              resolve(data.data); // return the signature
            }
          } else if (data.result_type === "sign-error") {
            console.error(
              `❌ Signing failed on node ${data.server_id}:`,
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

      // send message for signing
      const signPayload = {
        id: BACKEND_ID,
        action: ACTION,
        session,
        message,
      };

      console.log("📤 Publishing sign-start:", signPayload);
      await pub.publish("sign-start", JSON.stringify(signPayload));
    });
  } catch (err) {
    console.error("❌ Error sending message to servers:", err);
    try {
      await pub.disconnect();
      await sub.disconnect();
    } catch {}
    return null;
  }
};
