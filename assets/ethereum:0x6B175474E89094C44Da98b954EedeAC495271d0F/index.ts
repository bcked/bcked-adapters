/**
 * Dai, issued by Sky (formerly MakerDAO). DAI and USDS share one pool of reserves in the Vat, see
 * src/crawler/adapters/sky.ts.
 */
import { getSkyBacking, getSkyCirculating } from "../../src/crawler/adapters/sky";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Dai",
    symbol: "DAI",
    identifier: {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "sky",
    },
    reference: "https://sky.money/",
    tags: ["stablecoin"],
    backing: {
        method: "on-chain",
        description:
            "Vaults in the Sky Vat, read on-chain: USDC in the Lite PSM, all ETH, wstETH and WBTC locked in vaults, and the debt of allocator, real-world-asset and staking vaults, whose composition is not reported on-chain. DAI gets the share of its circulating supply, without the DAI the Lite PSM keeps for swaps.",
        reference: "https://chainlog.sky.money/",
        address: "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B",
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
        const circulating = await getSkyCirculating(details.identifier.address, this.chain);
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating,
                burned: null,
                total: null,
                issued: null,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return getSkyBacking(details.identifier.address, this.chain);
    }
}
