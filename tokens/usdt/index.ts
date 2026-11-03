import path from "node:path";

import { FILES, PATHS } from "../../src/constants";
import { tetherTotalCirculating } from "../../src/crawler/adapters/circulating";
import { toAsync } from "../../src/utils/array";
import { writeToCsv } from "../../src/utils/csv";
import { toISOString } from "../../src/utils/string_formatting";

/**
 * Tether USD on every tracked chain. The reserves are reported for all chains together and recorded
 * here (records/backing.csv, evidence.csv) by scripts/attestations/update.sh. The chain assets link
 * this token and get their share of the reserves.
 */
const details: bcked.token.Details = {
    name: "Tether USD",
    symbol: "USDT",
    identifier: "usdt",
    issuer: "tether",
    reference: "https://tether.to/en/transparency/",
    tags: ["stablecoin", "real-world-asset"],
    backing: {
        method: "reports",
        description:
            "Tether's quarterly assurance reports (BDO), for all chains together. Each chain gets its share by circulating supply. From November 2018 to January 2021 Tether published no reports. For that time the backing is the monthly total from Tether's own transparency page, unaudited and without a breakdown.",
        reference: "https://tether.to/en/transparency/",
        reports: "token",
    },
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    /**
     * Records the USDT circulating on all chains, from Tether's figures, as the token's total. The
     * chain assets take their share of the reserves against it (see getTokenBackingShare).
     */
    async update(): Promise<void> {
        const total = await tetherTotalCirculating("usdt");
        const csvPath = path.join(
            PATHS.tokens,
            details.identifier,
            PATHS.records,
            FILES.csv.supply
        );
        await writeToCsv(
            csvPath,
            toAsync([{ timestamp: toISOString(Date.now()), total }]),
            "timestamp"
        );
    }
}
