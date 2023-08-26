import "dotenv/config";
import path from "node:path";
import swaggerJSDoc from "swagger-jsdoc";
import { REGISTER_INSTANCE } from "ts-node";
import { writeJson } from "../utils/files";
import { WorkerPool } from "../utils/worker_pool";

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
    const options: swaggerJSDoc.OAS3Options = {
        failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
        definition: {
            openapi: "3.1.0",
            info: {
                title: "bcked API",
                summary: "Free API for all data on bcked.com",
                // TODO Multiline description.
                description: "",
                termsOfService: "https://github.com/bcked/bcked-adapters/blob/main/LEGAL_NOTICE.md",
                contact: {
                    name: "API Support",
                    url: "https://github.com/bcked/bcked-adapters/issues",
                    email: "contact@bcked.com",
                },
                license: {
                    name: "GNU General Public License v3.0 only",
                    identifier: "GPL-3.0",
                    url: "https://github.com/bcked/bcked-adapters/blob/main/LICENSE",
                },
                // TODO maybe use the current commit hash here
                version: "1.0.0",
            },
        },
        apis: ["src/api/resources/*.ts"],
    };

    const spec = swaggerJSDoc(options);
    writeJson("api/openapi.json", spec);
}

async function job() {
    if (process[REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }

    await jsonifyRefs("/assets.json");

    await generateOasSchema();
}

job();
