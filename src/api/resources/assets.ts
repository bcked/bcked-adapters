import { readdir } from "fs/promises";
import path from "path";
import { readJson } from "../../utils/files";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = {
    "/assets.json": assets,
    "/assets/${id}.json": assets_$id,
    "/assets/${id}/details.json": assets_$id_details,
};

/**
 * @openapi
 * /assets.json:
 *   get:
 *     summary: Retrieve a list of assets
 *     description: Get a list of asset IDs and references
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assets'
 */
export async function assets(): Promise<api.Resource> {
    const assetIds = await readdir(ASSETS_PATH);

    const resource = {
        $id: "/assets.json",
        assets: assetIds.map((id) => ({
            $ref: `/assets/${id}.json`,
        })),
    };

    return resource;
}

/**
 * @openapi
 * /assets/{id}.json:
 *   get:
 *     summary: Get an asset
 *     description: Get an asset by its ID
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 */
export async function assets_$id(id: bcked.asset.Id) {
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
}

/**
 *
 * @param id - The ID of the asset.
 * @returns Details of the asset.
 *
 * @openapi
 * /assets/{id}/details.json:
 *   get:
 *     summary: Get details of an asset
 *     description: Get details of an asset by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the asset
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetDetails'
 */
export async function assets_$id_details(id: bcked.asset.Id) {
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
}

export async function assets_id_prices() {}

// for await (const entry of readCSV(`${recordsPath}/supply.csv`)) {
//     console.log(entry);
// }
