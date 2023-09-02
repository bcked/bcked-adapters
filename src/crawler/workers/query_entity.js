"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const bot_1 = require("../../watcher/bot");
const proxy_1 = require("../adapters/proxy");
const adapter = new proxy_1.EntityAdapterProxy();
worker_threads_1.parentPort?.on("message", async (entityId) => {
    try {
        const res = await Promise.all([adapter.getDetails(entityId), adapter.update(entityId)]);
        worker_threads_1.parentPort?.postMessage(res);
    }
    catch (error) {
        console.error(error);
        await (0, bot_1.sendErrorReport)(error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=query_entity.js.map