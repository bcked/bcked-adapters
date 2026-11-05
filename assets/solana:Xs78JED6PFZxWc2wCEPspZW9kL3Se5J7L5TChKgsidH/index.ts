/**
 * Strategy PP Variable xStock (STRCx) on Solana, a tracker certificate on Strategy's Variable Rate
 * Series A Perpetual Stretch Preferred Stock (STRC), issued by Backed Assets (JE) Limited. The issuer
 * lists the mint address in its public asset data: https://api.xstocks.fi/api/v2/public/assets/STRCx
 *
 * Supply is read on-chain. The mint uses the Token-2022 Scaled UI Amount extension for dividends and
 * splits: the raw amounts stay constant and the mint's multiplier gives the number of tokens. Tokens
 * in the issuer's own wallets and in the bridge's custody account are not circulating
 * (src/crawler/adapters/xstocks.ts). There is no price: STRCx has no Chainlink price feed. The shares
 * held as collateral are not recorded, see tokens/strcx.
 */
import { xStockSupply } from "../../src/crawler/adapters/xstocks";

// The xStocks bridge's custody account of STRCx on Solana.
const BRIDGE_CUSTODY = "CizsJMFKJaMbC5h2yTN7BmN2ZQXuihtK19iS5MRM73Sn";

const details: bcked.asset.Details = {
    name: "Strategy PP Variable xStock",
    symbol: "STRCx",
    identifier: {
        address: "Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH",
        system: "solana",
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
        return [await xStockSupply(details.identifier, [BRIDGE_CUSTODY])];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
