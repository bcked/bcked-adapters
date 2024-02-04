import fs from "node:fs/promises";
import path from "node:path";
import { job } from "../utils/job";
import { executeInWorkerPool } from "../utils/worker_pool";

const WORKERS_PATH = "src/crawler/workers";

async function query<Result>(dir: string, workerScript: string): Promise<void> {
    const workerScriptPath = path.resolve(WORKERS_PATH, workerScript);
    const ids = await fs.readdir(dir);
    await executeInWorkerPool<string, Result>(workerScriptPath, ids);
}

job("Crawler Job", async () => {
    await query("systems", "query_system.ts");
    await query("entities", "query_entity.ts");
    await query("assets", "query_asset.ts");
});
