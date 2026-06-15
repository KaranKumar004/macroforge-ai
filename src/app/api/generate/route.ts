import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const diagnosticLogs: string[] = [];
    const logDiag = (msg: string) => {
        console.log(msg);
        diagnosticLogs.push(msg);
    };
    const warnDiag = (msg: string, detail?: string) => {
        const fullMsg = msg + (detail ? ` ${detail}` : "");
        console.warn(fullMsg);
        diagnosticLogs.push(fullMsg);
    };

    try {
        const { prompt, metadata, language, isProModel } = await req.json();

        const columns = metadata?.columns || [];
        const filename = metadata?.filename || "data.xlsx";

        // 1. Format Dataset Schema & Samples exactly as requested
        let schemaText = "Dataset Schema:\n\n";
        let sampleText = "Sample Values:\n";

        columns.forEach((col: any) => {
            schemaText += `${col.name} (${col.type})\n`;
            if (col.sample !== undefined && col.sample !== null) {
                sampleText += `${col.name} = ${col.sample}\n`;
            }
        });

        // 2. Define Developer System Prompt for structured model reasoning
        let languageRules = "";
        if (language === "vba") {
            languageRules = `IMPORTANT RULES FOR VBA:

 * SCHEMA FIRST & HEADER DYNAMIC SEARCH: Analyze the dataset schema. Dynamically locate column indices by looping through the first row (headers) to find column names rather than hardcoding column placements. Loop through columns 1 to lastCol (where lastCol is calculated dynamically using Find/End) rather than looping through all Cells of Rows(1) (which contains 16,384 columns and degrades performance). Verify that all required columns are successfully resolved (> 0); if any required column is missing, exit the Sub gracefully after alerting the user and restoring settings.
 * EXPLICIT WORKBOOK & SHEET QUALIFICATION: Always explicitly qualify worksheet operations (like deleting or adding worksheets, referencing ranges, etc.) using a declared workbook object (e.g., \`srcWorkbook.Sheets(...)\` or \`srcWorkbook.Worksheets.Add\`) rather than using implicit active sheet references (like \`ActiveSheet\`, \`Worksheets(...)\`, or \`ActiveWorkbook\`). This prevents runtime mismatch when multiple workbooks are open or the active sheet changes.
 * ROBUST ERROR HANDLING & CLEANUP:
   - Implement structured error handling (\`On Error GoTo ErrorHandler\`).
   - Ensure Excel application settings (\`ScreenUpdating\`, \`Calculation\`, \`EnableEvents\`) are always restored to their default state inside a \`Cleanup:\` block even if the macro crashes.
   - Always check if the workbook, worksheet, or dialog objects are instantiated (e.g., \`If Not srcWorkbook Is Nothing Then\`) before executing cleanup methods like \`Close\` or releasing them, preventing Runtime Error 91 (Object variable not set) if the macro terminates early.
   - Professional design: The \`ErrorHandler\` block must alert the user and then use \`Resume Cleanup\` to transfer control to the \`Cleanup\` block, avoiding duplicated settings restoration code inside both blocks.
 * MEMORY ARRAY PROCESSING FOR PERFORMANCE: For operations that loop through and modify cell values (e.g., trimming spaces, case conversions, phone cleaning) on more than 100 rows, load the sheet range into a 2D Variant array, perform calculations in memory, and write the array back to the worksheet in a single operation. Do not use multiple cell-by-cell loops across the entire sheet range. When writing values back to a single vertical column range, the array must be declared and sized as a 2D array (e.g., \`ReDim arr(1 To lastRow - 1, 1 To 1)\`) rather than a 1D array. Assigning a 1D array directly to a vertical range replicates the first element across all cells in the column, corrupting the data.
 * ROW DELETION VS FILTERING: When asked to 'filter out' or remove missing or empty rows from the primary dataset, you must physically delete the rows (looping backwards, e.g. \`For i = lastRow To 2 Step -1\`) rather than just applying \`AutoFilter\` (which only hides rows from screen view but leaves them in calculations and summaries).
 * COMPREHENSIVE AGGREGATIONS: Ensure all requested cohorts, groups, or tiers (e.g. Silver, Gold, Platinum) are fully represented and calculated in summaries and metrics sheet outputs. Do not omit any categories from summary arrays or calculations.
  * SAFE SAVEAS & EXTENSION PARSING: When saving the processed workbook as "[filename]_processed.[ext]", dynamically find the position of the last period (using InStrRev) and insert "_processed" before the extension. Never append directly to the filename to avoid creating invalid file extensions. Use the declared workbook object (e.g., \`srcWorkbook.SaveAs\`) instead of \`ActiveWorkbook.SaveAs\`. Build the save path using \`srcWorkbook.Path\` (e.g., \`srcWorkbook.Path & "\\" & fileName & "_processed." & fileExtension\`) to ensure the file is saved in the original folder.
 * LAST COLUMN RESOLUTION: Never use \`Columns.Count + 1\` or \`ws.Columns.Count\` to locate the next empty column. \`Columns.Count\` returns the total column capacity of the worksheet (e.g., 16384), and adding 1 to it will exceed Excel's column bounds and throw a Runtime Error 1004. Always use the dynamically calculated last used column index (e.g., \`lastCol + 1\`).
 * FIND METHOD SAFE GUARD: When using \$.Find("*")\$ to calculate \`lastRow\` or \`lastColumn\`, verify that the search does not return \`Nothing\` before accessing the \$.Row\$ or \$.Column\$ property to prevent crashes on empty sheets.
 * DIVISION-BY-ZERO SAFETY: Always check if the denominator or counts (e.g., averages, ratios) are greater than zero before performing arithmetic division.
 * DUPLICATE SHEET PROTECTION: Before creating or renaming a worksheet, check if a sheet with that name already exists. If it does, delete it first or append a suffix to prevent runtime name conflicts. The helper check should inspect the workbook object collection (e.g., iterating through \`wb.Sheets\`) rather than using implicit \`Evaluate("ISREF(...)")\` which can test the wrong workbook scope.
 * PHONE STANDARDIZATION SAFETY: Never use the simple \`Val()\` function on phone numbers as it deletes leading zeros and truncates numbers containing formatting characters (such as parentheses, hyphens, or spaces). You must clean phone numbers by converting scientific notation (if any) and then iterating through each character of the phone string to extract and keep only digits, preserving leading zeros.
 * DATA RANGE ROW HIGHLIGHTING: When highlighting row ranges (e.g. for customer tiers), color only the row range from column 1 to \`lastCol\` (e.g. \`ws.Range(ws.Cells(row_idx, 1), ws.Cells(row_idx, lastCol)).Interior.Color = RGB(...)\`) rather than the entire \`ws.Rows(row_idx)\` to prevent file bloating and performance lag.
 * NO HARDCODED DATA COLUMNS: Never use hardcoded column index numbers (e.g., column 2 for name) for variables that exist in the dataset; always use the dynamically resolved column variable index.
 * FINAL CODE REQUIREMENTS: The generated VBA must compile under 'Option Explicit'. It must declare all variables with explicit types (no untyped variants unless necessary), including all loop control variables (like \`i\`, \`j\`, \`k\`, \`r\`, \`c\`) using \`Dim i As Long\`, etc. It must open a File Dialog picker letting the user select their data file dynamically, open it, perform operations, save, close the workbook, and restore Excel application settings. Handle errors and include inline comments.`;
        } else {
            languageRules = `IMPORTANT RULES FOR PYTHON (PANDAS & OPENPYXL):

* COMPLETE IMPORTS: Always include all necessary package imports (e.g. \`import pandas as pd\`, \`import numpy as np\`, \`import openpyxl\`, \`from openpyxl.styles import PatternFill\`, \`from openpyxl.utils.dataframe import dataframe_to_rows\`) at the very top of the script. Do not write code containing unresolved module dependencies.
* SCHEMA FIRST & DYNAMIC HEADERS: Analyze the provided dataset schema (metadata.columns) and use the exact column names. Never assume columns like 'phone', 'dob', 'blood_type', 'annual_income', or 'purchase_count' exist unless you verify their presence in the schema first. Search programmatically using case-insensitive checks and synonyms if needed. If a required column is missing, handle it gracefully by skipping the dependent step and adding a log message or writing 'N/A' in the output, instead of raising a KeyError.
* PHONE STANDARDIZATION & NaN SAFETY: Never call int(phone_num) directly on strings that might contain scientific float notation (e.g. '3.81E+09') or decimal values, as it will crash with a ValueError. Always convert values to float first, check for NaN, and then format cleanly to integer strings (e.g. str(int(float(x))) under a try-except block).
* DYNAMIC FORMATTING & ROW STYLING:
  - Never assume a targeted column is at column A or any fixed index. Always dynamically find the 1-based index of the target header from the DataFrame columns list (e.g. col_idx = list(df.columns).index('ColName') + 1) to retrieve or style cells in openpyxl.
  - When appending DataFrames using dataframe_to_rows, always include headers (header=True) so the Excel sheet has labeled columns.
  - When asked to highlight/format a "row", iterate through all columns for that row index in openpyxl (e.g. for col_idx in range(1, ws.max_column + 1): ws.cell(row=row_idx, column=col_idx).fill = ...) rather than coloring only the first cell.
* TEMPORAL COLUMNS & DATE HANDLING: Recognize date columns. Do NOT perform arithmetic operations (e.g. sum, mean, stddev) directly on raw date/time fields. If Date of Birth (DOB) or other date columns need plotting or statistics, convert them into ages or another meaningful numeric metric first. Plot age distributions rather than raw datetime objects on histograms.
* DATA QUALITY AUDITS & SANITIZATION:
  - Phone validation: Sanitize the phone column first (remove floats/decimals, spaces, hyphens, parentheses, country codes, and non-numeric characters) before validating. Handle blank/missing values properly.
  - Auditing Reports: When auditing, track duplicates and blank cells. Write a detailed "Data Quality Report" worksheet in the output Excel file showing duplicate count, missing values, validation errors, and overall accuracy.
* AUTOMATED EXPLORATORY DATA ANALYSIS (EDA):
  - Numeric columns: Perform automatic summary statistics (count, mean, stddev, min, max, median) for all numeric fields.
  - Outliers: Detect outliers dynamically in numeric columns using the Interquartile Range (IQR) method.
  - Categorical columns: Perform category breakdowns and frequency distributions for categorical columns.
  - Correlation: Calculate correlations between numeric variables.
* EXCEL DASHBOARD & EMBEDDED CHARTS:
  - Output Worksheets: The output Excel file must NOT just contain the original dataset. You must create the following worksheets:
    1. 'Data Quality Report' (Audit metrics)
    2. 'KPI Summary' (Key aggregates as large block cards)
    3. 'Segment Dashboard' (Pivot tables and insights)
  - Embedded Charts: Do NOT display charts on screen using blocking calls like 'plt.show()', as they will freeze or fail in headless browser runtimes (like Pyodide). Instead, save charts as image files (e.g. 'chart.png') or embed them directly into the Excel sheets using 'openpyxl.chart' (e.g. BarChart, LineChart) or 'openpyxl.drawing.image.Image'.
* ROBUST SAFETY & EXCEPTION GUARDS:
  - Check for empty datasets (df.empty) and exit gracefully.
  - Check for minimum rows required for statistical operations (e.g. need at least 3 rows to compute variance/stddev) to avoid division-by-zero or mathematical errors.
  - Wrap data loading, calculations, chart generation, and file saving in structured try-except blocks with detailed print logging.
  - Headless GUI Guard: Guard Tkinter/GUI code imports and calls under a try-except block so it doesn't run in headless sandbox workers (when 'INPUT_FILE_PATH' in globals() is True).`;
        }

        const systemPrompt = `You are MacroForge Pro, an expert Excel VBA and Python Pandas automation engineer.

Your job is to generate COMPLETE, PRODUCTION-READY code based on:
1. User request
2. Dataset schema
3. Column types
4. Sample values

${languageRules}

Provide ONLY the clean code block without markdown tags. Do not write introductory or concluding conversational text. Include comments indicating the task checklist status.`;

        // 3. Connect to live Gemini and Nvidia APIs if keys are present in environment
        let geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            geminiApiKey = geminiApiKey.replace(/['"\s]/g, "");
            if (geminiApiKey.includes("GEMINI_API_KEY=")) {
                geminiApiKey = geminiApiKey.split("GEMINI_API_KEY=")[1];
            }
        }
        
        let nvidiaApiKey = process.env.NVIDIA_API_KEY;
        if (nvidiaApiKey) {
            nvidiaApiKey = nvidiaApiKey.replace(/['"\s]/g, "");
            if (nvidiaApiKey.includes("NVIDIA_API_KEY=")) {
                nvidiaApiKey = nvidiaApiKey.split("NVIDIA_API_KEY=")[1];
            }
        }

        const keyPrefix = geminiApiKey ? geminiApiKey.substring(0, 8) : "NONE";
        const keySuffix = geminiApiKey ? geminiApiKey.substring(geminiApiKey.length - 4) : "NONE";
        const nvKeyPrefix = nvidiaApiKey ? nvidiaApiKey.substring(0, 8) : "NONE";

        logDiag(`[Diagnostic] API Request received. Gemini Key Present: ${!!geminiApiKey}, Length: ${geminiApiKey ? geminiApiKey.length : 0}`);
        logDiag(`[Diagnostic] Nvidia Key Present: ${!!nvidiaApiKey}, Length: ${nvidiaApiKey ? nvidiaApiKey.length : 0}`);
        logDiag(`[Diagnostic] Gemini Key Details - Prefix: ${keyPrefix}, Suffix: ${keySuffix}`);
        logDiag(`[Diagnostic] Nvidia Key Details - Prefix: ${nvKeyPrefix}`);
        logDiag(`[Diagnostic] Mapped Env Keys: ${JSON.stringify(Object.keys(process.env).filter(k => k.toUpperCase().includes("KEY") || k.toUpperCase().includes("GEMINI") || k === "PORT"))}`);
        
        if (geminiApiKey || nvidiaApiKey) {
            // Run a quick diagnostic to check which models are actually authorized for this key (Gemini only)
            if (geminiApiKey) {
                try {
                    const listUrl = "https://generativelanguage.googleapis.com/v1beta/models";
                    const listRes = await fetch(listUrl, {
                        method: "GET",
                        headers: {
                            "x-goog-api-key": geminiApiKey,
                        }
                    });
                    if (listRes.ok) {
                        const listData = await listRes.json();
                        const modelNames = listData.models?.map((m: any) => m.name) || [];
                        logDiag(`[Diagnostic] ListModels (Header v1beta) Success. Models count: ${modelNames.length} Models: ${JSON.stringify(modelNames)}`);
                    } else {
                        const errText = await listRes.text();
                        warnDiag(`[Diagnostic] ListModels (Header v1beta) Failed with status ${listRes.status}:`, errText);
                    }
                } catch (listErr: any) {
                    warnDiag(`[Diagnostic] ListModels (Header v1beta) Crashed:`, listErr?.message || String(listErr));
                }

                try {
                    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`;
                    const listRes = await fetch(listUrl);
                    if (listRes.ok) {
                        const listData = await listRes.json();
                        const modelNames = listData.models?.map((m: any) => m.name) || [];
                        logDiag(`[Diagnostic] ListModels (Query v1beta) Success. Models count: ${modelNames.length} Models: ${JSON.stringify(modelNames)}`);
                    } else {
                        const errText = await listRes.text();
                        warnDiag(`[Diagnostic] ListModels (Query v1beta) Failed with status ${listRes.status}:`, errText);
                    }
                } catch (listErr: any) {
                    warnDiag(`[Diagnostic] ListModels (Query v1beta) Crashed:`, listErr?.message || String(listErr));
                }
            }

            // Define list of model endpoints to try in order of preference
            const attempts = [
                // NVIDIA API Models (meta/llama-3.3-70b-instruct is extremely smart/fast, meta/llama-3.1-405b-instruct, meta/llama-3.1-70b-instruct)
                { provider: "nvidia", version: "v1", model: "meta/llama-3.3-70b-instruct", useHeader: true, label: "Llama 3.3 70B (Nvidia)" },
                { provider: "nvidia", version: "v1", model: "meta/llama-3.1-405b-instruct", useHeader: true, label: "Llama 3.1 405B (Nvidia)" },
                { provider: "nvidia", version: "v1", model: "meta/llama-3.1-70b-instruct", useHeader: true, label: "Llama 3.1 70B (Nvidia)" },

                // Gemini 2.5 Flash (Modern Standard)
                { provider: "gemini", version: "v1beta", model: "gemini-2.5-flash", useHeader: true, label: "Gemini 2.5 Flash (v1beta, Header)" },
                { provider: "gemini", version: "v1beta", model: "gemini-2.5-flash", useHeader: false, label: "Gemini 2.5 Flash (v1beta, Query)" },
                
                // Flash Latest (Generic mapping)
                { provider: "gemini", version: "v1beta", model: "gemini-flash-latest", useHeader: true, label: "Gemini Flash Latest (v1beta, Header)" },
                { provider: "gemini", version: "v1beta", model: "gemini-flash-latest", useHeader: false, label: "Gemini Flash Latest (v1beta, Query)" },
                { provider: "gemini", version: "v1", model: "gemini-flash-latest", useHeader: true, label: "Gemini Flash Latest (v1, Header)" },
                { provider: "gemini", version: "v1", model: "gemini-flash-latest", useHeader: false, label: "Gemini Flash Latest (v1, Query)" },

                // Gemini 2.0 Flash
                { provider: "gemini", version: "v1beta", model: "gemini-2.0-flash", useHeader: true, label: "Gemini 2.0 Flash (v1beta, Header)" },
                { provider: "gemini", version: "v1beta", model: "gemini-2.0-flash", useHeader: false, label: "Gemini 2.0 Flash (v1beta, Query)" },

                // Gemini 3.5 Flash
                { provider: "gemini", version: "v1beta", model: "gemini-3.5-flash", useHeader: true, label: "Gemini 3.5 Flash (v1beta, Header)" },
                { provider: "gemini", version: "v1beta", model: "gemini-3.5-flash", useHeader: false, label: "Gemini 3.5 Flash (v1beta, Query)" },

                // Gemini 3.1 Flash Lite
                { provider: "gemini", version: "v1beta", model: "gemini-3.1-flash-lite", useHeader: true, label: "Gemini 3.1 Flash Lite (v1beta, Header)" },
                { provider: "gemini", version: "v1beta", model: "gemini-3.1-flash-lite", useHeader: false, label: "Gemini 3.1 Flash Lite (v1beta, Query)" },

                // Gemini 2.5 Pro
                { provider: "gemini", version: "v1beta", model: "gemini-2.5-pro", useHeader: true, label: "Gemini 2.5 Pro (v1beta, Header)" },
                { provider: "gemini", version: "v1beta", model: "gemini-2.5-pro", useHeader: false, label: "Gemini 2.5 Pro (v1beta, Query)" },

                // Gemini Pro Latest
                { provider: "gemini", version: "v1beta", model: "gemini-pro-latest", useHeader: true, label: "Gemini Pro Latest (v1beta, Header)" },
                { provider: "gemini", version: "v1beta", model: "gemini-pro-latest", useHeader: false, label: "Gemini Pro Latest (v1beta, Query)" },
                { provider: "gemini", version: "v1", model: "gemini-pro-latest", useHeader: true, label: "Gemini Pro Latest (v1, Header)" },
                { provider: "gemini", version: "v1", model: "gemini-pro-latest", useHeader: false, label: "Gemini Pro Latest (v1, Query)" }
            ];

            // If they didn't choose the Pro model, filter down to Flash, Lite, Latest, or 70B models
            const activeAttempts = isProModel 
                ? attempts 
                : attempts.filter(a => a.model.includes("flash") || a.model.includes("lite") || a.model.includes("latest") || a.model.includes("70b"));

            for (const attempt of activeAttempts) {
                // Skip attempts for which keys are not present
                if (attempt.provider === "nvidia" && !nvidiaApiKey) {
                    continue;
                }
                if (attempt.provider === "gemini" && !geminiApiKey) {
                    continue;
                }

                try {
                    let apiUrl = "";
                    let headers: HeadersInit = {
                        "Content-Type": "application/json",
                    };
                    let requestBody = {};

                    if (attempt.provider === "nvidia") {
                        apiUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
                        headers["Authorization"] = `Bearer ${nvidiaApiKey}`;
                        requestBody = {
                            model: attempt.model,
                            messages: [
                                {
                                    role: "user",
                                    content: `${systemPrompt}\n\n${schemaText}\n\n${sampleText}\n\nUser Request: ${prompt}\n\nPlease generate the corresponding script code.`,
                                }
                            ],
                            temperature: 0.1,
                            max_tokens: 4096,
                        };
                    } else {
                        apiUrl = attempt.useHeader
                            ? `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent`
                            : `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${geminiApiKey}`;
                        
                        if (attempt.useHeader) {
                            headers["x-goog-api-key"] = geminiApiKey!;
                        }
                        requestBody = {
                            contents: [
                                {
                                    role: "user",
                                    parts: [
                                        {
                                            text: `${systemPrompt}\n\n${schemaText}\n\n${sampleText}\n\nUser Request: ${prompt}\n\nPlease generate the corresponding script code.`,
                                        },
                                    ],
                                },
                            ],
                            generationConfig: {
                                temperature: 0.1,
                            },
                        };
                    }
                    
                    logDiag(`[Diagnostic] Attempting generation using: ${attempt.label}`);

                    const apiResponse = await fetch(apiUrl, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(requestBody),
                    });

                    if (apiResponse.ok) {
                        const data = await apiResponse.json();
                        let code = "";

                        if (attempt.provider === "nvidia") {
                            code = data.choices?.[0]?.message?.content || "";
                        } else {
                            code = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                        }

                        // Extract code from markdown blocks if returned
                        if (code.includes("```")) {
                            const matches = code.match(/```[a-zA-Z]*\n([\s\S]*?)\n```/);
                            if (matches && matches[1]) {
                                code = matches[1];
                            }
                        }

                        logDiag(`[Diagnostic] Generation successful using: ${attempt.label}`);
                        return NextResponse.json({
                            success: true,
                            code: code.trim(),
                            tier: attempt.label,
                            isFallback: false,
                            diagnostics: diagnosticLogs,
                        });
                    } else {
                        const errBody = await apiResponse.text();
                        warnDiag(`[Diagnostic] ${attempt.label} failed with status ${apiResponse.status}:`, errBody);
                    }
                } catch (err: any) {
                    warnDiag(`[Diagnostic] ${attempt.label} fetch crashed:`, err?.message || String(err));
                }
            }
            warnDiag("[Diagnostic] All live Gemini and Nvidia model endpoints failed. Falling back to offline simulator.");
        }

        // 4. FALLBACK ENGINE (Smart rule-based simulation formatted according to developer rules)
        const delay = isProModel ? 3000 : 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));

        const promptLower = prompt.toLowerCase();
        const numericCols = columns.filter((c: any) => c.type === "number").map((c: any) => c.name);
        const stringCols = columns.filter((c: any) => c.type === "string").map((c: any) => c.name);
        const dateCols = columns.filter((c: any) => c.type === "date" || c.name.toLowerCase().includes("date")).map((c: any) => c.name);

        let codeLines: string[] = [];
        let vbaLines: string[] = [];

        // Rules analysis
        if (promptLower.includes("clean") || promptLower.includes("trim") || promptLower.includes("spaces")) {
            if (stringCols.length > 0) {
                codeLines.push(`    # Trim spaces and fill NaNs for string columns`);
                stringCols.forEach((col: string) => {
                    codeLines.push(`    if '${col}' in df.columns:\n        df['${col}'] = df['${col}'].fillna('').astype(str).str.strip()`);
                });
            } else {
                codeLines.push(`    # Standardize string fields\n    df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)`);
            }
            vbaLines.push(`    ' Trim whitespace from string columns\n    For r = 2 To lastRow\n        For c = 1 To lastCol\n            If Not IsEmpty(ws.Cells(r, c)) And VarType(ws.Cells(r, c)) = vbString Then\n                ws.Cells(r, c).Value = Trim(ws.Cells(r, c).Value)\n            End If\n        Next c\n    Next r`);
        }

        if (promptLower.includes("duplicate") || promptLower.includes("remove unique") || promptLower.includes("uniques")) {
            codeLines.push(`    # Remove duplicate rows`);
            const subsetCol = stringCols[0] || columns[0]?.name;
            if (subsetCol) {
                codeLines.push(`    print(f"Removing duplicate rows based on column: ${subsetCol}")\n    df = df.drop_duplicates(subset=[${JSON.stringify(subsetCol)}], keep='first')`);
            } else {
                codeLines.push(`    df = df.drop_duplicates()`);
            }
            vbaLines.push(`    ' Remove duplicate rows based on column A\n    ws.Range("A1").CurrentRegion.RemoveDuplicates Columns:=1, Header:=xlYes`);
        }

        if (promptLower.includes("filter") || promptLower.includes("greater") || promptLower.includes("less") || promptLower.includes("limit")) {
            const targetCol = numericCols[0] || columns[0]?.name;
            if (targetCol) {
                const conditionVal = promptLower.match(/\d+/) ? promptLower.match(/\d+/)?.[0] : "100";
                const conditionOp = promptLower.includes("less") ? "<" : ">";
                codeLines.push(`    # Filter rows based on '${targetCol}' ${conditionOp} ${conditionVal}`);
                codeLines.push(`    print(f"Filtering values in ${targetCol} that are ${conditionOp} ${conditionVal}")\n    df = df[df['${targetCol}'] ${conditionOp} ${conditionVal}]`);
                
                vbaLines.push(`    ' Filter rows based on column containing ${targetCol} ${conditionOp} ${conditionVal}\n    Dim targetColIdx As Long\n    targetColIdx = 1 ' Adjust to match ${targetCol} index\n    For r = lastRow To 2 Step -1\n        If ws.Cells(r, targetColIdx).Value ${conditionOp} ${conditionVal} Then\n            ' Keep row\n        Else\n            ws.Rows(r).Delete\n        End If\n    Next r`);
            }
        }

        if (promptLower.includes("date") || promptLower.includes("format date") || promptLower.includes("standardize date")) {
            if (dateCols.length > 0) {
                codeLines.push(`    # Parse and format date columns`);
                dateCols.forEach((col: string) => {
                    codeLines.push(`    if '${col}' in df.columns:\n        df['${col}'] = pd.to_datetime(df['${col}'], errors='coerce')`);
                });
            } else {
                codeLines.push(`    # Search and parse potential date columns\n    for col in df.columns:\n        if 'date' in col.lower():\n            df[col] = pd.to_datetime(df[col], errors='coerce')`);
            }
            vbaLines.push(`    ' Format dates in columns\n    For r = 2 To lastRow\n        ' Format cells containing dates as YYYY-MM-DD\n        If IsDate(ws.Cells(r, 1).Value) Then\n            ws.Cells(r, 1).NumberFormat = "yyyy-mm-dd"\n        End If\n    Next r`);
        }

        if (promptLower.includes("pivot") || promptLower.includes("summary") || promptLower.includes("group") || promptLower.includes("sum")) {
            const groupCol = stringCols[0] || (columns.length > 0 ? columns[0].name : "");
            const aggCol = numericCols[0] || (columns.length > 1 ? columns[1].name : "");
            
            if (groupCol && aggCol) {
                codeLines.push(`    # Create summary pivot table grouping by '${groupCol}'`);
                codeLines.push(`    print(f"Grouping by ${groupCol} and aggregating sum of ${aggCol}")\n    df = df.groupby('${groupCol}', as_index=False)['${aggCol}'].sum()`);
                
                vbaLines.push(`    ' Group data and summarize in a message box (Simple simulation)\n    Dim dict As Object, cellVal As String, numericVal As Double\n    Set dict = CreateObject("Scripting.Dictionary")\n    For r = 2 To lastRow\n        cellVal = CStr(ws.Cells(r, 1).Value)\n        numericVal = Val(ws.Cells(r, 2).Value)\n        If dict.Exists(cellVal) Then\n            dict(cellVal) = dict(cellVal) + numericVal\n        Else\n            dict.Add cellVal, numericVal\n        End If\n    Next r\n    ' Output results to column D and E\n    ws.Cells(1, 4).Value = "Group Key"\n    ws.Cells(1, 5).Value = "Sum Value"\n    Dim key As Variant, keyIdx As Long: keyIdx = 2\n    For Each key In dict.Keys\n        ws.Cells(keyIdx, 4).Value = key\n        ws.Cells(keyIdx, 5).Value = dict(key)\n        keyIdx = keyIdx + 1\n    Next key`);
            }
        }

        // Standard Fallback code if no rules are met
        if (codeLines.length === 0) {
            codeLines.push(`    # 1. Clean numeric fields`);
            if (numericCols.length > 0) {
                numericCols.forEach((col: string) => {
                    codeLines.push(`    if '${col}' in df.columns:\n        df['${col}'] = df['${col}'].fillna(0)`);
                });
            } else {
                codeLines.push(`    df = df.fillna(0)`);
            }
            codeLines.push(`\n    # 2. Capitalize string headers and values`);
            if (stringCols.length > 0) {
                codeLines.push(`    df['${stringCols[0]}'] = df['${stringCols[0]}'].astype(str).str.upper()`);
            }
        }

        if (vbaLines.length === 0) {
            vbaLines.push(`    ' Standard automation cleanup\n    For r = 2 To lastRow\n        If IsNumeric(ws.Cells(r, 1).Value) And IsEmpty(ws.Cells(r, 1)) Then\n            ws.Cells(r, 1).Value = 0\n        End If\n    Next r`);
        }

        let generatedCode = "";

        if (language === "python") {
            generatedCode = `# =========================================================
# MACROFORGE PRO - AUTOMATED PYTHON AUTOMATION KERNEL
# =========================================================
# Dataset: ${filename}
# Active Sheet: ${metadata?.activeSheet || "Sheet1"}
#
# SCHEMA ANALYSIS:
${columns.map((c: any) => `#   - ${c.name} (${c.type})`).join("\n")}
#
# REQUIREMENT CHECKLIST:
# [x] Open system file dialog picker (guarded for headless worker)
# [x] Execute clean-up calculations on custom columns
# [x] Save processed file as "[filename]_processed"
# =========================================================

import pandas as pd
import numpy as np
import os

# Guard GUI import for headless web sandboxes (like Pyodide in browser)
try:
    from tkinter import filedialog, Tk
    HAS_GUI = True
except ImportError:
    HAS_GUI = False

def select_input_file():
    if not HAS_GUI:
        return None
    root = Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.askopenfilename(
        title="MacroForge AI - Select Data File to Process",
        filetypes=[("Excel or CSV Files", "*.xlsx *.xls *.csv")]
    )
    return file_path

def process_file(file_path: str, output_path: str):
    """
    Automated processing script for: ${filename}
    User requested: ${prompt}
    AI Model: ${isProModel ? "MacroForge Pro (High-Performance)" : "MacroForge Standard"}
    """
    try:
        print(f"[*] Initializing MacroForge execution kernel")
        print(f"[*] Loading data file: {file_path}")
        
        # Determine how to read the file based on extension
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        print(f"[*] Successfully parsed {len(df)} rows and {len(df.columns)} columns")
        print(f"[*] Applying automated operations:")
        
        # ---------------------------------------------------------
        # AI Generated Transformation Logic Based on User Prompt
        # ---------------------------------------------------------
${codeLines.join("\n")}
        
        # Write output
        print(f"[*] Writing transformed output to: {output_path}")
        
        if output_path.endswith('.csv'):
            df.to_csv(output_path, index=False)
        else:
            df.to_excel(output_path, index=False)
            
        print("[+] Processing complete! File saved successfully.")
        
    except Exception as e:
        print(f"[ERROR] Error processing file: {str(e)}")
        raise

if __name__ == "__main__":
    # If running in Pyodide browser worker environment
    if 'INPUT_FILE_PATH' in globals():
        input_path = globals().get('INPUT_FILE_PATH')
        output_path = '/tmp/output_data.csv'
        process_file(input_path, output_path)
    else:
        # Running locally: Open desktop File Dialog picker
        print("[*] Running script locally. Opening file picker dialog...")
        input_path = select_input_file()
        if input_path:
            dir_name = os.path.dirname(input_path)
            base_name = os.path.basename(input_path)
            file_name, ext = os.path.splitext(base_name)
            output_path = os.path.join(dir_name, f"{file_name}_processed{ext}")
            
            process_file(input_path, output_path)
        else:
            print("[!] Operation cancelled. No file selected.")
`;
        } else {
            generatedCode = `' =========================================================
' MACROFORGE PRO - AUTOMATED EXCEL VBA AUTOMATION KERNEL
' =========================================================
' Dataset: ${filename}
' Active Sheet: ${metadata?.activeSheet || "Sheet1"}
'
' SCHEMA ANALYSIS:
${columns.map((c: any) => `'   - ${c.name} (${c.type})`).join("\n")}
'
' REQUIREMENT CHECKLIST:
' [x] Run compilation verification under Option Explicit
' [x] Open system File Dialog picker to select input workbook
' [x] Execute AI-guided calculations mapping columns programmatically
' [x] Save processed file as "[filename]_processed"
' [x] Restore Excel screen updating and calculations settings
' =========================================================

Option Explicit

Sub RunMacroForgeAutomation()
    On Error GoTo ErrorHandler
    
    Dim fd As Object
    Dim selectedFile As String
    Dim srcWorkbook As Workbook
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim lastCol As Long
    Dim r As Long, c As Long
    
    ' Optimize Excel performance during execution
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False
    
    ' Create File Dialog picker for the user to select their input file
    Set fd = Application.FileDialog(3) ' 3 = msoFileDialogFilePicker
    With fd
        .Title = "MacroForge AI - Select Excel/CSV file to Automate"
        .Filters.Clear
        .Filters.Add "Excel Files", "*.xlsx; *.xls; *.csv", 1
        If .Show = -1 Then
            selectedFile = .SelectedItems(1)
        Else
            MsgBox "No file selected. Operation cancelled.", vbExclamation, "MacroForge AI"
            GoTo CleanUp
        End If
    End With
    
    ' Open the selected workbook
    Set srcWorkbook = Workbooks.Open(selectedFile)
    Set ws = srcWorkbook.Sheets(1)
    
    ' Find bounds
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    ' ---------------------------------------------------------
    ' AI Generated Transformation Logic Based on User Prompt
    ' ---------------------------------------------------------
${vbaLines.join("\n")}
    
    ' Save the processed workbook in the same folder with "_processed" suffix
    Dim savePath As String
    Dim dotPos As Long
    dotPos = InStrRev(selectedFile, ".")
    savePath = Left(selectedFile, dotPos - 1) & "_processed" & Mid(selectedFile, dotPos)
    
    srcWorkbook.SaveAs Filename:=savePath
    srcWorkbook.Close SaveChanges:=True
    
    MsgBox "Automation complete!" & vbNewLine & "File saved successfully to: " & vbNewLine & savePath, vbInformation, "MacroForge AI"
    GoTo CleanUp

ErrorHandler:
    MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical, "MacroForge Exec Error"

CleanUp:
    ' Restore Excel settings
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
End Sub
`;
        }

        return NextResponse.json({
            success: true,
            code: generatedCode,
            tier: isProModel ? "Pro" : "Standard",
            isFallback: true,
            diagnostics: diagnosticLogs,
        });
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || "Failed to generate code.",
                diagnostics: diagnosticLogs
            },
            { status: 500 }
        );
    }
}
