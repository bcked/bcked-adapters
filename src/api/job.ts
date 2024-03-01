import _ from "lodash";
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "../paths";
import { writeJson } from "../utils/files";
import { job } from "../utils/job";
import { executeInWorker, executeInWorkerPool } from "../utils/worker_pool";
import { INDEX_RESOURCES } from "./resources";
import { ASSET_RESOURCES } from "./resources/assets";
import { ENTITY_RESOURCES } from "./resources/entities";
import { SYSTEM_RESOURCES } from "./resources/systems";
import { JsonResources } from "./utils/resources";

const WORKERS_PATH = "src/api/workers";

async function compile<Result>(
    dir: string,
    workerScript: string,
    resources: JsonResources | undefined = undefined
): Promise<(Result | null)[]> {
    const ids = await fs.readdir(dir);

    if (resources) {
        await resources.index(ids);
    }

    const workerScriptPath = path.resolve(WORKERS_PATH, workerScript);
    return executeInWorkerPool<string, Result>(workerScriptPath, ids);
}

async function generateOasSchema() {
    INDEX_RESOURCES.extend(ENTITY_RESOURCES, SYSTEM_RESOURCES, ASSET_RESOURCES);
    const oasSchema = _.pick(INDEX_RESOURCES.spec, [
        "openapi",
        "info",
        "servers",
        "paths",
        "components",
        "tags",
    ]);
    await writeJson(`${PATHS.api}/openapi.json`, oasSchema);
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
    await writeJson(`${PATHS.api}/404/index.json`, json);
}

job("API Job", async () => {
    // TODO this could already be done during data collection, not requiring a post-processing step
    await Promise.all([compile(PATHS.assets, "precompile_supply.ts")]);

    await Promise.all([
        compile(PATHS.assets, "precompile_market_cap.ts"),
        compile(PATHS.assets, "precompile_underlying_assets.ts"),
    ]);

    await Promise.all([compile(PATHS.assets, "precompile_collateralization_ratio.ts")]);

    await Promise.all([
        executeInWorker(path.resolve(WORKERS_PATH, "precompile_collateralization_graph.ts")),
    ]);

    await Promise.all([
        INDEX_RESOURCES.index(),
        compile(PATHS.entities, "compile_entity.ts", ENTITY_RESOURCES),
        compile(PATHS.systems, "compile_system.ts", SYSTEM_RESOURCES),
        compile(PATHS.assets, "compile_asset.ts", ASSET_RESOURCES),
        executeInWorker(path.resolve(WORKERS_PATH, "compile_graph.ts")),
        generateOasSchema(),
        generate404(),
    ]);
});
