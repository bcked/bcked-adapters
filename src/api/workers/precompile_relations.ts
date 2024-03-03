import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { readdir } from "fs/promises";
import _, { type PropertyPath } from "lodash";
import { join } from "path";
import { fromAsync } from "../../utils/array";
import { readJson, writeJson } from "../../utils/files";
import { toId } from "../../utils/helper";

async function* loadAssetDetails(): AsyncIterableIterator<bcked.asset.Details | null> {
    const assetIds = (await readdir(PATHS.assets)) as bcked.asset.Id[];

    for (const assetId of assetIds) {
        const detailsJson = join(PATHS.assets, assetId, PATHS.records, "details.json");
        yield await readJson(detailsJson);
    }
}

async function storeGrouping(
    assetDetails: bcked.asset.Details[],
    groupBy: PropertyPath,
    path: string
): Promise<void> {
    const groupedAssets = _.groupBy(assetDetails, groupBy);
    for (const key in groupedAssets) {
        if (key == "undefined" || !groupedAssets[key]!.length) {
            continue;
        }

        const assetIds = groupedAssets[key]!.map((asset) =>
            toId((asset as bcked.asset.Details).identifier)
        );
        const jsonFilePath = join(path, key, PATHS.records, "assets.json");
        await writeJson(jsonFilePath, { ids: assetIds });
    }
}

parentPort?.on("message", async () => {
    const step = `Precompiling Relations`;
    console.log(step);

    try {
        const assetDetails = _.compact(await fromAsync(loadAssetDetails()));

        await storeGrouping(assetDetails, "identifier.system", PATHS.systems);
        await storeGrouping(assetDetails, "linkedEntities.issuer", PATHS.entities);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(step, error);
        await sendErrorReport(step, error);
        parentPort?.postMessage(null);
    }
});
