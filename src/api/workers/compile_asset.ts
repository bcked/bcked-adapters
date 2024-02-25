import { existsSync } from "fs";
import type { PropertyPath } from "lodash";
import path from "path";
import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { readCSV } from "../../utils/csv";
import { StreamStats, type Stats } from "../../utils/stream";
import { getDateParts } from "../../utils/time";
import { sendErrorReport } from "../../watcher/bot";
import { ASSET_RESOURCES } from "../resources/assets";
import { compileDetails, compileIcons } from "../utils/compile";

async function compileHistory<TObject extends primitive.Timestamped, TKey extends keyof TObject>(
    csvName: string,
    id: bcked.asset.Id,
    key: TKey | PropertyPath,
    createHistoryResource: (
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<TObject> | undefined,
        years: string[]
    ) => Promise<any>,
    createYearResource: (
        id: bcked.entity.Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        months: string[]
    ) => Promise<any>,
    createMonthResource: (
        id: bcked.entity.Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) => Promise<any>,
    createDayResource: (
        id: bcked.entity.Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) => Promise<any>,
    createHourResource: (id: bcked.asset.Id, stats: Stats<TObject> | undefined) => Promise<any>
) {
    const csvPath = path.join(PATHS.assets, id, PATHS.records, csvName);

    if (!existsSync(csvPath)) return;

    const historyStats: StreamStats<TObject, TKey> = new StreamStats(key, 100);

    const yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<TObject, TKey> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<TObject, TKey> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<TObject, TKey> | undefined;
    let hoursOfDay: string[] = [];
    let hoursStats: StreamStats<TObject, TKey> | undefined;
    let historyObject: TObject | undefined;

    async function addHourToDay(hour: string) {
        await createHourResource(id, hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new StreamStats(key, 100);
    }

    async function addDayToMonth(day: string, hour: string) {
        await createDayResource(
            id,
            daysStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth.at(-1),
            hoursOfDay
        );
        await addHourToDay(hour);
        hoursOfDay = [hour];
        daysOfMonth.push(day);
        daysStats = new StreamStats(key, 100);
    }

    async function addMonthToYear(month: string, day: string, hour: string) {
        await createMonthResource(
            id,
            monthsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth
        );
        await addDayToMonth(day, hour);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new StreamStats(key, 100);
    }

    async function addYearToHistory(year: string, month: string, day: string, hour: string) {
        await createYearResource(id, yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day, hour);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new StreamStats(key, 100);
    }

    for await (historyObject of readCSV<TObject>(csvPath)) {
        const { year, month, day, hour } = getDateParts(historyObject.timestamp);

        if (yearsOfHistory.at(-1) !== year) {
            await addYearToHistory(year!, month!, day!, hour!);
        }

        if (monthsOfYear.at(-1) !== month) {
            await addMonthToYear(month!, day!, hour!);
        }

        if (daysOfMonth.at(-1) !== day) {
            await addDayToMonth(day!, hour!);
        }

        if (hoursOfDay.at(-1) !== hour) {
            await addHourToDay(hour!);
        }

        historyStats.add(historyObject);
        yearsStats!.add(historyObject);
        monthsStats!.add(historyObject);
        daysStats!.add(historyObject);
        hoursStats!.add(historyObject);
    }

    if (!yearsOfHistory.length) return;

    await createHistoryResource(id, historyObject?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Compile asset ${id}`);
    try {
        await Promise.all([
            ASSET_RESOURCES.asset(id),
            compileDetails(ASSET_RESOURCES, PATHS.assets, id),
            compileIcons(ASSET_RESOURCES, PATHS.assets, id),
            compileHistory<bcked.asset.Price, "usd">(
                "price.csv",
                id,
                "usd",
                ASSET_RESOURCES.priceHistory,
                ASSET_RESOURCES.priceYear,
                ASSET_RESOURCES.priceMonth,
                ASSET_RESOURCES.priceDay,
                ASSET_RESOURCES.priceHour
            ),
            compileHistory<bcked.asset.SupplyAmount, "amount">(
                "supply_amount.csv",
                id,
                "amount",
                ASSET_RESOURCES.supplyHistory,
                ASSET_RESOURCES.supplyYear,
                ASSET_RESOURCES.supplyMonth,
                ASSET_RESOURCES.supplyDay,
                ASSET_RESOURCES.supplyHour
            ),
            compileHistory<bcked.asset.MarketCap, "usd">(
                "market_cap.csv",
                id,
                "usd",
                ASSET_RESOURCES.marketCapHistory,
                ASSET_RESOURCES.marketCapYear,
                ASSET_RESOURCES.marketCapMonth,
                ASSET_RESOURCES.marketCapDay,
                ASSET_RESOURCES.marketCapHour
            ),
            compileHistory<bcked.asset.Relationships, "usd">(
                "underlying_assets.csv",
                id,
                "usd",
                ASSET_RESOURCES.underlyingAssetsHistory,
                ASSET_RESOURCES.underlyingAssetsYear,
                ASSET_RESOURCES.underlyingAssetsMonth,
                ASSET_RESOURCES.underlyingAssetsDay,
                ASSET_RESOURCES.underlyingAssetsHour
            ),
            compileHistory<bcked.asset.Collateralization, "ratio">(
                "collateralization_ratio.csv",
                id,
                "ratio",
                ASSET_RESOURCES.collateralizationRatioHistory,
                ASSET_RESOURCES.collateralizationRatioYear,
                ASSET_RESOURCES.collateralizationRatioMonth,
                ASSET_RESOURCES.collateralizationRatioDay,
                ASSET_RESOURCES.collateralizationRatioHour
            ),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
