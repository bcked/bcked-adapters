/**
 * Ondo Short-Term US Government Bond Fund (OUSG) on Ethereum, tokenized fund shares. Ondo lists the token
 * address in its documentation: https://docs.ondo.finance/addresses
 *
 * Supply is the token's totalSupply, read on-chain. There is no Chainlink feed for OUSG and no
 * on-chain pool, so there is no price. The fund's holdings are not recorded, see tokens/ousg.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Ondo Short-Term US Government Bond Fund",
    symbol: "OUSG",
    identifier: {
        address: "0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92",
        system: "ethereum",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "ondo",
    },
    reference: "https://docs.ondo.finance/addresses",
    tags: ["real-world-asset"],
    token: "ousg",
};

export default class Adapter implements bcked.asset.Adapter {
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // totalSupply of the token contract, read on-chain.
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
