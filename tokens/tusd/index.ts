/**
 * TrueUSD (TUSD) on Ethereum, BNB Chain and Avalanche, a US dollar stablecoin issued by Techteryx. The
 * addresses of the natively issued chains are listed on the TrueUSD website (https://tusd.io/). TUSD
 * on Tron, also native, is not tracked: bcked does not read Tron. TUSD on Polygon, Arbitrum and other
 * chains is bridged and not tracked separately. Supply is read on-chain. The price is the Chainlink
 * TUSD/USD feed.
 *
 * The backing is not recorded. Chainlink's TUSD Reserves feed reports the reserves for all chains
 * together, and the TUSD on Tron cannot be measured, so the share of each tracked chain is not known.
 * The TrueUSD transparency pages are not used: their terms do not allow automated copying.
 */
const details: bcked.token.Details = {
    name: "TrueUSD",
    symbol: "TUSD",
    identifier: "tusd",
    issuer: "techteryx",
    reference: "https://tusd.io/",
    backing: {
        method: "not-tracked",
        description:
            "Chainlink's Proof of Reserves reports the reserves behind TUSD on all chains together, but the TUSD on Tron, which bcked does not track, cannot be measured, so the share of each tracked chain is not recorded.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/tusd-por",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
