/**
 * Provides the circulating supply of stablecoins per chain from the DefiLlama stablecoins API.
 * All attribution goes to DefiLlama.
 * API documentation: https://defillama.com/docs/api
 */
import { JsonApi } from "../../utils/requests";

interface SupplyPoint {
    date: number; // Unix seconds
    circulating?: { peggedUSD?: number };
}

interface Stablecoin {
    tokens: SupplyPoint[];
    chainBalances: Record<string, { tokens: SupplyPoint[] } | undefined>;
}

export interface ChainSupply {
    timestamp: number; // Unix milliseconds
    chain: number; // Circulating supply on the chain
    total: number; // Circulating supply on all chains tracked by DefiLlama
}

export class DefiLlamaStablecoins {
    api: JsonApi;

    constructor() {
        this.api = new JsonApi("https://stablecoins.llama.fi");
    }

    /**
     * Daily circulating supply of a stablecoin on a chain and on all tracked chains.
     * Early history is incomplete for some chains (e.g. Omni for USDT is not tracked).
     * @param stablecoinId DefiLlama stablecoin ID (1 = USDT, 2 = USDC)
     * @param chain DefiLlama chain name, e.g. "Ethereum"
     */
    async getChainSupply(stablecoinId: number, chain: string): Promise<ChainSupply[]> {
        const stablecoin = await this.api.fetchJson<Stablecoin>(`/stablecoin/${stablecoinId}`);
        const totals = new Map(
            stablecoin.tokens.map((point) => [point.date, point.circulating?.peggedUSD ?? 0])
        );
        return (stablecoin.chainBalances[chain]?.tokens ?? [])
            .map((point) => ({
                timestamp: point.date * 1000,
                chain: point.circulating?.peggedUSD ?? 0,
                total: totals.get(point.date) ?? 0,
            }))
            .filter((point) => point.chain > 0 && point.total >= point.chain);
    }
}
