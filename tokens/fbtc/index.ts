/**
 * Ignition FBTC on Ethereum and BNB Chain, bitcoin wrapped 1:1 by Ignition. The address, the same on
 * most chains, is listed in Ignition's docs (https://docs.fbtc.com/developers/smart-contracts). FBTC
 * on Mantle, Arbitrum, BOB, Base, Sonic, Plume, Pharos and Solana is not tracked yet. Supply is read
 * on-chain. The price is the Chainlink FBTC/BTC exchange rate in USD with BTC/USD.
 *
 * The backing is not recorded. Chainlink's FBTC Proof of Reserves feed on Ethereum reports the
 * bitcoin behind FBTC and behind Locked FBTC, the tokens partner protocols mint against bitcoin held
 * at their own reserve addresses. On 2026-11-07 it reported 8,323 BTC, while FBTC on all ten chains
 * and the Locked FBTC contracts listed in Ignition's docs came to about 6,082, so the share of FBTC on
 * each chain cannot be measured.
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
            "Chainlink's Proof of Reserves reports the bitcoin behind FBTC and Locked FBTC together, and the tokens Ignition lists do not add up to it, so the share of each chain is not recorded.",
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
