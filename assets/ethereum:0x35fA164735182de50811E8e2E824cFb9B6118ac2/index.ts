/**
 * ether.fi Staked ETH (eETH) on Ethereum, issued by ether.fi. eETH rebases: one eETH stands for one
 * ETH staked through ether.fi, and the total supply of eETH is the ETH pooled in the ether.fi
 * LiquidityPool by ether.fi's own accounting, which its oracle updates. eETH exists only on Ethereum.
 * Wrapped eETH (weETH) holds eETH and is bridged to other chains, so the eETH supply covers it.
 * Addresses are listed in ether.fi's docs:
 * https://etherfi.gitbook.io/etherfi/developers/contracts-and-integrations/deployed-contracts
 *
 * Supply is read on-chain. eETH held by the ether.fi Treasury is not circulating.
 *
 * The backing is the ETH held for eETH, from Chainlink's eETH Proof of Reserves feed on Ethereum
 * (https://data.chain.link/feeds/ethereum/mainnet/eeth-por).
 *
 * Price: Chainlink's weETH/ETH feed in USD, divided by the eETH one weETH holds (getRate of weETH),
 * see src/crawler/apis/chainlink.ts. There is no feed for eETH itself.
 */
import { formatUnits } from "ethers";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { multicall } from "../../src/crawler/chains/multicall";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

// ether.fi Treasury, listed in ether.fi's docs. Holds ether.fi's own eETH.
const TREASURY = "0x0c83EAe1FE72c390A02E426572854931EefF93BA";
// Chainlink eETH Proof of Reserves feed on Ethereum (ETH, 18 decimals).
const EETH_POR = "0xC8cd82067eA907EA4af81b625d2bB653E21b5156";

const details: bcked.asset.Details = {
    name: "ether.fi Staked ETH",
    symbol: "eETH",
    identifier: {
        address: "0x35fA164735182de50811E8e2E824cFb9B6118ac2",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "etherfi",
    },
    reference:
        "https://etherfi.gitbook.io/etherfi/developers/contracts-and-integrations/deployed-contracts",
    tags: ["staking-token"],
    backing: {
        method: "custodian",
        description:
            "The ETH held for eETH, from Chainlink's eETH Proof of Reserves feed on Ethereum. Updated daily.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/eeth-por",
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
        const [{ timestamp, issued, burned }, { balance: treasury }] = await Promise.all([
            this.chain.getSupply(address, system),
            this.chain.getBalance(TREASURY, address, system),
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
        // ETH held for eETH, from Chainlink's eETH Proof of Reserves feed on-chain.
        const [round] = await multicall(this.chain, "ethereum", [
            {
                target: EETH_POR,
                signature:
                    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
            },
        ]);
        const [, answer, , updatedAt] = round! as unknown as [bigint, bigint, bigint, bigint];
        return [
            {
                timestamp: toISOString(Number(updatedAt) * 1000),
                underlying: { "ethereum:ETH": parseFloat(formatUnits(answer, 18)) },
            },
        ];
    }
}
