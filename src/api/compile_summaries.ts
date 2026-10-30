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
import { TOKEN_RESOURCES } from "./resources/tokens";
import { compileDetails, compileIcons } from "./utils/compile";
import { readCSV } from "../utils/csv";
import { GRAPH_RESOURCES } from "./resources/graphs";
import { dailyComposition, dailySeries, latestWithChange, type DailySeries } from "./utils/series";

/** Path of the icon resource, or null if the item has no icon. */
function iconPath(kind: string, id: string) {
    return existsSync(path.join(kind, id, FILES.svg.icon)) ? `/${kind}/${id}/icons/icon.svg` : null;
}

function recordsPath(kind: string, id: string, file: string) {
    return path.join(kind, id, PATHS.records, file);
}

type Report = { report: string; file: string; sha256: string; url: string };

/** Reports listed in an evidence.csv, newest first. */
async function readReports(csvPath: string): Promise<Report[]> {
    if (!existsSync(csvPath)) return [];
    const reports: Report[] = [];
    for await (const row of readCSV<Report>(csvPath))
        reports.push({ ...row, report: String(row.report), sha256: String(row.sha256) });
    return reports.toSorted((a, b) => b.report.localeCompare(a.report));
}

/**
 * The backing graph of the last recorded day of every month, with links as [from, to, USD] triples.
 * One resource for clients that show how the graph changed, instead of one request per day.
 */
/**
 * Dates of the reports behind every asset whose backing comes from reports: the timestamps of its
 * backing records, or of its issuer's when the issuer reports for all chains together.
 */
async function readReportDates(assetIds: bcked.asset.Id[]): Promise<Map<string, string[]>> {
    const entries = await Promise.all(
        assetIds.map(async (id) => {
            const details = await readJson<bcked.asset.DetailsRecord>(
                recordsPath(PATHS.assets, id, FILES.json.details)
            );
            if (details?.backing?.method != "reports") return null;
            const csvPath =
                details.backing.reports == "token" && details.token
                    ? recordsPath(PATHS.tokens, details.token, FILES.csv.backing)
                    : recordsPath(PATHS.assets, id, FILES.csv.backing);
            if (!existsSync(csvPath)) return null;
            const dates = new Set<string>();
            for await (const row of readCSV<primitive.Timestamped>(csvPath))
                dates.add(row.timestamp.slice(0, 10));
            return [id, [...dates].sort()] as const;
        })
    );
    return new Map(entries.filter((e) => e != null));
}

async function compileGraphSeries(reportDates: Map<string, string[]>) {
    const csvPath = path.join(PATHS.graphs, PATHS.records, FILES.csv.collateralizationGraph);
    if (!existsSync(csvPath)) return;
    type Row = primitive.Timestamped & {
        graph: { links?: { fromId?: string; toId?: string; data?: { value?: number } }[] };
    };
    const linksOf = (row: Row) =>
        (row.graph.links ?? [])
            .filter((link) => link.fromId && link.toId)
            .map(
                (link) =>
                    [
                        link.fromId!,
                        link.toId!,
                        typeof link.data?.value == "number" ? link.data.value : null,
                    ] as const
            );
    // The last recorded day of every month and of every week (weeks start on Monday).
    const months = new Map<string, Row>();
    const weeks = new Map<string, Row>();
    for await (const row of readCSV<Row>(csvPath)) {
        months.set(row.timestamp.slice(0, 7), row);
        weeks.set(weekStart(row.timestamp.slice(0, 10)), row);
    }
    const nodes: string[] = [];
    const index = new Map<string, number>();
    const nodeIndex = (id: string) => {
        if (!index.has(id)) index.set(id, nodes.push(id) - 1);
        return index.get(id)!;
    };
    const weekly = [...weeks.values()].map((row) => ({
        date: row.timestamp.slice(0, 10),
        links: linksOf(row).map(
            ([from, to, value]) =>
                [nodeIndex(from), nodeIndex(to), value == null ? null : Math.round(value)] as [
                    number,
                    number,
                    number | null,
                ]
        ),
    }));
    await Promise.all([
        GRAPH_RESOURCES.collateralizationGraphSeries(
            [...months].map(([month, row]) => ({
                month,
                date: row.timestamp.slice(0, 10),
                links: linksOf(row).map(([from, to, value]) => [from, to, value]),
            }))
        ),
        GRAPH_RESOURCES.collateralizationGraphWeekly(
            nodes,
            weekly,
            Object.fromEntries(
                [...reportDates]
                    .filter(([id]) => index.has(id))
                    .map(([id, dates]) => [index.get(id)!, dates])
            )
        ),
    ]);
}

