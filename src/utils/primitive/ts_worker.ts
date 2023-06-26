import * as path from "path";
import { Worker as JsWorker, WorkerOptions } from "worker_threads";

export class Worker extends JsWorker {
    constructor(filename: string, options?: WorkerOptions) {
        const resolvedPath = require.resolve(filename);
        super(resolvedPath, {
            ...options,
            execArgv: resolvedPath.endsWith(".ts") ? ["--require", "ts-node/register"] : undefined,
        });
    }
}

export async function runWorker<T>(script: string, options?: WorkerOptions): Promise<T | null> {
    // TODO look into worker pool execution to limit max number of workers
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve("src", script), options);
        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            resolve(null);
        });
    });
}
