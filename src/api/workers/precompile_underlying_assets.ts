import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import _ from "lodash";
import path from "path";
import { ConsecutiveLookup, readCSV, writeToCsv } from "../../utils/csv";
import { remove } from "../../utils/files";
import { round } from "../../utils/math";

async function lookupUnderlyingPrice(
    timestamp: string,
    amount: number,
    lookup: ConsecutiveLookup<bcked.asset.Price>,
    window: number = hoursToMilliseconds(12)
): Promise<bcked.asset.Relationship> {
    const price = await lookup.getClosest(timestamp, window);
    if (!price) return { amount };

    return {
        amount,
        price: price,
        usd: round(price.usd * amount, 2),
    };
}

async function* match(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<bcked.asset.Relationships> {
    const backingCsv = path.join(PATHS.assets, id, "records", "backing.csv");

    if (!existsSync(backingCsv)) return;

    const backingEntries = readCSV<bcked.asset.Backing>(backingCsv);

    let priceLookup:
        | { assetId: bcked.asset.Id; lookup: ConsecutiveLookup<bcked.asset.Price> }[]
        | undefined = undefined;

    for await (const backingEntry of backingEntries) {
        // Initialize price lookup if not yet done
        if (priceLookup === undefined) {
            priceLookup = [];
            for (const underlyingAssetId of Object.keys(backingEntry.underlying)) {
                const priceCsv = path.join(PATHS.assets, underlyingAssetId, "records", "price.csv");

                if (!existsSync(priceCsv)) continue;

                priceLookup.push({
                    assetId: underlyingAssetId as bcked.asset.Id,
                    lookup: new ConsecutiveLookup<bcked.asset.Price>(priceCsv),
                });
            }
        }

        // Get closest prices to the current entry for all underlying assets
        const underlying = Object.fromEntries(
            await Promise.all(
                priceLookup.map(async ({ assetId, lookup }) => [
                    assetId,
                    await lookupUnderlyingPrice(
                        backingEntry.timestamp,
                        backingEntry.underlying[assetId]!,
                        lookup,
                        window
                    ),
                ])
            )
        );

        yield {
            timestamp: backingEntry.timestamp,
            breakdown: underlying,
            usd: round(_.sumBy(Object.values(underlying), "usd"), 2),
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling prices of underlying assets for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, "records", "underlying_assets.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await remove(filePath);

        const entries = match(id);
        await writeToCsv(filePath, entries, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
