/**
 * Prices from Chainlink Data Feeds, read on-chain from the feed contracts on Ethereum, or on another
 * chain where a feed names one.
 * Feeds: https://docs.chain.link/data-feeds (addresses from Chainlink's feed directory).
 *
 * A token has the same price on every chain, so all chain versions of a token use its feed. Some
 * prices are derived from a feed: wstETH from stETH and the wstETH exchange rate, eETH from weETH and
 * the weETH exchange rate, WBTC from the
 * WBTC/BTC and BTC/USD feeds, XAUt (one troy ounce of gold per token) from gold. The euro (rwa:EUR)
 * is priced by the EUR/USD feed, silver (rwa:XAG) by the XAG/USD feed.
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../chains/proxy";
import { multicall, type Call } from "../chains/multicall";
import { toId } from "../../utils/helper";
import { toISOString } from "../../utils/string_formatting";

const LATEST = "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)";

// Canonical Chainlink feeds on Ethereum, or on the chain given (USD prices, 8 decimals unless noted).
export const FEEDS = {
    ETH: { address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", decimals: 8 },
    WEETH_ETH: { address: "0x5c9C449BbC9a6075A2c061dF312a35fd1E05fF22", decimals: 18 }, // weETH in ETH
    BTC: { address: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", decimals: 8 },
    WBTC_BTC: { address: "0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23", decimals: 8 },
    USDT: { address: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D", decimals: 8 },
    USDC: { address: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", decimals: 8 },
    DAI: { address: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", decimals: 8 },
    USDS: { address: "0xfF30586cD0F29eD462364C7e81375FC0C71219b1", decimals: 8 },
    PYUSD: { address: "0x8f1dF6D7F2db73eECE86a18b4381F4707b918FB1", decimals: 8 },
    RLUSD: { address: "0x26C46B7aD0012cA71F2298ada567dC9Af14E7f2A", decimals: 8 },
    AUSD: { address: "0xB00341502DfEA6Ced8A5786b4059d29dA5E4D1FD", decimals: 18 },
    USDE: { address: "0xa569d910839Ae8865Da8F8e70FfFb0cBA869F961", decimals: 8 },
    SUSDE: { address: "0xFF3BC18cCBd5999CE63E788A1c250a88626aD099", decimals: 8 },
    USDF: { address: "0xb177857a1799aA5F7fEb5799Fdf12CbE8fdF78B1", decimals: 8 },
    GHO: { address: "0x3f12643D3f6f874d39C2a4c9f2Cd6f2DbAC877FC", decimals: 8 },
    USD0: { address: "0x7e891DEbD8FA0A4Cf6BE58Ddff5a8ca174FebDCB", decimals: 8 },
    CBBTC: { address: "0x2665701293fCbEB223D11A08D826563EDcCE423A", decimals: 8 },
    FBTC_BTC: { address: "0xe5346a4Fd329768A99455d969724768a00CA63FB", decimals: 18 }, // FBTC in BTC
    LBTC_BTC: { address: "0x5c29868C58b6e15e2b962943278969Ab6a7D3212", decimals: 8 }, // LBTC in BTC
    USD1: { address: "0xF0d9bb015Cd7BfAb877B7156146dc09Bf461370d", decimals: 8 },
    USDTB: { address: "0x66704DAD467A7cA508B3be15865D9B9F3E186c90", decimals: 8 },
    TUSD: { address: "0xec746eCF986E2927Abd291a2A1716c940100f8Ba", decimals: 8 },
    USYC: { address: "0xE8E65Fb9116875012F5990Ecaab290B3531DbeB9", decimals: 8 }, // NAV (Aave LlamaGuard)
    U: { address: "0xF6351B2dCF0110E76c71C1d319Af2f410454B6f3", decimals: 18 },
    OUSD: { address: "0xaf0311CCc42d22D2624fEC8024119cb71bBc7418", decimals: 8 }, // Open USD
    USDG: { address: "0x14f0737d6b705259e521EA6E9E3506AC78dBd311", decimals: 8 },
    EURC: { address: "0x04F84020Fdf10d9ee64D1dcC2986EDF2F556DA11", decimals: 8 },
    EUR: { address: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1", decimals: 8 },
    SKY: { address: "0xee10fE5E7aa92dd7b136597449c3d5813cFC5F18", decimals: 8 },
    PAXG: { address: "0x9944D86CEB9160aF5C5feB251FD671923323f8C3", decimals: 8 },
    XAU: { address: "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6", decimals: 8 },
    XAG: { address: "0x379589227b15F1a12195D3f2d90bBc9F31f95235", decimals: 8 },
    STETH: { address: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8", decimals: 8 },
    STRC: { address: "0xf4d2076277fff631EFC4385Ab36b1f7734218d23", decimals: 8 },
    USTBL: { address: "0x477e363c51Ab0C4D13B22CD6B57D56d4a3Cb7Abe", decimals: 6 }, // NAV per share
    M: { address: "0xC28198Df9aee1c4990994B35ff51eFA4C769e534", decimals: 8 }, // M NAV
    JTRSY: { address: "0x0C2e4Df738e99e8db80012f5bb2a303f3f48Ca74", decimals: 6 }, // NAV per share
    JAAA: { address: "0x3BbccB2301759D2e4A5692bA72DAb4b75dC43B1a", decimals: 6 }, // NAV per share
    SUPERSTATE_USTB: { address: "0x289B5036cd942e619E1Ee48670F98d214E745AAC", decimals: 6 }, // NAV per share
    TBILL: { address: "0xAbE7a3643615Ed32d3431e11E0Ee5A486Cb27d48", decimals: 8 }, // NAV per token
    APXUSD: { address: "0x651b101f72F82630cf59c68E6EE4305aFBd3B1F5", decimals: 18 }, // Exchange Rate
    TBTC: { address: "0x8350b7De6a6a2C1368E7D4Bd968190e13E354297", decimals: 8 },
    USDAI: {
        address: "0xF3d6b05E69918d71807Ab005791daCcEC5de8C78",
        decimals: 8,
        chain: "arbitrum",
    },
    // frxETH in ETH, Chainlink's frxETH-ETH exchange rate feed (the "Low" one, the plain rate; the
    // "High" feed is an upper band).
    FRXETH_ETH: {
        address: "0x1bD872f3A606471787B1a304cE0356e4e87Af930",
        decimals: 18,
        chain: "arbitrum",
    },
    // syrupUSDC in USDC, Chainlink's exchange rate feed on Arbitrum.
    // USDD in USDC, Chainlink's exchange rate feed.
    USDD_USDC: { address: "0xBfC7d98Eea35380ceEC0a1DC1702Ea186723602C", decimals: 18 },
    SYRUPUSDC_USDC: {
        address: "0xF8722c901675C4F2F7824E256B8A6477b2c105FB",
        decimals: 18,
        chain: "arbitrum",
    },
} as const;
type Feed = keyof typeof FEEDS;

/** The chain a feed is read on. */
export function feedChain(feed: Feed): bcked.system.Id {
    const source = FEEDS[feed];
    return "chain" in source ? source.chain : "ethereum";
}

