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
async function jsonifyRefs(seedUri) {
    const workerScriptPath = node_path_1.default.resolve("src/api/workers/jsonify_refs.ts");
    const pool = new worker_pool_1.WorkerPool(workerScriptPath, { min: 0, max: 4 });
    let queue = [seedUri];
    while (queue.length > 0) {
        const res = await pool.execute(queue.shift());
        queue = queue.concat(res);
    }
    await pool.close();
}
async function generateOasSchema() {
    const spec = lodash_1.default.omit(resources_1.RESOURCES.spec, "loaders");
    (0, files_1.writeJson)("api/openapi.json", lodash_1.default.pick(spec, ["openapi", "info", "paths", "components", "tags"]));
}
async function job() {
    if (process[ts_node_1.REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }
    await jsonifyRefs("/assets.json");
    await generateOasSchema();
}
job();
//# sourceMappingURL=job.js.map