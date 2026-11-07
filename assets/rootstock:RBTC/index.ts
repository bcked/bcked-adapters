/**
 * Smart Bitcoin (RBTC), the native coin of Rootstock, pegged 1:1 to bitcoin by the PowPeg. All 21
 * million RBTC exist from the start and sit in the Bridge contract
 * (0x0000000000000000000000000000000001000006, defined in the Rootstock node,
 * https://github.com/rsksmart/rskj). Bitcoin sent to the PowPeg federation releases the same amount
 * of RBTC from the Bridge, and RBTC sent back to the Bridge releases the bitcoin. The supply in
 * circulation is 21 million less the Bridge's balance.
 *
 * The backing is the bitcoin at the federation's address, which the Bridge names
 * (getFederationAddress, and getRetiringFederationAddress while a federation hands over), read
 * from the bitcoin chain through mempool.space.
 *
 * There is no Chainlink feed for RBTC, and bcked does not price from pools live, so RBTC has no
 * price yet.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { JsonApi } from "../../src/utils/requests";
import { toISOString } from "../../src/utils/string_formatting";

const BRIDGE = "0x0000000000000000000000000000000001000006";
const MAX_SUPPLY = 21_000_000;

interface MempoolAddress {
    chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
}

const details: bcked.asset.Details = {
    name: "Smart Bitcoin",
    symbol: "RBTC",
    identifier: {
        address: "RBTC",
        system: "rootstock",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {},
    reference: "https://github.com/rsksmart/rskj",
    tags: ["chain-token"],
    backing: {
        method: "custodian",
        description:
            "The bitcoin at the address of the PowPeg federation, which the Rootstock Bridge contract names, read from the bitcoin chain.",
        reference: "https://github.com/rsksmart/rskj",
    },
};

export default class Adapter implements bcked.asset.Adapter {
    chain: ChainProxy;
    mempool: JsonApi;

    constructor() {
        this.chain = new ChainProxy();
        this.mempool = new JsonApi("https://mempool.space/api");
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        // No Chainlink feed, see above.
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, balance } = await this.chain.getBalance(BRIDGE, null, "rootstock");
        const circulating = MAX_SUPPLY - balance;
        return [
            {
                timestamp,
                circulating,
                burned: null,
                total: circulating,
                issued: circulating,
                max: MAX_SUPPLY,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const addresses = await Promise.all(
            ["getFederationAddress", "getRetiringFederationAddress"].map((name) =>
                this.chain.call<string>(
                    BRIDGE,
                    `function ${name}() view returns (string)`,
                    [],
                    "rootstock"
                )
            )
        );
        let btc = 0;
        for (const address of addresses.filter(Boolean)) {
            const { chain_stats } = await this.mempool.fetchJson<MempoolAddress>(
                `/address/${address}`
            );
            btc += (chain_stats.funded_txo_sum - chain_stats.spent_txo_sum) / 1e8;
        }
        return [{ timestamp: toISOString(Date.now()), underlying: { "bitcoin:BTC": btc } }];
    }
}
