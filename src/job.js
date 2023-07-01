"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const _ = require("lodash");
const fs = require("node:fs/promises");
const ts_node_1 = require("ts-node");
const helper_1 = require("./utils/helper");
const ts_worker_1 = require("./utils/primitive/ts_worker");
async function queryAsset(assetId) {
    const identifier = (0, helper_1.fromId)(assetId);
    const data = await (0, ts_worker_1.runWorker)("workers/execute_load.ts", {
        workerData: {
            script: `assets/${assetId}/index.ts`,
            call: {
                details: "getDetails",
                price: "getPrice",
                supply: "getSupply",
                backing: "getBacking",
            },
        },
    });
    if (data == null)
        throw new Error(`No result from worker for ${assetId}.`);
    if (!_.isEqual(data.details.identifier, identifier))
        throw new Error(`Directory name ${assetId} doesn't match identifier ${(0, helper_1.toId)(data.details.identifier)} in asset details.`);
    await (0, ts_worker_1.runWorker)("workers/store_to_csv.ts", {
        workerData: {
            data: {
                price: data.price,
                supply: data.supply,
                backing: data.backing,
            },
            to: {
                price: (0, helper_1.getPriceCsvPath)(identifier),
                supply: (0, helper_1.getSupplyCsvPath)(identifier),
                backing: (0, helper_1.getBackingCsvPath)(identifier),
            },
        },
    });
}
async function job() {
    if (process[ts_node_1.REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }
    const assets = (await fs.readdir("assets"));
    await Promise.all(assets.map(queryAsset));
}
job().catch((err) => console.error(err));
//# sourceMappingURL=job.js.map