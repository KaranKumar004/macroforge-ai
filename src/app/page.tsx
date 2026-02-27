"use client";

import { useState } from "react";
import { Sparkles, TerminalSquare, AlertCircle, RefreshCw, Layers, Zap, Lock, Play, Download } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { MetadataGrid } from "@/components/MetadataGrid";
import { CodePreview } from "@/components/CodePreview";
import { usePyodide } from "@/hooks/usePyodide";
import type { FileMetadata } from "@/types";

export default function Home() {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<"python" | "vba">("python");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pyodide Integration
  const { runPython, isInitializing: pyInitializing, isRunning: pyRunning, error: pyError } = usePyodide();

  const handleGenerate = async () => {
    if (!metadata || !prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, metadata, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedCode(data.code);
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
  };

  const handleRunCode = async () => {
    if (!metadata?.rawBuffer || !generatedCode) return;

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col font-sans">
      {/* Navigation (Optional, can be expanded later) */}
      <nav className="w-full bg-white dark:bg-[#09090b]/80 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <TerminalSquare className="w-8 h-8 text-brand-500" />
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">MacroForge</span>
            </div>
            {/* Add links to GitHub later if needed */}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16">

        {/* --- HERO SECTION --- */}
        <section className="text-center pt-8 md:pt-16 pb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
            Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">AI Automation</span> Engineer
          </h1>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-600 dark:text-gray-400 mx-auto mb-10 leading-relaxed">
            Stop wrestling with repetitive Excel tasks. Describe what you want to do in plain English, and MacroForge AI instantly generates production-ready Python or VBA code tailored to your exact file structure.
          </p>
          <div className="flex justify-center gap-4">
            {/* If we had a specific "Get Started" anchor, we could put a button here. Since the tool is immediately below, we'll just encourage scrolling. */}
            <a href="#tool-section" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-brand-500 hover:bg-brand-600 shadow-md hover:shadow-lg transition-all">
              Try it Now
            </a>
          </div>
        </section>

        {/* --- HOW IT WORKS / FEATURES --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">1. Upload Template</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Drop your `.xlsx` or `.csv` file. We automatically analyze the headers, data types, and row structures to understand your context.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">2. Describe Action</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tell us what you want to do. "Standardize dates", "Remove trailing spaces", or "Create a pivot table summarizing sales".
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">3. Get Secure Code</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Instantly receive Python (Pandas) or VBA code. <strong>Your actual data never leaves your browser</strong>; we only send column metadata to the AI.
            </p>
          </div>
        </section>

        {/* --- THE TOOL SECTION --- */}
        <section id="tool-section" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full">
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
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold">✓</span>
                      File Structure Analysis Complete
                    </h2>
                    <button
                      onClick={resetAll}
                      className="text-sm font-medium text-gray-500 hover:text-brand-500 flex items-center gap-1.5 transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 px-3 py-1.5 rounded-full"
                    >
                      <RefreshCw className="w-4 h-4" /> Start Over
                    </button>
                  </div>

                  {/* Metadata display is responsive internally */}
                  <MetadataGrid metadata={metadata} />

                  <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold">2</span>
                      Describe Automation
                    </h2>
                    <div className="flex flex-col gap-5">
                      {/* Language Toggle */}
                      <div className="flex flex-wrap gap-4 mb-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg w-fit">
                        <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition-colors ${language === 'python' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                          <input
                            type="radio"
                            name="language"
                            value="python"
                            checked={language === "python"}
                            onChange={() => setLanguage("python")}
                            className="sr-only"
                          />
                          <span className={`text-sm font-semibold ${language === 'python' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>Python (Pandas)</span>
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition-colors ${language === 'vba' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                          <input
                            type="radio"
                            name="language"
                            value="vba"
                            checked={language === "vba"}
                            onChange={() => setLanguage("vba")}
                            className="sr-only"
                          />
                          <span className={`text-sm font-semibold ${language === 'vba' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>Excel VBA</span>
                        </label>
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
                        className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-lg font-semibold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-3"
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
                          </>
                        )}
                      </button>

                      {/* Error Display */}
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm mt-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="font-medium">{error}</p>
                        </div>
                      )}

                      {/* Pyodide Run Button */}
                      {generatedCode && language === "python" && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Execute Locally</h3>
                          <button
                            onClick={handleRunCode}
                            disabled={pyRunning || pyInitializing}
                            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-base font-semibold shadow-md transition-all flex items-center justify-center gap-3"
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
                              <p className="font-medium font-mono whitespace-pre-wrap">{pyError}</p>
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
            </div>

            {/* Right Column: Code Preview */}
            <div className="flex flex-col h-[500px] lg:h-[calc(100vh-12rem)] min-h-[500px] mt-8 lg:mt-0">
              <CodePreview code={generatedCode || ""} language={language} />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <TerminalSquare className="w-5 h-5" />
            <span className="font-semibold">MacroForge AI</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Empowering analysts with AI-driven automation.
          </p>
        </div>
      </footer>
    </div>
  );
}
