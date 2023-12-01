import { JsonResources } from "../utils/resources";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
    name: "Assets Backing",
    description: "Everything about asset backing",
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
    path: "/assets/{id}/backing",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing`,
            latest: {
                $ref: `/assets/${id}/backing/latest`,
            },
            allTime: {
                $ref: `/assets/${id}/backing/all-time`,
            },
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/backing/latest",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing/latest`,
            $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/backing/all-time",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing/all-time`,
            high: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/backing/{year}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/backing/{year}",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id, year }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing/${year}`,
            high: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/backing/{year}/{month}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/backing/{year}/{month}",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing/${year}/${month}`,
            high: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/backing/{year}/{month}/{day}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/backing/{year}/{month}/{day}",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing/${year}/${month}/${day}`,
            high: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/backing/{year}/{month}/{day}/{hour}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/backing/{year}/{month}/{day}/{hour}",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day, hour }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing/${year}/${month}/${day}/${hour}`,
            timestamp: "ISO Timestamp",
            price: {
                $ref: `/assets/{id}/price/{year}/{month}/{day}/{hour}`,
            },
            supply: {
                $ref: `/assets/{id}/supply/{year}/{month}/{day}/{hour}`,
            },
            // TODO what about the graph?
            // TODO How to handle non-matching timepoints within the backing tree?
            underlying: {
                total: {
                    "rwa:USD": "{value}",
                },
                breakdown: [
                    {
                        asset: {
                            $ref: `/assets/{id}`,
                        },
                        amount: "{count}",
                        value: {
                            "rwa:USD": "{value}",
                        },
                    },
                ],
            },
            // TODO what about derivatives?
        };

        return resource;
    },
});
