/**
 * GHO, the stablecoin of the Aave protocol, read on-chain. Addresses are from Aave's address book
 * (https://github.com/bgd-labs/aave-address-book, MIT).
 *
 * Facilitators mint GHO ahead of use. GHO not in anyone's hands sits with the GHO reserves (which
 * fund the stability modules, GSMs), the GSMs themselves, the GHO aTokens of the Aave markets GHO is
 * minted into (liquidity not borrowed) and, for GHO on other chains, the Chainlink CCIP pool on
 * Ethereum. The circulating GHO on Ethereum leaves these out.
 *
 * What backs the GHO in circulation, on all chains together:
 * - GHO borrowed from the Aave markets (Core, Lido, Horizon): each direct minter's bucket less the
 *   GHO left in the market. Recorded as loans (rwa:LOAN) at the borrowed amount; the borrowers'
 *   collateral is not traced.
 * - The GSMs on Ethereum, Arbitrum, Plasma and Monad: the stablecoins they hold, unwrapped from the
 *   Aave wrapper tokens they hold them in. Stablecoins without an asset in bcked count as not traced:
 *   USDT0 on Plasma, whose backing (USDT locked on Ethereum) covers USDT0 on chains bcked cannot read.
 * GHO on Ethereum gets the share of this that matches its share of all GHO in circulation.
 */
import { formatUnits } from "ethers";
import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";

const UNTRACKED = "rwa:UNTRACKED";
// Loans against collateral, as for Maple's syrupUSDC.
const LOAN = "rwa:LOAN";
export const GHO = "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f";
const GHO_RESERVE = "0x54C58157DeF387A880AE62332D1445f03adbE7E9";
const GSM_REGISTRY = "0x167527DB01325408696326e3580cd8e55D99Dc1A";
const TOKEN_ADMIN_REGISTRY = "0xb22764f98dD05c789929716D677382Df22C05Cb6";
// Direct minters into the Aave markets and the GHO aToken of their market: Core, Lido and Horizon.
const DIRECT_MINTERS: [string, string][] = [
    ["0x5513224daaEABCa31af5280727878d52097afA05", "0x00907f9921424583e7ffBfEdf84F92B7B2Be4977"],
    ["0x2cE01c87Fec1b71A9041c52CaED46Fc5f4807285", "0x18eFE565A5373f430e2F809b97De30335B3ad96A"],
    ["0xe10C78A3AC7f016eD2DE1A89c5479b1039EAB9eA", "0x946281A2d0DD6e650d08f74833323D66AE4c8b12"],
];

interface Deployment {
    gho: string;
    reserve: string;
    /** GSM registry, or the GSMs where the address book names them directly. */
    gsmRegistry?: string;
    gsms?: string[];
}

// GHO on other chains with GSMs, funded from Ethereum through Chainlink CCIP.
const REMOTE: Partial<Record<bcked.system.Id, Deployment>> = {
    arbitrum: {
        gho: "0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33",
        reserve: "0xC912D64F9F649897dC0244da3835869d410d053e",
        gsmRegistry: "0x2Be58aD215AA8552CB5BD038a88d0dE39d2427BB",
    },
    plasma: {
        gho: "0xb77E872A68C62CfC0dFb02C067Ecc3DA23B4bbf3",
        reserve: "0x6aC541605b0317dE076C9FeC2842902c844dEa74",
        gsms: ["0xd06114F714beCD6f373e5cE94E07278eF46eBF37"],
    },
    monad: {
        gho: "0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73",
        reserve: "0x307707A53Cb51670a8bcC8a2808A349C65E1Fb92",
        gsms: ["0x3Cf3779EEf770931543ACd2C7f6ECd1b37E35caB"],
    },
};

// Stablecoins in GSMs that bcked tracks, by chain and token address (lowercase).
const COLLATERAL: Record<string, bcked.asset.Id> = {
    "ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7":
        "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48":
        "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    "arbitrum:0xaf88d065e77c8cc2239327c5edb3a432268e5831":
        "arbitrum:0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC
    "monad:0x754704bc059f8c67012fed69bc8a327a5aafb603":
        "monad:0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // USDC
};

const BALANCE = "function balanceOf(address) view returns (uint256)";

export class GhoReader {
    constructor(private chain: ChainProxy) {}

    private async ghoBalance(gho: string, holder: string, system: bcked.system.Id) {
        return parseFloat(
            formatUnits(await this.chain.call<bigint>(gho, BALANCE, [holder], system), 18)
        );
    }

    private async gsms(deployment: Deployment, system: bcked.system.Id): Promise<string[]> {
        if (!deployment.gsmRegistry) return deployment.gsms ?? [];
        return this.chain.call<string[]>(
            deployment.gsmRegistry,
            "function getGsmList() view returns (address[])",
            [],
            system
        );
    }

    /** Holders on Ethereum of GHO that is not in circulation. */
    private async idleHoldersOnEthereum(): Promise<string[]> {
        const [gsms, pool] = await Promise.all([
            this.gsms({ gho: GHO, reserve: GHO_RESERVE, gsmRegistry: GSM_REGISTRY }, "ethereum"),
            this.ccipPool(),
        ]);
        const holders = [
            GHO_RESERVE,
            ...gsms,
            ...DIRECT_MINTERS.map(([, aToken]) => aToken),
            ...pool,
        ];
        return [...new Set(holders)];
    }

