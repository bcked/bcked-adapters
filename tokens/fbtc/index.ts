/**
 * Ignition FBTC, bitcoin wrapped 1:1 by Ignition. The address, the same on most chains, is listed in
 * Ignition's docs (https://docs.fbtc.com/developers/smart-contracts). FBTC on Ethereum and BNB Chain
 * is tracked; the supply on the other chains is read for the shares below. Supply is read on-chain.
 * The price is the Chainlink FBTC/BTC exchange rate in USD with BTC/USD.
 *
 * The backing is Chainlink's FBTC Proof of Reserves feed on Ethereum (named in Ignition's docs). It
 * reports the bitcoin behind FBTC and behind Locked FBTC, tokens partner protocols mint by burning
 * FBTC (https://docs.fbtc.com/ecosystem/locked-fbtc-token). Each chain gets the share of FBTC_ASSETS
 * (all FBTC and Locked FBTC) that matches its supply. Ignition's list of Locked FBTC contracts misses
 * some; the ones marked below were found as contracts that burn FBTC and return it from fbtc(). On
 * 2026-11-08 the feed reported 8,322.7 BTC and these tokens held 8,322.6. FBTC on Solana is left
 * out: it is a bridged copy, and counting it went 162 BTC over the feed.
 */
import type { PorFeed } from "../../src/crawler/adapters/por_share";

export const FBTC_POR: PorFeed = {
    address: "0x75A0d3264a949C2C920d7F25Df174af1FaF73399",
    system: "ethereum",
    underlying: "bitcoin:BTC",
};

export const FBTC_ASSETS: bcked.asset.Id[] = [
    "ethereum:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "bsc:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "mantle:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "arbitrum:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "bob:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "base:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "sonic:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "plume:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    "pharos:0xd990cf81e9aea2417326fdfac12b19aa66f8b6c2",
    "ethereum:0x3119a1AD5B63A000aB9CA3F2470611eB997B93B9", // Avalon
    "ethereum:0xd681C5574b7F4E387B608ed9AF5F5Fc88662b37c", // Bedrock
    "ethereum:0xEb28877D7e3DbA5bcd4D0a1474C31F8AFb2d6052", // Solv Babylon
    "ethereum:0x777B2913b1BB171A83cA3cdf79CB40523Ac76fDb", // PumpBTC
    "ethereum:0xc152d5a599f83b3d0098cbadb23fce95f27ff30b", // Cian, not in the list
    "ethereum:0xfe4ecd930a1282325aef8e946f17c0e25744de45", // Lombard, not in the list
    "bsc:0x3119a1AD5B63A000aB9CA3F2470611eB997B93B9", // Avalon
    "bsc:0x2B25f4F134a56054b2b6388C2750F1eA3877e02b", // PumpBTC
    "bsc:0xEb28877D7e3DbA5bcd4D0a1474C31F8AFb2d6052", // Bedrock, not in the list
    "mantle:0x3119a1AD5B63A000aB9CA3F2470611eB997B93B9", // Avalon
    "mantle:0xd681C5574b7F4E387B608ed9AF5F5Fc88662b37c", // Bedrock
    "mantle:0x86680077DBC01eEd9C957470f89b2AB1dac72B53",
    "mantle:0x93C6afA1882ea5E5bF403cA8fcb5aF87409EeCd0",
    "bob:0xEE03e367bcB59A9b4c1c0ea495A2e9cAC36372C8", // Bedrock
    "bob:0xd681C5574b7F4E387B608ed9AF5F5Fc88662b37c", // PumpBTC
];

const details: bcked.token.Details = {
    name: "Ignition FBTC",
    symbol: "FBTC",
    identifier: "fbtc",
    issuer: "ignition",
    reference: "https://docs.fbtc.com/",
    backing: {
        method: "custodian",
        description:
            "Chainlink's Proof of Reserves reports the bitcoin behind FBTC and Locked FBTC together. Each chain gets the share that matches its supply.",
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
