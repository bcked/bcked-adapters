"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const worker_threads_1 = require("worker_threads");
async function execute() {
    const { script, call } = worker_threads_1.workerData;
    if (worker_threads_1.parentPort == null)
        throw new Error(`Parent port for execution of script ${script} missing.`);
    const { default: Adapter } = await Promise.resolve(`${path.resolve(script)}`).then(s => require(s));
    const adapter = new Adapter();
    const data = Object.fromEntries(await Promise.all(Object.entries(call).map(async ([field, fn]) => [field, await adapter[fn]()])));
    worker_threads_1.parentPort.postMessage(data);
}
execute();
//# sourceMappingURL=execute_load.js.map