import "dotenv/config";
import _ from "lodash";
import path from "node:path";
import { REGISTER_INSTANCE } from "ts-node";
import { writeJson } from "../utils/files";
import { WorkerPool } from "../utils/worker_pool";
import { RESOURCES } from "./resources";

async function jsonifyRefs(seedUri: string) {
    const workerScriptPath = path.resolve("src/api/workers/jsonify_refs.ts");
    const pool = new WorkerPool(workerScriptPath, { min: 0, max: 4 });

    let queue = [seedUri];
    while (queue.length > 0) {
        const res = await pool.execute<string[]>(queue.shift()!);
        queue = queue.concat(res!);
    }
    await pool.close();
}

async function generateOasSchema() {
    const spec = _.omit(RESOURCES.spec, "loaders");
    writeJson("api/openapi.json", _.pick(spec, ["openapi", "info", "paths", "components", "tags"]));
}

async function job() {
    if (process[REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }

    await jsonifyRefs("/assets.json");

    await generateOasSchema();
}

job();
