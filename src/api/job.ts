import "dotenv/config";
import path from "node:path";
import { REGISTER_INSTANCE } from "ts-node";
import { WorkerPool } from "../utils/worker_pool";

async function run(seedUri: string, workerScript: string) {
    const workerScriptPath = path.resolve("src/api/workers", workerScript);
    const pool = new WorkerPool(workerScriptPath, { min: 0, max: 4 });

    let queue = [seedUri];
    while (queue.length > 0) {
        const res = await pool.execute<string[]>(queue.shift()!);
        queue = queue.concat(res!);
    }
    await pool.close();
}

async function job() {
    if (process[REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }

    await run("/assets.json", "jsonify_refs.ts");
}

job();
