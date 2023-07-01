"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorker = exports.Worker = void 0;
const path = require("path");
const worker_threads_1 = require("worker_threads");
class Worker extends worker_threads_1.Worker {
    constructor(filename, options) {
        const resolvedPath = require.resolve(filename);
        super(resolvedPath, {
            ...options,
            execArgv: resolvedPath.endsWith(".ts") ? ["--require", "ts-node/register"] : undefined,
        });
    }
}
exports.Worker = Worker;
async function runWorker(script, options) {
    // TODO look into worker pool execution to limit max number of workers
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve("src", script), options);
        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
            resolve(null);
        });
    });
}
exports.runWorker = runWorker;
//# sourceMappingURL=ts_worker.js.map