/**
 * Ether. The price comes from Chainlink's ETH/USD feed on-chain, the supply from ultrasound.money.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { Ultrasound } from "../../src/crawler/apis/ultrasound";

const details: bcked.asset.Details = {
    name: "Ether",
    symbol: "ETH",
    identifier: {
        address: "ETH",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency"],
    linkedEntities: {
        issuer: "ethereum",
    },
    reference: "https://ethereum.org/en/",
    backing: {
        method: "unbacked",
        description: "Ether is the native coin of its chain and is not backed by other assets.",
        reference: null,
    },
    tags: ["chain-token"],
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    ultrasound: Ultrasound;

    constructor() {
        this.api = new ApiProxy();
        this.ultrasound = new Ultrasound();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, supply } = await this.ultrasound.getEthSupply();
        return [
            {
                timestamp,
                circulating: null,
                burned: null,
                total: supply,
                issued: supply,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // There is no backing for ETH
        return [];
    }
}
