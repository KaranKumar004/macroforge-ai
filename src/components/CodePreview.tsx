"use client";

import React, { useState } from "react";
import { Check, Copy, Download, Code2, Sparkles } from "lucide-react";

interface CodePreviewProps {
    code: string;
    language: "python" | "vba";
}

export function CodePreview({ code, language }: CodePreviewProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadCode = () => {
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `macroforge_script.${language === "python" ? "py" : "vba"}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!code) {
        return (
            <div className="glass-panel h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed border-2 border-gray-300/50 dark:border-gray-700/50">
                <div className="p-4 bg-brand-500/5 rounded-full mb-4">
                    <Code2 className="w-8 h-8 text-brand-500/50" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Awaiting Instructions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    Upload a file and describe your problem to generate your automation script.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-panel w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500 h-full border border-brand-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
            <div className="px-4 py-3 bg-[#0d1117] border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-mono font-medium text-gray-300">
                        Generated {language === "python" ? "Python script" : "VBA macro"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={downloadCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md transition-colors text-xs font-medium"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </button>
                </div>
            </div>
            <div className="p-4 bg-[#0d1117] flex-1 overflow-auto relative group">
                <pre className="text-sm font-mono text-gray-300 leading-relaxed wrapper">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}
