"use client";

import React from "react";
import { FileSpreadsheet, Database, TableProperties, CheckCircle2 } from "lucide-react";
import type { FileMetadata } from "@/types";

interface MetadataGridProps {
    metadata: FileMetadata;
}

export function MetadataGrid({ metadata }: MetadataGridProps) {
    return (
        <div className="glass-panel w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-white/5">
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
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-full">
                        <TableProperties className="w-4 h-4" />
                        {metadata.columns.length} Columns
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-full">
                        <Database className="w-4 h-4" />
                        {metadata.sheetNames.length} Sheets
                    </span>
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
