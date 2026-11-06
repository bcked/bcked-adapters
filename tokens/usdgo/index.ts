/**
 * USDGO on Ethereum and Solana, a US dollar stablecoin issued by Anchorage Digital Bank, N.A. with OSL.
 * The addresses are listed in Anchorage Digital's stablecoin documentation
 * (https://docs.anchorage.com/knowledge-base/platform/users/stablecoins). USDGO on Morph is not tracked:
 * bcked does not read Morph. Supply is read on-chain. There is no Chainlink feed for USDGO, so no price
 * is recorded.
 *
 * The reserves are reported monthly (https://www.anchorage.com/platform/usdgo-reserve-attestations),
 * but Anchorage Digital's terms do not allow automated collection
 * (https://www.anchorage.com/terms-and-conditions), so the backing is not recorded yet.
 */
const details: bcked.token.Details = {
    name: "USDGO",
    symbol: "USDGO",
    identifier: "usdgo",
    issuer: "anchorage",
    reference: "https://www.anchorage.com/platform/usdgo-reserve-attestations",
    backing: {
        method: "not-tracked",
        description:
            "Anchorage Digital publishes monthly reserve reports, but bcked does not record them yet.",
        reference: "https://www.anchorage.com/platform/usdgo-reserve-attestations",
    },
    tags: ["stablecoin", "real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
