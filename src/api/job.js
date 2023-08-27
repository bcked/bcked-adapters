"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const lodash_1 = __importDefault(require("lodash"));
const node_path_1 = __importDefault(require("node:path"));
const ts_node_1 = require("ts-node");
const files_1 = require("../utils/files");
const worker_pool_1 = require("../utils/worker_pool");
const resources_1 = require("./resources");
const queue_1 = require("./utils/queue");
async function jsonifyRefs(seedUri) {
    const workerScriptPath = node_path_1.default.resolve("src/api/workers/jsonify_refs.ts");
    const pool = new worker_pool_1.WorkerPool(workerScriptPath, { min: 0, max: 4 });
    const queue = new queue_1.UniqueQueue();
    queue.add(seedUri);
    for (const item of queue.items) {
        const res = await pool.execute(item);
        queue.add(...res);
    }
    await pool.close();
}
async function generateOasSchema() {
    const spec = lodash_1.default.omit(resources_1.RESOURCES.spec, "loaders");
    (0, files_1.writeJson)("api/openapi.json", lodash_1.default.pick(spec, ["openapi", "info", "servers", "paths", "components", "tags"]));
}
async function job() {
    if (process[ts_node_1.REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }
    await jsonifyRefs("/");
    await generateOasSchema();
}
job();
//# sourceMappingURL=job.js.map