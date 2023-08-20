import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { REGISTER_INSTANCE } from "ts-node";
import { WorkerPool } from "../utils/worker_pool";

async function query(dir: string, workerScript: string) {
    const workerScriptPath = path.resolve("src/crawler/workers", workerScript);
    const ids = await fs.readdir(dir);
    const pool = new WorkerPool(workerScriptPath, { min: 0, max: 4 });
    const res = await Promise.all(ids.map((id) => pool.execute(id)));
    await pool.close();
    return res;
}

async function job() {
    if (process[REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }

    await query("systems", "query_system.ts");
    await query("entities", "query_entity.ts");
    await query("assets", "query_asset.ts");
}

job();
