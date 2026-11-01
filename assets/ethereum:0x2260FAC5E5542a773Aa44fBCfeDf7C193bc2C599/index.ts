/**
 * Wrapped Bitcoin. The backing is the bitcoin held by the WBTC custodians, from Chainlink's WBTC
 * Proof of Reserves feed on Ethereum (https://data.chain.link/feeds/ethereum/mainnet/wbtc-por).
 */
import { formatUnits } from "ethers";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { multicall } from "../../src/crawler/chains/multicall";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const WBTC_POR = "0xa81FE04086865e63E12dD3776978E49DEEa2ea4e";

const details: bcked.asset.Details = {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    identifier: {
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "bitgo",
    },
    reference: "https://www.wbtc.network/",
    tags: ["bridged-asset"],
    backing: {
        method: "custodian",
        description:
            "The bitcoin held by the WBTC custodians, from Chainlink's WBTC Proof of Reserves feed on Ethereum. Updated daily.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/wbtc-por",
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
        const { timestamp, issued, burned } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp,
                circulating: null,
                burned: burned ?? null,
                total: burned ? issued - burned : issued,
                issued: issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // Bitcoin held by the WBTC custodians, from Chainlink's WBTC Proof of Reserves feed on-chain.
        const [round] = await multicall(this.chain, "ethereum", [
            {
                target: WBTC_POR,
                signature:
                    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
            },
        ]);
        const [, answer, , updatedAt] = round! as unknown as [bigint, bigint, bigint, bigint];
        return [
            {
                timestamp: toISOString(Number(updatedAt) * 1000),
                underlying: { "bitcoin:BTC": parseFloat(formatUnits(answer, 8)) },
            },
        ];
    }
}
