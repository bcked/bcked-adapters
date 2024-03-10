import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";

import _, { type PropertyPath } from "lodash";
import { join } from "path";
import { fromAsync } from "../../utils/array";
import { readJson, writeJson } from "../../utils/files";
import { toId } from "../../utils/helper";

async function* loadAssetDetails(
    assetIds: bcked.asset.Id[]
): AsyncIterableIterator<bcked.asset.Details | null> {
    for (const assetId of assetIds) {
        const detailsJson = join(PATHS.assets, assetId, PATHS.records, FILES.json.details);
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
        const jsonFilePath = join(path, key, PATHS.records, FILES.json.assets);
        await writeJson(jsonFilePath, { ids: assetIds });
    }
}

parentPort?.on("message", async (assetIds: bcked.asset.Id[]) => {
    const step = `Precompiling Relations`;
    console.log(step);

    try {
        const assetDetails = _.compact(await fromAsync(loadAssetDetails(assetIds)));

        await storeGrouping(assetDetails, "identifier.system", PATHS.systems);
        await storeGrouping(assetDetails, "linkedEntities.issuer", PATHS.entities);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(step, error);
        await sendErrorReport(step, error);
        parentPort?.postMessage(null);
    }
});
