/**
 * GHO on Ethereum, the stablecoin of the Aave protocol. The address is listed in Aave's address book
 * (https://github.com/bgd-labs/aave-address-book, MIT). The price is the Chainlink GHO/USD feed.
 *
 * Facilitators mint GHO ahead of use, so the totalSupply includes GHO no one holds. The circulating
 * supply leaves out the GHO held by the GHO reserve (which funds the stability modules), by the
 * stability modules themselves (listed by the GSM registry), the GHO not borrowed from the Aave
 * markets it is minted into (held by their GHO aTokens), and the GHO locked in the Chainlink CCIP
 * pool for GHO on other chains (from Chainlink's TokenAdminRegistry). GHO on other chains is not
 * tracked.
 *
 * The backing is not recorded yet. GHO is minted by several facilitators: the Aave pool (GHO borrowed
 * against collateral), the GHO stability modules (holding USDC and USDT) and direct minters into Aave
 * markets. Each needs its own on-chain reading, which is not built yet.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const GHO_RESERVE = "0x54C58157DeF387A880AE62332D1445f03adbE7E9";
const GSM_REGISTRY = "0x167527DB01325408696326e3580cd8e55D99Dc1A";
// GHO aTokens of the Aave markets GHO is minted into: Core, Lido and Horizon.
const GHO_A_TOKENS = [
    "0x00907f9921424583e7ffBfEdf84F92B7B2Be4977",
    "0x18eFE565A5373f430e2F809b97De30335B3ad96A",
    "0x946281A2d0DD6e650d08f74833323D66AE4c8b12",
];
const TOKEN_ADMIN_REGISTRY = "0xb22764f98dD05c789929716D677382Df22C05Cb6";

const details: bcked.asset.Details = {
    name: "GHO",
    symbol: "GHO",
    identifier: {
        address: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "aave",
    },
    reference: "https://github.com/bgd-labs/aave-address-book",
    backing: {
        method: "not-tracked",
        description:
            "GHO is backed by the positions of several facilitators on-chain (loans in the Aave pool, USDC and USDT in the stability modules), which bcked does not read yet.",
        reference: "https://aave.com/docs/developers/gho",
    },
    tags: ["stablecoin"],
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

    /** Holders of GHO that is minted but not in circulation, see above. */
    private async idleHolders(): Promise<string[]> {
        const { address, system } = details.identifier;
        const [gsms, pool] = await Promise.all([
            this.chain.call<string[]>(
                GSM_REGISTRY,
                "function getGsmList() view returns (address[])",
                [],
                system
            ),
            this.chain.call<string>(
                TOKEN_ADMIN_REGISTRY,
                "function getPool(address) view returns (address)",
                [address],
                system
            ),
        ]);
        // CCIP pools from version 2.0 keep the tokens in a lockbox.
        const lockBox = await this.chain
            .call<string>(pool, "function getLockBox() view returns (address)", [], system)
            .catch(() => null);
        const holders = [GHO_RESERVE, ...gsms, ...GHO_A_TOKENS, pool, lockBox];
        return [...new Set(holders.filter((h): h is string => !!h))];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { address, system } = details.identifier;
        const [{ timestamp, issued }, holders] = await Promise.all([
            this.chain.getSupply(address, system),
            this.idleHolders(),
        ]);
        const balances = await Promise.all(
            holders.map((holder) => this.chain.getBalance(holder, address, system))
        );
        const idle = balances.reduce((sum, { balance }) => sum + balance, 0);
        return [
            {
                timestamp,
                circulating: issued - idle,
                burned: null,
                total: issued,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
