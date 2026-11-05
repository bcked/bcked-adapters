/**
 * Invesco QQQ Trust bStocks (QQQB) on BNB Chain, tokenized certificates over units of the Invesco QQQ
 * Trust (QQQ), issued by BTech Holdings, a Binance group company in the Abu Dhabi Global Market. Each
 * certificate is backed 1:1 by a QQQ unit held by the custodian, according to the issuer. The issuer
 * lists the token contract on its website (https://www.bstocks.finance/en/, markets list).
 *
 * The token follows ERC-8056 (https://eips.ethereum.org/EIPS/eip-8056): dividends and splits change a
 * multiplier, not the balances. One raw token stands for uiMultiplier() QQQ units. The supply is
 * recorded in QQQ units (totalSupply times uiMultiplier).
 *
 * Price: none. There is no Chainlink feed for the token and no on-chain pool with at least $1M
 * liquidity. The QQQ/USD feed prices the underlying units, not the token, so it is not used.
 * Backing: not recorded. The issuer publishes it only on Binance's proof of collateral page, whose terms
 * could not be read.
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Invesco QQQ Trust bStocks",
    symbol: "QQQB",
    identifier: {
        address: "0x205812CdBed920aFf76C6580abD681a46D11efc7",
        system: "bsc",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "btech",
    },
    reference: "https://www.bstocks.finance/en/",
    backing: {
        method: "not-tracked",
        description:
            "The issuer states that each token is backed by one QQQ unit held by the custodian, but publishes no holdings that bcked can record.",
        reference: "https://www.bstocks.finance/en/",
    },
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
        const burnedUnits = (burned ?? 0) * multiplier;
        return [
            {
                timestamp,
                circulating: null,
                burned: burnedUnits,
                total: issued * multiplier - burnedUnits,
                issued: issued * multiplier,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
