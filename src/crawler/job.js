"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const job_1 = require("../utils/job");
const worker_pool_1 = require("../utils/worker_pool");
const WORKERS_PATH = "src/crawler/workers";
async function query(dir, workerScript) {
    const workerScriptPath = node_path_1.default.resolve(WORKERS_PATH, workerScript);
    const ids = await promises_1.default.readdir(dir);
    await (0, worker_pool_1.executeInWorkerPool)(workerScriptPath, ids);
}
(0, job_1.job)("Crawler Job", async () => {
    await query("systems", "query_system.ts");
    await query("entities", "query_entity.ts");
    await query("assets", "query_asset.ts");
});
//# sourceMappingURL=job.js.map