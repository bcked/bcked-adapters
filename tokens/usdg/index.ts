/**
 * Global Dollar on every tracked chain, issued by Paxos. The reserves are reported for all chains
 * together in Paxos's monthly attestation reports and recorded here by scripts/attestations/update.sh.
 */
const details: bcked.token.Details = {
    name: "Global Dollar",
    symbol: "USDG",
    identifier: "usdg",
    issuer: "paxos",
    reference: "https://www.paxos.com/usdg-transparency",
    tags: ["stablecoin", "real-world-asset"],
    backing: {
        method: "reports",
        description:
            "Paxos's monthly attestation reports, for all chains together. Each chain gets its share by circulating supply.",
        reference: "https://www.paxos.com/usdg-transparency",
        reports: "token",
    },
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
