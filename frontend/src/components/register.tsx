import React, { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import axios from "axios";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Fingerprint, Shield, Cpu, Globe2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Register = ({
  setPublicKey,
}: {
  setPublicKey: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // register button
  async function handleClick() {
    try {
      setIsLoading(true);

      console.log("requesting for challenge");
      const response = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/v1/register-options`,
        { e: email },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("got the challenge");

      const { options, message: challengeMessage } = response.data;

      // ⚡ Always alert backend message (even if failed)
      if (challengeMessage) toast.info(challengeMessage);

      if (!options) {
        return; // stop here if no registration options
      }

      const attResp = await startRegistration(options);

      console.log("sending the signed challenge for verification");
      const verifyResp = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/v1/register-verify`,
        { e: email, signed: attResp },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("verified");
      const { message, verified, publicKey, token } = verifyResp.data;

      // ⚡ Always alert backend message (success or failure)
      toast.success(message || "Something went wrong.");

      if (!verified || !token || !publicKey) {
        return; // stop here if registration failed
      }

      setPublicKey(publicKey);
      localStorage.setItem("token", token);

      setEmail("");
      navigate("/transfer");
    } catch (error: any) {
      console.error("server error", error);

      // Alert the backend message if present
      const backendMessage =
        error?.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(backendMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#101010] bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-gray-200 overflow-x-hidden">
      {/* glowing background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 opacity-20 blur-[200px]" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500 to-purple-600 opacity-20 blur-[180px]" />
      </div>

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center pt-16"
      >
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500 drop-shadow-md">
          ID<span className="text-indigo-300">MAP</span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Decentralized Identity Layer — Built for the Future of Authentication
        </p>
      </motion.div>

      {/* main content */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-16 mt-16 px-8 md:px-20">
        {/* left: info section */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-8 max-w-xl"
        >
          <Feature
            icon={<Shield className="w-6 h-6 text-indigo-400" />}
            title="Never Expose Private Keys"
            text="Your keys never exist in full anywhere. IDMAP uses MPC-based Distributed Key Generation (DKG) to split and secure key shares across multiple nodes."
          />
          <Feature
            icon={<Cpu className="w-6 h-6 text-blue-400" />}
            title="Threshold Signing Made Simple"
            text="Each node signs its share independently — IDMAP combines them into a valid on-chain signature, without ever revealing the secret."
          />
          <Feature
            icon={<Globe2 className="w-6 h-6 text-purple-400" />}
            title="Web2 + Web3 Identity Bridge"
            text="Link Gmail, GitHub, or Twitter with your Web3 wallet. Own your unified digital identity securely, across ecosystems."
          />
        </motion.div>

        {/* right: registration card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 shadow-lg shadow-indigo-700/40">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Create Your IDMAP Account
            </h2>
            <p className="text-gray-400 text-sm text-center">
              Passwordless registration using WebAuthn & MPC
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border border-white/20 text-gray-100 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
            <Button
              onClick={handleClick}
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all py-2.5 shadow-lg shadow-indigo-800/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register with IDMAP"
              )}
            </Button>
          </div>

          {/* 🔗 Already registered? */}
          <p className="text-gray-400 text-sm text-center mt-6 cursor-pointer">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/signin")}
              className="text-indigo-400 hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>

          <p className="text-gray-500 text-xs text-center mt-4">
            🔒 Your registration is end-to-end secure using MPC & WebAuthn.
          </p>
        </motion.div>
      </div>

      {/* footer */}
      <div className="text-center mt-16 mb-10 text-gray-500 text-sm">
        © {new Date().getFullYear()} IDMAP — The Future of Decentralized
        Identity
      </div>
    </div>
  );
};

const Feature = ({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) => (
  <div className="flex gap-4 items-start">
    <div className="p-2 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
    </div>
  </div>
);
