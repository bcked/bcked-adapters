"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCES = void 0;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const files_1 = require("../../utils/files");
const resources_1 = require("../utils/resources");
const ASSETS_PATH = "assets";
const RECORDS = "records";
exports.RESOURCES = new resources_1.JsonResources();
exports.RESOURCES.register({
    path: "/assets",
    summary: "Retrieve a list of assets",
    description: "Get a list of asset IDs and references",
    type: "Assets",
    // TODO write schema
    schema: {},
    loader: async () => {
        const assetIds = await (0, promises_1.readdir)(ASSETS_PATH);
        const resource = {
            $id: "/assets",
            assets: assetIds.map((id) => ({
                $ref: `/assets/${id}`,
            })),
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/assets/{id}",
    summary: "Get an asset",
    description: "Get an asset by its ID",
    type: "Asset",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const recordsPath = path.join(ASSETS_PATH, id, RECORDS);
        const resource = {
            $id: `/assets/${id}`,
            details: {
                $ref: `/assets/${id}/details`,
            },
            // price: {
            //     $ref: "/assets/{id}/prices/{timestamp}",
            //     timestamp: "ISO Timestamp",
            //     usd: "price in USD",
            // },
            // supply: {
            //     timestamp: "ISO Timestamp",
            //     supply: "count",
            // },
            // backing: {
            //     timestamp: "ISO Timestamp",
            //     assetId: "count",
            // },
        };
        return resource;
    },
});
// parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The ID of the asset
exports.RESOURCES.register({
    path: "/assets/{id}/details",
    summary: "Get details of an asset",
    description: "Get details of an asset by its ID",
    type: "AssetDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path_1.default.join(ASSETS_PATH, id, RECORDS, "details.json");
        const details = await (0, files_1.readJson)(filePath);
        const resource = {
            $id: `/assets/${id}/details`,
            name: details?.name,
            symbol: details?.symbol,
            identifier: {
                address: details?.identifier.address,
                // TODO Map to system ref
                system: details?.identifier.system,
            },
            assetClasses: details?.assetClasses,
            // TODO Map to entity refs
            // TODO make list instead?
            linkedEntities: details?.linkedEntities,
            reference: details?.reference,
            tags: details?.tags,
        };
        return resource;
    },
});
// for await (const entry of readCSV(`${recordsPath}/supply.csv`)) {
//     console.log(entry);
// }
//# sourceMappingURL=assets.js.map