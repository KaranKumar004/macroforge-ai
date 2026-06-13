"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TerminalSquare, Sparkles, Check, ChevronDown, Terminal, Shield, Zap, RefreshCw, BarChart2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleStartCTA = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const faqs = [
    {
      question: "Is my data uploaded to your servers or any third-party AI?",
      answer: "No. Your actual spreadsheet data never leaves your browser. Our local file uploader parses metadata (column names and a single sample row) entirely on the client-side. Only this metadata schema is sent to the AI API to generate your custom VBA/Python script. Your data is 100% secure."
    },
    {
      question: "What is the Pyodide Browser Sandbox?",
      answer: "Pyodide is a WebAssembly port of Python that runs directly in your browser. This allows MacroForge to execute the generated Python scripts inside an isolated local sandbox. You can process your spreadsheets, download results, and inspect live stdout execution logs without installing Python locally."
    },
    {
      question: "How do credit packs work vs the Pro membership?",
      answer: "Standard generations and sandbox runs cost 1 credit each. New accounts receive 5 free credits. The 50-credit pack is a one-time purchase of $9.99. The Pro membership is a $19.99/mo subscription that grants unlimited generations, unlimited sandbox runs, and unlocks Excel VBA macro generation and the premium Llama 3.3 70B models."
    },
    {
      question: "Can I run the generated Python and VBA code locally on my PC?",
      answer: "Absolutely. The generated scripts are designed to be fully self-contained. The Python script includes standard library guards (like Tkinter) to show local file selection dialogs when run on your PC. The VBA code is ready to be pasted directly into Excel's Developer console, prompting you with a standard system folder browser when executed."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col font-sans relative overflow-hidden selection:bg-brand-500/30 selection:text-brand-100 text-gray-900 dark:text-gray-100">
      {/* Background visual glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="w-full bg-white/70 dark:bg-[#09090b]/70 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <TerminalSquare className="w-8 h-8 text-brand-500" />
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">MacroForge</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-brand-500 transition-colors">Pricing</a>
              <a href="#faqs" className="hover:text-brand-500 transition-colors">FAQs</a>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-full transition-all shadow-md flex items-center gap-1 cursor-pointer select-none"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="text-xs font-bold text-gray-750 dark:text-gray-300 hover:text-brand-500 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-full transition-all shadow-md cursor-pointer select-none"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center z-10 flex flex-col items-center">
        {/* Glow badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 font-bold text-xs mb-6 select-none animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MacroForge AI v2.0 is Live</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.15] text-gray-900 dark:text-white max-w-5xl">
          Automate Your Spreadsheets <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-500">In Plain English</span>
        </h1>
        
        <p className="max-w-2xl text-lg sm:text-xl text-gray-650 dark:text-gray-400 mb-10 leading-relaxed">
          Stop writing repetitive code or formulas. Describe your data operation, and MacroForge AI instantly generates production-ready Python or VBA scripts tailored to your file schema.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button
            onClick={handleStartCTA}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-full text-white bg-brand-500 hover:bg-brand-600 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all cursor-pointer"
          >
            Start Building Free
          </button>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-gray-750 dark:text-gray-300 bg-white/40 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all backdrop-blur-md"
          >
            View Pricing plans
          </a>
        </div>

        {/* Dashboard Mockup Showcase */}
        <div className="w-full max-w-5xl border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden bg-white/30 dark:bg-[#0c0c0e]/30 backdrop-blur-xl shadow-2xl p-4 transition-all">
          <div className="rounded-2xl overflow-hidden border border-gray-250 dark:border-gray-800 bg-[#09090b] aspect-[16/10] flex flex-col relative">
            {/* Window chrome header */}
            <div className="h-10 bg-black/40 border-b border-gray-850 flex items-center px-4 gap-2 justify-between">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
              </div>
              <div className="text-[10px] text-gray-500 font-mono tracking-wider">macroforge_sandbox_session</div>
              <div className="w-12"></div>
            </div>
            
            {/* Visual simulation content */}
            <div className="flex-1 grid grid-cols-2 gap-4 p-4 text-left font-mono">
              <div className="border border-gray-850 bg-black/20 rounded-xl p-4 flex flex-col gap-3">
                <div className="text-xs text-brand-400 font-bold border-b border-gray-850 pb-2 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" /> Console Execution Logs
                </div>
                <div className="flex-1 text-[10px] text-gray-400 flex flex-col gap-2 overflow-hidden leading-relaxed">
                  <div>[*] Initializing MacroForge execution kernel</div>
                  <div>[*] Loading raw spreadsheet: <span className="text-yellow-400">customer_dataset.xlsx</span></div>
                  <div>[*] Mapped headers: id, email, blood_type, age</div>
                  <div className="text-emerald-400">[+] Auditing duplicate customer IDs (2 duplicate IDs found)</div>
                  <div className="text-emerald-400">[+] Auditing email formats (1 invalid domain format highlighted)</div>
                  <div className="text-purple-400">[*] Generating Segment Dashboard Pivot Table...</div>
                  <div className="text-blue-400">[+] Outlier analysis complete: IQR bounds applied</div>
                  <div className="text-emerald-400">[+] Processing complete! Processed file saved.</div>
                </div>
              </div>
              
              <div className="border border-gray-850 bg-black/40 rounded-xl p-4 flex flex-col gap-2">
                <div className="text-xs text-gray-400 font-bold border-b border-gray-850 pb-2">AI Generated Script Output</div>
                <div className="flex-1 text-[9px] text-gray-500 overflow-hidden leading-relaxed whitespace-pre-wrap select-none font-mono">
{`import pandas as pd
import numpy as np
import openpyxl

def build_ecommerce_dashboard(file_path):
    df = pd.read_excel(file_path)
    
    # Check for empty datasets
    if df.empty or len(df) < 3:
        raise ValueError("Insufficient rows for calculation")

    # Dynamic Column Checking
    col_id = next(c for c in df.columns if 'id' in c.lower())
    col_email = next(c for c in df.columns if 'email' in c.lower())
    col_age = next(c for c in df.columns if 'age' in c.lower())

    # Calculate statistics & detect outliers
    q1 = df[col_age].quantile(0.25)
    q3 = df[col_age].quantile(0.75)
    iqr = q3 - q1
    outliers = df[(df[col_age] < (q1 - 1.5 * iqr)) | (df[col_age] > (q3 + 1.5 * iqr))]

    # Save to multiple output worksheets...`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-24 z-10 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            A Complete Analytics Platform in Your Browser
          </h2>
          <p className="text-gray-500 dark:text-gray-450 max-w-xl mx-auto text-base">
            Everything you need to analyze, audit, and visualize spreadsheet databases securely in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-900/30 border border-gray-250/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">100% Client-Side Privacy</h3>
            <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
              Your sensitive business data never leaves your computer. We parse metadata locally, sending only column names and single sample cells to the AI.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-900/30 border border-gray-250/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pyodide Local Sandbox</h3>
            <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
              Execute generated Python code locally inside an isolated WebAssembly sandbox. Inspect runtime execution output logs in our retro terminal console.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-900/30 border border-gray-250/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Multi-Provider Redundancy</h3>
            <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
              Equipped with automatic API fallbacks between Google AI Studio and NVIDIA NIM Llama 3.3. Zero downtime, maximum performance.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-gray-900/30 border border-gray-250/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard Generation</h3>
            <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
              Enforce structural dashboard sheets complete with KPI summaries, pivot tables, automatic outlier calculations, and native Excel chart embedding.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white dark:bg-gray-900/30 border border-gray-250/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Auto-Recovery Self-Healing</h3>
            <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
              If a python run encounters errors in the WebAssembly sandbox, the system feeds logs back to the AI model to self-correct automatically.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white dark:bg-gray-900/30 border border-gray-250/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dual Python & VBA Options</h3>
            <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
              Download clean Excel macros under Option Explicit or Pandas scripts with Tkinter system pickers ready for standard execution on your desktop.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-24 z-10 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-500 dark:text-gray-450 max-w-md mx-auto text-base">
            Choose the package that fits your automation needs. Start free, scale when ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Card 1: Pay As You Go */}
          <div className="bg-white dark:bg-[#0c0c0e]/30 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-md flex flex-col gap-6 relative">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Standard Credits Pack</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Great for occasional scripting and cleanups</p>
            </div>
            
            <div className="flex items-baseline gap-1 py-2 border-y border-gray-150 dark:border-gray-800/80">
              <span className="text-4xl font-black text-gray-900 dark:text-white">$9.99</span>
              <span className="text-sm font-semibold text-gray-500">/ one-time pack</span>
            </div>

            <ul className="flex flex-col gap-3 text-sm text-gray-650 dark:text-gray-350 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span><strong>50 Credits</strong> to use at any time</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Python Script generation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Local browser WebAssembly runs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Standard AI Model (Gemini 2.5 Flash)</span>
              </li>
            </ul>

            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl text-sm transition-colors cursor-pointer select-none"
            >
              Get Credits Pack
            </button>
          </div>

          {/* Card 2: Pro Plan */}
          <div className="bg-white dark:bg-[#0c0c0e]/40 border-2 border-brand-500 rounded-3xl p-8 shadow-xl flex flex-col gap-6 relative">
            {/* Pro badge tag */}
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-500 text-white font-bold text-[10px] tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-md select-none">
              Most Popular
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                Pro Membership
                <Zap className="w-4.5 h-4.5 text-brand-500 fill-brand-500" />
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">For analysts and engineers wanting unlimited power</p>
            </div>
            
            <div className="flex items-baseline gap-1 py-2 border-y border-gray-150 dark:border-gray-800/80">
              <span className="text-4xl font-black text-gray-900 dark:text-white">$19.99</span>
              <span className="text-sm font-semibold text-gray-500">/ month</span>
            </div>

            <ul className="flex flex-col gap-3 text-sm text-gray-650 dark:text-gray-350 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span><strong>Unlimited</strong> generations and runs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Excel VBA Macro generation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Premium AI Models (Llama 3.3 70B)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Advanced chart & dashboard layouts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Priority generation support</span>
              </li>
            </ul>

            <button
              onClick={() => router.push("/login")}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all cursor-pointer select-none"
            >
              Subscribe to Pro
            </button>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="max-w-3xl mx-auto px-4 py-24 z-10 w-full border-t border-gray-200 dark:border-gray-850">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 flex items-center justify-between font-semibold text-gray-900 dark:text-white text-left transition-colors hover:text-brand-500 cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${activeFaq === index ? "rotate-185 text-brand-500" : ""}`} />
              </button>
              
              {activeFaq === index && (
                <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200 border-t border-gray-150/40 dark:border-gray-850/40 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b] py-12 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-gray-700 dark:text-white">
            <TerminalSquare className="w-6 h-6 text-brand-500" />
            <span className="font-bold">MacroForge AI</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            &copy; 2026 MacroForge. All rights reserved. Secure, client-side automation.
          </p>
        </div>
      </footer>
    </div>
  );
}
