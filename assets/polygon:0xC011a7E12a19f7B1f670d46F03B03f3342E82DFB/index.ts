/**
 * Polymarket USD (pUSD) on Polygon, the collateral token of Polymarket. The address is listed in
 * Polymarket's docs (https://docs.polymarket.com/resources/contracts). pUSD is minted 1:1 against USDC
 * or USDC.e, which the token contract moves to its vault (VAULT() of the token).
 *
 * The backing is read on-chain: the USDC and USDC.e held by the vault. USDC.e is USDC bridged from
 * Ethereum through the Polygon PoS bridge, so it is counted as USDC (the Ethereum asset). There is no
 * Chainlink feed for pUSD, so there is no price.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const USDC_POLYGON = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_E = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const USDC_ETHEREUM = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const VAULT = "function VAULT() view returns (address)";

const details: bcked.asset.Details = {
    name: "Polymarket USD",
    symbol: "pUSD",
    identifier: {
        address: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB",
        system: "polygon",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "polymarket",
    },
    reference: "https://docs.polymarket.com/concepts/pusd",
    tags: ["stablecoin"],
    backing: {
        method: "on-chain",
        description:
            "USDC and USDC.e held by the pUSD vault on Polygon, read on-chain. USDC.e, USDC bridged from Ethereum, is counted as USDC.",
        reference: "https://docs.polymarket.com/concepts/pusd",
    },
};

export default class Adapter implements bcked.asset.Adapter {
    chain: ChainProxy;

    constructor() {
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        // No Chainlink feed for pUSD.
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const { address, system } = details.identifier;
        const vault = await this.chain.call<string>(address, VAULT, [], system);
        const [usdc, usdcE] = await Promise.all([
            this.chain.getBalance(vault, USDC_POLYGON, system),
            this.chain.getBalance(vault, USDC_E, system),
        ]);
        return [
            {
                timestamp: toISOString(Date.now()),
                underlying: {
                    [`polygon:${USDC_POLYGON}`]: usdc.balance,
                    [`ethereum:${USDC_ETHEREUM}`]: usdcE.balance,
                },
            },
        ];
    }
}
