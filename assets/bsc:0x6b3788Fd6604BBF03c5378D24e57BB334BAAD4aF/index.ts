/**
 * apxUSD on BNB Chain, bridged through Chainlink CCIP: minted and burned on BNB Chain by its token pool,
 * see tokens/apxusd. The token address is listed in Apyx's docs:
 * https://docs.apyx.fi/resources/smart-contract-addresses
 *
 * Supply is read on-chain. The price comes from Chainlink's APXUSD / USD Exchange Rate feed on
 * Ethereum. The backing is not recorded, see the Ethereum asset. The icon is generic.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "apxUSD",
    symbol: "apxUSD",
    identifier: {
        address: "0x6b3788Fd6604BBF03c5378D24e57BB334BAAD4aF",
        system: "bsc",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "apyx",
    },
    reference: "https://docs.apyx.fi/resources/smart-contract-addresses",
    tags: ["stablecoin"],
    token: "apxusd",
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;

    constructor() {
        this.api = new ApiProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const circulating = await onChainSupply(
            details.identifier.address,
            details.identifier.system
        );
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
        return [];
    }
}
