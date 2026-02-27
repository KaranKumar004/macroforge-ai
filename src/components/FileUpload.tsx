"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileMetadata, ColumnMetadata } from "@/types";

interface FileUploadProps {
    onFileParsed: (metadata: FileMetadata) => void;
}

export function FileUpload({ onFileParsed }: FileUploadProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;

            setIsProcessing(true);
            setError(null);

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to json to easily get headers (using first row)
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length === 0) {
                        throw new Error("The uploaded file is empty or formatted incorrectly.");
                    }

                    const headers = jsonData[0] as string[];
                    const sampleRow = jsonData.length > 1 ? (jsonData[1] as any[]) : [];

                    const columns: ColumnMetadata[] = headers.map((header, index) => {
                        const sampleValue = sampleRow[index];
                        let type: ColumnMetadata["type"] = "unknown";

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

                    onFileParsed({
                        filename: file.name,
                        size: file.size,
                        sheetNames: workbook.SheetNames,
                        columns,
                    });
                } catch (err: any) {
                    setError(err.message || "Failed to process the file.");
                } finally {
                    setIsProcessing(false);
                }
            };

            reader.onerror = () => {
                setError("Error reading the file.");
                setIsProcessing(false);
            };

            reader.readAsArrayBuffer(file);
        },
        [onFileParsed]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
            "text/csv": [".csv"],
        },
        multiple: false,
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "glass-panel relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ease-in-out",
                    isDragActive
                        ? "border-brand-500 bg-brand-500/10 scale-[1.02]"
                        : "border-gray-300/50 hover:border-brand-400 hover:bg-white/5 dark:border-gray-700/50 dark:hover:bg-white/5"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center space-y-4">
                    <div className="p-4 bg-brand-500/10 rounded-full">
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
                        ) : (
                            <UploadCloud className="w-8 h-8 text-brand-500" />
                        )}
                    </div>
                    <div>
                        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Excel (.xlsx, .xls) or CSV
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
}
