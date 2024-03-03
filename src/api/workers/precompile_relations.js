"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const bot_1 = require("../../watcher/bot");
const promises_1 = require("fs/promises");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = require("path");
const array_1 = require("../../utils/array");
const files_1 = require("../../utils/files");
const helper_1 = require("../../utils/helper");
async function* loadAssetDetails() {
    const assetIds = (await (0, promises_1.readdir)(paths_1.PATHS.assets));
    for (const assetId of assetIds) {
        const detailsJson = (0, path_1.join)(paths_1.PATHS.assets, assetId, paths_1.PATHS.records, "details.json");
        yield await (0, files_1.readJson)(detailsJson);
    }
}
async function storeGrouping(assetDetails, groupBy, path) {
    const groupedAssets = lodash_1.default.groupBy(assetDetails, groupBy);
    for (const key in groupedAssets) {
        if (key == "undefined" || !groupedAssets[key].length) {
            continue;
        }
        const assetIds = groupedAssets[key].map((asset) => (0, helper_1.toId)(asset.identifier));
        const jsonFilePath = (0, path_1.join)(path, key, paths_1.PATHS.records, "assets.json");
        await (0, files_1.writeJson)(jsonFilePath, { ids: assetIds });
    }
}
worker_threads_1.parentPort?.on("message", async () => {
    const step = `Precompiling Relations`;
    console.log(step);
    try {
        const assetDetails = lodash_1.default.compact(await (0, array_1.fromAsync)(loadAssetDetails()));
        await storeGrouping(assetDetails, "identifier.system", paths_1.PATHS.systems);
        await storeGrouping(assetDetails, "linkedEntities.issuer", paths_1.PATHS.entities);
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(step, error);
        await (0, bot_1.sendErrorReport)(step, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=precompile_relations.js.map