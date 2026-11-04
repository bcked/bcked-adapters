/**
 * Circulating supply of issuer tokens per chain, from sources that allow republishing.
 *
 * - USDT and XAUt: Tether's own figures per chain (https://app.tether.to/transparency.json): tokens
 *   issued on the chain less the tokens in Tether's treasury and the quarantined tokens. Tether's
 *   numbers are used as facts with attribution, like the figures from its reports.
 * - USDC, PYUSD and USDG: totalSupply of the token contract on the chain, read on-chain. These
 *   issuers mint on demand and hold no unissued tokens in a treasury.
 * - EURC on Solana: Circle's own figure per chain (https://api.circle.com/v1/stablecoins). The token
 *   on Solana also counts tokens that Circle has not issued yet ("Tokens Allowed But Not Issued" in
 *   its reports), so its totalSupply is more than the EURC in circulation.
 * - Tokens on the XRP Ledger: the issuer's obligations in the currency, read on-chain.
 * - KAU and KAG on the Kinesis ledgers: the coins in circulation (minted less redeemed), read on-chain.
 */
import { ChainProxy } from "../chains/proxy";
import { SolanaChain } from "../chains/solana";
import { JsonApi } from "../../utils/requests";

type TetherToken = Record<string, string | number>;
interface TetherTransparency {
    data: { usdt: TetherToken; xaut: TetherToken };
}

const tether = new JsonApi("https://app.tether.to");
let tetherCache: Promise<TetherTransparency> | null = null;

function tetherData(): Promise<TetherTransparency> {
    tetherCache ??= tether
        .fetchJson<TetherTransparency>("/transparency.json")
        .catch((error: unknown) => {
            tetherCache = null;
            throw error;
        });
    return tetherCache;
}

/**
 * Circulating Tether tokens on one chain, by Tether's chain key ("eth", "tron", "sol", ...).
 * @param token "usdt" or "xaut"
 */
export async function tetherCirculating(token: "usdt" | "xaut", chain: string): Promise<number> {
    const data = (await tetherData()).data[token];
    const value = (key: string) => Number(data[`${key}_${chain}`] ?? 0);
    return value("totaltokens") - value("reserve_balance") - value("quarantined");
}

/** Circulating Tether tokens on all chains together. */
export async function tetherTotalCirculating(token: "usdt" | "xaut"): Promise<number> {
    const data = (await tetherData()).data[token];
    const chains = Object.keys(data)
        .filter((key) => key.startsWith("totaltokens_"))
        .map((key) => key.slice("totaltokens_".length));
    let total = 0;
    for (const chain of chains) total += await tetherCirculating(token, chain);
    return total;
}

interface CircleStablecoins {
    data: { symbol: string; chains: { chain: string; amount: string }[] }[];
}

const circle = new JsonApi("https://api.circle.com");
let circleCache: Promise<CircleStablecoins> | null = null;

function circleData(): Promise<CircleStablecoins> {
    circleCache ??= circle
        .fetchJson<CircleStablecoins>("/v1/stablecoins")
        .catch((error: unknown) => {
            circleCache = null;
            throw error;
        });
    return circleCache;
}

/**
 * Circulating Circle tokens on one chain, from Circle's stablecoin data.
 * @param symbol "USDC" or "EURC"
 * @param chain Circle's chain key ("ETH", "SOL", "BASE", ...)
 */
export async function circleCirculating(symbol: string, chain: string): Promise<number> {
    const token = (await circleData()).data.find((entry) => entry.symbol == symbol);
    const amount = token?.chains.find((entry) => entry.chain == chain)?.amount;
    if (amount === undefined) throw Error(`No ${symbol} on ${chain} in Circle's stablecoin data`);
    return Number(amount);
}

const chain = new ChainProxy();
const solana = new SolanaChain();

/** totalSupply of a token contract, read on-chain. */
export async function onChainSupply(address: string, system: bcked.system.Id): Promise<number> {
    if (system == "solana") return (await solana.getSupply(address)).issued;
    return (await chain.getSupply(address, system)).issued;
}
