"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = void 0;
const tarn_1 = require("tarn");
const ts_worker_1 = require("./ts_worker");
class WorkerPool {
    constructor(workerScriptPath, options) {
        this.pool = new tarn_1.Pool({
            create: async () => new ts_worker_1.Worker(workerScriptPath),
            destroy: (worker) => worker.terminate(),
            ...options,
        });
    }
    async execute(data) {
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
                if (code !== 0)
                    reject(new Error(`Worker stopped with exit code ${code}`));
                resolve(null);
            });
            worker.postMessage(data);
        });
    }
    async close() {
        await this.pool.destroy();
    }
}
exports.WorkerPool = WorkerPool;
//# sourceMappingURL=workerpool.js.map