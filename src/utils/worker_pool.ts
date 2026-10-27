import { Worker } from "node:worker_threads";

interface Options {
    max: number;
}

/**
 * Runs work items in a fixed number of worker threads.
 * Bun runs the TypeScript worker scripts directly.
 *
 * Items are queued and handed to the next free worker, so there is no acquire timeout.
 * Every worker handles one item at a time and answers with exactly one message per item.
 *
 * If a worker crashes on an item, it is replaced and the remaining items still run.
 * After all items are done, the execution rejects with all failures, so callers can
 * keep partial results but the failure is not lost.
 */
export async function executeInWorkerPool<Result>(
    workerScriptPath: string,
    workItems: unknown[],
    options: Options = { max: 4 }
): Promise<(Result | null)[]> {
    const results: (Result | null)[] = new Array(workItems.length).fill(null);
    const failures: Error[] = [];
    let next = 0;

    async function runWorker() {
        let worker = new Worker(workerScriptPath);
        try {
            while (next < workItems.length) {
                const index = next++;
                try {
                    results[index] = await executeOnWorker<Result>(worker, workItems[index]);
                } catch (error) {
                    const item = JSON.stringify(workItems[index]);
                    console.error(`Worker ${workerScriptPath} failed on ${item}:`, error);
                    failures.push(new Error(`Failed on ${item}`, { cause: error }));
                    await worker.terminate();
                    worker = new Worker(workerScriptPath);
                }
            }
        } finally {
            await worker.terminate();
        }
    }

    const workerCount = Math.max(1, Math.min(options.max, workItems.length));
    await Promise.all(Array.from({ length: workerCount }, runWorker));

    if (failures.length) {
        throw new AggregateError(
            failures,
            `${failures.length} of ${workItems.length} work items failed in ${workerScriptPath}`
        );
    }
    return results;
}

export async function executeInWorker<Result>(
    workerScriptPath: string,
    data?: unknown
): Promise<Result | null> {
    const [result] = await executeInWorkerPool<Result>(workerScriptPath, [data], { max: 1 });
    return result ?? null;
}

function executeOnWorker<Result>(worker: Worker, data: unknown): Promise<Result | null> {
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
