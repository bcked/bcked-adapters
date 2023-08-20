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

    async execute(data: string | object) {
        const worker = await this.pool.acquire().promise;

        return new Promise((resolve, reject) => {
            worker.on("message", (response) => {
                // Release the worker back to the pool after the work is done.
                this.pool.release(worker);
                resolve(response);
            });
            worker.on("error", (err) => {
                this.pool.release(worker);
                reject(err);
            });
            worker.on("exit", (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                resolve(null);
            });
            worker.postMessage(data);
        });
    }

    async close() {
        await this.pool.destroy();
    }
}
