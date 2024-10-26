"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const ids_1 = require("../api/utils/ids");
const job_1 = require("../utils/job");
const worker_pool_1 = require("../utils/worker_pool");
const WORKERS_PATH = "src/crawler/workers";
(0, job_1.job)("Crawler Job", async () => {
    const [assetIds, entityIds, systemIds] = await Promise.all([
        (0, ids_1.getAssetIds)(),
        (0, ids_1.getEntityIds)(),
        (0, ids_1.getSystemIds)(),
    ]);
    await (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "query_system.ts"), systemIds);
    await (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "query_entity.ts"), entityIds);
    await (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "query_asset.ts"), assetIds);
});
//# sourceMappingURL=job.js.map