import _ from "lodash";
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "../paths";
import { writeJson } from "../utils/files";
import { job } from "../utils/job";
import { executeInWorkerPool } from "../utils/worker_pool";
import { INDEX_RESOURCES } from "./resources";
import { ASSET_RESOURCES } from "./resources/assets";
import { ENTITY_RESOURCES } from "./resources/entities";
import { SYSTEM_RESOURCES } from "./resources/systems";
import { JsonResources } from "./utils/resources";

const WORKERS_PATH = "src/api2/workers";

async function compile<Result>(
    dir: string,
    workerScript: string,
    resources: JsonResources | undefined = undefined
): Promise<Array<Result | null>> {
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
    writeJson(`${PATHS.api}/openapi.json`, oasSchema);
    return oasSchema;
}

job("API Job", async () => {
    // TODO this could already be done during data collection, not requiring a post-processing step
    await Promise.all([compile(PATHS.assets, "precompile_supply.ts")]);

    await Promise.all([
        compile(PATHS.assets, "precompile_market_cap.ts"),
        compile(PATHS.assets, "precompile_underlying_assets.ts"),
    ]);

    await Promise.all([
        INDEX_RESOURCES.index(),
        compile(PATHS.entities, "compile_entity.ts", ENTITY_RESOURCES),
        compile(PATHS.systems, "compile_system.ts", SYSTEM_RESOURCES),
        compile(PATHS.assets, "compile_asset.ts", ASSET_RESOURCES),
        generateOasSchema(),
    ]);

    // TODO continue by adding backing json as API resource and to compile_asset using the precomputed data
    // TODO think about derivative assets
    // TODO think about if price and supply is needed as independent resources? Reference or directly include info?
    // TODO delete old api code if no longer needed
    // TODO reduce code redundancy/duplication
    // TODO optimize code to only run for new entries and not for all entries
});
