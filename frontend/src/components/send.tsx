import { useState, useEffect } from "react";
import axios from "axios";
import { startAuthentication } from "@simplewebauthn/browser";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  Wallet,
  Send,
  Coins,
  Database,
  Loader2,
  ShieldCheck,
  Cpu,
  Fingerprint,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface Transaction {
  toAddress: string;
  amount: number;
  status: boolean;
  signature: string;
  txid: string;
}

export const SendTransaction = ({ publicKey }: { publicKey: string }) => {
  const [toAddress, setToAddress] = useState("");
  const [lamports, setLamports] = useState(0); // NOTE: this is actually in sol not in lamports
  const [loading, setLoading] = useState(false);
  const [airdropLoading, setAirdropLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionTemplate`${y}deg`;
  const rotateY = useMotionTemplate`${x}deg`;

  useEffect(() => {
    async function fetchTxs() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/v1/transactions`,
          {
            headers: { token: localStorage.getItem("token") },
          }
        );
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      }
    }
    fetchTxs();
  }, []);

  async function handleSend() {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/v1/send-options`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
        }
      );

      const { options } = response.data;
      if (!options) {
        alert(response.data.message);
        return;
      }

      const authResponse = await startAuthentication(options);
      const verifyResponse = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/v1/send-verify`,
        { toAddress, lamports: lamports * 1_000_000_000, signed: authResponse },
        {
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
        }
      );

      const { success, verified, signature, txid, message } =
        verifyResponse.data;
      if (!verified) {
        alert(message);
        return;
      }

      const tx: Transaction = {
        toAddress,
        amount: lamports,
        status: success ? success : false,
        signature,
        txid,
      };

      setTransactions((prev) => [...prev, tx]);

      alert(message || "Transaction sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Transaction failed.");
    } finally {
      setLoading(false);
      setLamports(0);
      setToAddress("");
    }
  }

  /// 🚀 Helper: Airdrops `lamports` to the given Solana address (Devnet)
  async function handleAirdrop() {
    const address = publicKey;
    const lamports = LAMPORTS_PER_SOL; // 1 SOL
    setAirdropLoading(true);

    const rpcEndpoints = [
      "https://api.devnet.solana.com",
      "https://rpc.ankr.com/solana_devnet",
      "https://devnet.rpcpool.com",
      "https://rpc-devnet.helius.xyz",
      "https://devnet-rpc.triton.one",
    ];

    const pubkey = new PublicKey(address);
    let success = false;

    for (const url of rpcEndpoints) {
      const connection = new Connection(url, "confirmed");

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const sig = await connection.requestAirdrop(pubkey, lamports);
          const latestBlockhash = await connection.getLatestBlockhash();
          const confirmation = await connection.confirmTransaction(
            {
              signature: sig,
              ...latestBlockhash,
            },
            "confirmed"
          );

          if (confirmation.value.err === null) {
            console.info(
              `Airdrop successful via ${url} (attempt ${attempt}) — ${lamports} lamports sent to ${address}`
            );
            success = true;
            break;
          } else {
            await new Promise((r) => setTimeout(r, 200));
          }
        } catch (e) {
          console.error(`Airdrop attempt ${attempt} via ${url} failed:`, e);
          await new Promise((r) => setTimeout(r, 200));
        } finally {
          setAirdropLoading(false);
        }
      }

      if (success) break;
    }

    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    try {
      const balance = await connection.getBalance(pubkey);
      console.info(
        `Current balance for ${address}: ${balance / LAMPORTS_PER_SOL} SOL`
      );
    } catch (e) {
      console.error(`Failed to fetch balance for ${address}:`, e);
    }

    if (success) {
      alert("Airdrop successful");
    } else {
      alert("Airdrop limit reached");
      console.error(`Airdrop failed on all RPC endpoints for ${address}`);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#030014] text-gray-100 overflow-hidden flex flex-col">
      {/* Curved Animated Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <motion.path
          d="M0,500 C250,400 750,600 1000,500"
          stroke="url(#grad1)"
          strokeWidth="3"
          fill="none"
          animate={{
            d: [
              "M0,500 C200,300 800,700 1000,500",
              "M0,500 C250,400 750,600 1000,500",
              "M0,500 C300,600 700,400 1000,500",
            ],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Blobs */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-600/30 via-indigo-600/20 to-blue-500/20 blur-[180px] -top-40 -left-40"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-cyan-500/20 via-indigo-500/30 to-fuchsia-500/30 blur-[160px] -bottom-40 -right-40"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
      />

      {/* 🔑 Display User Public Key */}
      {publicKey && (
        <div className="w-full flex flex-col items-center mt-8">
          <p className="text-gray-400 text-sm mb-2">Your Solana Address</p>
          <div className="flex items-center space-x-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-gray-100 max-w-[90%] break-all">
            <span className="text-sm truncate">{publicKey}</span>

            {/* Copy Button with Feedback */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 5000);
              }}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className={`ml-3 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                copied
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } ${hovering ? "cursor-pointer" : ""}`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* ⚙️ Layout */}
      <div className="flex flex-1 flex-col lg:flex-row items-center justify-between px-10 py-20 space-y-12 lg:space-y-0 lg:space-x-12">
        {/* 🧭 Left Sidebar */}
        <div className="flex flex-col space-y-6 pl-5 mb-10 w-full lg:w-1/4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-3xl font-semibold text-indigo-400">Features</h2>
            <div className="flex flex-col gap-3 text-gray-300 text-sm">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-400" />
                Passwordless WebAuthn Login
              </div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                Multi-Party Computation Key Sharing
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Distributed Transaction Validation
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                Zero-Trust Identity Verification
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-yellow-400" />
                Encrypted Off-Chain Data Storage
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-pink-400" />
                Decentralized Wallet Management
              </div>
            </div>
          </motion.div>
        </div>

        {/* 💳 Center Transaction Card */}
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const xPos = e.clientX - rect.left;
            const yPos = e.clientY - rect.top;
            x.set((yPos / rect.height - 0.5) * 10);
            y.set((xPos / rect.width - 0.5) * -10);
          }}
          onMouseLeave={() => {
            x.set(0);
            y.set(0);
          }}
          className="w-full lg:w-[420px] transition-transform duration-300"
        >
          <Card className="bg-white/10 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="w-5 h-5 text-indigo-400" /> Send Transaction
              </CardTitle>
              <CardDescription className="text-gray-400">
                Secure Solana transfer using IDMAP authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Recipient Solana Address"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="bg-white/10 border-white/20 text-gray-100"
              />
              <Input
                type="number"
                placeholder="Amount (lamports)"
                value={lamports}
                onChange={(e) => setLamports(Number(e.target.value))}
                className="bg-white/10 border-white/20 text-gray-100"
              />

              <Button
                onClick={handleSend}
                disabled={loading || !toAddress || lamports <= 0}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send
                  </>
                )}
              </Button>

              <Button
                onClick={handleAirdrop}
                disabled={airdropLoading}
                variant="outline"
                className="w-full bg-white/5 hover:bg-white/10 text-indigo-400 border border-indigo-500/40"
              >
                {airdropLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Requesting...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" /> Airdrop 1 SOL (Devnet)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* 🧾 Right Side - Info */}
        <div className="w-full lg:w-1/4 space-y-4 text-gray-300">
          <h2 className="text-3xl font-semibold text-purple-400">
            About IDMAP
          </h2>
          <p className="text-sm leading-relaxed text-gray-400">
            IDMAP bridges decentralized identity with secure multi-party
            computation. Each transaction is verified through user
            authentication and MPC signing, ensuring total trustless security.
          </p>
        </div>
      </div>

      {/* 🧾 History */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-12"
      >
        <div className="flex items-center gap-2 mb-4">
          <Database className="text-purple-400 w-5 h-5" />
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">
            No transactions yet
          </p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx, i) => (
              <li
                key={i}
                className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 text-sm flex justify-between items-center hover:bg-white/10 transition-colors"
              >
                <span className="truncate max-w-[200px] text-gray-300">
                  {tx.toAddress}
                </span>
                <span className="text-indigo-400">{tx.amount} SOL</span>
                <span
                  className={`${
                    tx.status ? "text-green-400" : "text-red-400"
                  } text-xs font-medium`}
                >
                  {tx.status ? "Success" : "Failed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Footer */}
      <div className="pb-6 text-center text-gray-500 text-sm">
        <div className="flex justify-center items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <p>
            Built with 💙 by <span className="text-indigo-400">IDMAP</span> —
            Web3 Identity Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
};
