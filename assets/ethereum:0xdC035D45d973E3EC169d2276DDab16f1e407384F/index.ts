/**
 * USDS, issued by Sky (formerly MakerDAO). DAI and USDS share one pool of reserves in the Vat, see
 * src/crawler/adapters/sky.ts.
 */
import { getSkyBacking, getSkyCirculating } from "../../src/crawler/adapters/sky";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "USDS",
    symbol: "USDS",
    identifier: {
        address: "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
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
            "Vaults in the Sky Vat, read on-chain: USDC in the Lite PSM, all ETH, wstETH, WBTC and SKY locked in vaults, real-world-asset vaults as loans, and the positions of the Spark, Grove and Obex allocators (loans, money market funds, stablecoins). Debt of other vaults, and allocator debt whose positions are not found, is not traced yet. USDS gets the share of its circulating supply, without the USDS the allocators hold. It shares the reserves with DAI.",
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
