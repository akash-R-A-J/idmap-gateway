import { startAuthentication } from "@simplewebauthn/browser";
import axios from "axios";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Mail,
  Loader2,
  // KeyRound,
  // ShieldCheck,
  // Cpu,
  // Network,
  // Zap,
  // Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const navigate = useNavigate();

  async function handleClick() {
    if (!email) {
      toast.warning("Missing Email", {
        description: "Please enter your email before continuing.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/v1/login-options`,
        { e: email },
        { headers: { "Content-Type": "application/json" } }
      );

      const { options, token, message } = response.data;

      if (!options || !token) {
        toast.warning("Login Error", {
          description: message || "Failed to initiate login. Please try again.",
        });
        return;
      }

      // Pass preferred user verification if "Remember device" is checked
      const asseResp = await startAuthentication({
        ...options,
        userVerification: rememberDevice ? "preferred" : "discouraged",
      });

      const verificationResp = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/v1/login-verify`,
        { signed: asseResp },
        {
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );

      const { verified, message: verifyMsg } = verificationResp.data;

      if (verified) {
        localStorage.setItem("token", token);
        localStorage.setItem("email", email);
        toast.success("Login Successful", {
          // description: verifyMsg || "You've successfully logged in!",
        });
        navigate("/transfer");
      } else {
        toast.error("Login Failed", {
          description: verifyMsg || "Authentication failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Error during login:", error);
      const backendMsg =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.warning("Login Failed", {
        description: backendMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col md:flex-row items-center justify-center px-8 py-10 gap-12 overflow-x-hidden">
      {/* Left Side - Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex justify-center"
      >
        <Card className="w-[420px] backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
          <CardHeader className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              ID<span className="text-indigo-300">MAP</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm tracking-wide">
              Decentralized Identity Login
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-6">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-gray-800/50 text-gray-100 border-gray-700 focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              />
            </div>

            {/* ✅ Remember Device Option */}
            <div className="flex items-center mt-2 space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="accent-indigo-500"
              />
              <label
                htmlFor="remember"
                className="text-gray-400 text-sm select-none"
              >
                Remember this device
              </label>
            </div>

            <Button
              onClick={handleClick}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all py-4 shadow-lg shadow-indigo-800/30"
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

            <div className="text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/")}
                className="text-indigo-400 cursor-pointer hover:underline"
              >
                Sign up here
              </span>
            </div>

            <p className="text-xs text-gray-400 text-center mt-5">
              🔒 Secure passwordless login using WebAuthn.
            </p>

            {/* ✅ Social Identity Bridge (visual only) */}
            {/* <div className="flex justify-center gap-3 mt-3">
              <Button variant="outline" size="icon">
                <img src="/google.svg" alt="Google" className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <img src="/github.svg" alt="GitHub" className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <img src="/twitter.svg" alt="Twitter" className="w-5 h-5" />
              </Button>
            </div> */}

            {/* ✅ Security Badge */}
            {/* <p className="text-xs text-gray-500 text-center mt-2">
              🔐 Audited by XYZ Labs · FIDO2 Certified
            </p> */}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
