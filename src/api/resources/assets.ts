import fs from "fs";
import { readdir } from "fs/promises";
import path from "path";
import { readJson } from "../../utils/files";
import { JsonResources } from "../utils/resources";
import { icons } from "./icons";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
    name: "Assets",
    description: "Everything about assets",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/assets",
    },
});

RESOURCES.register({
    path: "/assets",
    summary: "Retrieve a list of assets",
    description: "Get a list of asset IDs and references",
    type: "Assets",
    // TODO write schema
    schema: {},
    loader: async () => {
        const assetIds = await readdir(ASSETS_PATH);

        const resource = {
            $id: "/assets",
            assets: assetIds.map((id) => ({
                $ref: `/assets/${id}`,
            })),
        };

        return resource;
    },
});

async function preProcess(id: bcked.asset.Id) {
    const recordsPath = path.join(ASSETS_PATH, id, RECORDS);
    const priceCsv = path.join(recordsPath, "price.csv");
    const supplyCsv = path.join(recordsPath, "supply.csv");
    const backingCsv = path.join(recordsPath, "backing.csv");

    // TODO match for backing table in asset dir
    // TODO match for mcap table in asset dir
}

RESOURCES.register({
    path: "/assets/{id}",
    summary: "Get an asset",
    description: "Get an asset by its ID",
    type: "Asset",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        await preProcess(id);
        const recordsPath = path.join(ASSETS_PATH, id, RECORDS);
        const resource = {
            $id: `/assets/${id}`,
            details: {
                $ref: `/assets/${id}/details`,
            },
            icons: {
                $ref: `/assets/${id}/icons`,
            },
            price: fs.existsSync(path.join(recordsPath, "price.csv"))
                ? {
                      $ref: `/assets/${id}/price`,
                  }
                : null,
            // supply: {
            //     $ref: `/assets/{id}/supply`,
            // },
            // mcap: {
            //     $ref: `/assets/{id}/mcap`,
            // },
            // backing: {
            //     $ref: `/assets/${id}/backing`,
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
    path: "/assets/{id}/details",
    summary: "Get details of an asset",
    description: "Get details of an asset by its ID",
    type: "AssetDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        const details = await readJson<bcked.asset.DetailsRecord>(filePath);

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
            listed: details?.listed,
            updated: details?.updated,
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/icons",
    summary: "Get icons of an asset",
    description: "Get icons of an asset by its ID",
    type: "AssetIcons",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => await icons("assets", id),
});

// for await (const entry of readCSV(`${recordsPath}/supply.csv`)) {
//     console.log(entry);
// }
