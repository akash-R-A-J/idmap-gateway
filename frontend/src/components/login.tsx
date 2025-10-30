import { startAuthentication } from "@simplewebauthn/browser";
import axios from "axios";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, KeyRound, ShieldCheck, Cpu, Network, Zap, Database } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!email) {
      alert("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/v1/login-options",
        { e: email },
        { headers: { "Content-Type": "application/json" } }
      );
      
      const {options, token} = response.data;
      if(!options || !token){
        alert(response.data.message);
        return;
      }
        

      const asseResp = await startAuthentication(options);

      const verificationResp = await axios.post(
        "http://localhost:5000/api/v1/login-verify",
        {signed: asseResp},
        {
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );
      
      const {verified, message} = verificationResp.data;
      if(!verified){
        alert(message);
      }

      localStorage.setItem("token", token);
      alert(message);
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: <KeyRound className="w-5 h-5 text-indigo-400" />,
      title: "Never Expose Private Keys",
      desc: "IDMAP uses MPC-based Distributed Key Generation (DKG) to split and secure key shares across nodes.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      title: "Threshold Signing Made Simple",
      desc: "Sign blockchain transactions without revealing secrets. Each node signs its share, forming a valid on-chain signature.",
    },
    {
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      title: "Composable Rust Modules",
      desc: "Use modular crates for DKG, signing, transport, and client — plug only what you need.",
    },
    {
      icon: <Network className="w-5 h-5 text-indigo-400" />,
      title: "Web2 + Web3 Identity Bridge",
      desc: "Link Gmail or Twitter with your Web3 wallet. Own your identity across ecosystems.",
    },
    {
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      title: "Asynchronous & Distributed",
      desc: "Built with Tokio for fast, non-blocking networking — optimized for DKG and signing rounds.",
    },
    {
      icon: <Database className="w-5 h-5 text-indigo-400" />,
      title: "On-Chain Verifiable",
      desc: "All signatures are verifiable on-chain (Solana-compatible). Trustless by design.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col md:flex-row items-center justify-center px-6 py-10 gap-10">
      
      {/* Left Side - Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex justify-center"
      >
        <Card className="w-[380px] backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
          <CardHeader className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              ID<span className="text-indigo-300">MAP</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm tracking-wide">
              Decentralized Identity Login
            </p>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                name="email"
                id="email-login"
                placeholder="Enter your registered email"
                className="pl-10 bg-gray-800/50 text-gray-100 border-gray-700 focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={handleClick}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all duration-200 ease-in-out flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Login with IDMAP"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Secure passwordless login using WebAuthn.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Side - Feature Showcase */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 max-w-xl space-y-5 text-gray-300"
      >
        <h2 className="text-2xl font-semibold text-indigo-300 mb-2">
          Why IDMAP?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-1">
                {f.icon}
                <h3 className="text-sm font-medium text-gray-100">{f.title}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
