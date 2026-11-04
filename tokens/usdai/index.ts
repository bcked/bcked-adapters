/**
 * USDai by USD.AI on every tracked chain, see src/crawler/adapters/usdai.ts. The backing is PYUSD
 * held by the USDai contract on Arbitrum, read on-chain. Each chain asset gets its share. USDai on
 * Plasma is not tracked yet.
 */
const details: bcked.token.Details = {
    name: "USDai",
    symbol: "USDai",
    identifier: "usdai",
    issuer: "usdai",
    reference: "https://docs.usd.ai/depositor/usdai",
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
