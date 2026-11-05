/**
 * Wrapped YLDS (wYLDS) on Ethereum, see src/crawler/adapters/hastra.ts. Hastra lists the address
 * in its proof of reserves (https://hastra.io/proof-of-reserves) and in its Ethereum integration
 * guide: https://github.com/provenance-io/hastra-eth-vault/blob/main/docs/CURATOR_INTEGRATION.md
 *
 * The token is the YieldVault contract, which mints wYLDS 1:1 against USDC and burns it on
 * redemption, so the circulating supply is the supply on-chain. There is no Chainlink feed for
 * wYLDS, so there is no price. The backing is the Ethereum share of Hastra's proof of reserves. The
 * icon is a generic placeholder: Hastra's terms do not allow the use of its logos without written
 * consent.
 */
import { wyldsBacking } from "../../src/crawler/adapters/hastra";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Wrapped YLDS",
    symbol: "wYLDS",
    identifier: {
        address: "0x6aD038cA6C04e885630851278ca0a856Ad9a66Cc",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "hastra",
    },
    reference: "https://hastra.io/proof-of-reserves",
    tags: ["real-world-asset"],
    token: "wylds",
    backing: {
        method: "custodian",
        description:
            "Hastra's proof of reserves for wYLDS on all chains, read every hour from its public API: YLDS held on the Provenance Blockchain and USDC waiting to buy YLDS (not traced, counted at one US dollar each), and YLDS lent into Figure's Prime lending pools (loans). wYLDS on Ethereum gets the Ethereum share, by supply.",
        reference: "https://hastra.io/proof-of-reserves",
    },
};

export default class Adapter implements bcked.asset.Adapter {
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        // No Chainlink feed for wYLDS.
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

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        return wyldsBacking("ethereum", lastRecorded);
    }
}
