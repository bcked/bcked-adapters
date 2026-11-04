/**
 * Janus Henderson Anemoy Treasury Fund (JTRSY) on every tracked chain. The fund is managed by
 * Anemoy and holds US Treasury bills with a maturity of up to six months
 * (https://www.anemoy.io/funds/jtrsy). Its shares are issued as tokens through the Centrifuge
 * protocol (pool 281474976710662, share class 0x00010000000000060000000000000001). The token
 * addresses are those the Centrifuge Spoke contract (0xd30Da1d7F964E5f6C2D9fE2AAA97517F6B23FA2B)
 * returns on each chain, as named in Centrifuge's governance spells:
 * https://github.com/centrifuge/protocol/tree/main/env/spell
 *
 * Supply is read on-chain on each chain. The price is the net asset value per share from the
 * Chainlink JTRSY NAV feed on Ethereum.
 *
 * The fund's holdings are not recorded: Anemoy's website publishes no holdings, and the Centrifuge
 * website and app, which show them, answer automated requests with a bot check, so their terms
 * could not be read. JTRSY on Avalanche (one share on 2026-11-04) and on chains without a
 * configured RPC is not tracked.
 */
const details: bcked.token.Details = {
    name: "Janus Henderson Anemoy Treasury Fund",
    symbol: "JTRSY",
    identifier: "jtrsy",
    issuer: "anemoy",
    reference: "https://www.anemoy.io/funds/jtrsy",
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
