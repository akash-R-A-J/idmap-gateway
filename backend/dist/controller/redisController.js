import { createClient } from "redis";
const totalNodes = 2;
const dkgResults = new Set();
export const testRedis = async () => {
    // --- 1️⃣ Create two separate clients ---
    const pub = createClient({ url: "redis://localhost:6379" });
    const sub = createClient({ url: "redis://localhost:6379" });
    await pub.connect();
    await sub.connect();
    // --- 2️⃣ Subscribe to result channels ---
    await sub.subscribe("dkg-result", async (msg) => {
        const data = JSON.parse(msg);
        console.log("DKG Result:", data);
        dkgResults.add(data.server_id);
        if (dkgResults.size === totalNodes) {
            console.log("All DKG nodes finished, triggering sign-start");
            const message = Buffer.from("hello threshold world, good luck");
            const signPayload = {
                id: "req-10",
                action: "sign",
                session: "hellojikahdn",
                message: message.toString("base64"),
            };
            await pub.publish("sign-start", JSON.stringify(signPayload));
        }
    });
    await sub.subscribe("sign-result", async (msg) => {
        const data = JSON.parse(msg);
        if (data.result_type === "sign-result") {
            console.log(`Signature from node ${data.server_id}:`, data.data);
        }
        else if (data.result_type === "sign-error") {
            console.error(`Signing failed on node ${data.server_id}:`, data.error);
        }
    });
    // --- 3️⃣ Publish the DKG start message ---
    const dkgPayload = {
        id: "req-9",
        action: "startdkg",
        session: "hellojikahdn",
    };
    await pub.publish("dkg-start", JSON.stringify(dkgPayload));
    console.log("Sent DKG request ");
};
//# sourceMappingURL=redisController.js.map