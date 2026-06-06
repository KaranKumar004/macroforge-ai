"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, ShieldCheck, CheckCircle2, Loader2, Sparkles, Zap, Coins } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (type: "credits" | "pro") => void;
  initialPlan?: "credits" | "pro";
}

export function CheckoutModal({ isOpen, onClose, onPaymentSuccess, initialPlan = "credits" }: CheckoutModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"credits" | "pro">(initialPlan);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"billing" | "success">("billing");
  const [cardType, setCardType] = useState<"visa" | "mastercard" | "amex" | "unknown">("unknown");

  useEffect(() => {
    if (isOpen) {
      setStep("billing");
      setIsProcessing(false);
      // Keep selected plan set to what was requested
      setSelectedPlan(initialPlan);
    }
  }, [isOpen, initialPlan]);

  // Detect card issuer based on first digit
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (rawVal.startsWith("4")) {
      setCardType("visa");
    } else if (rawVal.startsWith("5")) {
      setCardType("mastercard");
    } else if (rawVal.startsWith("3")) {
      setCardType("amex");
    } else {
      setCardType("unknown");
    }

    // Format with spaces: 1234 5678 1234 5678
    const formatted = rawVal
      .replace(/(\d{4})/, "$1 ")
      .replace(/(\d{4}) (\d{4})/, "$1 $2 ")
      .replace(/(\d{4}) (\d{4}) (\d{4})/, "$1 $2 $3 ")
      .trim()
      .substring(0, 19); // Max length 19 (16 digits + 3 spaces)
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    let formatted = rawVal;
    if (rawVal.length > 2) {
      formatted = `${rawVal.substring(0, 2)}/${rawVal.substring(2, 4)}`;
    }
    setExpiry(formatted.substring(0, 5));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    setCvc(rawVal.substring(0, selectedPlan === "pro" ? 4 : 3));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !name) return;

    setIsProcessing(true);
    // Simulate premium payment processing with loader
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setStep("success");
  };

  const handleFinish = () => {
    onPaymentSuccess(selectedPlan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-400 via-blue-500 to-purple-600" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/50 hover:bg-gray-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "billing" ? (
          <div className="p-6 md:p-8">
            <div className="text-center mb-6 pt-4">
              <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-brand-400" />
                Upgrade MacroForge AI
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Unlock automated macro coding and browser sandbox execution.
              </p>
            </div>

            {/* Plans Selector */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Credit Pack */}
              <div
                onClick={() => setSelectedPlan("credits")}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedPlan === "credits"
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-gray-800 bg-gray-950/40 hover:bg-gray-800/40 text-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Credit Pack</span>
                  <Coins className={`w-4 h-4 ${selectedPlan === "credits" ? "text-brand-400" : "text-gray-500"}`} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">50 Credits</h4>
                  <p className="text-2xl font-black text-white mt-1">$9.99</p>
                  <p className="text-xs text-gray-500 mt-1">Ideal for occasional automation</p>
                </div>
              </div>

              {/* Monthly Subscription */}
              <div
                onClick={() => setSelectedPlan("pro")}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedPlan === "pro"
                    ? "border-purple-500 bg-purple-500/10 text-white"
                    : "border-gray-800 bg-gray-950/40 hover:bg-gray-800/40 text-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">MacroForge Pro</span>
                  <Zap className={`w-4 h-4 ${selectedPlan === "pro" ? "text-purple-400" : "text-gray-500"}`} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Unlimited</h4>
                  <p className="text-2xl font-black text-white mt-1">
                    $19.99<span className="text-xs font-normal text-gray-400">/mo</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All features, unlimited generation</p>
                </div>
              </div>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handlePay} className="space-y-4">
              <div className="border-t border-gray-800 pt-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-400" />
                  Secure Payment Details (Mock)
                </h3>
              </div>

              {/* Card Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Card Number</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4000 1234 5678 9010"
                    className="w-full pl-4 pr-12 py-3 bg-gray-950/60 border border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-white outline-none placeholder:text-gray-600 text-sm tracking-wider"
                  />
                  <div className="absolute right-4">
                    {cardType === "visa" && (
                      <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">VISA</span>
                    )}
                    {cardType === "mastercard" && (
                      <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">MC</span>
                    )}
                    {cardType === "amex" && (
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">AMEX</span>
                    )}
                    {cardType === "unknown" && (
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expiry & CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Expires</label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-gray-950/60 border border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-white outline-none placeholder:text-gray-600 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">CVC</label>
                  <input
                    type="password"
                    required
                    value={cvc}
                    onChange={handleCvcChange}
                    placeholder="•••"
                    className="w-full px-4 py-3 bg-gray-950/60 border border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-white outline-none placeholder:text-gray-600 text-sm tracking-widest"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-gray-950/60 border border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-white outline-none placeholder:text-gray-600 text-sm"
                />
              </div>

              {/* Submit Pay button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-4 py-4 px-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Securely Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-brand-100" />
                    Pay {selectedPlan === "credits" ? "$9.99" : "$19.99"}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 pt-2 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
                <span>Simulated Secure Stripe Checkout. No real money will be charged.</span>
              </div>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-6 border border-brand-500/30">
              <CheckCircle2 className="w-10 h-10 text-brand-500 pulse-glow" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2">Payment Successful!</h2>
            <p className="text-sm text-gray-400 max-w-sm mb-8">
              {selectedPlan === "credits"
                ? "50 credits have been added to your balance. Start building scripts!"
                : "You are now upgraded to MacroForge Pro! Enjoy unlimited generations and premium models."}
            </p>

            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-full shadow-lg transition-all text-sm select-none cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
