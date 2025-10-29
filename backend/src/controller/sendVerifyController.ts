import type { Request, Response } from "express";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getKeyByUserId } from "../helpers/key.js";
import { sendTxnToServer } from "../helpers/sendtxn.js";
import bs58 from "bs58";
import { verifyChallenge } from "../helpers/webauthn.js";

interface BodyInputType {
  toAddress: String;
  lamports: number;
}

export const sendVerifyController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { toAddress, lamports }: BodyInputType = req.body;
    const { signed } = req.body;

    if (!userId) {
      return res.status(403).json({ message: "invalid credentials" });
    }

    // --- verify webauthn challenge ---
    const verified = verifyChallenge(userId, signed);

    // --- Create Solana Transaction ---
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const key = await getKeyByUserId(userId);
    if (!key) {
      return res.status(404).json({ message: "key not found" });
    }

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
      verified,
    });
  } catch (e) {
    console.error("sendVerifyController error:", e);
    return res.status(500).json({ message: "internal error", e });
  }
};
