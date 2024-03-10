"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../constants");
const files_1 = require("../utils/files");
const job_1 = require("../utils/job");
const worker_pool_1 = require("../utils/worker_pool");
const resources_1 = require("./resources");
const assets_1 = require("./resources/assets");
const entities_1 = require("./resources/entities");
const graphs_1 = require("./resources/graphs");
const systems_1 = require("./resources/systems");
const ids_1 = require("./utils/ids");
const WORKERS_PATH = "src/api/workers";
async function generateOasSchema() {
    resources_1.INDEX_RESOURCES.extend(entities_1.ENTITY_RESOURCES, systems_1.SYSTEM_RESOURCES, assets_1.ASSET_RESOURCES, graphs_1.GRAPH_RESOURCES);
    const oasSchema = lodash_1.default.pick(resources_1.INDEX_RESOURCES.spec, [
        "openapi",
        "info",
        "servers",
        "paths",
        "components",
        "tags",
    ]);
    await (0, files_1.writeJson)(node_path_1.default.join(constants_1.PATHS.api, constants_1.FILES.json.openapi), oasSchema);
    return oasSchema;
}
async function generate404() {
    const json = {
        error: {
            code: "404",
            message: "Not Found",
            description: "The requested resource could not be found.",
        },
    };
    await (0, files_1.writeJson)(node_path_1.default.join(constants_1.PATHS.api, constants_1.PATHS.notFound, constants_1.FILES.json.index), json);
}
(0, job_1.job)("API Job", async () => {
    const [assetIds, entityIds, systemIds] = await Promise.all([
        (0, ids_1.getAssetIds)(),
        (0, ids_1.getEntityIds)(),
        (0, ids_1.getSystemIds)(),
    ]);
    // TODO this could already be done during data collection, not requiring a post-processing step
    // TODO define with depends on definitions as a DAG and then automatically group into consecutive execution steps
    // Two types of workers:
    // 1. parameter forwarded to worker
    // 2. parameter spread to worker pool
    // Unify everything and implement DAG based worker pool execution -> execute everything in a single pool?
    // Per parameter dependency e.g. depending on supply of an asset being precompiled
    // Could be done with local mapping done here and dynamic dependsOn definitions
    await Promise.all([
        (0, worker_pool_1.executeInWorker)(node_path_1.default.resolve(WORKERS_PATH, "precompile_relations.ts"), assetIds),
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "precompile_supply.ts"), assetIds),
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "precompile_underlying_assets.ts"), assetIds),
    ]);
    await Promise.all([
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "precompile_market_cap.ts"), assetIds), // Depends on "precompile_supply.ts"
    ]);
    await Promise.all([
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "precompile_system_total_value_locked.ts"), systemIds),
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "precompile_entities_total_value_locked.ts"), entityIds),
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "precompile_collateralization_ratio.ts"), assetIds), // Depends on "precompile_underlying_assets.ts" and "precompile_market_cap.ts"
    ]);
    await Promise.all([
        (0, worker_pool_1.executeInWorker)(node_path_1.default.resolve(WORKERS_PATH, "precompile_collateralization_graph.ts"), assetIds), // Depends on "precompile_collateralization_ratio.ts"
    ]);
    await Promise.all([
        resources_1.INDEX_RESOURCES.index(),
        assets_1.ASSET_RESOURCES.index(assetIds),
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "compile_asset.ts"), assetIds),
        entities_1.ENTITY_RESOURCES.index(entityIds),
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "compile_entity.ts"), entityIds),
        systems_1.SYSTEM_RESOURCES.index(systemIds),
        (0, worker_pool_1.executeInWorkerPool)(node_path_1.default.resolve(WORKERS_PATH, "compile_system.ts"), systemIds),
        graphs_1.GRAPH_RESOURCES.index(),
        (0, worker_pool_1.executeInWorker)(node_path_1.default.resolve(WORKERS_PATH, "compile_graph.ts")),
        generateOasSchema(),
        generate404(),
    ]);
});
//# sourceMappingURL=job.js.map