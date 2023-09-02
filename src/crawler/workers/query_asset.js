"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const helper_1 = require("../../utils/helper");
const bot_1 = require("../../watcher/bot");
const proxy_1 = require("../adapters/proxy");
const adapter = new proxy_1.AssetAdapterProxy();
worker_threads_1.parentPort?.on("message", async (assetId) => {
    const identifier = (0, helper_1.fromId)(assetId);
    try {
        const res = await Promise.all([
            adapter.getDetails(identifier),
            adapter.getPrice(identifier),
            adapter.getSupply(identifier),
            adapter.getBacking(identifier),
        ]);
        worker_threads_1.parentPort?.postMessage(res);
    }
    catch (error) {
        console.error(error);
        await (0, bot_1.sendErrorReport)(error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=query_asset.js.map