/** Monday of the week of a `YYYY-MM-DD` date, as `YYYY-MM-DD`. */
function weekStart(date: string): string {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
    return day.toISOString().slice(0, 10);
}

/** USD value per underlying asset on the latest day with a breakdown, or null without one. */
function latestComposition(composition: Record<string, [string, number][]>) {
    const date = Object.values(composition)
        .map((series) => series.at(-1)?.[0])
        .filter((d): d is string => !!d)
        .sort()
        .at(-1);
    if (!date) return null;
    const parts = Object.fromEntries(
        Object.entries(composition)
            .map(([id, series]) => [id, series.findLast(([d]) => d == date)?.[1]] as const)
            .filter((entry): entry is readonly [string, number] => typeof entry[1] == "number")
    );
    return { date, parts };
}

/** Series of every compiled asset, to add up the chains of a token. */
const compiledSeries = new Map<
    bcked.asset.Id,
    {
        marketCap: DailySeries;
        collateralizationRatio: DailySeries;
        collateral: DailySeries;
        composition: Record<string, DailySeries>;
    }
>();

async function compileAsset(id: bcked.asset.Id) {
    const csv = (file: string) => recordsPath(PATHS.assets, id, file);
    const [details, price, supply, marketCap, collateralizationRatio, collateral, composition] =
        await Promise.all([
            readJson<bcked.asset.DetailsRecord>(csv(FILES.json.details)),
            dailySeries(csv(FILES.csv.price), "usd"),
            dailySeries(csv(FILES.csv.supplyAmount), "amount"),
            dailySeries(csv(FILES.csv.marketCap), "usd"),
            dailySeries(csv(FILES.csv.collateralizationRatio), "ratio"),
            dailySeries(csv(FILES.csv.collateralizationRatio), "collateral.usd"),
            dailyComposition(csv(FILES.csv.underlyingAssets)),
        ]);

    await ASSET_RESOURCES.series(id, {
        price,
        supply,
        "market-cap": marketCap,
        "collateralization-ratio": collateralizationRatio,
        collateral,
        composition,
    });

    if (details?.backing) {
        const evidence =
            details.backing.reports == "token" && details.token
                ? recordsPath(PATHS.tokens, details.token, FILES.csv.evidence)
                : csv(FILES.csv.evidence);
        await ASSET_RESOURCES.reports(id, details.backing, await readReports(evidence));
    }

    compiledSeries.set(id, { marketCap, collateralizationRatio, collateral, composition });

    return {
        id,
        $ref: `/assets/${id}`,
        token: details?.token ?? null,
        name: details?.name ?? null,
        symbol: details?.symbol ?? null,
        system: details?.identifier.system ?? null,
        linkedEntities: details?.linkedEntities ?? {},
        assetClasses: details?.assetClasses ?? [],
        tags: details?.tags ?? [],
        backing: details?.backing?.method ?? null,
        composition: latestComposition(composition),
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

/** Adds up daily series by date. A date counts every series that has a value on it. */
function addSeries(series: DailySeries[]): DailySeries {
    const sums = new Map<string, number>();
    for (const one of series)
        for (const [date, value] of one) sums.set(date, (sums.get(date) ?? 0) + value);
    return [...sums].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * A token from its chain assets: market cap, reserves and composition added up per day. The ratio
 * is the combined reserves over the combined market cap at the backing dates, which is each
 * chain's reserves over its own ratio, so a chain without backing on a day does not lower it.
 */
async function compileToken(
    id: bcked.token.Id,
    assets: { id: bcked.asset.Id; token: string | null }[]
) {
    const details = await readJson<bcked.token.DetailsRecord>(
        recordsPath(PATHS.tokens, id, FILES.json.details)
    );
    // The crawler writes the details. A token added since its last run is left out until then.
    if (!details) {
        console.warn(`Token ${id} has no details yet, skipped`);
        return null;
    }
    const members = assets.filter((a) => a.token == id).map((a) => a.id);
    const series = members.map((m) => compiledSeries.get(m)).filter((s) => s != null);

    const marketCap = addSeries(series.map((s) => s.marketCap));
    const collateral = addSeries(series.map((s) => s.collateral));
    const marketCapThen = addSeries(
        series.map((s) => {
            const ratios = new Map(s.collateralizationRatio);
            return s.collateral
                .filter(([date]) => ratios.get(date))
                .map(([date, usd]): [string, number] => [date, usd / ratios.get(date)!]);
        })
    );
    const thenByDate = new Map(marketCapThen);
    const collateralizationRatio: DailySeries = collateral
        .filter(([date]) => thenByDate.get(date))
        .map(([date, usd]) => [date, usd / thenByDate.get(date)!]);
    const composition: Record<string, DailySeries> = {};
    for (const reserve of new Set(series.flatMap((s) => Object.keys(s.composition))))
        composition[reserve] = addSeries(series.map((s) => s.composition[reserve] ?? []));

    await Promise.all([
        TOKEN_RESOURCES.token(id),
        compileDetails(TOKEN_RESOURCES, PATHS.tokens, id),
        compileIcons(TOKEN_RESOURCES, PATHS.tokens, id),
        TOKEN_RESOURCES.assets(id, members),
        TOKEN_RESOURCES.series(id, {
            "market-cap": marketCap,
            "collateralization-ratio": collateralizationRatio,
            collateral,
            composition,
        }),
        details?.backing
            ? TOKEN_RESOURCES.reports(
                  id,
                  details.backing,
                  await readReports(recordsPath(PATHS.tokens, id, FILES.csv.evidence))
              )
            : null,
    ]);

    return {
        id,
        $ref: `/tokens/${id}`,
        name: details?.name ?? null,
        symbol: details?.symbol ?? null,
        issuer: details?.issuer ?? null,
        tags: details?.tags ?? [],
        backing: details?.backing?.method ?? null,
        icon: iconPath(PATHS.tokens, id),
        assets: members,
        composition: latestComposition(composition),
        "market-cap": latestWithChange(marketCap),
        "collateralization-ratio": latestWithChange(collateralizationRatio),
        collateral: latestWithChange(collateral),
    };
}

export async function compileSummaries(
    assetIds: bcked.asset.Id[],
    entityIds: bcked.entity.Id[],
    systemIds: bcked.system.Id[],
    tokenIds: bcked.token.Id[]
) {
    const [assets, entities, systems] = await Promise.all([
        Promise.all(assetIds.map(compileAsset)),
        Promise.all(entityIds.map((id) => compileGroup(PATHS.entities, id))),
        Promise.all(systemIds.map((id) => compileGroup(PATHS.systems, id))),
    ]);
    // After the assets, whose series the tokens add up.
    const tokens = (await Promise.all(tokenIds.map((id) => compileToken(id, assets)))).filter(
        (token) => token != null
    );

    await Promise.all([
        compileGraphSeries(await readReportDates(assetIds)),
        ASSET_RESOURCES.summary(assets),
        TOKEN_RESOURCES.index(tokens.map((token) => token.id)),
        TOKEN_RESOURCES.summary(tokens),
        ENTITY_RESOURCES.summary(entities),
        SYSTEM_RESOURCES.summary(systems),
    ]);
}
