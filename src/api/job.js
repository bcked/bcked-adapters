"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const paths_1 = require("../paths");
const files_1 = require("../utils/files");
const job_1 = require("../utils/job");
const worker_pool_1 = require("../utils/worker_pool");
const resources_1 = require("./resources");
const assets_1 = require("./resources/assets");
const entities_1 = require("./resources/entities");
const systems_1 = require("./resources/systems");
const WORKERS_PATH = "src/api/workers";
async function compile(dir, workerScript, resources = undefined) {
    const ids = await promises_1.default.readdir(dir);
    if (resources) {
        await resources.index(ids);
    }
    const workerScriptPath = node_path_1.default.resolve(WORKERS_PATH, workerScript);
    return (0, worker_pool_1.executeInWorkerPool)(workerScriptPath, ids);
}
async function generateOasSchema() {
    resources_1.INDEX_RESOURCES.extend(entities_1.ENTITY_RESOURCES, systems_1.SYSTEM_RESOURCES, assets_1.ASSET_RESOURCES);
    const oasSchema = lodash_1.default.pick(resources_1.INDEX_RESOURCES.spec, [
        "openapi",
        "info",
        "servers",
        "paths",
        "components",
        "tags",
    ]);
    await (0, files_1.writeJson)(`${paths_1.PATHS.api}/openapi.json`, oasSchema);
    return oasSchema;
}
async function generate404() {
    await (0, files_1.writeJson)(`${paths_1.PATHS.api}/404/index.json`, {
        error: {
            code: "404",
            message: "Not Found",
            description: "The requested resource could not be found.",
        },
    });
}
(0, job_1.job)("API Job", async () => {
    // TODO this could already be done during data collection, not requiring a post-processing step
    await Promise.all([compile(paths_1.PATHS.assets, "precompile_supply.ts")]);
    await Promise.all([
        compile(paths_1.PATHS.assets, "precompile_market_cap.ts"),
        compile(paths_1.PATHS.assets, "precompile_underlying_assets.ts"),
    ]);
    await Promise.all([compile(paths_1.PATHS.assets, "precompile_collateralization_ratio.ts")]);
    await Promise.all([(0, worker_pool_1.executeInWorker)(node_path_1.default.resolve(WORKERS_PATH, "precompile_global_graph.ts"))]);
    await Promise.all([
        resources_1.INDEX_RESOURCES.index(),
        compile(paths_1.PATHS.entities, "compile_entity.ts", entities_1.ENTITY_RESOURCES),
        compile(paths_1.PATHS.systems, "compile_system.ts", systems_1.SYSTEM_RESOURCES),
        compile(paths_1.PATHS.assets, "compile_asset.ts", assets_1.ASSET_RESOURCES),
        generateOasSchema(),
        generate404(),
    ]);
});
//# sourceMappingURL=job.js.map