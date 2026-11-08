/**
 * USDY by Ondo Finance. There is no Chainlink feed for USDY. Its price is the Orca USDY/USDC Whirlpool
 * on Solana, which holds more than $1M of USDC (src/crawler/apis/pools.ts). USDY has the same value
 * on every chain, so all chain assets share it, read once per crawl.
 */
import { poolPrice } from "../apis/pools";

const POOL = "AGXrswVDRoUf62UX9voTXv6TCGw6fBUEwDpyUd9YdZfD";
const SOLANA_MINT = "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6";

let price: Promise<bcked.asset.Price[]> | null = null;

export function usdyPrice(): Promise<bcked.asset.Price[]> {
    price ??= poolPrice({
        kind: "whirlpool",
        pool: POOL,
        tokenMint: SOLANA_MINT,
        quoteSymbol: "USDC",
    }).catch((error: unknown) => {
        price = null;
        throw error;
    });
    return price;
}
