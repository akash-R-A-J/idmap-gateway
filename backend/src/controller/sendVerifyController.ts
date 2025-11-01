import type { Request, Response } from "express";
import pino from "pino";
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

const logger = pino({ name: "sendVerifyController" });

interface BodyInputType {
  toAddress: string;
  lamports: number;
  signed: any;
}

/**
 * @description
 * Verifies a user's WebAuthn challenge and executes a Solana transfer transaction
 * signed via DKG nodes, then broadcasts it to the Solana network.
 */

// TODO: update redis-client here too  (connection: quit and connect)
export const sendVerifyController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { toAddress, lamports, signed }: BodyInputType = req.body;

    // TODO: check if user has the lamports amount to send or not
    if (!userId) {
      logger.warn("Missing userId in request");
      return res.status(403).json({ message: "invalid credentials" });
    }

    if (!toAddress || !lamports || !signed) {
      logger.warn({ userId }, "Missing required transaction parameters");
      return res.status(400).json({ message: "invalid input" });
    }

    // --- Step 1: Verify WebAuthn challenge ---
    const verified = await verifyChallenge(userId, signed);
    if (!verified) {
      logger.warn({ userId }, "WebAuthn challenge verification failed");
      return res.status(403).json({ message: "invalid credentials" });
    }

    // --- Step 2: Setup Solana connection ---
    const rpcUrl =
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    logger.info({ rpcUrl }, "Connected to Solana RPC");

    // --- Step 3: Retrieve user's DKG shared key info ---
    const key = await getKeyByUserId(userId);
    if (!key) {
      logger.error({ userId }, "No DKG key found for user");
      return res.status(404).json({ message: "key not found" });
    }

    const sessionId = key.sessionid;
    const fromPubkey = new PublicKey(key.solanaaddress);
    const toPubkey = new PublicKey(toAddress);

    // --- Step 4: Create Solana transfer instruction ---
    const instruction = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    });

    const { blockhash } = await connection.getLatestBlockhash();
    logger.info({ blockhash }, "Latest blockhash retrieved");

    const messageV0 = new TransactionMessage({
      payerKey: fromPubkey,
      recentBlockhash: blockhash,
      instructions: [instruction],
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // --- Step 5: Serialize transaction message for signing ---
    const serialized = Buffer.from(transaction.message.serialize());
    const base64Message = serialized.toString("base64");

    logger.info(
      { sessionId, userId },
      "Serialized transaction message prepared"
    );

    // --- Step 6: Send transaction message to distributed key servers (Rust DKG nodes) ---
    const signature = await sendTxnToServer(userId, base64Message, sessionId);
    if (!signature) {
      logger.error(
        { userId, sessionId },
        "No signature received from DKG nodes"
      );
      return res.status(400).json({ message: "signing failed" });
    }

    logger.info({ userId, sessionId, signature }, "Received DKG signature");

    // --- Step 7: Attach aggregated signature ---
    transaction.addSignature(fromPubkey, bs58.decode(signature));

    // --- Step 8: Broadcast the transaction to Solana network ---
    const txid = await connection.sendTransaction(transaction, {
      maxRetries: 3,
      skipPreflight: false,
    });

    logger.info({ txid, userId }, "Transaction successfully broadcasted");

    return res.status(200).json({
      success: true,
      verified,
      signature,
      txid,
      message: "Transaction successfully signed and broadcasted",
    });
  } catch (error) {
    logger.error(
      { error },
      "Error during transaction verification or broadcast"
    );
    return res.status(500).json({ message: "internal server error" });
  }
};