const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const ST_ETH_PER_TOKEN = "function stEthPerToken() view returns (uint256)";
// Wrapped eETH, from ether.fi's deployed contracts:
// https://etherfi.gitbook.io/etherfi/developers/contracts-and-integrations/deployed-contracts
export const WEETH = "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee";
const EETH_PER_WEETH = "function getRate() view returns (uint256)";

/** How each asset is priced: a feed, or a feed times a factor read on-chain. */
interface Source {
    feed: Feed;
    times?: Feed | "wstETH";
    /** Divided by eETH per weETH, read on-chain: eETH from the weETH price. */
    per?: "weETH";
}

const BY_SYMBOL: Record<string, Source> = {
    CBBTC: { feed: "CBBTC" },
    FBTC: { feed: "FBTC_BTC", times: "BTC" },
    LBTC: { feed: "LBTC_BTC", times: "BTC" },
    USD1: { feed: "USD1" },
    USDTB: { feed: "USDTB" },
    TUSD: { feed: "TUSD" },
    USDD: { feed: "USDD_USDC", times: "USDC" },
    USYC: { feed: "USYC" },
    U: { feed: "U" },
    OUSD: { feed: "OUSD" },
    USDT: { feed: "USDT" },
    USDC: { feed: "USDC" },
    PYUSD: { feed: "PYUSD" },
    USDG: { feed: "USDG" },
    EURC: { feed: "EURC" },
    RLUSD: { feed: "RLUSD" },
    USTBL: { feed: "USTBL" },
    M: { feed: "M" },
    USDAI: { feed: "USDAI" },
    JTRSY: { feed: "JTRSY" },
    JAAA: { feed: "JAAA" },
    USTB: { feed: "SUPERSTATE_USTB" },
    TBILL: { feed: "TBILL" },
    APXUSD: { feed: "APXUSD" },
    TBTC: { feed: "TBTC" },
};

