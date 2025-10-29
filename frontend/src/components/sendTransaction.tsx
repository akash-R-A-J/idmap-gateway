import { useState } from "react";
import axios from "axios";
import { startAuthentication } from "@simplewebauthn/browser";

export const SendTransaction = () => {
  const [toAddress, setToAddress] = useState<string>("");
  const [lamports, setLamports] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSend() {
    try {
      setLoading(true);

      // 1️⃣ Step 1: Get send options (challenge + token)
      const response = await axios.post(
        "http://localhost:5000/api/v1/send-options",
        { toAddress, lamports },
        {
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
        }
      );

      console.log("Send options response:", response.data);

      const { options } = response.data;

      // 2️⃣ Step 2: Perform WebAuthn authentication (sign the challenge)
      const authResponse = await startAuthentication(options);
      console.log("Authentication response:", authResponse);

      // 3️⃣ Step 3: Verify the signed challenge
      const verifyResponse = await axios.post(
        "http://localhost:5000/api/v1/send-verify",
        authResponse,
        {
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
        }
      );

      console.log("Verification response:", verifyResponse.data);
      alert(
        verifyResponse.data.message || "Transaction verified successfully!"
      );
    } catch (err) {
      console.error("Error during transaction verification:", err);
      alert("Transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-700 p-6 rounded-md flex flex-col items-center justify-center w-96 mx-auto">
      <h2 className="text-xl text-white mb-4 font-semibold">Send SOL</h2>

      <input
        type="text"
        placeholder="Recipient Solana Address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
        className="bg-gray-600 text-gray-100 px-4 py-2 rounded-md w-full mb-3"
      />

      <input
        type="number"
        placeholder="Lamports"
        value={lamports}
        onChange={(e) => setLamports(Number(e.target.value))}
        className="bg-gray-600 text-gray-100 px-4 py-2 rounded-md w-full mb-3"
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-gray-900 text-white px-4 py-2 rounded-md w-full hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Send"}
      </button>
    </div>
  );
};
