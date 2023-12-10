import { hoursToMilliseconds } from "date-fns";
import { unflatten } from "flat"; // Serialize nested data structures
import fs from "fs";
import { readdir } from "fs/promises";
import _ from "lodash";
import path from "path";
import { fromAsync, matchOnTimestamp, toAsync } from "../../utils/array";
import { readCSV, readHeaders } from "../../utils/csv";
import { readJson } from "../../utils/files";
import { isNewer } from "../../utils/time";
import { JsonResources } from "../utils/resources";
import { icons } from "./icons";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
    name: "Assets",
    description: "Everything about assets",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/assets",
    },
});

RESOURCES.register({
    path: "/assets",
    summary: "Retrieve a list of assets",
    description: "Get a list of asset IDs and references",
    type: "Assets",
    // TODO write schema
    schema: {},
    loader: async () => {
        const assetIds = await readdir(ASSETS_PATH);

        const resource = {
            $id: "/assets",
            assets: assetIds.map((id) => ({
                $ref: `/assets/${id}`,
            })),
        };

        return resource;
    },
});

async function getUnderlyingIds(id: bcked.asset.Id): Promise<bcked.asset.Id[]> {
    const backingCsv = path.join(ASSETS_PATH, id, RECORDS, "backing.csv");

    if (!fs.existsSync(backingCsv)) return [];

    const headersDict: bcked.asset.Backing = unflatten(
        _.zipObject(await readHeaders(backingCsv), [])
    );
    const underlyingIds = Object.keys(headersDict.underlying) as bcked.asset.Id[];
    return underlyingIds;
}

type BackingPriceEntry = {
    timestamp: primitive.ISODateTimeString;
    underlying: {
        [underlyingId: bcked.asset.Id]: {
            amount: number;
            price: // TODO remove again
            | {
                      usd: number;
                  }
                | undefined;
            value:
                | {
                      usd: number;
                  }
                | undefined;
        };
    };
};

async function* onlyPrice(
    entries: AsyncIterableIterator<[bcked.asset.Backing, bcked.asset.Price]>
): AsyncIterableIterator<bcked.asset.Price> {
    for await (const [backing, price] of entries) {
        // Overwrite timestamp with matched backing timestamp
        yield { ...price, timestamp: backing.timestamp };
    }
}

