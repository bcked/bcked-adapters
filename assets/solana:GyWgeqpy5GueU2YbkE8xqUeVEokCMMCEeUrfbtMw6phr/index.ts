/**
 * BlackRock USD Institutional Digital Liquidity Fund (BUIDL) on Solana, tokenized fund shares.
 * BlackRock lists the token address on its website:
 * https://www.blackrock.com/corporate/compliance/scams-and-fraud/blackrock-token-addresses
 *
 * Supply is the token's totalSupply, read on-chain. There is no Chainlink feed for BUIDL, so there is no
 * price. The fund's holdings are not recorded: BlackRock's website terms do not allow automated
 * collection of its fund data, see tokens/buidl.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "BlackRock USD Institutional Digital Liquidity Fund",
    symbol: "BUIDL",
    identifier: {
        address: "GyWgeqpy5GueU2YbkE8xqUeVEokCMMCEeUrfbtMw6phr",
        system: "solana",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "blackrock",
    },
    reference:
        "https://www.blackrock.com/corporate/compliance/scams-and-fraud/blackrock-token-addresses",
    tags: ["real-world-asset"],
    token: "buidl",
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
