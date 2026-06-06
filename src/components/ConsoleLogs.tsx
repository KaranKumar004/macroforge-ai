"use client";

import React, { useEffect, useRef } from "react";
import { Terminal, Trash2, Copy, Check } from "lucide-react";

interface ConsoleLogsProps {
  logs: string[];
  isRunning: boolean;
  onClear: () => void;
}

export function ConsoleLogs({ logs, isRunning, onClear }: ConsoleLogsProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto scroll to bottom when new logs come in
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, isRunning]);

  const copyLogs = async () => {
    if (logs.length === 0) return;
    await navigator.clipboard.writeText(logs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="terminal-window flex flex-col h-full min-h-[200px] max-h-[350px] animate-in fade-in-50 duration-300">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-gray-800">
        <div className="flex items-center gap-3">
          {/* Windows / Mac OS Style circles */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 font-medium ml-2">
            <Terminal className="w-3.5 h-3.5 text-green-500" />
            <span>python-worker-sandbox ~ console</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <>
              <button
                onClick={copyLogs}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-gray-200 transition-all"
                title="Copy Terminal Logs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClear}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-all"
                title="Clear Console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Terminal Logs Output */}
      <div className="terminal-body flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm leading-relaxed text-gray-300 bg-[#09090b]">
        {logs.length === 0 && !isRunning ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-6 text-center">
            <span className="text-gray-600 mb-1 font-semibold">{`$ pyodide --status`}</span>
            <span className="text-xs">{`Console idle. Run a script to stream stdout logs.`}</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-gray-500 border-b border-gray-900 pb-1 mb-2">
              {`[Session started at ${new Date().toLocaleTimeString()}]`}
            </div>
            {logs.map((log, idx) => {
              const isError = log.startsWith("❌") || log.toLowerCase().includes("[error]");
              const isWarning = log.toLowerCase().includes("[warning]");
              return (
                <div
                  key={idx}
                  className={`whitespace-pre-wrap ${
                    isError
                      ? "text-red-400"
                      : isWarning
                      ? "text-yellow-400 font-medium"
                      : "text-green-400"
                  }`}
                >
                  <span className="text-gray-600 select-none mr-2">{`>`}</span>
                  {log}
                </div>
              );
            })}
            {isRunning && (
              <div className="text-brand-400 animate-pulse flex items-center gap-1.5 mt-1 font-medium">
                <span className="text-gray-600 select-none mr-2">{`>`}</span>
                <span>Executing code block...</span>
                <span className="w-1.5 h-4 bg-brand-500 animate-caret" />
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
