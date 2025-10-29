"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SignUpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/transfer");
    }
  }, [status, session, router]);

  const handleSocialSignUp = async (provider: "google" | "github") => {
    try {
      await signIn(provider, {
        callbackUrl: "/transfer",
        redirect: true,
      });
    } catch (error) {
      toast.error("Authentication failed");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('email-only', {
        email,
        callbackUrl: '/transfer',
        redirect: true
      });

      if (result?.error) {
        toast.error('Sign up failed');
      }
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="w-8 h-8 border-3 border-gray-700 border-t-gray-300 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="text-gray-400 text-sm">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <main className="flex-1 flex">
        <div className="hidden lg:flex lg:w-1/2 bg-[#0f0f0f]">
          <div className="flex flex-col justify-center w-full pl-20 pr-16 py-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 max-w-[480px]"
            >
              {/* Logo and Brand Name */}
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <img src="/logo.png" alt="IdMap" className="w-9 h-9 rounded-md object-cover" />
                <span className="text-lg font-semibold text-white">Id&lt;Map&gt;</span>
              </div>

              {/* Feature 1: Never Expose Private Keys */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-[20px] h-[20px] text-[#7c6aef]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-white mb-2 leading-[1.3]">
                    Never Expose Private Keys
                  </h3>
                  <p className="text-[13px] font-normal text-gray-400 leading-[1.7]">
                    Your private keys never exist in full anywhere. idmap uses MPC-based cryptography to split and secure them across multiple nodes.
                  </p>
                </div>
              </div>

              {/* Feature 2: Unified Web2 + Web3 Identity */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-[20px] h-[20px] text-[#7c6aef]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-white mb-2 leading-[1.3]">
                    Unified Web2 + Web3 Identity
                  </h3>
                  <p className="text-[13px] font-normal text-gray-400 leading-[1.7]">
                    Sign up with your email or social login and instantly connect your decentralized wallet — no passwords, no custodians.
                  </p>
                </div>
              </div>

              {/* Feature 3: Trustless Signing, Simplified */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-[20px] h-[20px] text-[#7c6aef]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-white mb-2 leading-[1.3]">
                    Trustless Signing, Simplified
                  </h3>
                  <p className="text-[13px] font-normal text-gray-400 leading-[1.7]">
                    Every transaction is signed collectively and verified on-chain — fully secure, transparent, and Solana-ready.
                  </p>
                </div>
              </div>

              {/* Feature 4: Future-Ready Authentication */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-[20px] h-[20px] text-[#7c6aef]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-white mb-2 leading-[1.3]">
                    Future-Ready Authentication
                  </h3>
                  <p className="text-[13px] font-normal text-gray-400 leading-[1.7]">
                    From secure logins to cross-chain identity proofs, idmap is the foundation of next-gen decentralized authentication.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center items-center px-8 bg-[#0f0f0f] py-8">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full max-w-[440px]"
  >
    {/* SIGNUP CARD */}
    <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] px-12 py-12 shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-[26px] font-semibold text-white mb-2">Create your account</h1>
        <p className="text-[13px] text-gray-500">Welcome! Please fill in the details to get started.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => handleSocialSignUp('github')}
          className="h-11 px-3.5 flex items-center justify-center gap-2 bg-transparent border border-[#333] rounded-md text-[13px] text-gray-300 hover:bg-[#1f1f1f] transition-all font-medium"
        >
          <svg className="w-[15px] h-[15px]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </button>

        <button
          onClick={() => handleSocialSignUp('google')}
          className="h-11 px-3.5 flex items-center justify-center gap-2 bg-transparent border border-[#333] rounded-md text-[13px] text-gray-300 hover:bg-[#1f1f1f] transition-all font-medium"
        >
          <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2a2a2a]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[#181818] text-gray-600 text-[12px]">or continue with email</span>
        </div>
      </div>

      {/* Email Sign Up Form */}
      <form onSubmit={handleEmailSignUp} className="mb-6">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-11 px-4 text-[13px] bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#7c6aef] focus:ring-2 focus:ring-[#7c6aef]/20 text-white placeholder-gray-600 transition-all duration-200 hover:border-[#3a3a3a] mb-3"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#7c6aef] hover:bg-[#6b5bd4] text-white rounded-lg font-semibold text-[13px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#7c6aef]/20 active:scale-[0.98]"
        >
          {loading ? 'Creating account...' : 'Sign up with Email'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-[13px] text-gray-500">
          Already have an account?{' '}``
          <Link href="/signin" className="text-[#7c6aef] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>

    {/* FOOTER */}
    <div className="mt-5 text-center">
      <p className="text-[11px] text-gray-600">
        Secured by <span className="text-gray-500 font-medium">Id&lt;Map&gt;</span>
      </p>
    </div>
  </motion.div>
</div>

      </main>

      <footer className="w-full py-3 bg-[#0f0f0f]">
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500">
          <span>© 2025 Id&lt;Map&gt;</span>
          <span>·</span>
          <a href="#" className="hover:text-gray-400 transition-colors">
            Support
          </a>
          <span>·</span>
          <a href="#" className="hover:text-gray-400 transition-colors">
            Privacy
          </a>
          <span>·</span>
          <a href="#" className="hover:text-gray-400 transition-colors">
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
