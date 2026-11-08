/**
 * Open USD (OUSD) on Ethereum, Base, Solana and Tempo, a US dollar stablecoin of Open Standard,
 * issued by Bridge. Bridge lists the addresses on its transparency page
 * (https://reserves.bridge.xyz/ousd). Supply is read on-chain. The price is the Chainlink OUSD/USD
 * feed.
 *
 * The backing comes from Bridge's public transparency API (src/crawler/adapters/bridge.ts), which
 * states the reserves and the total on-chain supply for all chains. Each chain gets its share by
 * supply.
 */
const details: bcked.token.Details = {
    name: "Open USD",
    symbol: "OUSD",
    identifier: "ousd",
    issuer: "bridge",
    reference: "https://reserves.bridge.xyz/ousd",
    tags: ["stablecoin", "real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
