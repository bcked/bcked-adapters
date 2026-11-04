/**
 * Resupply USD (reUSD) on Ethereum, issued by Resupply, see src/crawler/adapters/resupply.ts. The
 * token address is listed in Resupply's docs: https://docs.resupply.finance/faq/contract-addresses
 *
 * Supply is the token's totalSupply, read on-chain. reUSD exists only on Ethereum. reUSD held by the
 * Insurance Pool and by Savings reUSD (sreUSD) is part of the supply.
 *
 * The backing is the collateral of all Resupply pairs, read on-chain: lending positions in Curve Lend
 * and Fraxlend, counted in the crvUSD and frxUSD they can be redeemed for.
 *
 * There is no Chainlink reUSD feed, so there is no price. The icon is generic: Resupply publishes no
 * terms or brand guidelines that allow using its marks.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { resupplyCollateral } from "../../src/crawler/adapters/resupply";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Resupply USD",
    symbol: "reUSD",
    identifier: {
        address: "0x57aB1E0003F623289CD798B1824Be09a793e4Bec",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "resupply",
    },
    reference: "https://docs.resupply.finance/faq/contract-addresses",
    tags: ["stablecoin"],
    backing: {
        method: "on-chain",
        description:
            "The collateral of all Resupply pairs, read from the chain every hour: lending positions in Curve Lend and Fraxlend, counted in the crvUSD and frxUSD they hold. crvUSD and frxUSD are not tracked yet and count at their US dollar value from the Chainlink crvUSD/USD and frxUSD/USD feeds. The loans of those lending markets are not traced.",
        reference: "https://docs.resupply.finance/resupply-protocol/collateralized-debt-positions",
        address: "0x10101010E0C3171D894B71B3400668aF311e7D94",
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
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // Minted when reUSD is borrowed from a pair, burned when it is repaid or redeemed.
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
        const collateral = await resupplyCollateral(this.chain);
        if (!collateral) return [];
        return [
            {
                timestamp: toISOString(Date.now()),
                underlying: { "rwa:UNTRACKED": collateral.usd },
            },
        ];
    }
}
