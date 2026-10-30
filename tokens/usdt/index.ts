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
            "Tether's quarterly assurance reports (BDO), for all chains together. Each chain gets its share by circulating supply.",
        reference: "https://tether.to/en/transparency/",
        reports: "token",
    },
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
