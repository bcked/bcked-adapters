/**
 * Ignition FBTC on Ethereum and BNB Chain, bitcoin wrapped 1:1 by Ignition. The address, the same on
 * every chain, is listed in Ignition's docs (https://docs.fbtc.com/). FBTC on Mantle, Arbitrum, Base
 * and Sonic is not tracked: bcked does not read Mantle and Sonic, and the docs list no FBTC contract
 * for the others. Supply is read on-chain. The price is the Chainlink FBTC/BTC exchange rate in USD
 * with BTC/USD.
 *
 * The backing is not recorded. Chainlink's FBTC Proof of Reserves feed on Ethereum reports the bitcoin
 * behind FBTC on all chains together, and a large part of FBTC is on Mantle, so the share of each
 * tracked chain cannot be measured.
 */
const details: bcked.token.Details = {
    name: "Ignition FBTC",
    symbol: "FBTC",
    identifier: "fbtc",
    issuer: "ignition",
    reference: "https://docs.fbtc.com/",
    backing: {
        method: "not-tracked",
        description:
            "Chainlink's Proof of Reserves reports the bitcoin behind FBTC on all chains together, but the FBTC on Mantle, which bcked does not track, cannot be measured, so the share of each tracked chain is not recorded.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/fbtc-por",
    },
    tags: ["wrapped-token"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
