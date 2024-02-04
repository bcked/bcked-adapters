import { JsonResources } from "../utils/resources";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
    name: "Assets Market Capitalization",
    description: "Everything about asset market capitalization",
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
    path: "/assets/{id}/mcap",
    summary: "Get mcap of an asset",
    description: "Get mcap of an asset by its ID",
    type: "AssetMcap",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/mcap`,
            latest: {
                $ref: `/assets/${id}/mcap/latest`,
            },
            allTime: {
                $ref: `/assets/${id}/mcap/history`,
            },
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/mcap/latest",
    summary: "Get mcap of an asset",
    description: "Get mcap of an asset by its ID",
    type: "AssetMcap",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/mcap/latest`,
            $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/mcap/history",
    summary: "Get mcap of an asset",
    description: "Get mcap of an asset by its ID",
    type: "AssetMcap",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/mcap/history`,
            high: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/mcap/{year}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/mcap/{year}",
    summary: "Get mcap of an asset",
    description: "Get mcap of an asset by its ID",
    type: "AssetMcap",
    // TODO write schema
    schema: {},
    loader: async ({ id, year }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/mcap/${year}`,
            high: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/mcap/{year}/{month}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/mcap/{year}/{month}",
    summary: "Get mcap of an asset",
    description: "Get mcap of an asset by its ID",
    type: "AssetMcap",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/mcap/${year}/${month}`,
            high: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/mcap/{year}/{month}/{day}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/mcap/{year}/{month}/{day}",
    summary: "Get mcap of an asset",
    description: "Get mcap of an asset by its ID",
    type: "AssetMcap",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/mcap/${year}/${month}/${day}`,
            high: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            median: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            low: {
                $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
            },
            data: [
                {
                    $ref: `/assets/${id}/mcap/{year}/{month}/{day}/{hour}`,
                },
            ],
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/mcap/{year}/{month}/{day}/{hour}",
    summary: "Get mcap of an asset",
    description: "Get mcap of an asset by its ID",
    type: "AssetMcap",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day, hour }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/mcap/${year}/${month}/${day}/${hour}`,
            timestamp: "ISO Timestamp",
            price: {
                $ref: `/assets/{id}/price/{year}/{month}/{day}/{hour}`,
            },
            supply: {
                $ref: `/assets/{id}/supply/{year}/{month}/{day}/{hour}`,
            },
            value: {
                "rwa:USD": "{value}",
            },
        };

        return resource;
    },
});
