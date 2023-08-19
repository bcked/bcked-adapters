"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const proxy_1 = require("../utils/adapters/proxy");
const adapter = new proxy_1.EntityAdapterProxy();
worker_threads_1.parentPort?.on("message", async (entityId) => {
    const res = await Promise.all([adapter.getDetails(entityId), adapter.update(entityId)]);
    worker_threads_1.parentPort?.postMessage(res);
});
//# sourceMappingURL=query_entity.js.map