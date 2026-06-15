"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TerminalSquare, Mail, Lock, Chrome, Github, AlertCircle, ArrowRight } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { user, login, signUp, loginWithOAuth, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert("Registration successful! You can now sign in.");
        setIsSignUp(false);
      } else {
        await login(email, password);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSOLogin = async (provider: "google" | "github") => {
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || `SSO login failed for ${provider}`);
      setIsSubmitting(false);
    }
  };

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand logo header */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center gap-2" onClick={() => router.push("/")}>
            <TerminalSquare className="w-10 h-10 text-brand-500 cursor-pointer" />
            <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white cursor-pointer">MacroForge</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {isSignUp ? "Create an account to start building automations" : "Sign in to access your automation workspace"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-[#09090b]/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2.5 text-red-700 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>{isSignUp ? "Create Free Account" : "Access Workspace"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <span className="relative px-3 bg-white dark:bg-[#0c0c0e] text-xs font-medium text-gray-500 uppercase tracking-widest">Or Continue With</span>
          </div>

          {/* SSO Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSSOLogin("google")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/40 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-red-500" />
              <span>Google</span>
            </button>
            <button
              onClick={() => handleSSOLogin("github")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/40 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <Github className="w-4 h-4 text-gray-900 dark:text-white" />
              <span>GitHub</span>
            </button>
          </div>

          {/* Toggle Link */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            {isSignUp ? "Already have an account?" : "New to MacroForge?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-bold text-brand-500 hover:text-brand-600 hover:underline cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Create one for free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
