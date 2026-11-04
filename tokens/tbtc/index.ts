/**
 * tBTC by Threshold on every tracked chain, see src/crawler/adapters/tbtc.ts. The backing is the
 * bitcoin the tBTC Bridge has credited to the TBTCVault on Ethereum, read on-chain. Each chain asset
 * gets its share. tBTC on Starknet, OP Mainnet, Polygon, Sui and BOB is not tracked yet.
 */
const details: bcked.token.Details = {
    name: "tBTC",
    symbol: "tBTC",
    identifier: "tbtc",
    issuer: "threshold",
    reference: "https://docs.threshold.network/tbtc-v2",
    tags: ["bridged-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
