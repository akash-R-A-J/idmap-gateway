import { sendCredMap, sendInputMap } from "./sendOptionController.js";
import { getCredentialByIdAndUserId, updateCounter, } from "../helpers/credentials.js";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, } from "@solana/web3.js";
import { getKeyByUserId } from "../helpers/key.js";
import { sendTxnToServer } from "../helpers/sendtxn.js";
import bs58 from "bs58";
export const sendVerifyController = async (req, res) => {
    const userId = req.userId;
    const { body } = req;
    if (!userId) {
        return res.status(403).json({ message: "invalid credentials" });
    }
    try {
        // Get the challenge for WebAuthn verification
        const options = sendCredMap.get(userId);
        if (!options) {
            return res.status(404).json({ message: "invalid credentials" });
        }
        console.log("got options");
        const credential = await getCredentialByIdAndUserId({
            id: body.id,
            userId,
        });
        if (!credential) {
            return res.status(404).json({ message: "credential not found" });
        }
        console.log("got correct credentials");
        // Verify authentication (WebAuthn)
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: options.challenge,
            expectedOrigin: process.env.origin,
            expectedRPID: process.env.rpID,
            credential: {
                id: credential.id,
                publicKey: Uint8Array.from(credential.publickey),
                counter: Number(credential.counter),
                transports: credential.transports,
            },
        });
        console.log("verification");
        const { verified, authenticationInfo } = verification;
        if (!verified) {
            return res.status(400).json({ message: "verification failed" });
        }
        console.log("verified");
        const { newCounter } = authenticationInfo;
        // Clean up challenge and update counter
        sendCredMap.delete(userId);
        await updateCounter(credential.id, newCounter);
        console.log("updated counter");
        // --- Create Solana Transaction ---
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const userInput = sendInputMap.get(userId);
        if (!userInput) {
            return res.status(403).json({ message: "invalid input" });
        }
        const { toAddress, lamports } = userInput;
        const key = await getKeyByUserId(userId);
        if (!key) {
            return res.status(404).json({ message: "key not found" });
        }
        console.log("got userinput and key");
        console.log("key.solanaAddress: ", key.solanaaddress);
        console.log("toAddress: ", toAddress);
        const sessionId = key.sessionid;
        const fromPubkey = new PublicKey(key.solanaaddress);
        const toPubkey = new PublicKey(toAddress);
        const instruction = SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
        });
        console.log("instruction");
        const { blockhash } = await connection.getLatestBlockhash();
        console.log("got blockhash");
        const messageV0 = new TransactionMessage({
            payerKey: fromPubkey,
            recentBlockhash: blockhash,
            instructions: [instruction],
        }).compileToV0Message();
        console.log("messagev0");
        const transaction = new VersionedTransaction(messageV0);
        console.log("transaction");
        // Serialize message for distributed signing
        const serialized = Buffer.from(transaction.message.serialize());
        const base64Message = serialized.toString("base64");
        console.log("base64 serialized message:", base64Message);
        // --- Send to Redis Pub/Sub cluster (Rust nodes) ---
        const signature = await sendTxnToServer(userId, base64Message, sessionId);
        if (!signature) {
            return res.status(400).json({ message: "signing failed" });
        }
        console.log("Received signature from DKG nodes:", signature);
        // --- Attach the signature ---
        transaction.addSignature(fromPubkey, bs58.decode(signature));
        console.log("broadcasting");
        // --- Broadcast to Solana ---
        const txid = await connection.sendTransaction(transaction, {
            maxRetries: 3,
            skipPreflight: false,
        });
        console.log("Transaction sent:", txid);
        return res.status(200).json({
            success: true,
            signature,
            txid,
            message: "Transaction successfully signed and broadcasted",
        });
    }
    catch (e) {
        console.error("sendVerifyController error:", e);
        return res.status(500).json({ message: "internal error", e });
    }
};
//# sourceMappingURL=sendVerifyController.js.map