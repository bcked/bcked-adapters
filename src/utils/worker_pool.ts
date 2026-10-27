import { Worker } from "./ts_worker";

interface Options {
    max: number;
}

/**
 * Runs work items in a fixed number of worker threads.
 *
 * Items are queued and handed to the next free worker, so there is no acquire timeout.
 * Every worker handles one item at a time and answers with exactly one message per item.
 * An error or unexpected exit of a worker rejects the whole execution.
 */
export async function executeInWorkerPool<Data, Result>(
    workerScriptPath: string,
    workItems: Data[],
    options: Options = { max: 4 }
): Promise<(Result | null)[]> {
    const results: (Result | null)[] = new Array(workItems.length).fill(null);
    let next = 0;

    async function runWorker() {
        const worker = new Worker(workerScriptPath);
        try {
            while (next < workItems.length) {
                const index = next++;
                results[index] = await executeOnWorker<Data, Result>(worker, workItems[index]!);
            }
        } finally {
            await worker.terminate();
        }
    }

    const workerCount = Math.max(1, Math.min(options.max, workItems.length));
    await Promise.all(Array.from({ length: workerCount }, runWorker));
    return results;
}

export async function executeInWorker<Data, Result>(
    workerScriptPath: string,
    data?: Data
): Promise<Result | null> {
    const [result] = await executeInWorkerPool<Data | undefined, Result>(
        workerScriptPath,
        [data],
        { max: 1 }
    );
    return result ?? null;
}

function executeOnWorker<Data, Result>(worker: Worker, data: Data): Promise<Result | null> {
    return new Promise((resolve, reject) => {
        const onMessage = (response: Result) => {
            cleanup();
            resolve(response);
        };

        const onError = (err: Error) => {
            cleanup();
            reject(err);
        };

        const onExit = (code: number) => {
            cleanup();
            reject(new Error(`Worker stopped unexpectedly with exit code ${code}`));
        };

        const cleanup = () => {
            worker.off("message", onMessage);
            worker.off("error", onError);
            worker.off("exit", onExit);
        };

        worker.on("message", onMessage);
        worker.on("error", onError);
        worker.on("exit", onExit);
        worker.postMessage(data);
    });
}