async function* matchBackingPrices(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<BackingPriceEntry> {
    const backingCsv = path.join(ASSETS_PATH, id, RECORDS, "backing.csv");

    if (!fs.existsSync(backingCsv)) return;

    const underlyingIds = await getUnderlyingIds(id);
    const underlyingPriceMatches = underlyingIds.map((underlyingId) => {
        const underlyingPriceCsv = path.join(ASSETS_PATH, underlyingId, RECORDS, "price.csv");

        if (!fs.existsSync(underlyingPriceCsv)) return toAsync([]);

        return onlyPrice(
            matchOnTimestamp(
                [
                    readCSV<bcked.asset.Backing>(backingCsv),
                    readCSV<bcked.asset.Price>(underlyingPriceCsv),
                ],
                window
            ) as AsyncIterableIterator<[bcked.asset.Backing, bcked.asset.Price]>
        );
    });

    var readHead: { [id: bcked.asset.Id]: { price: bcked.asset.Price; done: boolean } } = {};

    // Instead iterate through all backing entries
    // per entry, try to find an entry in the underlying matches? Step one forward when necessary
    for await (const backing of readCSV<bcked.asset.Backing>(backingCsv)) {
        var entry: BackingPriceEntry = {
            timestamp: backing.timestamp,
            underlying: {},
        };

        for (const [underlyingId, underlyingPriceMatch] of _.zip(
            underlyingIds,
            underlyingPriceMatches
        )) {
            var element = readHead[underlyingId!];

            // Read element from list if
            // 1. No element read yet
            // 2. The list still holds more values (not `done`) and the current backing entry is ahead of the `readHead` entry.
            if (
                element === undefined ||
                (!element.done && isNewer(element.price.timestamp, backing.timestamp, 1))
            ) {
                const { value: price, done } = await underlyingPriceMatch!.next();
                element = { price, done: done! };
                readHead[underlyingId!] = element;
            }

            const amount = backing.underlying[underlyingId!]!;
            // console.log(`${entry.timestamp}: ${amount} at $${element.price.usd}`);
            var value = undefined;
            if (element.price?.timestamp === backing.timestamp) {
                value = {
                    usd: element.price.usd * amount,
                };
            }

            entry.underlying[underlyingId!] = { amount, value, price: element.price };
        }

        yield entry;

        // TODO matching doesn't work properly right now.
        // There seems to be errors in combinationsForTimeWindow, closestForTimestamps, and matchOnTimestamp
        // Debug using the btc records
        // Noticed problems:
        // - Combinations are not sorted from left to right (first all of the first timestamp of the first list)
        //   => this might be the main problem?
        // - Doesn't only return the closest entry (might be due to the prior issue)
    }

    // const test = await fromAsync(entries);

    // map to: {timestamp: <>, underlying: { amount: <>, value: <usd>}}

    // console.log(test);
}

async function preProcess(id: bcked.asset.Id) {
    const recordsPath = path.join(ASSETS_PATH, id, RECORDS);
    const priceCsv = path.join(recordsPath, "price.csv");
    const supplyCsv = path.join(recordsPath, "supply.csv");
    const backingCsv = path.join(recordsPath, "backing.csv");

    if (!fs.existsSync(priceCsv) || !fs.existsSync(supplyCsv) || !fs.existsSync(backingCsv)) return;

    // for await (const t of matchBackingPrices(id)){
    //     console.log(`${t.timestamp}: ${t.underlying['bitcoin:BTC'].}`);
    // }
    const test = await fromAsync(matchBackingPrices(id));
    console.log(test);
    // readCSV(priceCsv);
    // readCSV(supplyCsv);
    // readCSV(backingCsv);

    // const mcap = await fromAsync(matchOnTimestamp([readCSV<bcked.asset.Supply>(supplyCsv), readCSV<bcked.asset.Price>(priceCsv)]))
    const backing = await fromAsync(
        matchOnTimestamp([
            readCSV<bcked.asset.Backing>(backingCsv),
            readCSV<bcked.asset.Supply>(supplyCsv),
            readCSV<bcked.asset.Price>(priceCsv),
        ])
    );
    console.log(backing);
    // TODO match for backing table in asset dir
    // TODO match for mcap table in asset dir

    // Where was I?
    // Where do I want to take this?
    // Open challenges?

    // Only storing backing matches, removes a lot of entries which might be relevant for price charts e.g.
    // How and when to match price per time for backing entries?

    // How to store and provide data via API?
    // Current idea of storing for every year, month and day seems excessive?

    // Use delta/differential compression? -> store only changes
    // https://github.com/lemire/FastIntegerCompression.js

    // Or provide current API structure but just for backing matches
    // Prematch prices of backing -> if unavailable, track as unknown
}

RESOURCES.register({
    path: "/assets/{id}",
    summary: "Get an asset",
    description: "Get an asset by its ID",
    type: "Asset",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        await preProcess(id);
        const recordsPath = path.join(ASSETS_PATH, id, RECORDS);
        const resource = {
            $id: `/assets/${id}`,
            details: {
                $ref: `/assets/${id}/details`,
            },
            icons: {
                $ref: `/assets/${id}/icons`,
            },
            price: fs.existsSync(path.join(recordsPath, "price.csv"))
                ? {
                      $ref: `/assets/${id}/price`,
                  }
                : null,
            // supply: {
            //     $ref: `/assets/{id}/supply`,
            // },
            // mcap: {
            //     $ref: `/assets/{id}/mcap`,
            // },
            // backing: {
            //     $ref: `/assets/${id}/backing`,
            // },
        };

        return resource;
    },
});

// parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The ID of the asset
RESOURCES.register({
    path: "/assets/{id}/details",
    summary: "Get details of an asset",
    description: "Get details of an asset by its ID",
    type: "AssetDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "details.json");

        const details = await readJson<bcked.asset.DetailsRecord>(filePath);

        const resource = {
            $id: `/assets/${id}/details`,
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
            listed: details?.listed,
            updated: details?.updated,
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/icons",
    summary: "Get icons of an asset",
    description: "Get icons of an asset by its ID",
    type: "AssetIcons",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => await icons("assets", id),
});

// for await (const entry of readCSV(`${recordsPath}/supply.csv`)) {
//     console.log(entry);
// }
