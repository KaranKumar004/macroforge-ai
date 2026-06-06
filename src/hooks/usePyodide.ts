import { useState, useEffect, useRef, useCallback } from 'react';

interface RunPythonArgs {
    code: string;
    fileBuffer: ArrayBuffer;
    fileName: string;
}

interface RunPythonResult {
    outBuffer?: Uint8Array;
    outPath?: string;
    error?: string;
}

export function usePyodide() {
    const workerRef = useRef<Worker | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // Initialize the Web Worker only on the client side
        const worker = new Worker('/pyodide-worker.js');
        workerRef.current = worker;

        const handleWorkerMessage = (event: MessageEvent) => {
            const { type, log } = event.data;
            if (type === 'PY_LOG') {
                setLogs((prev) => [...prev, log]);
            } else if (type === 'PY_ERR') {
                setLogs((prev) => [...prev, `❌ ${log}`]);
            }
        };

        worker.addEventListener('message', handleWorkerMessage);
        setIsInitializing(false);

        return () => {
            worker.removeEventListener('message', handleWorkerMessage);
            worker.terminate();
        };
    }, []);

    const runPython = useCallback((args: RunPythonArgs): Promise<RunPythonResult> => {
        return new Promise((resolve) => {
            if (!workerRef.current) {
                resolve({ error: "Worker not initialized" });
                return;
            }

            setIsRunning(true);
            setError(null);
            setLogs([]); // Clear logs at the beginning of a run

            const messageId = Date.now().toString();

            const handleMessage = (event: MessageEvent) => {
                const { id, status, result, outPath, error } = event.data;

                if (id === messageId) {
                    workerRef.current?.removeEventListener('message', handleMessage);
                    setIsRunning(false);

                    if (status === 'success') {
                        resolve({ outBuffer: result, outPath });
                    } else {
                        setError(error);
                        resolve({ error });
                    }
                }
            };

            workerRef.current.addEventListener('message', handleMessage);

            workerRef.current.postMessage({
                id: messageId,
                type: 'RUN_PYTHON',
                ...args
            });
        });
    }, []);

    return { runPython, isInitializing, isRunning, error, logs, clearLogs: () => setLogs([]) };
}
