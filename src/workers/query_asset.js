"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const proxy_1 = require("../utils/adapters/proxy");
const helper_1 = require("../utils/helper");
const adapter = new proxy_1.AssetAdapterProxy();
worker_threads_1.parentPort?.on("message", async (assetId) => {
    const identifier = (0, helper_1.fromId)(assetId);
    const res = await Promise.all([
        adapter.getDetails(identifier),
        adapter.getPrice(identifier),
        adapter.getSupply(identifier),
        adapter.getBacking(identifier),
    ]);
    worker_threads_1.parentPort?.postMessage(res);
});
//# sourceMappingURL=query_asset.js.map