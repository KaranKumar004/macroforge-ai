"use client";

import React from "react";
import { FileSpreadsheet, Database, TableProperties, CheckCircle2 } from "lucide-react";
import type { FileMetadata } from "@/types";

interface MetadataGridProps {
    metadata: FileMetadata;
    onSheetChange?: (sheetName: string) => void;
}

export function MetadataGrid({ metadata, onSheetChange }: MetadataGridProps) {
    return (
        <div className="glass-panel w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 border-b border-gray-200/50 dark:border-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg">
                        <FileSpreadsheet className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {metadata.filename}
                            <CheckCircle2 className="w-4 h-4 text-brand-500" />
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Parsed Locally • Zero Data Transmitted
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-full text-xs font-semibold">
                        <TableProperties className="w-3.5 h-3.5 text-brand-500" />
                        {metadata.columns.length} Columns
                    </span>
                    
                    {metadata.sheetNames.length > 1 ? (
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700/50 focus-within:border-brand-500 transition-colors">
                            <Database className="w-3.5 h-3.5 text-purple-500" />
                            <select
                                value={metadata.activeSheet || metadata.sheetNames[0]}
                                onChange={(e) => onSheetChange?.(e.target.value)}
                                className="bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none pr-1 cursor-pointer font-semibold py-1 focus:ring-0"
                            >
                                {metadata.sheetNames.map((sheet, index) => (
                                    <option key={index} value={sheet} className="dark:bg-[#09090b]">
                                        Sheet: {sheet}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <Database className="w-3.5 h-3.5 text-purple-500" />
                            {metadata.sheetNames[0] || "1 Sheet"}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-600 uppercase bg-gray-50/50 dark:bg-gray-900/50 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-semibold">Column Name</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Inferred Type</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Sample Data (Local)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
                        {metadata.columns.map((col, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                    {col.name}
                                </td>
                                <td className="px-6 py-4 text-brand-600 dark:text-brand-400">
                                    <span className="px-2.5 py-1 bg-brand-500/10 rounded-md text-xs font-medium">
                                        {col.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-xs">
                                    {col.sample !== undefined ? String(col.sample) : "N/A"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
