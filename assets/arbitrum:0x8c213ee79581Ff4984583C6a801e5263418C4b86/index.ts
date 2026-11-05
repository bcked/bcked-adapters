/**
 * Janus Henderson Anemoy Treasury Fund (JTRSY) on Arbitrum, tokenized fund shares issued through
 * the Centrifuge protocol. Centrifuge's governance spells name the token address on Ethereum, Base
 * and Arbitrum (TRANCHE_JTRSY):
 * https://github.com/centrifuge/protocol/blob/1835217780ef8bd372876b8bf2a1eb15aa4add56/env/spell/008_ethereum_0x9f10617b39438c4da5afc6f41e30080ebf6653fe.sol
 *
 * Supply is the token's totalSupply, read on-chain. The price is the fund's net asset value per
 * share from the Chainlink JTRSY NAV feed on Ethereum. The fund's holdings are not recorded, see
 * tokens/jtrsy.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Janus Henderson Anemoy Treasury Fund",
    symbol: "JTRSY",
    identifier: {
        address: "0x8c213ee79581Ff4984583C6a801e5263418C4b86",
        system: "arbitrum",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "anemoy",
    },
    reference:
        "https://github.com/centrifuge/protocol/blob/1835217780ef8bd372876b8bf2a1eb15aa4add56/env/spell/008_ethereum_0x9f10617b39438c4da5afc6f41e30080ebf6653fe.sol",
    tags: ["real-world-asset"],
    token: "jtrsy",
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
