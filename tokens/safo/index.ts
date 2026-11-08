/**
 * Spiko Amundi Overnight Swap Fund, USD share class "Spiko Dollar" (SAFO, ISIN FR0014015LE1), a
 * money market fund of Spiko, on Ethereum, Arbitrum, Polygon, Base and Solana. The Solana mint is in
 * Spiko's MIT-licensed solana-contracts repository (deployments/SAFO-mainnet-beta.json). The EVM
 * addresses were read once by hand from Spiko's public API (public-api.spiko.io/v0/share-classes),
 * as facts; the API's data itself is not used, since Spiko's terms allow it for internal use only.
 * SAFO on Etherlink, Stellar and Starknet is not tracked: bcked does not read these chains. The
 * other share classes of the fund (eurSAFO, gbpSAFO, ...) are separate tokens and not tracked.
 * Supply is read on-chain. The price is the net asset value per share in USD from the Chainlink
 * SAFO NAV feed on Ethereum.
 *
 * The fund's holdings are not recorded: Spiko publishes them on its website, whose terms could not
 * be read.
 */
const details: bcked.token.Details = {
    name: "Spiko Amundi Overnight Swap Fund (USD)",
    symbol: "SAFO",
    identifier: "safo",
    issuer: "spiko",
    reference:
        "https://github.com/spiko-tech/solana-contracts/blob/main/deployments/SAFO-mainnet-beta.json",
    backing: {
        method: "not-tracked",
        description: "Spiko publishes the fund's holdings, but bcked does not record them yet.",
        reference: null,
    },
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
