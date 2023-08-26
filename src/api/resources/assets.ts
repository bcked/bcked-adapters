import { readdir } from "fs/promises";
import path from "path";
import { readJson } from "../../utils/files";
import { JsonResources } from "../utils/resources";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = new JsonResources();

RESOURCES.register({
    path: "/assets.json",
    summary: "Retrieve a list of assets",
    description: "Get a list of asset IDs and references",
    type: "Assets",
    // TODO write schema
    schema: {},
    loader: async () => {
        const assetIds = await readdir(ASSETS_PATH);

        const resource = {
            $id: "/assets.json",
            assets: assetIds.map((id) => ({
                $ref: `/assets/${id}.json`,
            })),
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}.json",
    summary: "Get an asset",
    description: "Get an asset by its ID",
    type: "Asset",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const recordsPath = path.join(ASSETS_PATH, id, RECORDS);
        const resource = {
            $id: `/assets/${id}.json`,
            details: {
                $ref: `/assets/${id}/details.json`,
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
RESOURCES.register({
    path: "/assets/{id}/details.json",
    summary: "Get details of an asset",
    description: "Get details of an asset by its ID",
    type: "AssetDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        const details = await readJson<bcked.asset.Details>(filePath);

        const resource = {
            $id: `/assets/${id}/details.json`,
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
