// import {
//   Connection,
//   PublicKey,
//   SystemProgram,
//   Message,
//   TransactionInstruction,
// } from "@solana/web3.js";
// import Redis from "ioredis";

// const redis = new Redis("redis://localhost:6379");

// async function sendSignRequest() {
//   const fromAddress = "9sT6aFwYdFQ8x1Zt9Ecs4mC5ZkvU7xVqZsNdoC5PhqBA";
//   const toAddress = "3fHQhTVCHerqk69GwqXhWbG4zRArCUqi6Bhnu7pTm5mj";
//   const lamports = 1_000_000;

//   // --- create a Solana Message ---
//   const connection = new Connection("https://api.devnet.solana.com", "confirmed");
//   const fromPubkey = new PublicKey(fromAddress);
//   const toPubkey = new PublicKey(toAddress);

//   const instruction = SystemProgram.transfer({
//     fromPubkey,
//     toPubkey,
//     lamports,
//   });

//   const { blockhash } = await connection.getLatestBlockhash();
//   const message = new Message({
//     payerKey: fromPubkey,
//     recentBlockhash: blockhash,
//     instructions: [instruction as TransactionInstruction],
//   });

//   const serialized = message.serialize(); // this must match Rust's `Message::serialize()`
//   const base64Message = serialized.toString("base64");

//   // --- send to Redis for signing ---
//   const payload = {
//     id: "req-001",
//     action: "sign",
//     session: "session-001",
//     message: base64Message,
//   };

//   await redis.publish("sign-start", JSON.stringify(payload));
//   console.log("✅ Sent sign request:", payload);
// }

// sendSignRequest().catch(console.error);
