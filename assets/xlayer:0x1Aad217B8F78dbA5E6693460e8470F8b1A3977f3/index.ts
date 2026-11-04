/**
 * Strategy PP Variable xStock (STRCx) on X Layer, a tracker certificate on Strategy's Variable Rate
 * Series A Perpetual Stretch Preferred Stock (STRC), issued by Backed Assets (JE) Limited. The issuer
 * lists the token address per chain in its public asset data: https://api.xstocks.fi/api/v2/public/assets/STRCx
 *
 * Supply is the token's totalSupply, read on-chain. The token rebases for dividends and splits, and
 * totalSupply already includes the multiplier. There is no price: STRCx has no Chainlink price feed.
 * The shares held as collateral are not recorded, see tokens/strcx.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Strategy PP Variable xStock",
    symbol: "STRCx",
    identifier: {
        address: "0x1Aad217B8F78dbA5E6693460e8470F8b1A3977f3",
        system: "xlayer",
    },
    assetClasses: ["stock", "derivative"],
    linkedEntities: {
        issuer: "backed",
    },
    reference: "https://api.xstocks.fi/api/v2/public/assets/STRCx",
    tags: ["real-world-asset"],
    token: "strcx",
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
