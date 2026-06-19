"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { 
  TerminalSquare, User, Zap, Coins, ArrowLeft, LogOut, 
  Layers, Code2, Calendar, Shield, CreditCard, ChevronRight 
} from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";

export default function Profile() {
  const router = useRouter();
  const { user, credits, isPro, isLoading, refreshProfile, logout } = useAuth();
  
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"credits" | "pro">("credits");

  // Protect route
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch count of saved scripts
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.email) return;
      try {
        const { count, error } = await supabase
          .from("saved_work")
          .select("*", { count: "exact", head: true })
          .eq("email", user.email);

        if (!error && count !== null) {
          setSavedCount(count);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    if (user) {
      fetchStats();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          <p className="text-gray-400 text-sm font-semibold">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = async (type: "credits" | "pro") => {
    await refreshProfile();
  };

  const getEmailPrefix = (email: string) => {
    return email.split("@")[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[110px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="w-full bg-white dark:bg-[#09090b]/80 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
              <TerminalSquare className="w-8 h-8 text-brand-500" />
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">MacroForge</span>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs font-semibold text-gray-650 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 bg-gray-100 dark:bg-gray-800/80 hover:bg-brand-500/10 px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 select-none"
              id="back-to-workspace-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Workspace
            </button>
          </div>
        </div>
      </nav>

      {/* Main Profile Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8 z-10">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="w-8 h-8 text-brand-500" />
            Account Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Manage your credentials, subscriptions, and script history.
          </p>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Personalized Profile Summary */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900/35 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-450 via-brand-500 to-emerald-600"></div>
              
              {/* User Avatar */}
              <div className="w-20 h-20 rounded-full bg-brand-500/10 border-2 border-brand-500/20 flex items-center justify-center mb-4 text-brand-500 font-extrabold text-2xl uppercase select-none">
                {getEmailPrefix(user.email).substring(0, 2)}
              </div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-full" id="profile-email-header">
                {getEmailPrefix(user.email)}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-full">
                {user.email}
              </p>

              {/* Badges */}
              <div className="mt-4 flex flex-col items-center gap-2 w-full">
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 font-black text-[10px] tracking-wider border border-purple-500/20 uppercase select-none">
                    <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                    PRO MEMBER
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold text-[10px] tracking-wider border border-gray-200 dark:border-gray-750 uppercase select-none">
                    Standard Account
                  </span>
                )}
              </div>

              <div className="w-full border-t border-gray-150 dark:border-gray-800/80 my-5"></div>

              {/* User Metadata list */}
              <div className="flex flex-col gap-3 w-full text-left text-xs">
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Joined June 2026</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span>Secure Local Run Mode</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                  <Code2 className="w-4 h-4 text-gray-400" />
                  <span>Sandbox Environment Active</span>
                </div>
              </div>

              {/* Log out CTA */}
              <button
                onClick={logout}
                className="w-full mt-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="profile-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Account
              </button>
            </div>
          </div>

          {/* Right Column: Details, Monetization, Stats */}
          <div className="md:col-span-2 flex flex-col gap-6 w-full">
            
            {/* Credits and Monetization Card */}
            <div className="bg-white dark:bg-gray-900/35 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-500" />
                Plan & Credits Billing
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Credit balance display */}
                <div className="p-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex flex-col gap-2 relative">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Available Generation Credits</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{isPro ? "∞" : credits}</span>
                    <span className="text-xs text-gray-500">credits</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {isPro ? "Unlimited standard & pro generations active." : "Credits are consumed when generating or running macros."}
                  </p>
                  
                  {!isPro && (
                    <button
                      onClick={() => {
                        setCheckoutPlan("credits");
                        setIsCheckoutOpen(true);
                      }}
                      className="mt-3 py-2 px-3 bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold transition-all w-fit cursor-pointer flex items-center gap-1 select-none"
                    >
                      <Coins className="w-3.5 h-3.5 text-yellow-500" />
                      Buy Credits Pack ($9.99)
                    </button>
                  )}
                </div>

                {/* Membership Status card */}
                <div className="p-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex flex-col gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Pro Subscription Status</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{isPro ? "Active Pro Plan" : "Inactive"}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {isPro ? "Charged $19.99/mo. Cancel or modify anytime." : "Subscribe to Pro to unlock Llama 3.3 70B and VBA macros."}
                  </p>

                  <button
                    onClick={() => {
                      if (isPro) {
                        alert("For live subscriptions, you can view your transactions and manage billing directly in your PayPal or Razorpay dashboard.");
                      } else {
                        setCheckoutPlan("pro");
                        setIsCheckoutOpen(true);
                      }
                    }}
                    className={`mt-3 py-2 px-4 rounded-lg text-xs font-bold transition-all w-fit cursor-pointer flex items-center gap-1 select-none ${isPro ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-brand-500 hover:bg-brand-600 text-white'}`}
                  >
                    <Zap className="w-3.5 h-3.5 text-white fill-white" />
                    {isPro ? "Manage Billing" : "Upgrade to Pro ($19.99/mo)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Performance and Saved Work stats */}
            <div className="bg-white dark:bg-gray-900/35 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-500" />
                Saved Script Statistics
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 dark:bg-black/15 rounded-2xl border border-gray-200 dark:border-gray-850 flex flex-col gap-1">
                  <span className="text-xs text-gray-400 font-semibold">Total Saved Scripts</span>
                  <span className="text-2xl font-black text-brand-500">
                    {savedCount !== null ? savedCount : "..."}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-black/15 rounded-2xl border border-gray-200 dark:border-gray-850 flex flex-col gap-1">
                  <span className="text-xs text-gray-400 font-semibold">Active Engine Mode</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 py-1">
                    Pyodide WASM
                  </span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-black/15 rounded-2xl border border-gray-200 dark:border-gray-850 flex flex-col gap-1">
                  <span className="text-xs text-gray-400 font-semibold">Allowed Providers</span>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 py-1 truncate">
                    Nvidia NIM / Google
                  </span>
                </div>
              </div>

              {/* View saved list redirection */}
              <div 
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-black/25 hover:bg-brand-500/5 hover:border-brand-500/30 border border-gray-200 dark:border-gray-800/80 rounded-2xl cursor-pointer transition-all group mt-1"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-250 group-hover:text-brand-500 transition-colors">
                      Access Saved Automations inside Workspace
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Your saved automations card is located inside the dashboard.
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Checkout Paywall Drawer/Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        initialPlan={checkoutPlan}
      />

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b] py-8 mt-16 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <TerminalSquare className="w-5 h-5" />
            <span className="font-semibold">MacroForge AI</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            &copy; 2026 MacroForge. All rights reserved. Secure, client-side automation.
          </p>
        </div>
      </footer>
    </div>
  );
}
