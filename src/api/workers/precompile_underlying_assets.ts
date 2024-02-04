import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import _ from "lodash";
import path from "path";
import { readCSV, writeToCsv } from "../../utils/csv";
import { ConsecutivePriceLookup } from "../utils/priceLookup";

const ASSETS_PATH = "assets";

async function lookupUnderlyingPrice(
    timestamp: string,
    amount: number,
    lookup: ConsecutivePriceLookup,
    window: number = hoursToMilliseconds(12)
): Promise<bcked.asset.Relationship> {
    const price = await lookup.getClosest(timestamp, window);
    if (!price) return { amount };

    return {
        amount,
        price: price,
        usd: price.usd * amount,
    };
}

async function* matchBackingPrices(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<bcked.asset.Relationships> {
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
            breakdown: underlying,
            usd: _.sumBy(Object.values(underlying), "usd"),
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling prices of underlying assets for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, "records", "underlying_assets.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await unlink(filePath).catch(() => {});

        const backingPrices = matchBackingPrices(id);
        await writeToCsv(filePath, backingPrices, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
