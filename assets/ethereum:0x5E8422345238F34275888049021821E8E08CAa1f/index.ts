/**
 * Frax Ether (frxETH) on Ethereum, issued by Frax. One frxETH is minted for each ETH sent to the
 * frxETH minter, and it is redeemable 1:1 for ETH through the redemption queue. The token address
 * is listed in Frax's docs: https://docs.frax.com/protocol/assets/frxeth/addresses
 *
 * Supply is read on-chain. frxETH on Fraxtal and on other chains (LayerZero OFT) is bridged from
 * Ethereum and locked there, so the totalSupply on Ethereum is all frxETH. The frxETH held by the
 * frxETH Comptroller multisig (Frax's treasury) is not circulating.
 *
 * The backing comes from Frax's frxETH balance sheet API (https://api.frax.finance/v2/frxeth/collateral),
 * which covers all chains: ETH in the validators (by Frax's beacon chain figures), ETH held by the
 * minter, the redemption queues and the treasury, and stETH. frxETH held by Frax itself is not
 * backing. Curve and Convex liquidity positions of the treasury hold frxETH and other tokens, so
 * they are counted at the US dollar value of the ETH value Frax states for them (rwa:UNTRACKED).
 *
 * Price: Chainlink's frxETH-ETH exchange rate feed on Arbitrum, in USD with ETH/USD
 * (src/crawler/apis/chainlink.ts). Recorded from the crawl on, the price history reads only feeds
 * on Ethereum.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { JsonApi } from "../../src/utils/requests";
import { toISOString } from "../../src/utils/string_formatting";

// frxETH Comptroller multisig, listed in Frax's docs. Holds Frax's own frxETH.
const COMPTROLLER = "0x8306300ffd616049FD7e4b0354a64Da835c1A81C";

const ETH: bcked.asset.Id = "ethereum:ETH";
const STETH: bcked.asset.Id = "ethereum:0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const UNTRACKED: bcked.asset.Id = "rwa:UNTRACKED";

const details: bcked.asset.Details = {
    name: "Frax Ether",
    symbol: "frxETH",
    identifier: {
        address: "0x5E8422345238F34275888049021821E8E08CAa1f",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "frax",
    },
    reference: "https://docs.frax.com/protocol/assets/frxeth/overview",
    tags: ["staking-token"],
    backing: {
        method: "custodian",
        description:
            "Frax's frxETH balance sheet: ETH in the validators by Frax's own figures, ETH and stETH held by the frxETH contracts and the treasury. Curve and Convex positions of the treasury are counted at their US dollar value, frxETH held by Frax is not counted.",
        reference: "https://facts.frax.finance/frxeth/balance-sheet",
    },
};

interface CollateralItem {
    key: string;
    tokenName: string;
    amount: number;
    valueInEth: number;
}

interface Collateral {
    updatedAtTimestampSec: number;
    assets: CollateralItem[];
}

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    chain: ChainProxy;
    frax: JsonApi;

    constructor() {
        this.api = new ApiProxy();
        this.chain = new ChainProxy();
        this.frax = new JsonApi("https://api.frax.finance");
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
        const [{ timestamp, issued, burned }, { balance: treasury }] = await Promise.all([
            this.chain.getSupply(address, system),
            this.chain.getBalance(COMPTROLLER, address, system),
        ]);
        const total = issued - (burned ?? 0);
        return [
            {
                timestamp,
                circulating: total - treasury,
                burned: burned ?? null,
                total,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const collateral = await this.frax.fetchJson<Collateral>("/v2/frxeth/collateral");
        const underlying: Partial<Record<bcked.asset.Id, number>> = {};
        const add = (id: bcked.asset.Id, amount: number) => {
            underlying[id] = (underlying[id] ?? 0) + amount;
        };

        let positionsInEth = 0;
        for (const item of collateral.assets) {
            if (!Number.isFinite(item.amount) || !Number.isFinite(item.valueInEth)) {
                throw new Error(`Invalid frxETH collateral item ${item.key}`);
            }
            if (item.amount == 0 && item.valueInEth == 0) continue;
            switch (item.tokenName) {
                case "ETH":
                case "WETH":
                    add(ETH, item.amount);
                    break;
                case "stETH":
                    add(STETH, item.amount);
                    break;
                case "frxETH":
                case "wfrxETH":
                    // Frax's own frxETH is not backing.
                    break;
                default:
                    // Liquidity positions and other tokens, by the ETH value Frax states.
                    positionsInEth += item.valueInEth;
            }
        }

        if (positionsInEth > 0) {
            const eth = await this.api.getPrice({ address: "ETH", system: "ethereum" });
            if (!eth) throw new Error("No ETH price to value the frxETH liquidity positions");
            add(UNTRACKED, positionsInEth * eth.usd);
        }

        return [
            {
                timestamp: toISOString(collateral.updatedAtTimestampSec * 1000),
                underlying,
            },
        ];
    }
}