// Assets by id. Chain versions of USDT, USDC, PYUSD, USDG, EURC, RLUSD, USTBL, M, USDai and TBILL are
// added below from TOKEN_ASSETS.
export const PRICE_SOURCES: Record<string, Source> = {
    "ethereum:ETH": { feed: "ETH" },
    "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": { feed: "ETH" }, // WETH
    "bitcoin:BTC": { feed: "BTC" },
    "ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": { feed: "WBTC_BTC", times: "BTC" },
    "ethereum:0x6B175474E89094C44Da98b954EedeAC495271d0F": { feed: "DAI" },
    "ethereum:0xdC035D45d973E3EC169d2276DDab16f1e407384F": { feed: "USDS" },
    "ethereum:0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a": { feed: "AUSD" },
    "ethereum:0x4c9EDD5852cd905f086C759E8383e09bff1E68B3": { feed: "USDE" },
    "ethereum:0x9D39A5DE30e57443BfF2A8307A4256c8797A3497": { feed: "SUSDE" },
    "ethereum:0xFa2B947eEc368f42195f24F36d2aF29f7c24CeC2": { feed: "USDF" },
    "ethereum:0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f": { feed: "GHO" },
    "ethereum:0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5": { feed: "USD0" },
    "ethereum:0x56072C95FAA701256059aa122697B133aDEd9279": { feed: "SKY" },
    "ethereum:0x45804880De22913dAFE09f4980848ECE6EcbAf78": { feed: "PAXG" },
    "ethereum:0x68749665FF8D2d112Fa859AA293F07A622782F38": { feed: "XAU" }, // XAUt
    "rwa:XAU": { feed: "XAU" },
    "rwa:XAG": { feed: "XAG" }, // silver, the backing of KAG
    "rwa:EUR": { feed: "EUR" },
    "rwa:STRC": { feed: "STRC" }, // Strategy's STRC preferred share, the collateral of STRCx
    "ethereum:0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": { feed: "STETH" },
    [`ethereum:${WSTETH}`]: { feed: "STETH", times: "wstETH" },
    // frxETH on Ethereum: the frxETH-ETH feed on Arbitrum in USD.
    "ethereum:0x5E8422345238F34275888049021821E8E08CAa1f": { feed: "FRXETH_ETH", times: "ETH" },
    "ethereum:0x80ac24aA929eaF5013f6436cdA2a7ba190f5Cc0b": {
        feed: "SYRUPUSDC_USDC",
        times: "USDC",
    },
    // eETH: the weETH/ETH feed in USD, divided by the eETH one weETH holds.
    "ethereum:0x35fA164735182de50811E8e2E824cFb9B6118ac2": {
        feed: "WEETH_ETH",
        times: "ETH",
        per: "weETH",
    },
};

