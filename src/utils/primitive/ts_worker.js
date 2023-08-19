"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = exports.adaptFileExt = void 0;
const worker_threads_1 = require("worker_threads");
function adaptFileExt(filename) {
    return process.env.DEV_MODE ? filename : filename.replace(".ts", ".js");
}
exports.adaptFileExt = adaptFileExt;
class Worker extends worker_threads_1.Worker {
    constructor(filename, options) {
        const adaptedFilename = adaptFileExt(filename);
        const resolvedPath = require.resolve(adaptedFilename);
        super(resolvedPath, {
            ...options,
            execArgv: resolvedPath.endsWith(".ts") ? ["--require", "ts-node/register"] : undefined,
        });
    }
}
exports.Worker = Worker;
//# sourceMappingURL=ts_worker.js.map