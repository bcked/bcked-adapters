/**
 * USD Coin on every tracked chain. The reserves are reported for all chains together and recorded
 * here (records/backing.csv, evidence.csv) by scripts/attestations/update.sh. The chain assets link
 * this token and get their share of the reserves.
 */
const details: bcked.token.Details = {
    name: "USD Coin",
    symbol: "USDC",
    identifier: "usdc",
    issuer: "circle",
    reference: "https://www.circle.com/transparency",
    tags: ["stablecoin", "real-world-asset"],
    backing: {
        method: "reports",
        description:
            "Circle's monthly attestation reports (Grant Thornton, Deloitte), for all chains together. Each chain gets its share by circulating supply.",
        reference: "https://www.circle.com/transparency",
        reports: "token",
    },
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
