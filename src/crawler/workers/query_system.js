"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const bot_1 = require("../../watcher/bot");
const proxy_1 = require("../adapters/proxy");
const adapter = new proxy_1.SystemAdapterProxy();
worker_threads_1.parentPort?.on("message", async (systemId) => {
    try {
        const res = await Promise.all([adapter.getDetails(systemId), adapter.update(systemId)]);
        worker_threads_1.parentPort?.postMessage(res);
    }
    catch (error) {
        console.error(error);
        await (0, bot_1.sendErrorReport)(error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=query_system.js.map