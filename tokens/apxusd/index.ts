/**
 * apxUSD by Apyx on every tracked chain. Apyx lists the contracts in its docs:
 * https://docs.apyx.fi/resources/smart-contract-addresses
 *
 * apxUSD is issued on Ethereum and moves to other chains through Chainlink CCIP: it is locked in a
 * Lock & Release pool on Ethereum and minted on the other chain. The backing (preferred shares such as
 * Strategy's STRC, STRCx and cash) is held off-chain and in wallets of the issuer and is not recorded
 * yet. apxUSD on Monad is not tracked yet.
 */
const details: bcked.token.Details = {
    name: "apxUSD",
    symbol: "apxUSD",
    identifier: "apxusd",
    issuer: "apyx",
    reference: "https://docs.apyx.fi/product-overview/apxusd-overview",
    backing: {
        method: "not-tracked",
        description:
            "The reserves of apxUSD, preferred shares and cash held by the issuer, are not recorded yet.",
        reference: "https://docs.apyx.fi/product-overview/apxusd-overview",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
