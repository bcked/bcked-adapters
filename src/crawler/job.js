"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const ts_node_1 = require("ts-node");
const worker_pool_1 = require("../utils/worker_pool");
async function query(dir, workerScript) {
    const workerScriptPath = node_path_1.default.resolve("src/crawler/workers", workerScript);
    const ids = await promises_1.default.readdir(dir);
    const pool = new worker_pool_1.WorkerPool(workerScriptPath, { min: 0, max: 4 });
    const res = await Promise.all(ids.map((id) => pool.execute(id)));
    await pool.close();
    return res;
}
async function job() {
    if (process[ts_node_1.REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }
    await query("systems", "query_system.ts");
    await query("entities", "query_entity.ts");
    await query("assets", "query_asset.ts");
}
job();
//# sourceMappingURL=job.js.map