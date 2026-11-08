/**
 * PRIME by Hastra on Ethereum, staked wYLDS. Hastra's StakingVault, listed as stakingVault in its
 * Ethereum deployment file (https://github.com/provenance-io/hastra-eth-vault/blob/main/deployment_mainnet.json),
 * is the PRIME token itself: an ERC-4626 vault that holds wYLDS and issues PRIME shares.
 *
 * Supply is the vault's totalSupply, read on-chain. The backing is the wYLDS the vault holds
 * (totalAssets), read on-chain. There is no price: Chainlink's Hastra Prime/wYLDS exchange rate gives
 * PRIME in wYLDS, but wYLDS itself has no price feed. The icon is a generic placeholder: Hastra's
 * terms do not allow the use of its logos without written consent.
 */
import { formatUnits } from "ethers";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const WYLDS = "0x6aD038cA6C04e885630851278ca0a856Ad9a66Cc";

const details: bcked.asset.Details = {
    name: "Hastra Prime",
    symbol: "PRIME",
    identifier: {
        address: "0x19ebb35279A16207Ec4ba82799CC64715065F7F6",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "hastra",
    },
    reference:
        "https://github.com/provenance-io/hastra-eth-vault/blob/main/deployment_mainnet.json",
    tags: ["real-world-asset"],
    backing: {
        method: "on-chain",
        description:
            "The wYLDS held by Hastra's StakingVault, which is the PRIME token, read on-chain every hour.",
        reference:
            "https://github.com/provenance-io/hastra-eth-vault/blob/main/docs/CURATOR_INTEGRATION.md",
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
        // No price feed for wYLDS, see above.
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
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
        const assets = await this.chain.call<bigint>(
            details.identifier.address,
            "function totalAssets() view returns (uint256)",
            [],
            "ethereum"
        );
        return [
            {
                timestamp: toISOString(Date.now()),
                underlying: { [`ethereum:${WYLDS}`]: parseFloat(formatUnits(assets, 6)) },
            },
        ];
    }
}
