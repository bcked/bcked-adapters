/**
 * crvUSD on Ethereum, the stablecoin of Curve, minted by its lending markets against collateral and by
 * its peg keepers. The addresses are listed in Curve's deployment data
 * (https://docs.curve.finance/deployments.json). The controller factory mints each market's debt
 * ceiling up front, so the totalSupply includes crvUSD no one has borrowed yet. The circulating supply
 * comes from Curve's stablecoin lens contract, which leaves that out. crvUSD bridged to other chains
 * is locked on Ethereum and counted there. The price is the Chainlink crvUSD/USD feed.
 *
 * The backing is not recorded yet. It is the collateral in the lending markets (wstETH, WBTC, WETH
 * and others) and the stablecoins held by the peg keepers, all on-chain, but the reading of each
 * market is not built yet.
 */
import { formatUnits } from "ethers";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const STABLECOIN_LENS = "0xe24e2db9f6bb40bbe7c1c025bc87104f5401ecd7";
const CIRCULATING_SUPPLY = "function circulating_supply() view returns (uint256)";

const details: bcked.asset.Details = {
    name: "crvUSD",
    symbol: "crvUSD",
    identifier: {
        address: "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "curve",
    },
    reference: "https://docs.curve.finance/deployments.json",
    tags: ["stablecoin"],
    backing: {
        method: "not-tracked",
        description:
            "crvUSD is backed by the collateral in Curve's lending markets and the stablecoins of its peg keepers, all on-chain, which bcked does not read yet.",
        reference: "https://docs.curve.finance/",
    },
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
        const { address, system } = details.identifier;
        const [{ timestamp, issued }, raw] = await Promise.all([
            this.chain.getSupply(address, system),
            this.chain.call<bigint>(STABLECOIN_LENS, CIRCULATING_SUPPLY, [], system),
        ]);
        const circulating = parseFloat(formatUnits(raw, 18));
        return [{ timestamp, circulating, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