// Chain versions of tokens that share one price.
const TOKEN_ASSETS: Record<string, string[]> = {
    USDD: [
        "tron:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz",
        "ethereum:0x4f8e5DE400DE08B164E7421B3EE387f461beCD1A",
        "bsc:0x45E51bc23D592EB2DBA86da3985299f7895d66Ba",
    ],
    TUSD: [
        "ethereum:0x0000000000085d4780B73119b644AE5ecd22b376",
        "bsc:0x40af3827F39D0EAcBF4A168f8D4ee67c121D11c9",
        "avalanche:0x1C20E891Bab6b1727d14Da358FAe2984Ed9B59EB",
        "tron:TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4",
    ],
    USTB: [
        "ethereum:0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e",
        "plume:0xe4fa682f94610ccd170680cc3b045d77d9e528a8",
        "solana:CCz3SGVziFeLYk2xfEstkiqJfYkjaSWb2GCABYsVcjo2",
    ],
    USDTB: [
        "ethereum:0xC139190F447e929f090Edeb554D95AbB8b18aC1C",
        "solana:8yXrtJ54jZtE84xEBzTESKuegjcAkAuDrdAhRd8i8n3T",
    ],
    LBTC: [
        "ethereum:0x8236a87084f8B84306f72007F36F2618A5634494",
        "base:0xecAc9C5F704e954931349Da37F60E39f515c11c1",
        "avalanche:0xecAc9C5F704e954931349Da37F60E39f515c11c1",
        "bsc:0xecAc9C5F704e954931349Da37F60E39f515c11c1",
        "solana:LBTCgU4b3wsFKsPwBn1rRZDx5DoFutM6RPiEt1TPDsY",
    ],
    JAAA: [
        "ethereum:0x5a0F93D040De44e78F251b03c43be9CF317Dcf64",
        "base:0x5a0F93D040De44e78F251b03c43be9CF317Dcf64",
    ],
    FBTC: [
        "ethereum:0xC96dE26018A54D51c097160568752c4E3BD6C364",
        "bsc:0xC96dE26018A54D51c097160568752c4E3BD6C364",
    ],
    OUSD: [
        "ethereum:0x9f6F3991D525015a6F8CaF062C83b62fD3AC4436",
        "base:0xB2000000000000000000002fEb517dFeC7415344",
        "solana:ousd2mJsPEckLHcSCDxyKD7NDGARZcfLbDZkKiatYHB",
    ],
    U: [
        "bsc:0xcE24439F2D9C6a2289F741120FE202248B666666",
        "ethereum:0xcE24439F2D9C6a2289F741120FE202248B666666",
        "tron:TFNirp6PbqYE1ZTtWuCMUKJWLNZkoCoeFJ",
    ],
    USYC: [
        "ethereum:0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b",
        "bsc:0x8D0fA28f221eB5735BC71d3a0Da67EE5bC821311",
        "solana:7LWanZteUKtvFjv4MHYgKXXdAuCQYFPJysL9pxxdRQGn",
    ],
    USD1: [
        "ethereum:0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
        "bsc:0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
        "solana:USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB",
    ],
    CBBTC: [
        "ethereum:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "base:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    ],
    USDT: [
        "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        "solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    ],
    USDC: [
        "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "arbitrum:0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        "polygon:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    ],
    PYUSD: [
        "ethereum:0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
        "solana:2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
        "arbitrum:0x46850aD61C2B7d64d08c9C754F45254596696984",
    ],
    USDG: [
        "ethereum:0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
        "solana:2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
        "xlayer:0x4ae46a509F6b1D9056937BA4500cb143933D2dc8",
        "robinhood:0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
        "ink:0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
    ],
    EURC: [
        "ethereum:0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
        "base:0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
        "solana:HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
    ],
    RLUSD: [
        "ethereum:0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
        "xrpl:RLUSD.rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
    ],
    USTBL: [
        "ethereum:0xe4880249745eAc5F1eD9d8F7DF844792D560e750",
        "polygon:0xe4880249745eAc5F1eD9d8F7DF844792D560e750",
        "base:0xe4880249745eAc5F1eD9d8F7DF844792D560e750",
        "arbitrum:0x021289588cd81dC1AC87ea91e91607eEF68303F5",
    ],
    M: [
        "ethereum:0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b",
        "arbitrum:0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b",
        "base:0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b",
    ],
    USDAI: [
        "arbitrum:0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF",
        "ethereum:0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF",
        "base:0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF",
        "solana:USDai5XCUzNebYzUk6EuRiFCvnyoyEdj7VSyijYcz2A",
    ],
    JTRSY: [
        "ethereum:0x8c213ee79581Ff4984583C6a801e5263418C4b86",
        "base:0x8c213ee79581Ff4984583C6a801e5263418C4b86",
        "arbitrum:0x8c213ee79581Ff4984583C6a801e5263418C4b86",
        "bsc:0xa5d465251fBCc907f5Dd6bB2145488DFC6a2627b",
        "plume:0xa5d465251fBCc907f5Dd6bB2145488DFC6a2627b",
    ],
    TBILL: [
        "ethereum:0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a",
        "bsc:0x5b4681F0d7A01B817675F25892D3Ad73572FD1D9",
    ],
    APXUSD: [
        "ethereum:0x98A878b1Cd98131B271883B390f68D2c90674665",
        "base:0xD993935E13851dd7517af10687EC7e5022127228",
        "bsc:0x6b3788Fd6604BBF03c5378D24e57BB334BAAD4aF",
        "solana:HAYQtfJEQ9DbDbaHEhxfGsWbSZ3ywthdsVB3PuB72DYe",
    ],
    TBTC: [
        "ethereum:0x18084fbA666a33d37592fA2633fD49a74DD93a88",
        "arbitrum:0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40",
        "base:0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b",
        "solana:6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU",
    ],
};
for (const [symbol, ids] of Object.entries(TOKEN_ASSETS))
    for (const id of ids) PRICE_SOURCES[id] = BY_SYMBOL[symbol]!;

// The latest feed values, read once per process and shared by all assets of a crawl.
let latest: Promise<{
    feeds: Record<Feed, { usd: number; updatedAt: number }>;
    rate: number;
    weEthRate: number;
}> | null = null;

export class Chainlink implements bcked.query.ApiModule {
    chain = new ChainProxy();

    private latest() {
        latest ??= Promise.all([
            this.readFeeds(Object.keys(FEEDS) as Feed[]),
            this.wstEthRate(),
            this.weEthRate(),
        ])
            .then(([feeds, rate, weEthRate]) => ({ feeds, rate, weEthRate }))
            .catch((error: unknown) => {
                latest = null;
                throw error;
            });
        return latest;
    }

    /**
     * Latest answer of each feed, at the given Ethereum block (latest if omitted). Feeds on other
     * chains are read at their latest block.
     */
    async readFeeds(
        feeds: Feed[],
        blockTag?: number
    ): Promise<Record<Feed, { usd: number; updatedAt: number }>> {
        const values: Partial<Record<Feed, { usd: number; updatedAt: number }>> = {};
        const chains = [...new Set(feeds.map(feedChain))];
        for (const system of chains) {
            const onChain = feeds.filter((feed) => feedChain(feed) == system);
            const calls: Call[] = onChain.map((feed) => ({
                target: FEEDS[feed].address,
                signature: LATEST,
            }));
            const block = system == "ethereum" ? blockTag : undefined;
            const results = await multicall(this.chain, system, calls, block);
            onChain.forEach((feed, i) => {
                const [, answer, , updatedAt] = results[i]! as unknown as [
                    bigint,
                    bigint,
                    bigint,
                    bigint,
                ];
                values[feed] = {
                    usd: parseFloat(formatUnits(answer, FEEDS[feed].decimals)),
                    updatedAt: Number(updatedAt) * 1000,
                };
            });
        }
        return values as Record<Feed, { usd: number; updatedAt: number }>;
    }

    /** stETH per wstETH, at the given block. */
    async wstEthRate(blockTag?: number): Promise<number> {
        const [rate] = await multicall(
            this.chain,
            "ethereum",
            [{ target: WSTETH, signature: ST_ETH_PER_TOKEN }],
            blockTag
        );
        return parseFloat(formatUnits(rate![0] as bigint, 18));
    }

    /** eETH per weETH, at the given block. */
    async weEthRate(blockTag?: number): Promise<number> {
        const [rate] = await multicall(
            this.chain,
            "ethereum",
            [{ target: WEETH, signature: EETH_PER_WEETH }],
            blockTag
        );
        return parseFloat(formatUnits(rate![0] as bigint, 18));
    }

    async getPrices(
        identifiers: bcked.asset.Identifier[]
    ): Promise<Partial<Record<bcked.asset.Id, bcked.asset.Price>>> {
        const wanted = identifiers
            .map((identifier) => [toId(identifier), PRICE_SOURCES[toId(identifier)]] as const)
            .filter((entry): entry is readonly [bcked.asset.Id, Source] => !!entry[1]);
        if (!wanted.length) return {};

        const { feeds: values, rate, weEthRate } = await this.latest();

        return Object.fromEntries(
            wanted.map(([id, source]) => {
                const base = values[source.feed];
                const factor =
                    (source.times == "wstETH"
                        ? rate
                        : source.times
                          ? values[source.times].usd
                          : 1) / (source.per == "weETH" ? weEthRate : 1);
                // A feed's latest answer is its valid price at the time it is read, even when the
                // feed last updated hours ago (feeds update on a deviation or once a day).
                return [id, { timestamp: toISOString(Date.now()), usd: base.usd * factor }];
            })
        );
    }

    async getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price | undefined> {
        return (await this.getPrices([identifier]))[toId(identifier)];
    }
}
