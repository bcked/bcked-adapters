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

    await resource.price(id);

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

    await resource.priceLatest(id, price?.timestamp);
    await resource.priceHistory(id, historyStats.get(), yearsOfHistory);
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
        ]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
