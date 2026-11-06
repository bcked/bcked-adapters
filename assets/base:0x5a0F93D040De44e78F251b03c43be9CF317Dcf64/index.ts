/** Janus Henderson Anemoy AAA CLO Fund (JAAA) on Base, see tokens/jaaa. */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Janus Henderson Anemoy AAA CLO Fund",
    symbol: "JAAA",
    identifier: {
        address: "0x5a0F93D040De44e78F251b03c43be9CF317Dcf64",
        system: "base",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "anemoy",
    },
    reference:
        "https://github.com/centrifuge/protocol/blob/72a8acfdbb2510da72aba6045c054f6b9a8afe7e/env/spell/005_ethereum_0x1e860a8108c95be344f49ad1501fb281d8b6bfbb.sol",
    tags: ["real-world-asset"],
    token: "jaaa",
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
        // totalSupply of the token, read on-chain. Shares in a pending redemption are burned when
        // the redemption is executed, so they still count until then.
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
