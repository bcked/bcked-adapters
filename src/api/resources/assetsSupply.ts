import { JsonResources } from "../utils/resources";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
    name: "Assets Supply",
    description: "Everything about asset supply",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/assets",
    },
});

// for await (const entry of readCSV(`${recordsPath}/supply.csv`)) {
//     console.log(entry);
// }

// parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The ID of the asset
RESOURCES.register({
    path: "/assets/{id}/supply",
    summary: "Get supply of an asset",
    description: "Get supply of an asset by its ID",
    type: "AssetSupply",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/supply`,
            latest: {
                $ref: `/assets/${id}/supply/latest`,
            },
            allTime: {
                $ref: `/assets/${id}/supply/all-time`,
            },
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/supply/latest",
    summary: "Get supply of an asset",
    description: "Get supply of an asset by its ID",
    type: "AssetSupply",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/supply/latest`,
            $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/supply/all-time",
    summary: "Get supply of an asset",
    description: "Get supply of an asset by its ID",
    type: "AssetSupply",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/supply/all-time`,
            high: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/supply/{year}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/supply/{year}",
    summary: "Get supply of an asset",
    description: "Get supply of an asset by its ID",
    type: "AssetSupply",
    // TODO write schema
    schema: {},
    loader: async ({ id, year }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/supply/${year}`,
            high: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/supply/{year}/{month}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/supply/{year}/{month}",
    summary: "Get supply of an asset",
    description: "Get supply of an asset by its ID",
    type: "AssetSupply",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/supply/${year}/${month}`,
            high: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/supply/{year}/{month}/{day}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/supply/{year}/{month}/{day}",
    summary: "Get supply of an asset",
    description: "Get supply of an asset by its ID",
    type: "AssetSupply",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/supply/${year}/${month}/${day}`,
            high: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/supply/{year}/{month}/{day}/{hour}",
    summary: "Get supply of an asset",
    description: "Get supply of an asset by its ID",
    type: "AssetSupply",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day, hour }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/supply/${year}/${month}/${day}/${hour}`,
            timestamp: "ISO Timestamp",
            count: "{count}",
        };

        return resource;
    },
});
