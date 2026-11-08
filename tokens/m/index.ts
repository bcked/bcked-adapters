/**
 * M by M0 on every tracked chain, see src/crawler/adapters/m0.ts. The backing is the collateral of
 * the minters recorded by the MinterGateway on Ethereum, read on-chain. Each chain asset gets its
 * share. M on OP Mainnet, Sei, Plasma, Solana, Noble, Hyperliquid and Plume is not tracked yet.
 */
const details: bcked.token.Details = {
    name: "M by M0",
    symbol: "M",
    identifier: "m",
    issuer: "m0",
    reference: "https://docs.m0.org/protocol/m-token",
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
