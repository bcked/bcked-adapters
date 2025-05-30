/**
 * Circles reserves are two fold.
 *
 * 1. Reserve holdings managed by BlackRock, see: https://www.blackrock.com/cash/en-us/products/329365/
 * 2. Cash holdings by Circle, see: https://www.circle.com/en/transparency
 *
 * Note: Cash holdings are reported infrequently or via the attestation reports.
 */
import Crawler from "crawler";
import dateFormat from "dateformat";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { FILES } from "../../src/constants";
import { BRManager } from "../../src/crawler/apis/br_manager";
import { toAsync } from "../../src/utils/array";
import { getClosest, getLatest } from "../../src/utils/cache";
import { writeToCsv } from "../../src/utils/csv";
import { toISOString } from "../../src/utils/string_formatting";
import { daysInMs, getDatesBetween, hoursInMs, isClose, isNewer } from "../../src/utils/time";

const details: bcked.entity.Details = {
    name: "Circle",
    identifier: "circle",
    reference: "https://www.circle.com/",
    tags: [],
};

export interface Cash {
    timestamp: `${number}-${number}-${number}`; // yyyy-mm-dd
    usd: number;
}

export default class Adapter implements bcked.entity.Adapter {
    treasuryManager: BRManager;
    crawler: Crawler;
    recordsPath: string;

    constructor() {
        this.treasuryManager = new BRManager();
        this.crawler = new Crawler({ rateLimit: 1000 });
        this.recordsPath = `entities/${details.identifier}/records`;
    }

    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async fetchLatestTreasuryReserves(): Promise<void> {
        const csvPath = path.join(this.recordsPath, FILES.csv.reserves);

        const lastEntry = await getLatest<bcked.asset.Backing>(csvPath);
        // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
        if (lastEntry !== null && isClose(lastEntry.timestamp, Date.now(), hoursInMs(23.99)))
            return;

        const startOfRecordings = new Date("2022-11-02");
        const startDate = new Date(lastEntry?.timestamp ?? startOfRecordings);

        // Loop through the dates using timestamps and create Date objects
        for (const timestamp of getDatesBetween(startDate, Date.now(), daysInMs(1))) {
            // await this.fetchTreasuryReserves(timestamp);
            const positions = await this.treasuryManager.getPositions("329365", "1464253357814", {
                fileType: "csv",
                fileName: "USDXX_holdings",
                dataType: "fund",
                asOfDate: dateFormat(timestamp, "yyyymmdd"), // yyyymmdd
            });

            if (!positions?.length) continue;

            const grouped = _.groupBy(positions, "asset");
            const summed = Object.fromEntries(
                Object.entries(grouped).map(([asset, group]) => [asset, _.sumBy(group, "par")])
            );

            const res: bcked.asset.Backing = {
                timestamp: toISOString(timestamp),
                underlying: summed,
            };

            await writeToCsv(csvPath, toAsync([res]), "timestamp");
        }
    }

    async fetchLatestCashReserves(): Promise<void> {
        const csvPath = path.join(this.recordsPath, FILES.csv.cash);

        const lastEntry = await getLatest<bcked.asset.Backing>(csvPath);
        // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
        if (lastEntry !== null && isClose(lastEntry.timestamp, Date.now(), hoursInMs(23.99)))
            return;

        const $ = await new Promise<cheerio.CheerioAPI>((resolve, reject) => {
            this.crawler.direct({
                uri: "https://www.circle.com/en/transparency",
                callback: (error, response) => {
                    if (error as Error | null) {
                        reject(error);
                    } else {
                        resolve(response.$);
                    }
                },
            });
        });

        const dateText = $("p:contains('As of')").next().text().trim();
        const canvasElement = $("#usdc_chartjs_canvas")[0] as cheerio.TagElement | undefined;
        const cashText = canvasElement?.attribs["data-usdc-cash"];

        if (!dateText || !cashText) return;

        const parsedDate = Date.parse(dateText);
        if (lastEntry !== null && !isNewer(lastEntry.timestamp, parsedDate, hoursInMs(12))) return;

        const cashUsd = parseFloat(cashText) * 1000000000;
        const entry = {
            timestamp: dateFormat(parsedDate, "yyyy-mm-dd"),
            underlying: {
                "rwa:USD": cashUsd,
            },
        };

        await writeToCsv(csvPath, toAsync([entry]), "timestamp");
    }

    async fetchLatestBacking(): Promise<void> {
        const csvPath = path.join(this.recordsPath, FILES.csv.backing);

        const lastEntry = await getLatest<bcked.asset.Backing>(csvPath);
        // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
        if (lastEntry !== null && isClose(lastEntry.timestamp, Date.now(), hoursInMs(23.99)))
            return;

        const startDate = new Date(lastEntry?.timestamp ?? 0);

        // Loop through the dates using timestamps and create Date objects
        for (const timestamp of getDatesBetween(startDate, Date.now(), daysInMs(1))) {
            const treasuryReserves = await getClosest<bcked.asset.Backing>(
                path.join(this.recordsPath, FILES.csv.reserves),
                timestamp,
                hoursInMs(12.0)
            );
            if (!treasuryReserves) continue;
            const cashReserves = await getClosest<bcked.asset.Backing>(
                path.join(this.recordsPath, FILES.csv.cash),
                timestamp,
                hoursInMs(12.0)
            );
            if (!cashReserves) continue;

            const res: bcked.asset.Backing = {
                timestamp: toISOString(timestamp),
                underlying: _.mergeWith(
                    treasuryReserves.underlying,
                    cashReserves.underlying,
                    (a, b) => _.sum([a, b])
                ),
            };

            await writeToCsv(csvPath, toAsync([res]), "timestamp");
        }
    }

    async update(): Promise<void> {
        // Update Circle reserves data.
        await fs.promises.mkdir(this.recordsPath, { recursive: true });
        await this.fetchLatestTreasuryReserves();
        await this.fetchLatestCashReserves();
        await this.fetchLatestBacking();
    }
}
