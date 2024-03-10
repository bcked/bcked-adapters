import path from "node:path";
import { getAssetIds, getEntityIds, getSystemIds } from "../api/utils/ids";
import { job } from "../utils/job";
import { executeInWorkerPool } from "../utils/worker_pool";

const WORKERS_PATH = "src/crawler/workers";

job("Crawler Job", async () => {
    const [assetIds, entityIds, systemIds] = await Promise.all([
        getAssetIds(),
        getEntityIds(),
        getSystemIds(),
    ]);

    await executeInWorkerPool(path.resolve(WORKERS_PATH, "query_system.ts"), systemIds);
    await executeInWorkerPool(path.resolve(WORKERS_PATH, "query_entity.ts"), entityIds);
    await executeInWorkerPool(path.resolve(WORKERS_PATH, "query_asset.ts"), assetIds);
});
