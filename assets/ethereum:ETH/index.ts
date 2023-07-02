/**
 * The ETH price and supply is queried using the Etherscan API.
 * All attribution goes to the [Etherscan API](https://etherscan.io/apis).
 */
import { Etherscan } from "../../src/utils/apis/etherscan";

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
    tags: ["chain-token"],
};

export default class Adapter implements bcked.asset.Adapter {
    etherscan: Etherscan;

    constructor() {
        this.etherscan = new Etherscan();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price | null> {
        // Use WETH as price proxy.
        return this.etherscan.getEthPrice();
    }

    async getSupply(): Promise<bcked.asset.Supply | null> {
        const { timestamp, issued, burned } = await this.etherscan.getEthSupply();
        return {
            timestamp,
            circulating: null,
            burned: burned ?? null,
            total: burned ? issued - burned : issued,
            issued: issued,
            max: null,
        };
    }

    async getBacking(): Promise<bcked.asset.Backing | null> {
        // There is no backing for ETH
        return null;
    }
}
