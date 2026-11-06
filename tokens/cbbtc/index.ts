/**
 * Coinbase Wrapped BTC (cbBTC) on Ethereum and Base, issued by Coinbase. The address, the same on
 * both chains, is listed in Coinbase's AgentKit repository (Apache-2.0):
 * https://github.com/coinbase/agentkit/blob/main/typescript/agentkit/src/action-providers/erc20/constants.ts
 * Supply is read on-chain on each chain. The price is the Chainlink cbBTC/USD feed.
 *
 * The backing is not recorded. Chainlink's cbBTC Proof of Reserves feed reports the bitcoin behind
 * cbBTC on all chains together (97,846 BTC on 2026-11-05), while Ethereum and Base held 95,083 cbBTC.
 * The rest is on chains whose cbBTC addresses Coinbase does not publish in a source bcked may read,
 * so the share of each tracked chain cannot be measured.
 */
const details: bcked.token.Details = {
    name: "Coinbase Wrapped BTC",
    symbol: "cbBTC",
    identifier: "cbbtc",
    issuer: "coinbase",
    reference: "https://data.chain.link/feeds/ethereum/mainnet/cbbtc-por",
    backing: {
        method: "not-tracked",
        description:
            "Chainlink's Proof of Reserves reports the bitcoin behind cbBTC on all chains together, but the cbBTC on chains bcked does not track cannot be measured, so the share of each tracked chain is not recorded.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/cbbtc-por",
    },
    tags: ["wrapped-token"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
