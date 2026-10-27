import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import _ from "lodash";
import path from "path";
import { ConsecutiveLookup, readCSV, writeToCsv } from "../../utils/csv";
import { remove } from "../../utils/files";
import { round } from "../../utils/math";

const CONSTANT_PRICE_TIMESTAMP = new Date(0).toISOString();

/**
 * Price source of an underlying asset. Assets with a fixed price (e.g. USD or treasuries at their
 * nominal value) record a single price at 1970-01-01, which applies to every timestamp.
 */
type PriceSource =
    { constant: bcked.asset.Price } | { lookup: ConsecutiveLookup<bcked.asset.Price> };

async function createPriceSource(priceCsv: string): Promise<PriceSource> {
    for await (const first of readCSV<bcked.asset.Price>(priceCsv)) {
        if (first.timestamp === CONSTANT_PRICE_TIMESTAMP) return { constant: first };
        break;
    }
    return { lookup: new ConsecutiveLookup<bcked.asset.Price>(priceCsv) };
}

async function lookupUnderlyingPrice(
    timestamp: string,
    amount: number,
    source: PriceSource,
    window: number = hoursToMilliseconds(12)
): Promise<bcked.asset.Relationship> {
    const price =
        "constant" in source ? source.constant : await source.lookup.getClosest(timestamp, window);
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
    const backingCsv = path.join(PATHS.assets, id, PATHS.records, FILES.csv.backing);

    if (!existsSync(backingCsv)) return;

    const backingEntries = readCSV<bcked.asset.Backing>(backingCsv);

    let priceLookup: { assetId: bcked.asset.Id; source: PriceSource }[] | undefined = undefined;

    for await (const backingEntry of backingEntries) {
        // Initialize price lookup if not yet done
        if (priceLookup === undefined) {
            priceLookup = [];
            for (const underlyingAssetId of Object.keys(backingEntry.underlying)) {
                const priceCsv = path.join(
                    PATHS.assets,
                    underlyingAssetId,
                    PATHS.records,
                    FILES.csv.price
                );

                if (!existsSync(priceCsv)) continue;

                priceLookup.push({
                    assetId: underlyingAssetId as bcked.asset.Id,
                    source: await createPriceSource(priceCsv),
                });
            }
        }

        // Get closest prices to the current entry for all underlying assets
        const underlying = Object.fromEntries(
            await Promise.all(
                priceLookup.map(
                    async ({ assetId, source }): Promise<[string, bcked.asset.Relationship]> => [
                        assetId,
                        await lookupUnderlyingPrice(
                            backingEntry.timestamp,
                            backingEntry.underlying[assetId]!,
                            source,
                            window
                        ),
                    ]
                )
            )
        );

        // The total is only known if every underlying asset has a price.
        const relationships = Object.values(underlying);
        const complete = relationships.every((relationship) => relationship.usd !== undefined);

        yield {
            timestamp: backingEntry.timestamp,
            breakdown: underlying,
            usd: complete ? round(_.sumBy(relationships, "usd"), 2) : null,
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling prices of underlying assets for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, PATHS.records, FILES.csv.underlyingAssets);
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
