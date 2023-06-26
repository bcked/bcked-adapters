import "dotenv/config";
import * as _ from "lodash";
import * as fs from "node:fs/promises";
import { fromId, getBackingCsvPath, getPriceCsvPath, getSupplyCsvPath, toId } from "./utils/helper";
import { runWorker } from "./utils/primitive/ts_worker";

async function queryAsset(assetId: bcked.asset.Id) {
    const identifier = fromId(assetId);

    const data = await runWorker<bcked.Asset>("workers/execute_load.ts", {
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

    if (data == null) throw new Error(`No result from worker for ${assetId}.`);

    if (!_.isEqual(data.details.identifier, identifier))
        throw new Error(
            `Directory name ${assetId} doesn't match identifier ${toId(
                data.details.identifier
            )} in asset details.`
        );

    await runWorker("workers/store_to_csv.ts", {
        workerData: {
            data: {
                price: data.price,
                supply: data.supply,
                backing: data.backing,
            },
            to: {
                price: getPriceCsvPath(identifier),
                supply: getSupplyCsvPath(identifier),
                backing: getBackingCsvPath(identifier),
            },
        },
    });
}

async function job() {
    const assets = (await fs.readdir("assets")) as bcked.asset.Id[];
    await Promise.all(assets.map(queryAsset));
}

job().catch((err) => console.error(err));
