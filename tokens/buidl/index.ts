/**
 * BlackRock USD Institutional Digital Liquidity Fund (BUIDL) on every tracked chain. BlackRock lists the
 * token addresses on its website. Supply is read on-chain on each chain.
 *
 * There is no price: BUIDL has no Chainlink feed. The fund's holdings are not recorded: BlackRock's
 * website terms do not allow automated collection of its fund data, and Securitize's terms page could
 * not be read. BUIDL on Optimism, Aptos and Tempo is not tracked yet.
 */
const details: bcked.token.Details = {
    name: "BlackRock USD Institutional Digital Liquidity Fund",
    symbol: "BUIDL",
    identifier: "buidl",
    issuer: "blackrock",
    reference:
        "https://www.blackrock.com/corporate/compliance/scams-and-fraud/blackrock-token-addresses",
    backing: {
        method: "not-tracked",
        description: "BlackRock publishes the fund's holdings, but bcked does not record them yet.",
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
