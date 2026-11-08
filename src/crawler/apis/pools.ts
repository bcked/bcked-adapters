/**
 * Prices from on-chain pools, for tokens without a Chainlink feed. A pool is used only while it holds
 * at least MIN_QUOTE_USD of the quote token, the stablecoin the token is traded against. The price is
 * the pool's current rate in the quote token times the quote token's Chainlink price.
 *
 * - Curve pools on EVM chains: get_dy for one token.
 * - Orca Whirlpools on Solana: the pool's sqrt price, read from the pool account. Layout from Orca's
 *   whirlpool program (https://github.com/orca-so/whirlpools, Apache-2.0): sqrt_price (u128 Q64.64)
 *   at byte 65, token_mint_a at 101, token_vault_a at 133, token_mint_b at 181, token_vault_b at 213.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { formatUnits } from "ethers";
import { ChainProxy } from "../chains/proxy";
import { format, toISOString } from "../../utils/string_formatting";
import { ApiProxy } from "./proxy";

export const MIN_QUOTE_USD = 1_000_000;
const WHIRLPOOL_PROGRAM = "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc";
const SOLANA_RPC = "https://solana-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}";

// Quote tokens and the Chainlink-priced asset that gives their USD price.
const QUOTE_PRICE: Record<string, bcked.asset.Identifier> = {
    USDC: { system: "ethereum", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    USDT: { system: "ethereum", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
};

export type PoolSource =
    | {
          kind: "curve";
          system: bcked.system.Id;
          pool: string;
          token: number;
          quote: number;
          quoteSymbol: string;
      }
    | { kind: "whirlpool"; pool: string; tokenMint: string; quoteSymbol: string };

const api = new ApiProxy();
const chain = new ChainProxy();

async function quoteUsd(symbol: string): Promise<number> {
    const id = QUOTE_PRICE[symbol];
    if (!id) throw Error(`No price for quote token ${symbol}`);
    const price = await api.getPrice(id);
    if (!price) throw Error(`No Chainlink price for quote token ${symbol}`);
    return price.usd;
}

/** Rate of the token in the quote token, and how much of the quote token the pool holds. */
async function curve(source: Extract<PoolSource, { kind: "curve" }>) {
    const { system, pool, token, quote } = source;
    const coin = (i: number) =>
        chain.call<string>(pool, "function coins(uint256) view returns (address)", [i], system);
    const decimals = async (address: string) =>
        Number(
            await chain.call<bigint>(
                address,
                "function decimals() view returns (uint8)",
                [],
                system
            )
        );
    const [tokenDecimals, quoteDecimals] = await Promise.all([
        coin(token).then(decimals),
        coin(quote).then(decimals),
    ]);
    const [out, held] = await Promise.all([
        chain.call<bigint>(
            pool,
            "function get_dy(int128,int128,uint256) view returns (uint256)",
            [token, quote, 10n ** BigInt(tokenDecimals)],
            system
        ),
        chain.call<bigint>(
            pool,
            "function balances(uint256) view returns (uint256)",
            [quote],
            system
        ),
    ]);
    return {
        rate: parseFloat(formatUnits(out, quoteDecimals)),
        quoteHeld: parseFloat(formatUnits(held, quoteDecimals)),
    };
}

async function whirlpool(source: Extract<PoolSource, { kind: "whirlpool" }>) {
    const connection = new Connection(
        format(SOLANA_RPC, { ALCHEMY_API_KEY: process.env["ALCHEMY_API_KEY"]! })
    );
    const info = await connection.getAccountInfo(new PublicKey(source.pool));
    if (!info) throw Error(`No account ${source.pool}`);
    if (info.owner.toBase58() != WHIRLPOOL_PROGRAM)
        throw Error(`${source.pool} is not an Orca Whirlpool`);
    const data = Buffer.from(info.data);
    const sqrtPrice = data.readBigUInt64LE(65) + (data.readBigUInt64LE(73) << 64n);
    const mintA = new PublicKey(data.subarray(101, 133)).toBase58();
    const vaultA = new PublicKey(data.subarray(133, 165));
    const mintB = new PublicKey(data.subarray(181, 213)).toBase58();
    const vaultB = new PublicKey(data.subarray(213, 245));
    if (mintA != source.tokenMint && mintB != source.tokenMint)
        throw Error(`${source.pool} does not hold ${source.tokenMint}`);
    const [a, b] = await Promise.all([
        connection.getTokenAccountBalance(vaultA),
        connection.getTokenAccountBalance(vaultB),
    ]);
    const root = Number(sqrtPrice) / 2 ** 64;
    // Price of token A in token B, in whole tokens.
    const aInB = root * root * 10 ** (a.value.decimals - b.value.decimals);
    const tokenIsA = mintA == source.tokenMint;
    const quoteVault = tokenIsA ? b : a;
    return {
        rate: tokenIsA ? aInB : 1 / aInB,
        quoteHeld: Number(quoteVault.value.amount) / 10 ** quoteVault.value.decimals,
    };
}

/** The token's USD price from its pool, or none while the pool holds too little of the quote token. */
export async function poolPrice(source: PoolSource): Promise<bcked.asset.Price[]> {
    const [{ rate, quoteHeld }, usd] = await Promise.all([
        source.kind == "curve" ? curve(source) : whirlpool(source),
        quoteUsd(source.quoteSymbol),
    ]);
    if (quoteHeld * usd < MIN_QUOTE_USD) {
        console.log(
            `Pool ${source.pool} holds only ${quoteHeld.toFixed(0)} ${source.quoteSymbol}, no price`
        );
        return [];
    }
    return [{ timestamp: toISOString(Date.now()), usd: rate * usd }];
}
