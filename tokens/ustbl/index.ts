/**
 * Spiko US T-Bills Money Market Fund (USTBL) on every tracked chain. Spiko lists the token addresses
 * in its contracts repositories (https://github.com/spiko-tech). Supply is read on-chain on each chain.
 * The price is the net asset value per share from the Chainlink USTBL NAV feed on Ethereum.
 *
 * The fund's holdings are not recorded: the terms of use of Spiko's website could not be read, so its
 * fund data is not collected. USTBL on Etherlink, Starknet and Stellar is not tracked yet.
 */
const details: bcked.token.Details = {
    name: "Spiko US T-Bills Money Market Fund",
    symbol: "USTBL",
    identifier: "ustbl",
    issuer: "spiko",
    reference: "https://github.com/spiko-tech/contracts",
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
