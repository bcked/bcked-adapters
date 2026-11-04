/**
 * Circle Internet Group (bStocks), CRCLB, on BNB Chain: tokenized certificates over shares of Circle
 * Internet Group (CRCL), issued by BTECH Holdings Ltd, a Binance group company in the Abu Dhabi Global
 * Market. Each token is backed 1:1 by a share held at a US broker-custodian, according to the issuer.
 * The issuer lists the token contract on its website (https://www.bstocks.finance/en/, markets list).
 *
 * The token follows ERC-8056 (https://eips.ethereum.org/EIPS/eip-8056): dividends and splits change a
 * multiplier, not the balances. One raw token stands for uiMultiplier() shares. The supply is recorded
 * in shares (totalSupply times uiMultiplier).
 *
 * Price: none. There is no Chainlink feed for the token and no on-chain pool with at least $1M
 * liquidity. Backing: not recorded. The issuer publishes it only on Binance's proof of collateral page,
 * whose terms could not be read.
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Circle Internet Group (bStocks)",
    symbol: "CRCLB",
    identifier: {
        address: "0x80f3D493EBCe97e343c53D29a137942416B4ffC0",
        system: "bsc",
    },
    assetClasses: ["stock", "derivative"],
    linkedEntities: {
        issuer: "btech",
    },
    reference: "https://www.bstocks.finance/en/",
    tags: ["real-world-asset"],
};

const UI_MULTIPLIER = "function uiMultiplier() view returns (uint256)";

export default class Adapter implements bcked.asset.Adapter {
    chain: ChainProxy;

    constructor() {
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { address, system } = details.identifier;
        const [{ timestamp, issued, burned }, raw] = await Promise.all([
            this.chain.getSupply(address, system),
            this.chain.call<bigint>(address, UI_MULTIPLIER, [], system),
        ]);
        const multiplier = parseFloat(formatUnits(raw, 18));
        const burnedShares = (burned ?? 0) * multiplier;
        return [
            {
                timestamp,
                circulating: null,
                burned: burnedShares,
                total: issued * multiplier - burnedShares,
                issued: issued * multiplier,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
