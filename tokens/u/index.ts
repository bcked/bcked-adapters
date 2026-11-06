/**
 * U by United Stables on BNB Chain and Ethereum. The address, the same on both chains, is listed on
 * United Stables' multichain page (https://www.u.tech/ecosystem/multichain/). U on Tron is not
 * tracked: bcked does not read Tron. Supply is read on-chain. The price is the Chainlink U/USD feed.
 *
 * The backing is not recorded. Chainlink's United Stables U Reserves feed on BNB Chain
 * (0xFa8e834DD2200923C706e6438d9030dB029B0c18, named on United Stables' proof of reserves page)
 * reports the reserves for U on all chains together ($1.65B on 2026-11-06), while BNB Chain and
 * Ethereum held 1.53B U. The rest is on Tron, so the share of each tracked chain cannot be measured.
 */
const details: bcked.token.Details = {
    name: "United Stables",
    symbol: "U",
    identifier: "u",
    issuer: "united-stables",
    reference: "https://www.u.tech/por/",
    backing: {
        method: "not-tracked",
        description:
            "Chainlink's Proof of Reserves reports the reserves behind U on all chains together, but the U on Tron, which bcked does not track, cannot be measured, so the share of each tracked chain is not recorded.",
        reference: "https://www.u.tech/por/",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
