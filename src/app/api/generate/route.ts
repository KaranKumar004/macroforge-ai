import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, metadata, language, isProModel } = await req.json();

        // Simulate API delay (Pro model is slightly slower/more complex, standard is faster)
        const delay = isProModel ? 3000 : 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));

        const promptLower = prompt.toLowerCase();
        const columns = metadata?.columns || [];
        const filename = metadata?.filename || "data.xlsx";

        // Detect column types
        const numericCols = columns.filter((c: any) => c.type === "number").map((c: any) => c.name);
        const stringCols = columns.filter((c: any) => c.type === "string").map((c: any) => c.name);
        const dateCols = columns.filter((c: any) => c.type === "date" || c.name.toLowerCase().includes("date")).map((c: any) => c.name);

        let codeLines: string[] = [];
        let vbaLines: string[] = [];

        // Dynamic rule-based python pandas logic builder
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
            generatedCode = `import pandas as pd
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
            generatedCode = `Option Explicit

' Automated processing script for: ${filename}
' User requested: ${prompt}
' AI Model: ${isProModel ? "MacroForge Pro (High-Performance)" : "MacroForge Standard"}

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
        });
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate code." },
            { status: 500 }
        );
    }
}
