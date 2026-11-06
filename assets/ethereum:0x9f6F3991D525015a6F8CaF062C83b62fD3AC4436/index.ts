/** Open USD (OUSD) on Ethereum, see tokens/ousd. */
import { bridgeBackingShare } from "../../src/crawler/adapters/bridge";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Open USD",
    symbol: "OUSD",
    identifier: {
        address: "0x9f6F3991D525015a6F8CaF062C83b62fD3AC4436",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "bridge",
    },
    reference: "https://reserves.bridge.xyz/ousd",
    tags: ["stablecoin", "real-world-asset"],
    token: "ousd",
    backing: {
        method: "custodian",
        description:
            "Bridge's transparency API, which states the reserves of OUSD on all chains together as cash and treasuries, and the total supply. OUSD on Ethereum gets its share of the reserves by supply. Updated daily.",
        reference: "https://reserves.bridge.xyz/ousd",
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

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        const supply = await onChainSupply(details.identifier.address, details.identifier.system);
        return bridgeBackingShare("ousd", supply, lastRecorded);
    }
}
