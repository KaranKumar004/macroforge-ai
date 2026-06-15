"use client";

import { useState, useEffect } from "react";
import { Sparkles, TerminalSquare, AlertCircle, RefreshCw, Layers, Zap, Lock, Play, Coins, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { MetadataGrid } from "@/components/MetadataGrid";
import { CodePreview } from "@/components/CodePreview";
import { ConsoleLogs } from "@/components/ConsoleLogs";
import { CheckoutModal } from "@/components/CheckoutModal";
import { usePyodide } from "@/hooks/usePyodide";
import { useAuth } from "@/context/AuthContext";
import type { FileMetadata } from "@/types";
import * as XLSX from "xlsx";
import { supabase } from "@/utils/supabase";

export default function Dashboard() {
  const router = useRouter();
  const { user, credits, isPro, isLoading, deductCredit, addCredits, upgradeToPro, logout } = useAuth();

  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<"python" | "vba">("python");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  // Pyodide Integration
  const { runPython, isInitializing: pyInitializing, isRunning: pyRunning, error: pyError, logs, clearLogs } = usePyodide();

  // Premium Billing states
  const [isProModel, setIsProModel] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutInitialPlan, setCheckoutInitialPlan] = useState<"credits" | "pro">("credits");

  // Supabase Saved Work states
  const [savedScripts, setSavedScripts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  // Protect the dashboard route: redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const fetchSavedScripts = async () => {
    if (!user?.email) return;
    try {
      const { data, error } = await supabase
        .from("saved_work")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSavedScripts(data);
      }
    } catch (err) {
      console.error("Failed to fetch saved scripts:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSavedScripts();
    }
  }, [user]);

  const handleSaveWork = async () => {
    if (!generatedCode || !user?.email || !saveTitle.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("saved_work")
        .insert({
          email: user.email,
          title: saveTitle.trim(),
          prompt,
          language,
          code: generatedCode,
        });

      if (error) {
        throw error;
      }

      setIsSaved(true);
      setIsSaveModalOpen(false);
      setSaveTitle("");
      fetchSavedScripts();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save work");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadScript = (script: any) => {
    setPrompt(script.prompt);
    setLanguage(script.language as "python" | "vba");
    setGeneratedCode(script.code);
    setError(null);
    setDiagnostics([]);
    setIsSaved(true);
    const el = document.getElementById("tool-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteScript = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("saved_work")
        .delete()
        .eq("id", id);

      if (!error) {
        setSavedScripts((prev) => prev.filter((s) => s.id !== id));
      } else {
        throw error;
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete script");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          <p className="text-gray-400 text-sm font-semibold">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Sheet switching handler
  const handleSheetChange = (sheetName: string) => {
    if (!metadata) return;

    try {
      const workbook = XLSX.read(new Uint8Array(metadata.rawBuffer), { type: "array" });
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        throw new Error(`The worksheet "${sheetName}" is empty.`);
      }

      const headers = jsonData[0] as string[];
      const sampleRow = jsonData.length > 1 ? (jsonData[1] as any[]) : [];

      const columns = headers.map((header, index) => {
        const sampleValue = sampleRow[index];
        let type: "string" | "number" | "boolean" | "date" | "unknown" = "unknown";

        if (sampleValue !== undefined && sampleValue !== null) {
          if (typeof sampleValue === "number") type = "number";
          else if (typeof sampleValue === "boolean") type = "boolean";
          else type = "string";
        }

        return {
          name: header ? String(header) : `Column ${index + 1}`,
          type,
          sample: sampleValue,
        };
      });

      setMetadata({
        ...metadata,
        activeSheet: sheetName,
        columns,
      });
      setGeneratedCode(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to parse selected worksheet");
    }
  };

  const handleGenerate = async () => {
    if (!metadata || !prompt.trim()) return;

    // --- PAYWALL CHECKS ---
    if (language === "vba" && !isPro) {
      setCheckoutInitialPlan("pro");
      setIsCheckoutOpen(true);
      return;
    }

    if (isProModel && !isPro) {
      setCheckoutInitialPlan("pro");
      setIsCheckoutOpen(true);
      return;
    }

    if (!isPro && credits <= 0) {
      setCheckoutInitialPlan("credits");
      setIsCheckoutOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedCode(null);
    setDiagnostics([]);
    setIsSaved(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, metadata, language, isProModel: isPro || isProModel }),
      });

      const data = await response.json();
      if (data.diagnostics) {
        setDiagnostics(data.diagnostics);
      }

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedCode(data.code);

      // Deduct credit if not Pro
      if (!isPro) {
        deductCredit();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetAll = () => {
    setMetadata(null);
    setPrompt("");
    setGeneratedCode(null);
    setError(null);
    setDiagnostics([]);
    clearLogs();
    setIsSaved(false);
  };

  const handleRunCode = async () => {
    if (!metadata?.rawBuffer || !generatedCode) return;

    // --- PAYWALL CHECK FOR RUNNING CODE ---
    if (!isPro && credits <= 0) {
      setCheckoutInitialPlan("credits");
      setIsCheckoutOpen(true);
      return;
    }

    // Deduct credit for run
    if (!isPro) {
      deductCredit();
    }

    const result = await runPython({
      code: generatedCode,
      fileBuffer: metadata.rawBuffer,
      fileName: metadata.filename,
    });

    if (result.outBuffer) {
      const blob = new Blob([result.outBuffer as any], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.outPath?.split('/').pop() || "output_data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handlePaymentSuccess = (type: "credits" | "pro") => {
    if (type === "pro") {
      upgradeToPro();
    } else {
      addCredits(50);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col font-sans">
      {/* Navigation Header */}
      <nav className="w-full bg-white dark:bg-[#09090b]/80 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <TerminalSquare className="w-8 h-8 text-brand-500" />
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">MacroForge</span>
            </div>

            {/* Premium Credit Widget & User Info */}
            <div className="flex items-center gap-4">
              {isPro ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 font-bold text-xs select-none">
                  <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                  <span>PRO MEMBER</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <Coins className="w-3.5 h-3.5 text-yellow-500" />
                    <span>{credits} Credits</span>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutInitialPlan("pro");
                      setIsCheckoutOpen(true);
                    }}
                    className="text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 px-3.5 py-1.5 rounded-full transition-all shadow-md flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Zap className="w-3 h-3 text-white fill-white" />
                    Upgrade
                  </button>
                </div>
              )}

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-850"></div>

              {/* Log Out button */}
              <button
                onClick={logout}
                className="text-xs font-semibold text-gray-500 hover:text-red-500 bg-gray-100 dark:bg-gray-800/80 hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 select-none"
              >
                <LogOut className="w-3 h-3" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
        <section id="tool-section" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-start">
            
            {/* Left Column: Input / Metadata */}
            <div className="flex flex-col gap-6">
              {!metadata ? (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold">1</span>
                    Upload Your Data File
                  </h2>
                  <FileUpload onFileParsed={setMetadata} />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">✓</span>
                      File Structure Analysis Complete
                    </h2>
                    <button
                      onClick={resetAll}
                      className="text-sm font-semibold text-gray-500 hover:text-brand-500 flex items-center gap-1.5 transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 px-3 py-1.5 rounded-full select-none cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Start Over
                    </button>
                  </div>

                  {/* Metadata display is responsive internally with sheet selector */}
                  <MetadataGrid metadata={metadata} onSheetChange={handleSheetChange} />

                  <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold">2</span>
                      Describe Automation
                    </h2>
                    
                    <div className="flex flex-col gap-5">
                      
                      {/* Language Toggle */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                          <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition-colors ${language === 'python' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <input
                              type="radio"
                              name="language"
                              value="python"
                              checked={language === "python"}
                              onChange={() => setLanguage("python")}
                              className="sr-only"
                            />
                            <span className={`text-sm font-bold ${language === 'python' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>Python (Pandas)</span>
                          </label>
                          <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition-colors relative ${language === 'vba' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <input
                              type="radio"
                              name="language"
                              value="vba"
                              checked={language === "vba"}
                              onChange={() => setLanguage("vba")}
                              className="sr-only"
                            />
                            <span className={`text-sm font-bold flex items-center gap-1.5 ${language === 'vba' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              Excel VBA
                              {!isPro && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] font-black tracking-widest text-purple-400 border border-purple-500/20">PRO</span>
                              )}
                            </span>
                          </label>
                        </div>

                        {/* Pro Model Toggle (Premium features toggle) */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isProModel}
                              onChange={(e) => {
                                if (e.target.checked && !isPro) {
                                  setCheckoutInitialPlan("pro");
                                  setIsCheckoutOpen(true);
                                } else {
                                  setIsProModel(e.target.checked);
                                }
                              }}
                              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500/30"
                            />
                            <span>Use Pro Model (Llama 3.3 70B)</span>
                            {!isPro && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] font-black tracking-widest text-purple-400 border border-purple-500/20">PRO</span>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Prompt Textarea */}
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Clean trailing spaces from the 'Name' column, and filter rows where 'Amount' is greater than 1000..."
                        className="w-full h-36 p-4 bg-gray-50 dark:bg-[#09090b]/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none text-base placeholder:text-gray-400 shadow-inner"
                      />

                      {/* Generate Button */}
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-3 cursor-pointer"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Analyzing & Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate {language === "python" ? "Python Script" : "VBA Macro"}
                            {!isPro && (language === "vba" || isProModel) && (
                              <Zap className="w-4.5 h-4.5 text-yellow-300 fill-yellow-300 animate-bounce" />
                            )}
                          </>
                        )}
                      </button>

                      {/* Error Display */}
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm mt-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="font-semibold">{error}</p>
                        </div>
                      )}

                      {/* Diagnostic Logs Disclosure */}
                      {diagnostics.length > 0 && (
                        <div className="mt-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 text-sm">
                          <details className="group">
                            <summary className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center justify-between">
                              <span>API Diagnostic Logs ({diagnostics.length} lines)</span>
                              <span className="text-xs text-brand-500 group-open:hidden hover:underline">Show Logs</span>
                              <span className="text-xs text-brand-500 hidden group-open:inline hover:underline">Hide Logs</span>
                            </summary>
                            <div className="mt-3 font-mono text-[11px] text-gray-600 dark:text-gray-400 max-h-60 overflow-y-auto whitespace-pre-wrap bg-white dark:bg-black/60 p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col gap-1.5 shadow-inner">
                              {diagnostics.map((log, idx) => (
                                <div key={idx} className={log.includes("Failed") || log.includes("Crashed") || log.includes("failed") ? "text-red-500 dark:text-red-400" : log.includes("successful") || log.includes("Success") ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>
                                  {log}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}

                      {/* Pyodide Run Button */}
                      {generatedCode && language === "python" && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                            Execute Locally
                            {!isPro && (
                              <span className="text-[10px] text-gray-500 font-normal">(Costs 1 credit)</span>
                            )}
                          </h3>
                          <button
                            onClick={handleRunCode}
                            disabled={pyRunning || pyInitializing}
                            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-base font-semibold shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
                          >
                            {pyRunning ? (
                              <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Processing Data in Browser...
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5" />
                                Run Action & Download Result
                              </>
                            )}
                          </button>

                          {pyError && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm mt-3">
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <p className="font-semibold font-mono whitespace-pre-wrap">{pyError}</p>
                            </div>
                          )}
                          {pyInitializing && (
                            <p className="text-xs text-center text-gray-500 mt-2 flex items-center justify-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Initializing isolated Python environment...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Saved Automations Section */}
              {user && (
                <div className="bg-white dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4 animate-in fade-in duration-500">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Layers className="w-5 h-5 text-brand-500" />
                    My Saved Automations ({savedScripts.length})
                  </h2>
                  {savedScripts.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      You haven't saved any scripts yet. Generate a script and click "Save Work" to see it here!
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {savedScripts.map((script) => (
                        <div
                          key={script.id}
                          onClick={() => handleLoadScript(script)}
                          className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-black/20 hover:bg-brand-500/5 hover:border-brand-500/30 border border-gray-150 dark:border-gray-800 rounded-xl cursor-pointer transition-all group"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-brand-500 transition-colors truncate">
                              {script.title}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">
                              {script.prompt}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0 font-sans">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${script.language === 'python' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-bold'}`}>
                              {script.language === 'python' ? 'Python' : 'VBA'}
                            </span>
                            <button
                              onClick={(e) => handleDeleteScript(script.id, e)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Delete script"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Code Preview & Console logs */}
            <div className="flex flex-col gap-6 w-full lg:h-[calc(100vh-12rem)]">
              <div className="flex-1 min-h-[350px]">
                <CodePreview
                  code={generatedCode || ""}
                  language={language}
                  onSave={() => setIsSaveModalOpen(true)}
                  isSaving={isSaving}
                  isSaved={isSaved}
                />
              </div>
              
              {generatedCode && language === "python" && (
                <ConsoleLogs logs={logs} isRunning={pyRunning} onClear={clearLogs} />
              )}
            </div>
            
          </div>
        </section>
      </main>

      {/* Checkout Paywall Drawer/Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        initialPlan={checkoutInitialPlan}
      />

      {/* Save Work Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Save Automation</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Provide a descriptive title to locate it later in your saved work list.</p>
            </div>

            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g. Filter invalid phone numbers"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm text-gray-900 dark:text-white placeholder:text-gray-550 shadow-inner font-semibold"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-2 font-sans">
              <button
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setSaveTitle("");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWork}
                disabled={isSaving || !saveTitle.trim()}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer select-none"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <TerminalSquare className="w-5 h-5" />
            <span className="font-semibold">MacroForge AI</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Empowering analysts with secure, client-side AI automation.
          </p>
        </div>
      </footer>
    </div>
  );
}
