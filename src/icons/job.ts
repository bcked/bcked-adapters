import "dotenv/config";
import glob from "glob";
import path from "node:path";
import { REGISTER_INSTANCE } from "ts-node";
import { WorkerPool } from "../utils/worker_pool";

async function job() {
    if (process[REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }

    const workerScriptPath = path.resolve("src/icons/workers/process_icons.ts");
    const pool = new WorkerPool(workerScriptPath, { min: 0, max: 4 });

    const icons = glob.sync("{assets,systems,entities}/**/icon.svg");
    for (const icon of icons) {
        await pool.execute(icon);
    }

    await pool.close();
}

job();
