/**
 * Janus Henderson Anemoy Treasury Fund (JTRSY) on BNB Chain, tokenized fund shares issued through
 * the Centrifuge protocol. The Centrifuge Spoke contract on this chain
 * (0xd30Da1d7F964E5f6C2D9fE2AAA97517F6B23FA2B, named in Centrifuge's governance spells) returns
 * this address as the share token of the JTRSY pool (shareToken of pool 281474976710662, share
 * class 0x00010000000000060000000000000001).
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
        address: "0xa5d465251fBCc907f5Dd6bB2145488DFC6a2627b",
        system: "bsc",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "anemoy",
    },
    reference:
        "https://github.com/centrifuge/protocol/blob/1835217780ef8bd372876b8bf2a1eb15aa4add56/env/spell/004_bnb-smart-chain_0x37271f54911a22156b39ab08e9f9738cc9bf55e4.sol",
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
