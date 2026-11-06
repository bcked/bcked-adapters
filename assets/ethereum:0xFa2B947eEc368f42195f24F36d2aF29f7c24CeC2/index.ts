/**
 * Falcon USD (USDf) on Ethereum, issued by Falcon Finance. The address is listed in Falcon Finance's
 * docs (https://docs.falcon.finance/resources/smart-contracts/). USDf on BNB Chain and XDC is not
 * tracked separately. The supply is the token's totalSupply on Ethereum.
 *
 * The price is the Chainlink USDf/USD feed. The backing (collateral deposited to mint USDf) is not
 * recorded: Falcon Finance publishes it on its transparency page, whose terms do not allow automated
 * monitoring or copying. The icon is generic.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Falcon USD",
    symbol: "USDf",
    identifier: {
        address: "0xFa2B947eEc368f42195f24F36d2aF29f7c24CeC2",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "falcon-finance",
    },
    reference: "https://docs.falcon.finance/",
    backing: {
        method: "not-tracked",
        description:
            "Falcon Finance publishes the collateral behind USDf on its transparency page, but bcked does not record it yet.",
        reference: "https://app.falcon.finance/transparency",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    chain: ChainProxy;

    constructor() {
        this.api = new ApiProxy();
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
