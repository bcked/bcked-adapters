import _ from "lodash";
import path from "node:path";
import { FILES, PATHS } from "../constants";
import { writeJson } from "../utils/files";
import { job } from "../utils/job";
import { executeInWorker, executeInWorkerPool } from "../utils/worker_pool";
import { INDEX_RESOURCES } from "./resources";
import { ASSET_RESOURCES } from "./resources/assets";
import { ENTITY_RESOURCES } from "./resources/entities";
import { GRAPH_RESOURCES } from "./resources/graphs";
import { SYSTEM_RESOURCES } from "./resources/systems";
import { getAssetIds, getEntityIds, getSystemIds } from "./utils/ids";

const WORKERS_PATH = "src/api/workers";

async function generateOasSchema() {
    INDEX_RESOURCES.extend(ENTITY_RESOURCES, SYSTEM_RESOURCES, ASSET_RESOURCES, GRAPH_RESOURCES);
    const oasSchema = _.pick(INDEX_RESOURCES.spec, [
        "openapi",
        "info",
        "servers",
        "paths",
        "components",
        "tags",
    ]);
    await writeJson(path.join(PATHS.api, FILES.json.openapi), oasSchema);
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
    await writeJson(path.join(PATHS.api, PATHS.notFound, FILES.json.index), json);
}

job("API Job", async () => {
    const [assetIds, entityIds, systemIds] = await Promise.all([
        getAssetIds(),
        getEntityIds(),
        getSystemIds(),
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
        executeInWorker(path.resolve(WORKERS_PATH, "precompile_relations.ts"), assetIds),
        executeInWorkerPool(path.resolve(WORKERS_PATH, "precompile_supply.ts"), assetIds),
        executeInWorkerPool(
            path.resolve(WORKERS_PATH, "precompile_underlying_assets.ts"),
            assetIds
        ),
    ]);

    await Promise.all([
        executeInWorkerPool(path.resolve(WORKERS_PATH, "precompile_market_cap.ts"), assetIds), // Depends on "precompile_supply.ts"
    ]);

    await Promise.all([
        executeInWorkerPool(
            path.resolve(WORKERS_PATH, "precompile_system_total_value_locked.ts"),
            systemIds
        ), // Depends on "precompile_relations.ts" and "precompile_market_cap.ts"
        executeInWorkerPool(
            path.resolve(WORKERS_PATH, "precompile_entities_total_value_locked.ts"),
            entityIds
        ), // Depends on "precompile_relations.ts" and "precompile_market_cap.ts"
        executeInWorkerPool(
            path.resolve(WORKERS_PATH, "precompile_collateralization_ratio.ts"),
            assetIds
        ), // Depends on "precompile_underlying_assets.ts" and "precompile_market_cap.ts"
    ]);

    await Promise.all([
        executeInWorker(
            path.resolve(WORKERS_PATH, "precompile_collateralization_graph.ts"),
            assetIds
        ), // Depends on "precompile_collateralization_ratio.ts"
    ]);

    await Promise.all([
        INDEX_RESOURCES.index(),
        ASSET_RESOURCES.index(assetIds),
        executeInWorkerPool(path.resolve(WORKERS_PATH, "compile_asset.ts"), assetIds), // Depends on
        ENTITY_RESOURCES.index(entityIds),
        executeInWorkerPool(path.resolve(WORKERS_PATH, "compile_entity.ts"), entityIds), // Depends on
        SYSTEM_RESOURCES.index(systemIds),
        executeInWorkerPool(path.resolve(WORKERS_PATH, "compile_system.ts"), systemIds), // Depends on
        GRAPH_RESOURCES.index(),
        executeInWorker(path.resolve(WORKERS_PATH, "compile_graph.ts")), // Depends on "precompile_collateralization_graph.ts"
        generateOasSchema(),
        generate404(),
    ]);
});
