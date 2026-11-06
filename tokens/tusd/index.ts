/**
 * TrueUSD (TUSD), a US dollar stablecoin issued by Techteryx. The addresses of the natively issued
 * chains (Ethereum, Tron, Avalanche, BNB Chain and an older BNB Chain contract) are listed on the
 * TrueUSD website (https://tusd.io/). TUSD on Polygon, Arbitrum and other chains is bridged from
 * these and not tracked separately. Supply is read on-chain. The price is the Chainlink TUSD/USD
 * feed.
 *
 * The backing is Chainlink's TUSD Reserves feed on Ethereum, which reports the reserves for all
 * chains together. Each chain gets the share that matches its supply
 * (src/crawler/adapters/por_share.ts). The older BNB Chain contract counts toward the total but
 * has no asset of its own. The TrueUSD transparency pages are not used: their terms do not allow
 * automated copying.
 */
import type { PorFeed } from "../../src/crawler/adapters/por_share";

export const TUSD_POR: PorFeed = {
    address: "0xBE456fd14720C3aCCc30A2013Bffd782c9Cb75D5",
    system: "ethereum",
    underlying: "rwa:USD",
};

export const TUSD_ASSETS: bcked.asset.Id[] = [
    "ethereum:0x0000000000085d4780B73119b644AE5ecd22b376",
    "bsc:0x40af3827F39D0EAcBF4A168f8D4ee67c121D11c9",
    "avalanche:0x1C20E891Bab6b1727d14Da358FAe2984Ed9B59EB",
    "tron:TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4",
    "bsc:0x14016E85a25aeb13065688cAFB43044C2ef86784",
];

const details: bcked.token.Details = {
    name: "TrueUSD",
    symbol: "TUSD",
    identifier: "tusd",
    issuer: "techteryx",
    reference: "https://tusd.io/",
    backing: {
        method: "custodian",
        description:
            "Chainlink's Proof of Reserves feed reports the reserves behind TUSD on all chains together. Each chain gets the share that matches its supply.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/tusd-por",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
