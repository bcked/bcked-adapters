import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { hoursInMs, isClose } from "../../src/utils/time";

const details: bcked.asset.Details = {
    name: "USD Coin",
    symbol: "USDC",
    identifier: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "circle",
    },
    reference: "https://www.circle.com/en/usdc",
    tags: ["stablecoin", "real-world-asset"],
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

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        // Backing is determined by Circle's reserves, tracked for Circle as an entity.
        if (lastRecorded !== null && isClose(lastRecorded.timestamp, Date.now(), hoursInMs(23.99)))
            return [];

        // const startDate = new Date(lastRecorded?.timestamp ?? 0);

        // const circleAdapter = new CircleAdapter();

        // TODO iterate all dates since last entry.
        // TODO get circle backing of each day
        // TODO get the supply of all chains USDC is deployed to
        // TODO calculate the share of the backing for the current chain

        return [];
    }
}
