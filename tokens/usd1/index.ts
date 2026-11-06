/**
 * USD1 by World Liberty Financial, issued natively on Ethereum, BNB Chain, Solana, Tron, Aptos and
 * Tempo. The addresses are listed in World Liberty Financial's docs
 * (https://docs.worldlibertyfinancial.com/usd1-token/contract-addresses), the Tempo address in its MIT
 * licensed proof of reserves dashboard (https://github.com/worldliberty/cre-por-dashboard). On the
 * other chains USD1 is minted against USD1 locked in Chainlink CCIP pools on a native chain, so the
 * supply on the native chains counts it once. Supply is read on-chain. The price is the Chainlink
 * USD1/USD feed.
 *
 * The backing is the reserves reported by a Chainlink oracle on Ethereum, named in that dashboard,
 * for USD1 on all chains together. Each native chain gets the share that matches its supply
 * (src/crawler/adapters/por_share.ts).
 */
import type { PorFeed } from "../../src/crawler/adapters/por_share";

export const USD1_POR: PorFeed = {
    address: "0x691b74146cdba162449012aa32d3cbf5df77d4c4",
    system: "ethereum",
    underlying: "rwa:USD",
    bundle: true,
};

export const USD1_ASSETS: bcked.asset.Id[] = [
    "ethereum:0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
    "bsc:0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
    "solana:USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB",
    "tron:TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc",
    "aptos:0x05fabd1b12e39967a3c24e91b7b8f67719a6dacee74f3c8b9fb7d93e855437d2",
    "tempo:0x20C000000000000000000000111111111E910F0f",
];

const details: bcked.token.Details = {
    name: "USD1",
    symbol: "USD1",
    identifier: "usd1",
    issuer: "world-liberty-financial",
    reference: "https://docs.worldlibertyfinancial.com/usd1-token/proof-of-reserves",
    backing: {
        method: "custodian",
        description:
            "A Chainlink oracle reports the reserves behind USD1 on all chains together. Each chain gets the share that matches its supply.",
        reference: "https://docs.worldlibertyfinancial.com/usd1-token/proof-of-reserves",
    },
    tags: ["stablecoin", "real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
