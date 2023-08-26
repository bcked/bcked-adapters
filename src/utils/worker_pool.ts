import { Pool } from "tarn";
import { Worker } from "./ts_worker";

interface Options {
    min: number;
    max: number;
}

export class WorkerPool {
    pool: Pool<Worker>;

    constructor(workerScriptPath: string, options: Options) {
        this.pool = new Pool({
            create: async () => new Worker(workerScriptPath),
            destroy: (worker) => worker.terminate(),
            ...options,
        });
    }

    async execute<T>(data: string | object): Promise<T | null> {
        const worker = await this.pool.acquire().promise;

        return new Promise((resolve, reject) => {
            const onMessage = (response: T) => {
                cleanup();
                resolve(response);
            };

            const onError = (err: Error) => {
                cleanup();
                reject(err);
            };

            const onExit = (code: number) => {
                cleanup();
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                resolve(null);
            };

            const cleanup = () => {
                worker.off("message", onMessage);
                worker.off("error", onError);
                worker.off("exit", onExit);
                // Release the worker back to the pool after the work is done.
                this.pool.release(worker);
            };

            worker.on("message", onMessage);
            worker.on("error", onError);
            worker.on("exit", onExit);
            worker.postMessage(data);
        });
    }

    async close() {
        await this.pool.destroy();
    }
}