    /** The GHO CCIP pool on Ethereum and, for pools from version 2.0, its lockbox. */
    private async ccipPool(): Promise<string[]> {
        const pool = await this.chain.call<string>(
            TOKEN_ADMIN_REGISTRY,
            "function getPool(address) view returns (address)",
            [GHO],
            "ethereum"
        );
        const lockBox = await this.chain
            .call<string>(pool, "function getLockBox() view returns (address)", [], "ethereum")
            .catch(() => null);
        return lockBox ? [pool, lockBox] : [pool];
    }

    /** totalSupply on Ethereum and the GHO in circulation there. */
    async ethereumSupply(): Promise<{ issued: number; circulating: number }> {
        const [{ issued }, holders] = await Promise.all([
            this.chain.getSupply(GHO, "ethereum"),
            this.idleHoldersOnEthereum(),
        ]);
        const idle = await Promise.all(holders.map((h) => this.ghoBalance(GHO, h, "ethereum")));
        return { issued, circulating: issued - idle.reduce((a, b) => a + b, 0) };
    }

    /** Stablecoins held by a GSM, unwrapped from Aave's wrapper token if it holds one. */
    private async gsmCollateral(
        gsm: string,
        system: bcked.system.Id
    ): Promise<{ asset: bcked.asset.Id; amount: number }> {
        const underlying = await this.chain.call<string>(
            gsm,
            "function UNDERLYING_ASSET() view returns (address)",
            [],
            system
        );
        const held = await this.chain.call<bigint>(underlying, BALANCE, [gsm], system);
        let token = underlying;
        let amount = held;
        try {
            token = await this.chain.call<string>(
                underlying,
                "function asset() view returns (address)",
                [],
                system
            );
            amount = await this.chain.call<bigint>(
                underlying,
                "function convertToAssets(uint256) view returns (uint256)",
                [held],
                system
            );
        } catch {
            // Not a wrapper: the GSM holds the stablecoin itself.
        }
        const decimals = await this.chain.call<bigint>(
            token,
            "function decimals() view returns (uint8)",
            [],
            system
        );
        const asset = COLLATERAL[`${system}:${token.toLowerCase()}`] ?? UNTRACKED;
        return { asset, amount: parseFloat(formatUnits(amount, Number(decimals))) };
    }

    /** The backing of the GHO on Ethereum, see above. */
    async ethereumBacking(): Promise<bcked.asset.Backing[]> {
        const underlying: Partial<Record<bcked.asset.Id, number>> = {};
        const add = (id: bcked.asset.Id, amount: number) => {
            if (amount > 0) underlying[id] = (underlying[id] ?? 0) + amount;
        };

        // GHO borrowed from the Aave markets.
        for (const [minter, aToken] of DIRECT_MINTERS) {
            const [, level] = await this.chain.call<[bigint, bigint]>(
                GHO,
                "function getFacilitatorBucket(address) view returns (uint256, uint256)",
                [minter],
                "ethereum"
            );
            const unborrowed = await this.ghoBalance(GHO, aToken, "ethereum");
            add(LOAN, parseFloat(formatUnits(level, 18)) - unborrowed);
        }

        // The GSMs on Ethereum and the other chains, and the GHO idle on the other chains.
        const deployments: [bcked.system.Id, Deployment][] = [
            ["ethereum", { gho: GHO, reserve: GHO_RESERVE, gsmRegistry: GSM_REGISTRY }],
            ...(Object.entries(REMOTE) as [bcked.system.Id, Deployment][]),
        ];
        let idleRemote = 0;
        for (const [system, deployment] of deployments) {
            const gsms = await this.gsms(deployment, system);
            for (const gsm of gsms) {
                const { asset, amount } = await this.gsmCollateral(gsm, system);
                add(asset, amount);
                if (system != "ethereum")
                    idleRemote += await this.ghoBalance(deployment.gho, gsm, system);
            }
            if (system != "ethereum")
                idleRemote += await this.ghoBalance(deployment.gho, deployment.reserve, system);
        }

        // GHO on Ethereum gets its share of all GHO in circulation: on Ethereum, plus the GHO locked
        // for the other chains less what is idle there.
        const [{ circulating }, pool] = await Promise.all([this.ethereumSupply(), this.ccipPool()]);
        const locked = (
            await Promise.all(pool.map((h) => this.ghoBalance(GHO, h, "ethereum")))
        ).reduce((a, b) => a + b, 0);
        const total = circulating + locked - idleRemote;
        if (!(total > 0)) return [];
        const share = Math.min(1, circulating / total);
        const backing: Partial<Record<bcked.asset.Id, number>> = {};
        for (const [id, amount] of Object.entries(underlying))
            backing[id as bcked.asset.Id] = amount! * share;
        return [{ timestamp: toISOString(Date.now()), underlying: backing }];
    }
}
