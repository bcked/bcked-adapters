"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const bot_1 = require("../../watcher/bot");
const proxy_1 = require("../adapters/proxy");
const adapter = new proxy_1.SystemAdapterProxy();
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Query system ${id}`);
    try {
        await Promise.all([adapter.getDetails(id), adapter.update(id)]);
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${paths_1.PATHS.systems}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${paths_1.PATHS.systems}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=query_system.js.map