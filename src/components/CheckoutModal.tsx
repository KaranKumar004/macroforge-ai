"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ShieldCheck, CheckCircle2, Loader2, Sparkles, Zap, Coins } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (type: "credits" | "pro") => void;
  initialPlan?: "credits" | "pro";
}

export function CheckoutModal({ isOpen, onClose, onPaymentSuccess, initialPlan = "credits" }: CheckoutModalProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"credits" | "pro">(initialPlan);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"billing" | "success">("billing");
  const [isPaypalSdkLoaded, setIsPaypalSdkLoaded] = useState(false);

  const selectedPlanRef = useRef(selectedPlan);
  useEffect(() => {
    selectedPlanRef.current = selectedPlan;
  }, [selectedPlan]);

  useEffect(() => {
    if (isOpen) {
      setStep("billing");
      setIsProcessing(false);
      setSelectedPlan(initialPlan);
      
      // If SDK was already loaded globally on window, transition state immediately
      if (typeof window !== "undefined" && (window as any).paypal) {
        setIsPaypalSdkLoaded(true);
      } else {
        setIsPaypalSdkLoaded(false);
      }
    }
  }, [isOpen, initialPlan]);

  // Load Razorpay Script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Load PayPal SDK dynamically when modal opens
  useEffect(() => {
    if (isOpen && !isPaypalSdkLoaded) {
      if (typeof window !== "undefined" && (window as any).paypal) {
        setIsPaypalSdkLoaded(true);
        return;
      }

      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      console.log("[CheckoutModal] Loading PayPal SDK. Client ID:", clientId);
      if (!clientId || clientId.includes("placeholder")) {
        console.warn("[CheckoutModal] PayPal Client ID is missing or placeholder.");
        return;
      }

      // Check if script already exists to avoid duplicate loads
      const existingScript = document.getElementById("paypal-sdk-script");
      if (existingScript) {
        setIsPaypalSdkLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.id = "paypal-sdk-script";
      script.onload = () => {
        setIsPaypalSdkLoaded(true);
      };
      script.onerror = () => {
        console.error("[CheckoutModal] Failed to load PayPal SDK.");
      };
      document.body.appendChild(script);
    }
  }, [isOpen, isPaypalSdkLoaded]);

  // Render PayPal Smart Buttons once script is loaded
  useEffect(() => {
    if (isPaypalSdkLoaded && isOpen) {
      const container = document.getElementById("paypal-button-container");
      if (container) {
        container.innerHTML = ""; // Clear duplicate renders
        try {
          (window as any).paypal.Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
            },
            createOrder: (data: any, actions: any) => {
              const currentPlan = selectedPlanRef.current;
              const price = currentPlan === "credits" ? "9.99" : "19.99";
              const description = currentPlan === "credits" ? "MacroForge 50 Credits Pack" : "MacroForge Pro Subscription";
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: price,
                    },
                    description: description,
                  },
                ],
              });
            },
            onApprove: async (data: any, actions: any) => {
              setIsProcessing(true);
              try {
                const details = await actions.order.capture();
                if (details.status === "COMPLETED") {
                  setStep("success");
                } else {
                  alert("PayPal transaction did not complete.");
                }
              } catch (err: any) {
                console.error("PayPal capture error:", err);
                alert(err.message || "Failed to capture PayPal payment.");
              } finally {
                setIsProcessing(false);
              }
            },
            onError: (err: any) => {
              console.error("PayPal Buttons error:", err);
              alert("PayPal checkout encountered an error. Please try again.");
            },
          }).render("#paypal-button-container");
        } catch (err) {
          console.error("Error rendering PayPal buttons:", err);
        }
      }
    }
  }, [isPaypalSdkLoaded, isOpen]);


  // Trigger Razorpay payment wizard
  const handleRazorpayPay = async () => {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    console.log("[CheckoutModal] Initiating Razorpay pay. Key ID:", keyId);
    
    if (!keyId || keyId.includes("placeholder")) {
      alert("Razorpay Key ID is not configured or is a placeholder in .env.local.");
      return;
    }

    setIsProcessing(true);
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Failed to load Razorpay Checkout script. Check your internet connection.");
      setIsProcessing(false);
      return;
    }

    const price = selectedPlan === "credits" ? 9.99 : 19.99;

    try {
      // 1. Create order on Next.js API endpoint
      const res = await fetch("/api/payment/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price, plan: selectedPlan }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Order creation failed");
      }

      // 2. Open Razorpay modal overlay
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MacroForge AI",
        description: selectedPlan === "credits" ? "50 Generation Credits" : "Pro Monthly membership",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setIsProcessing(true);
          try {
            // 3. Cryptographically verify signature on server
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.verified) {
              setStep("success");
            } else {
              alert(verifyData.error || "Payment signature validation failed.");
            }
          } catch (err: any) {
            alert(err.message || "Failed to verify transaction.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.email ? user.email.split("@")[0] : "Customer",
          email: user?.email || "customer@example.com",
        },
        theme: {
          color: "#22c55e",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Failed to initialize Razorpay payment.");
    } finally {
      setIsProcessing(false);
    }
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
          className="absolute top-5 right-5 p-2 bg-gray-805 hover:bg-gray-750 text-gray-200 hover:text-white rounded-full border border-gray-850/20 transition-all z-30 cursor-pointer shadow-md"
          aria-label="Close modal"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {step === "billing" ? (
          <div className="p-6 md:p-8">
            <div className="text-center mb-6 pt-4">
              <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-brand-400" />
                Upgrade MacroForge AI
              </h2>
              <p className="text-sm text-gray-400 mt-1">Select a plan and complete your checkout securely.</p>
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

            {/* Payment Gateways Section */}
            <div className="space-y-5 border-t border-gray-800/80 pt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center flex items-center justify-center gap-1.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                Select Live Payment Method
              </h3>

              {/* Razorpay Launch Button */}
              <button
                type="button"
                onClick={handleRazorpayPay}
                disabled={isProcessing}
                className="w-full py-3.5 px-6 bg-[#0c1f15] hover:bg-[#122e1f] border border-brand-500/30 text-brand-100 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer select-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    Connecting to Razorpay...
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    Pay with Razorpay (UPI, Card, Net Banking)
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center py-1.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-850" />
                </div>
                <span className="relative px-3 bg-gray-900 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Or
                </span>
              </div>

              {/* PayPal Button Container */}
              <div className="w-full min-h-[110px] relative z-10">
                {!isPaypalSdkLoaded ? (
                  <div className="w-full flex items-center justify-center p-6 text-xs text-gray-450 border border-gray-800/80 rounded-2xl bg-gray-950/20">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-500 mr-2" />
                    Loading PayPal express buttons...
                  </div>
                ) : (
                  <div id="paypal-button-container" className="w-full relative z-10 animate-in fade-in duration-300"></div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-500 pt-5 text-center border-t border-gray-850/60 mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
              <span>Payments processed via secure encrypted Razorpay & PayPal API tunnels.</span>
            </div>
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
