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
        const f = (x: bigint) => parseFloat(formatUnits(x, 18));
        const FACTORY = "0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC";
        const bal = (h: string) => this.chain.call<bigint>(address, "function balanceOf(address) view returns (uint256)", [h], system);
        const n = await this.chain.call<bigint>(FACTORY, "function n_collaterals() view returns (uint256)", [], system);
        let held = await bal(FACTORY); let debt = 0n;
        console.log("factory", f(held), "flash", f(await bal("0x26dE7861e213A5351F6ED767d00e0839930e9eE1")), "n", n);
        for (let i = 0n; i < n; i++) {
            const c = await this.chain.call<string>(FACTORY, "function controllers(uint256) view returns (address)", [i], system);
            const b = await bal(c); const d = await this.chain.call<bigint>(c, "function total_debt() view returns (uint256)", [], system);
            held += b; debt += d; console.log("ctrl", c, f(b), f(d));
        }
        for (const pk of ["0x9201da0D97CaAAff53f01B2fB56767C7072dE340","0xFb726F57d251aB5C731E5C64eD4F5F94351eF9F3","0x3fA20eAa107DE08B38a8734063D605d5842fe09C","0x338Cb2D827112d989A861cDe87CD9FfD913A1f9D"]) {
            const d = await this.chain.call<bigint>(pk, "function debt() view returns (uint256)", [], system); debt += d; console.log("pk", pk, f(d));
        }
        console.log("SUMMARY held", f(held), "debt", f(debt), "lens", circulating);
        return [{ timestamp, circulating, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
