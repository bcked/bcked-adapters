"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const constants_1 = require("../../constants");
const helper_1 = require("../../utils/helper");
const bot_1 = require("../../watcher/bot");
const proxy_1 = require("../adapters/proxy");
const adapter = new proxy_1.AssetAdapterProxy();
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Query asset ${id}`);
    const identifier = (0, helper_1.fromId)(id);
    try {
        await Promise.all([
            adapter.getDetails(identifier),
            adapter.getPrice(identifier),
            adapter.getSupply(identifier),
            adapter.getBacking(identifier),
        ]);
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${constants_1.PATHS.assets}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${constants_1.PATHS.assets}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=query_asset.js.map