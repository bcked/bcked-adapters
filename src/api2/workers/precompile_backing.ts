import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import path from "path";
import { readCSV, writeToCsv } from "../../utils/csv";
import { distance, isNewer } from "../../utils/time";

const ASSETS_PATH = "assets";

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

    if (!existsSync(backingCsv)) return;

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

parentPort?.on("message", async (id: bcked.asset.Id) => {
    try {
        console.log(`Precompiling backing prices for asset ${id}`);
        const backingPrices = matchBackingPrices(id);
        await writeToCsv(
            path.join(PATHS.assets, id, "records", "backing_value.csv"),
            backingPrices,
            "timestamp"
        );

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
