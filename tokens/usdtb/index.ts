/**
 * USDtb on Ethereum and Solana, a US dollar stablecoin issued by Anchorage Digital Bank, N.A. since
 * October 2025, originally launched by Ethena and backed mainly by BlackRock's BUIDL fund.
 * The addresses are listed in Anchorage Digital's stablecoin documentation
 * (https://docs.anchorage.com/knowledge-base/platform/users/stablecoins). Supply is read on-chain. The
 * price is the Chainlink USDtb/USD feed.
 *
 * The reserves are reported monthly by Anchorage Digital, but its terms do not allow automated
 * collection (https://www.anchorage.com/terms-and-conditions), so the backing is not recorded yet.
 */
const details: bcked.token.Details = {
    name: "USDtb",
    symbol: "USDtb",
    identifier: "usdtb",
    issuer: "anchorage",
    reference: "https://docs.anchorage.com/knowledge-base/platform/users/stablecoins",
    backing: {
        method: "not-tracked",
        description:
            "Anchorage Digital publishes monthly reserve reports, but bcked does not record them yet.",
        reference: "https://docs.anchorage.com/knowledge-base/platform/users/stablecoins",
    },
    tags: ["stablecoin", "real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
