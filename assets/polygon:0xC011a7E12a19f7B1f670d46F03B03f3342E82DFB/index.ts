/** Draft: find the pUSD vault and its USDC balances. */
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDCE = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const details: bcked.asset.Details = {
    name: "Polymarket USD",
    symbol: "pUSD",
    identifier: { address: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB", system: "polygon" },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: { issuer: "polymarket" },
    reference: null,
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.asset.Adapter {
    chain = new ChainProxy();
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }
    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }
    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(details.identifier.address, "polygon");
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }
    async getBacking(): Promise<bcked.asset.Backing[]> {
        const out: Record<string, number> = {};
        for (const sig of ["function vault() view returns (address)", "function VAULT() view returns (address)", "function treasury() view returns (address)"]) {
            try {
                const v = await this.chain.call<string>(details.identifier.address, sig, [], "polygon");
                console.log("getter", sig, v);
                const [a, b] = await Promise.all([this.chain.getBalance(v, USDC, "polygon"), this.chain.getBalance(v, USDCE, "polygon")]);
                out[`polygon:${USDC}`] = a.balance;
                out[`polygon:${USDCE}`] = b.balance;
                break;
            } catch (e) {
                console.log("no", sig);
            }
        }
        return [{ timestamp: toISOString(Date.now()), underlying: out }];
    }
}
