import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import { sumBy } from "lodash";
import path from "path";
import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { ConsecutiveLookup, writeToCsv } from "../../utils/csv";
import { readJson, remove } from "../../utils/files";
import { toISOString } from "../../utils/string_formatting";
import { getDatesBetween } from "../../utils/time";
import { sendErrorReport } from "../../watcher/bot";

interface MarketCapLookup {
    assetId: bcked.asset.Id;
    lookup: ConsecutiveLookup<bcked.asset.MarketCap>;
}

interface MarketCapResult {
    assetId: bcked.asset.Id;
    marketCap: bcked.asset.MarketCap | undefined;
}

function initializeMarketCapLookups(assetIds: bcked.asset.Id[]) {
    const marketCapLookups: MarketCapLookup[] = [];

    for (const assetId of assetIds) {
        const csvPath = path.join(PATHS.assets, assetId, PATHS.records, FILES.csv.marketCap);

        if (!existsSync(csvPath)) {
            continue;
        }

        marketCapLookups.push({
            assetId,
            lookup: new ConsecutiveLookup(csvPath),
        });
    }

    return marketCapLookups;
}

async function getMarketCapForTimestamp(
    timestamp: primitive.DateLike,
    marketCapLookups: MarketCapLookup[],
    window: number = hoursToMilliseconds(12)
): Promise<MarketCapResult[]> {
    // Get closest prices to the current entry for all underlying assets
    return Promise.all(
        marketCapLookups.map(async ({ assetId, lookup }) => ({
            assetId,
            marketCap: await lookup.getClosest(timestamp, window),
        }))
    );
}

async function* computeTotalValueLocked(
    id: bcked.entity.Id,
    window: number = hoursToMilliseconds(1)
): AsyncIterableIterator<any> {
    const assetsJson = path.join(PATHS.entities, id, PATHS.records, FILES.json.assets);
    const assets = await readJson<{ ids: bcked.asset.Id[] }>(assetsJson);

    if (!assets) {
        console.error("Assets not found");
        return;
    }

    const marketCapLookups = initializeMarketCapLookups(assets.ids);

    if (!marketCapLookups.length) {
        console.error("No market cap lookups found");
        return;
    }

    // TODO get latest entry from total value locked and continue from that time
    // const lastEntry = await getLatest<bcked.asset.Backing>(csvPath);
    // // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
    // if (lastEntry !== null && isClose(lastEntry.timestamp, Date.now(), hoursInMs(23.99))) return;

    // const startOfRecordings = new Date("2022-11-02");
    // const startDate = new Date(lastEntry?.timestamp ?? startOfRecordings);
    const startDate = new Date("2022-11-02");

    // Loop through the dates using timestamps and create Date objects
    for (const timestamp of getDatesBetween(startDate, Date.now(), window)) {
        const marketCaps = await getMarketCapForTimestamp(timestamp, marketCapLookups, window);

        if (!marketCaps.length) {
            continue;
        }

        const totalValueLocked = sumBy(marketCaps, "marketCap.usd");

        if (!totalValueLocked) {
            continue;
        }

        yield {
            timestamp: toISOString(timestamp),
            // assets: marketCaps.map((marketCap) => ({
            //     id: marketCap.assetId,
            //     timestamp: marketCap.marketCap?.timestamp,
            //     usd: marketCap.marketCap?.usd,
            // })),
            totalValueLocked,
        };
    }
}

parentPort?.on("message", async (id: bcked.entity.Id) => {
    const step = `Precompile system ${id} total value locked`;
    console.log(step);
    const filePath = path.join(PATHS.entities, id, PATHS.records, FILES.csv.totalValueLocked);

    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await remove(filePath);

        const entries = computeTotalValueLocked(id);
        await writeToCsv(filePath, entries, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(step, error);
        await sendErrorReport(step, error);
        parentPort?.postMessage(null);
    }
});
