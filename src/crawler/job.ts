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

    // Query everything even if some items fail, so all available data is recorded.
    const results = [];
    results.push(
        await executeInWorkerPool(path.resolve(WORKERS_PATH, "query_system.ts"), systemIds).then(
            () => null,
            (error: unknown) => error
        )
    );
    results.push(
        await executeInWorkerPool(path.resolve(WORKERS_PATH, "query_entity.ts"), entityIds).then(
            () => null,
            (error: unknown) => error
        )
    );
    results.push(
        await executeInWorkerPool(path.resolve(WORKERS_PATH, "query_asset.ts"), assetIds).then(
            () => null,
            (error: unknown) => error
        )
    );

    const errors = results.filter((error) => error !== null);
    if (errors.length) throw new AggregateError(errors, "Crawler finished with failures");
});
