/**
 * Compiles compact resources for clients like bcked.com:
 * a daily series per asset, entity and system, and a summary list per kind.
 * Without these, a chart or ranking needs hundreds of requests through the history resources.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { FILES, PATHS } from "../constants";
import { readJson } from "../utils/files";
import { ASSET_RESOURCES } from "./resources/assets";
import { ENTITY_RESOURCES } from "./resources/entities";
import { SYSTEM_RESOURCES } from "./resources/systems";
import { dailySeries, latestWithChange } from "./utils/series";

/** Path of the icon resource, or null if the item has no icon. */
function iconPath(kind: string, id: string) {
    return existsSync(path.join(kind, id, FILES.svg.icon)) ? `/${kind}/${id}/icons/icon.svg` : null;
}

function recordsPath(kind: string, id: string, file: string) {
    return path.join(kind, id, PATHS.records, file);
}

async function compileAsset(id: bcked.asset.Id) {
    const csv = (file: string) => recordsPath(PATHS.assets, id, file);
    const [details, price, supply, marketCap, collateralizationRatio, collateral] =
        await Promise.all([
            readJson<bcked.asset.DetailsRecord>(csv(FILES.json.details)),
            dailySeries(csv(FILES.csv.price), "usd"),
            dailySeries(csv(FILES.csv.supplyAmount), "amount"),
            dailySeries(csv(FILES.csv.marketCap), "usd"),
            dailySeries(csv(FILES.csv.collateralizationRatio), "ratio"),
            dailySeries(csv(FILES.csv.collateralizationRatio), "collateral.usd"),
        ]);

    await ASSET_RESOURCES.series(id, {
        price,
        supply,
        "market-cap": marketCap,
        "collateralization-ratio": collateralizationRatio,
        collateral,
    });

    return {
        id,
        $ref: `/assets/${id}`,
        name: details?.name ?? null,
        symbol: details?.symbol ?? null,
        system: details?.identifier.system ?? null,
        linkedEntities: details?.linkedEntities ?? {},
        assetClasses: details?.assetClasses ?? [],
        tags: details?.tags ?? [],
        icon: iconPath(PATHS.assets, id),
        price: latestWithChange(price),
        supply: latestWithChange(supply),
        "market-cap": latestWithChange(marketCap),
        "collateralization-ratio": latestWithChange(collateralizationRatio),
        collateral: latestWithChange(collateral),
    };
}

async function compileGroup(kind: typeof PATHS.entities | typeof PATHS.systems, id: string) {
    const [details, assets, totalValueLocked] = await Promise.all([
        readJson<Record<string, unknown>>(recordsPath(kind, id, FILES.json.details)),
        readJson<{ ids: bcked.asset.Id[] }>(recordsPath(kind, id, FILES.json.assets)),
        dailySeries(recordsPath(kind, id, FILES.csv.totalValueLocked), "totalValueLocked"),
    ]);

    const resources = kind === PATHS.entities ? ENTITY_RESOURCES : SYSTEM_RESOURCES;
    await resources.series(id, { "total-value-locked": totalValueLocked });

    return {
        id,
        $ref: `/${kind}/${id}`,
        ...details,
        icon: iconPath(kind, id),
        assets: assets?.ids ?? [],
        "total-value-locked": latestWithChange(totalValueLocked),
    };
}

export async function compileSummaries(
    assetIds: bcked.asset.Id[],
    entityIds: bcked.entity.Id[],
    systemIds: bcked.system.Id[]
) {
    const [assets, entities, systems] = await Promise.all([
        Promise.all(assetIds.map(compileAsset)),
        Promise.all(entityIds.map((id) => compileGroup(PATHS.entities, id))),
        Promise.all(systemIds.map((id) => compileGroup(PATHS.systems, id))),
    ]);

    await Promise.all([
        ASSET_RESOURCES.summary(assets),
        ENTITY_RESOURCES.summary(entities),
        SYSTEM_RESOURCES.summary(systems),
    ]);
}
