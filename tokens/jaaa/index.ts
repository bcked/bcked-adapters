/**
 * Janus Henderson Anemoy AAA CLO Fund (JAAA) on Ethereum and Base. The fund is managed by Anemoy and
 * holds AAA-rated collateralized loan obligations (https://www.anemoy.io/funds/jaaa). Its shares are
 * issued as tokens through the Centrifuge protocol (pool 281474976710663, share class
 * 0x00010000000000070000000000000001). Centrifuge's governance spells name the token address
 * (JAAA_SHARE_TOKEN) on Ethereum and Base: https://github.com/centrifuge/protocol/blob/72a8acfdbb2510da72aba6045c054f6b9a8afe7e/env/spell/005_ethereum_0x1e860a8108c95be344f49ad1501fb281d8b6bfbb.sol
 *
 * Supply is read on-chain on each chain. The price is the net asset value per share from the
 * Chainlink JAAA NAV feed on Ethereum.
 *
 * The fund's holdings are not recorded, as for JTRSY: Anemoy's website publishes no holdings, and the
 * Centrifuge website and app, which show them, answer automated requests with a bot check.
 */
const details: bcked.token.Details = {
    name: "Janus Henderson Anemoy AAA CLO Fund",
    symbol: "JAAA",
    identifier: "jaaa",
    issuer: "anemoy",
    reference: "https://www.anemoy.io/funds/jaaa",
    backing: {
        method: "not-tracked",
        description: "Anemoy publishes no holdings of the fund that bcked can record.",
        reference: "https://www.anemoy.io/funds/jaaa",
    },
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
