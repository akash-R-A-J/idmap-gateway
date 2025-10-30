import { startAuthentication } from "@simplewebauthn/browser";
import axios from "axios";
import { sign } from "crypto";
import { Session } from "next-auth";

export interface TransferRequest {
  recipientPublicKey: string;
  amount: number;
}

export interface TransferResponse {
  success: boolean;
  // transactionId?: string;
  message?: string;
}

// send-options and send-verify api endpoints
export async function transferTokens(
  data: TransferRequest,
  session: Session | null
): Promise<TransferResponse> {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const token = (session as any)?.accessToken || "";

  try {
    const toAddress = data.recipientPublicKey;
    const lamports = data.amount * 1_000_000_000; // TODO: convert this into lamports

    const response: any = await axios.get(
      `${backendUrl}/api/v1/send-options`,
      // method: "POST",
      {
        headers: {
          "Content-Type": "application/json",
          token,
        },
      }
      // body: JSON.stringify(data),
      // body: JSON.stringify({toAddress, lamports})
    );

    const { options } = response.data;

    // 1️⃣ Step 1: Get send options (challenge + token)
    // const response = await axios.post(
    //   `${backendUrl}/api/v1/send-options`,
    //   { toAddress, lamports },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       token,
    //     },
    //   }
    // );

    console.log("Send options response:", response.data);

    // const { options } = response.data;

    // 2️⃣ Step 2: Perform WebAuthn authentication (sign the challenge)
    const authResponse = await startAuthentication(options);
    console.log("Authentication response:", authResponse);

    // 3️⃣ Step 3: Verify the signed challenge
    const verifyResponse = await axios.post(
      "http://localhost:5000/api/v1/send-verify",
      { toAddress, lamports, signed: authResponse },
      {
        headers: {
          "Content-Type": "application/json",
          token,
        },
      }
    );

    // value.success = true;
    // value.message =
    //   verifyResponse.data.message || "Transaction verified successfully!";
    console.log("Verification response:", verifyResponse.data);
    const { success, verified, signature, txid, message } = verifyResponse.data;
    console.log(verified, signature, txid);

    alert(verifyResponse.data.message || "Transaction verified successfully!");
    return { success, message };
    
  } catch (err) {
    console.error("Error during transaction verification:", err);
    alert("Transaction failed. Check console for details.");
    return { success: false, message: "Transaction failed." };
  }

  // if (!verifyResponse.ok) {
  //   const errorData = await response.json().catch(() => ({}));
  //   throw new Error(errorData.message || "Transfer failed");
  //}
}
