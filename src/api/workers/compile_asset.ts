import { existsSync } from "fs";
import path from "path";
import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { readCSV } from "../../utils/csv";
import { StreamStats } from "../../utils/stream";
import { getDateParts } from "../../utils/time";
import { sendErrorReport } from "../../watcher/bot";
import { ASSET_RESOURCES, Asset } from "../resources/assets";
import { compileDetails, compileIcons } from "../utils/compile";

async function compilePrice(resource: Asset, id: bcked.asset.Id) {
    const csvPath = path.join(PATHS.assets, id, "records", "price.csv");

    if (!existsSync(csvPath)) return;

    const historyStats: StreamStats<bcked.asset.Price, "usd"> = new StreamStats("usd", 100);

    let yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<bcked.asset.Price, "usd"> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<bcked.asset.Price, "usd"> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<bcked.asset.Price, "usd"> | undefined;
    let hoursOfDay: string[] = [];
    let hoursStats: StreamStats<bcked.asset.Price, "usd"> | undefined;
    let price: bcked.asset.Price | undefined;

    async function addHourToDay(hour: string) {
        await resource.priceHour(id, hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new StreamStats("usd", 100);
    }

    async function addDayToMonth(day: string, hour: string) {
        await resource.priceDay(
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
        daysStats = new StreamStats("usd", 100);
    }

    async function addMonthToYear(month: string, day: string, hour: string) {
        await resource.priceMonth(
            id,
            monthsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth
        );
        await addDayToMonth(day, hour);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new StreamStats("usd", 100);
    }

    async function addYearToHistory(year: string, month: string, day: string, hour: string) {
        await resource.priceYear(id, yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day, hour);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new StreamStats("usd", 100);
    }

    for await (price of readCSV<bcked.asset.Price>(csvPath)) {
        const { year, month, day, hour } = getDateParts(price.timestamp);

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

        historyStats.add(price);
        yearsStats!.add(price);
        monthsStats!.add(price);
        daysStats!.add(price);
        hoursStats!.add(price);
    }

    if (!yearsOfHistory.length) return;

    await resource.priceHistory(id, price?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}

async function compileSupply(resource: Asset, id: bcked.asset.Id) {
    const csvPath = path.join(PATHS.assets, id, "records", "supply_amount.csv");

    if (!existsSync(csvPath)) return;

    const historyStats: StreamStats<bcked.asset.SupplyAmount, "amount"> = new StreamStats(
        "amount",
        100
    );

    let yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<bcked.asset.SupplyAmount, "amount"> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<bcked.asset.SupplyAmount, "amount"> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<bcked.asset.SupplyAmount, "amount"> | undefined;
    let hoursOfDay: string[] = [];
    let hoursStats: StreamStats<bcked.asset.SupplyAmount, "amount"> | undefined;
    let supply: bcked.asset.SupplyAmount | undefined;

    async function addHourToDay(hour: string) {
        await resource.supplyHour(id, hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new StreamStats("amount", 100);
    }

    async function addDayToMonth(day: string, hour: string) {
        await resource.supplyDay(
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
        daysStats = new StreamStats("amount", 100);
    }

    async function addMonthToYear(month: string, day: string, hour: string) {
        await resource.supplyMonth(
            id,
            monthsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth
        );
        await addDayToMonth(day, hour);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new StreamStats("amount", 100);
    }

    async function addYearToHistory(year: string, month: string, day: string, hour: string) {
        await resource.supplyYear(id, yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day, hour);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new StreamStats("amount", 100);
    }

    for await (supply of readCSV<bcked.asset.SupplyAmount>(csvPath)) {
        const { year, month, day, hour } = getDateParts(supply.timestamp);

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

        historyStats.add(supply);
        yearsStats!.add(supply);
        monthsStats!.add(supply);
        daysStats!.add(supply);
        hoursStats!.add(supply);
    }

    if (!yearsOfHistory.length) return;

    await resource.supplyHistory(id, supply?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}

async function compileMarketCap(resource: Asset, id: bcked.asset.Id) {
    const csvPath = path.join(PATHS.assets, id, "records", "market_cap.csv");

    if (!existsSync(csvPath)) return;

    const historyStats: StreamStats<bcked.asset.MarketCap, "usd"> = new StreamStats("usd", 100);

    let yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<bcked.asset.MarketCap, "usd"> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<bcked.asset.MarketCap, "usd"> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<bcked.asset.MarketCap, "usd"> | undefined;
    let hoursOfDay: string[] = [];
    let hoursStats: StreamStats<bcked.asset.MarketCap, "usd"> | undefined;
    let marketCap: bcked.asset.MarketCap | undefined;

    async function addHourToDay(hour: string) {
        await resource.marketCapHour(id, hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new StreamStats("usd", 100);
    }

    async function addDayToMonth(day: string, hour: string) {
        await resource.marketCapDay(
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
        daysStats = new StreamStats("usd", 100);
    }

    async function addMonthToYear(month: string, day: string, hour: string) {
        await resource.marketCapMonth(
            id,
            monthsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth
        );
        await addDayToMonth(day, hour);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new StreamStats("usd", 100);
    }

    async function addYearToHistory(year: string, month: string, day: string, hour: string) {
        await resource.marketCapYear(id, yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day, hour);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new StreamStats("usd", 100);
    }

    for await (marketCap of readCSV<bcked.asset.MarketCap>(csvPath)) {
        const { year, month, day, hour } = getDateParts(marketCap.timestamp);

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

        historyStats.add(marketCap);
        yearsStats!.add(marketCap);
        monthsStats!.add(marketCap);
        daysStats!.add(marketCap);
        hoursStats!.add(marketCap);
    }

    if (!yearsOfHistory.length) return;

    await resource.marketCapHistory(id, marketCap?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}

async function compileUnderlyingAssets(resource: Asset, id: bcked.asset.Id) {
    const csvPath = path.join(PATHS.assets, id, "records", "underlying_assets.csv");

    if (!existsSync(csvPath)) return;

    const historyStats: StreamStats<bcked.asset.Relationships, "usd"> = new StreamStats("usd", 100);

    let yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<bcked.asset.Relationships, "usd"> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<bcked.asset.Relationships, "usd"> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<bcked.asset.Relationships, "usd"> | undefined;
    let hoursOfDay: string[] = [];
    let hoursStats: StreamStats<bcked.asset.Relationships, "usd"> | undefined;
    let underlyingAssets: bcked.asset.Relationships | undefined;

    async function addHourToDay(hour: string) {
        await resource.underlyingAssetsHour(id, hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new StreamStats("usd", 100);
    }

    async function addDayToMonth(day: string, hour: string) {
        await resource.underlyingAssetsDay(
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
        daysStats = new StreamStats("usd", 100);
    }

    async function addMonthToYear(month: string, day: string, hour: string) {
        await resource.underlyingAssetsMonth(
            id,
            monthsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth
        );
        await addDayToMonth(day, hour);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new StreamStats("usd", 100);
    }

    async function addYearToHistory(year: string, month: string, day: string, hour: string) {
        await resource.underlyingAssetsYear(
            id,
            yearsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear
        );
        await addMonthToYear(month, day, hour);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new StreamStats("usd", 100);
    }

    for await (underlyingAssets of readCSV<bcked.asset.Relationships>(csvPath)) {
        const { year, month, day, hour } = getDateParts(underlyingAssets.timestamp);

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

        historyStats.add(underlyingAssets);
        yearsStats!.add(underlyingAssets);
        monthsStats!.add(underlyingAssets);
        daysStats!.add(underlyingAssets);
        hoursStats!.add(underlyingAssets);
    }

    if (!yearsOfHistory.length) return;

    await resource.underlyingAssetsHistory(
        id,
        underlyingAssets?.timestamp,
        historyStats.get(),
        yearsOfHistory
    );
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    try {
        console.log(`Compile asset ${id}`);
        const res = await Promise.all([
            ASSET_RESOURCES.asset(id),
            compileDetails(ASSET_RESOURCES, id),
            compileIcons(ASSET_RESOURCES, PATHS.assets, id),
            compilePrice(ASSET_RESOURCES, id),
            compileSupply(ASSET_RESOURCES, id),
            compileMarketCap(ASSET_RESOURCES, id),
            compileUnderlyingAssets(ASSET_RESOURCES, id),
        ]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
