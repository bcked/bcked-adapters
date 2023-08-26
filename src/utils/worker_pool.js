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
            const onMessage = (response) => {
                cleanup();
                resolve(response);
            };
            const onError = (err) => {
                cleanup();
                reject(err);
            };
            const onExit = (code) => {
                cleanup();
                if (code !== 0)
                    reject(new Error(`Worker stopped with exit code ${code}`));
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
exports.WorkerPool = WorkerPool;
//# sourceMappingURL=worker_pool.js.map