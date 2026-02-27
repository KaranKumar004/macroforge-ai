import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, metadata, language } = await req.json();

        // In a real implementation, this would call OpenAI or Anthropic API
        // passing the metadata (columns, datatypes) and the user's prompt
        // to generate the final code securely without user data.

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let generatedCode = "";

        if (language === "python") {
            generatedCode = `import pandas as pd
import numpy as np

# In Pyodide, INPUT_FILE_PATH is provided globally by the Web Worker.
def process_file(file_path: str, output_path: str):
    """
    Automated processing script for: ${metadata?.filename || "data.xlsx"}
    User requested: ${prompt}
    """
    try:
        print(f"Loading data from {file_path}")
        
        # Determine how to read the file based on extension
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        # ---------------------------------------------------------
        # AI Generated Transformation Logic Based on User Prompt
        # ---------------------------------------------------------
        
        # Clean numeric data (Example transformation)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            df[col] = df[col].fillna(0)
            
        # Clean string data
        string_cols = df.select_dtypes(include=['object']).columns
        for col in string_cols:
            df[col] = df[col].fillna('').astype(str).str.strip()
            
        # Write output (Ensure it saves to /tmp/output_data.csv for the web worker to fetch)
        print(f"Writing transformed data to {output_path}")
        
        # We output to CSV by default for easier browser handling, but Excel works too
        df.to_csv(output_path, index=False)
        print("Processing complete!")
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise

if __name__ == "__main__":
    # Ensure it uses the dynamic file path injected by Pyodide, and writes to the expected output path
    # If not running in Pyodide, it defaults to local paths
    input_path = globals().get('INPUT_FILE_PATH', 'input.xlsx')
    output_path = '/tmp/output_data.csv' if 'INPUT_FILE_PATH' in globals() else 'output_data.csv'
    
    process_file(input_path, output_path)
`;
        } else {
            generatedCode = `Option Explicit

' Automated processing script for: ${metadata?.filename || "data.xlsx"}
' User requested: ${prompt}

Sub ProcessData()
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim lastCol As Long
    Dim r As Long, c As Long
    
    ' Optimize performance
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False
    
    Set ws = ActiveSheet
    
    ' Find bounds
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    ' ---------------------------------------------------------
    ' AI Generated Transformation Logic Based on User Prompt
    ' ---------------------------------------------------------
    
    ' Example: Clear formatting and trim strings
    For c = 1 To lastCol
        For r = 2 To lastRow
            If Not IsEmpty(ws.Cells(r, c)) And VarType(ws.Cells(r, c)) = vbString Then
                ws.Cells(r, c).Value = Trim(ws.Cells(r, c).Value)
            End If
        Next r
    Next c
    
    MsgBox "Macro processing completed successfully!", vbInformation
    GoTo CleanUp

ErrorHandler:
    MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical

CleanUp:
    ' Restore settings
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
End Sub
`;
        }

        return NextResponse.json({
            success: true,
            code: generatedCode,
        });
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate code." },
            { status: 500 }
        );
    }
}
