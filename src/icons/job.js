"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const glob_1 = __importDefault(require("glob"));
const node_path_1 = __importDefault(require("node:path"));
const ts_node_1 = require("ts-node");
const worker_pool_1 = require("../utils/worker_pool");
async function job() {
    if (process[ts_node_1.REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }
    const workerScriptPath = node_path_1.default.resolve("src/icons/workers/process_icons.ts");
    const pool = new worker_pool_1.WorkerPool(workerScriptPath, { min: 0, max: 4 });
    const icons = glob_1.default.sync("{assets,systems,entities}/**/icon.svg");
    for (const icon of icons) {
        await pool.execute(icon);
    }
    await pool.close();
}
job();
//# sourceMappingURL=job.js.map