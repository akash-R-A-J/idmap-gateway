import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { Toaster } from "sonner";
import { Login } from "./components/login";
import { Register } from "./components/register";
import { SendTransaction } from "./components/send";

function App() {
  const [publickKey, setPublicKey] = useState<string>("");
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Register setPublicKey={setPublicKey} />} />
          <Route path="/signin" element={<Login />} />
          <Route
            path="/transfer"
            element={<SendTransaction publicKey={publickKey} />}
          />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </>
  );
}

export default App;

// right-side displayed feature on the login page
{
  /* Right Side - Feature Section (Single Column + Space on Right) */
}
{
  /* <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 max-w-md space-y-6 text-gray-300 pr-8"
      >
        <h2 className="text-3xl font-semibold text-indigo-300 mb-4">
          Why Choose IDMAP?
        </h2>

        <div className="flex flex-col gap-4">
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
      </motion.div> */
}

/**
 * 
  const features = [
    {
      icon: <KeyRound className="w-5 h-5 text-indigo-400" />,
      title: "Never Expose Private Keys",
      desc: "Your keys never exist in full anywhere. IDMAP uses MPC-based DKG to split and secure key shares across nodes.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      title: "Threshold Signing Made Simple",
      desc: "Each node signs its share independently — IDMAP combines them into a valid on-chain signature.",
    },
    {
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      title: "Composable Rust Modules",
      desc: "Plug and play modular crates for DKG, signing, and transport layers.",
    },
    {
      icon: <Network className="w-5 h-5 text-indigo-400" />,
      title: "Web2 + Web3 Identity Bridge",
      desc: "Link Gmail, GitHub, or Twitter with your Web3 wallet. Own your digital identity securely.",
    },
    {
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      title: "Async & Distributed",
      desc: "Built with Tokio for non-blocking, concurrent networking — optimized for DKG and signing rounds.",
    },
    {
      icon: <Database className="w-5 h-5 text-indigo-400" />,
      title: "On-Chain Verifiable",
      desc: "All signatures are verifiable on-chain (Solana-compatible). Trustless by design.",
    },
  ];

 */
