// public/pyodide-worker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodideReadyPromise;

async function loadPyodideAndPackages() {
    self.pyodide = await loadPyodide({
        stdout: (text) => {
            self.postMessage({ type: "PY_LOG", log: text });
        },
        stderr: (text) => {
            self.postMessage({ type: "PY_ERR", log: text });
        }
    });
    await self.pyodide.loadPackage(["micropip", "pandas", "openpyxl"]);
    return self.pyodide;
}

pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
    const { id, type, code, fileBuffer, fileName } = event.data;

    if (type === "RUN_PYTHON") {
        try {
            // 1. Wait for Pyodide to load
            await pyodideReadyPromise;

            // 2. Write the input file to Pyodide's virtual file system
            // We assume the user uploaded a file, and we write it to /tmp/input_data
            // The extension depends on what they uploaded
            const inputPath = `/tmp/input_data${fileName.substring(fileName.lastIndexOf('.'))}`;
            self.pyodide.FS.mkdir("/tmp"); // Make sure /tmp exists, ignore if it does

            try { self.pyodide.FS.mkdir("/tmp"); } catch (e) { } // ignore if exists

            self.pyodide.FS.writeFile(inputPath, new Uint8Array(fileBuffer));

            // 3. Set up a Python environment where we redirect stdout to capture prints (optional)
            // and execute the user's code. 
            // The AI prompt will be instructed to read from inputPath and write to '/tmp/output_data.xlsx' or similar.

            // We need to pass the dynamic input path to the python code. 
            // A simple way is to define it as a global before execution.
            self.pyodide.globals.set("INPUT_FILE_PATH", inputPath);

            // Execute code
            await self.pyodide.runPythonAsync(code);

            // 4. Try to find the output file. The AI prompt should write to /tmp/output_data.something
            // For now, let's look for known output paths, or we can just enforce '/tmp/output_data.xlsx' in the prompt.
            // Let's assume the AI always writes to '/tmp/output_data.xlsx' or '/tmp/output_data.csv'

            let outPath = null;
            if (self.pyodide.FS.analyzePath('/tmp/output_data.xlsx').exists) {
                outPath = '/tmp/output_data.xlsx';
            } else if (self.pyodide.FS.analyzePath('/tmp/output_data.csv').exists) {
                outPath = '/tmp/output_data.csv';
            }

            if (!outPath) {
                throw new Error("No output file was created at /tmp/output_data.xlsx or /tmp/output_data.csv. Ensure the generated code saves the result.");
            }

            // Read the output file
            const outBuffer = self.pyodide.FS.readFile(outPath);

            // Cleanup files to free up RAM
            self.pyodide.FS.unlink(inputPath);
            self.pyodide.FS.unlink(outPath);

            // Post back success
            self.postMessage({ id, status: "success", result: outBuffer, outPath });
        } catch (error) {
            console.error(error);
            self.postMessage({ id, status: "error", error: error.message });
        }
    }
};
