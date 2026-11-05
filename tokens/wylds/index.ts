/**
 * Wrapped YLDS (wYLDS) of the Hastra protocol on Ethereum and Solana, see
 * src/crawler/adapters/hastra.ts. Hastra lists the contract addresses in its proof of reserves
 * (https://hastra.io/proof-of-reserves) and its integration guides on GitHub. Each chain has its
 * own vault that mints wYLDS 1:1 against USDC, so the supplies of the chains add up. The backing
 * comes from Hastra's proof of reserves for all chains together, and each chain asset gets its
 * share.
 * There is no Chainlink feed for wYLDS, so there is no price. The icons are generic placeholders.
 */
const details: bcked.token.Details = {
    name: "Wrapped YLDS",
    symbol: "wYLDS",
    identifier: "wylds",
    issuer: "hastra",
    reference: "https://hastra.io/proof-of-reserves",
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
