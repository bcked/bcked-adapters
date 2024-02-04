import { hoursToMilliseconds } from "date-fns";
import path from "path";
import { fromAsync } from "../../utils/array";
import { readCSV } from "../../utils/csv";
import { distance, isNewer } from "../../utils/time";
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

class ConsecutivePriceLookup {
    private readonly prices: Map<string, bcked.asset.Price> = new Map();
    private readonly csvStream: AsyncGenerator<bcked.asset.Price>;
    private done: boolean = false;
    private lastTimestamp: string | undefined = undefined;

    constructor(public readonly assetId: bcked.asset.Id) {
        const csvPath = path.join(ASSETS_PATH, assetId, "records", "price.csv");
        this.csvStream = readCSV<bcked.asset.Price>(csvPath);
    }

    public async getClosest(
        timestamp: string,
        window: number = hoursToMilliseconds(12)
    ): Promise<bcked.asset.Price | undefined> {
        // Read new prices from csvStream and store them in the prices map
        while (
            !this.done && // Stop if the csvStream is done
            (!this.lastTimestamp || !isNewer(timestamp, this.lastTimestamp, window)) // Read ahead the specified time window
        ) {
            const { value: price, done } = await this.csvStream.next();
            this.done = done!;

            if (!price) break;

            this.prices.set(price.timestamp, price);

            this.lastTimestamp = price.timestamp;
        }

        // Find the best match in the prices cache
        let bestMatch: bcked.asset.Price | undefined;
        let bestDistance: number | undefined;
        for (const price of this.prices.values()) {
            // Ignore and delete entries older than time window
            if (isNewer(price.timestamp, timestamp, window)) {
                this.prices.delete(price.timestamp);
                continue;
            }

            const timeDistance = distance(timestamp, price.timestamp);
            if (!bestDistance || timeDistance < bestDistance) {
                bestMatch = price;
                bestDistance = timeDistance;
            } else {
                break; // Prices are sorted, so we can stop here.
            }
        }

        return bestMatch;
    }
}

type UnderlyingPriceEntry = {
    amount: number;
    price?: {
        usd: number;
    };
    value?: {
        usd: number;
    };
};

type BackingPriceEntry = {
    timestamp: primitive.ISODateTimeString;
    underlying: {
        [underlyingId: bcked.asset.Id]: UnderlyingPriceEntry;
    };
};

async function lookupUnderlyingPrice(
    timestamp: string,
    amount: number,
    lookup: ConsecutivePriceLookup,
    window: number = hoursToMilliseconds(12)
): Promise<UnderlyingPriceEntry> {
    const price = await lookup.getClosest(timestamp, window);
    if (!price) return { amount };

    return {
        amount,
        price: {
            usd: price.usd,
        },
        value: {
            usd: price.usd * amount,
        },
    };
}

async function* matchBackingPrices(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<BackingPriceEntry> {
    const backingCsv = path.join(ASSETS_PATH, id, "records", "backing.csv");
    const backingEntries = readCSV<bcked.asset.Backing>(backingCsv);

    let priceLookup: ConsecutivePriceLookup[] | undefined = undefined;

    for await (const backingEntry of backingEntries) {
        // Initialize price lookup if not yet done
        if (priceLookup === undefined) {
            priceLookup = [];
            for (const underlyingAssetId of Object.keys(backingEntry.underlying)) {
                priceLookup.push(new ConsecutivePriceLookup(underlyingAssetId as bcked.asset.Id));
            }
        }

        // Get closest prices to the current entry for all underlying assets
        const underlying = Object.fromEntries(
            await Promise.all(
                priceLookup.map(async (lookup) => [
                    lookup.assetId,
                    await lookupUnderlyingPrice(
                        backingEntry.timestamp,
                        backingEntry.underlying[lookup.assetId]!,
                        lookup,
                        window
                    ),
                ])
            )
        );

        yield {
            timestamp: backingEntry.timestamp,
            underlying,
        };
    }
}

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
        const name = `matchBackingPrices(${id})`;
        console.time(name);
        const test = await fromAsync(matchBackingPrices(id));
        console.timeEnd(name);

        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing`,
            latest: {
                $ref: `/assets/${id}/backing/latest`,
            },
            allTime: {
                $ref: `/assets/${id}/backing/history`,
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
    path: "/assets/{id}/backing/history",
    summary: "Get backing of an asset",
    description: "Get backing of an asset by its ID",
    type: "AssetBacking",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        // const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        // const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/backing/history`,
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
