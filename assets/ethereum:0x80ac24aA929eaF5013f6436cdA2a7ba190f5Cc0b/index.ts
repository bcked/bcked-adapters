/**
 * Maple syrupUSDC on Ethereum: shares of Maple's syrupUSDC pool (PoolV2, an ERC-4626 vault), which
 * lends USDC to institutional borrowers against collateral. The address is listed in Maple's docs
 * (https://docs.maple.finance/). Supply is the pool's totalSupply.
 *
 * The backing is read on-chain from the pool: the USDC it holds, and the rest of its totalAssets,
 * which are the outstanding loans with accrued interest, as secured loans (rwa:LOAN). The collateral
 * behind the loans is not recorded.
 *
 * The price is the Chainlink syrupUSDC/USDC exchange rate feed on Arbitrum, in USD with USDC/USD.
 */
import { formatUnits } from "ethers";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const TOTAL_ASSETS = "function totalAssets() view returns (uint256)";

const details: bcked.asset.Details = {
    name: "Maple syrupUSDC",
    symbol: "syrupUSDC",
    identifier: {
        address: "0x80ac24aA929eaF5013f6436cdA2a7ba190f5Cc0b",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "maple",
    },
    reference: "https://docs.maple.finance/",
    tags: ["real-world-asset"],
    backing: {
        method: "on-chain",
        description:
            "USDC held by the syrupUSDC pool and its outstanding loans (the rest of its total assets), read from the pool contract.",
        reference: "https://docs.maple.finance/",
        address: "0x80ac24aA929eaF5013f6436cdA2a7ba190f5Cc0b",
    },
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    chain: ChainProxy;

    constructor() {
        this.api = new ApiProxy();
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const { address, system } = details.identifier;
        const [{ balance: cash }, total] = await Promise.all([
            this.chain.getBalance(address, USDC, system),
            this.chain.call<bigint>(address, TOTAL_ASSETS, [], system),
        ]);
        const loans = Math.max(parseFloat(formatUnits(total, 6)) - cash, 0);
        return [
            {
                timestamp: toISOString(Date.now()),
                underlying: { [`ethereum:${USDC}`]: cash, "rwa:LOAN": loans },
            },
        ];
    }
}
