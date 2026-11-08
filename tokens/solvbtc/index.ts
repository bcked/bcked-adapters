/**
 * SolvBTC by Solv Protocol, bitcoin wrapped 1:1, on Ethereum and BNB Chain. Solv deploys it through a
 * SolvBTCFactory per chain, listed in its MIT-licensed repository
 * (https://github.com/solv-finance/SolvBTC, deployments/<chain>/SolvBTCFactory.json); the token is
 * the factory's getProxy("Solv BTC", "Solv BTC"), read on-chain. On 2026-11-08 Ethereum (2,386) and
 * BNB Chain (2,494) held almost all SolvBTC on the chains bcked reads; Avalanche, Soneium,
 * Arbitrum, Rootstock and others held less than 30 each and are not tracked. Supply is read
 * on-chain. The price is the Chainlink solvBTC/BTC feed in USD with BTC/USD.
 *
 * The backing is not recorded. Chainlink's SolvBTC Proof of Reserves on Ethereum reports the bitcoin
 * behind SolvBTC on all chains together (6,193 BTC on 2026-11-08), while the chains bcked reads held
 * 4,949 SolvBTC. The rest is on chains bcked does not read (Merlin, Bitlayer, Core and others), so
 * the share of each tracked chain cannot be measured.
 */
const details: bcked.token.Details = {
    name: "Solv BTC",
    symbol: "SolvBTC",
    identifier: "solvbtc",
    issuer: "solv",
    reference: "https://github.com/solv-finance/SolvBTC",
    backing: {
        method: "not-tracked",
        description:
            "Chainlink's Proof of Reserves reports the bitcoin behind SolvBTC on all chains together, but part of SolvBTC is on chains bcked does not read, so the share of each tracked chain is not recorded.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/solvbtc-por",
    },
    tags: [],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
