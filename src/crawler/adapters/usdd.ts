/**
 * Backing of USDD, read on-chain from its Vats. USDD is a fork of the Maker protocol with a separate
 * set of contracts on Tron, Ethereum and BNB Chain. USDD moves between chains, also to chains
 * without a Vat that bcked does not read (e.g. BitTorrent Chain), so a chain's Vat does not match
 * the USDD on that chain. The collateral of all three Vats is summed, and each chain asset gets the
 * share that its supply has of all USDD minted, the summed debt of the vaults. The USDD on chains
 * bcked does not read keeps its share. The joins are listed in the USDD docs
 * (https://docs.usdd.io/introduction/collateral-asset-contract-addresses).
 *
 * Each join names its vault type (ilk) and its collateral token (gem):
 * - Collateral bcked tracks (TRX, ETH, WBTC, USDT, USDC) is counted in full, as the join's balance
 *   of the token. Vaults are overcollateralized, so this is more than their debt.
 * - Other vaults are counted at their debt as reserves bcked has not traced yet. The largest is the
 *   Smart Allocator (SA001-A), which invests USDD's reserves in platforms like Aave; its join holds
 *   only a placeholder token.
 */
import { formatUnits } from "ethers";
import { ChainProxy } from "../chains/proxy";
import { toHex } from "../chains/tron";
import { toISOString } from "../../utils/string_formatting";
import { readSupplies } from "./por_share";

const UNTRACKED = "rwa:UNTRACKED";
const ILKS = "function ilks(bytes32) view returns (uint256, uint256, uint256, uint256, uint256)";

interface Deployment {
    vat: string;
    joins: string[];
    /** Collateral tokens bcked tracks, by gem address (hex), with their asset. */
    collateral: Record<string, bcked.asset.Id>;
}

export const DEPLOYMENTS: Record<string, Deployment> = {
    tron: {
        vat: "TH5dhX7o39afSbfDT2e3c9k4itWjNKD4D9",
        joins: [
            "TJ1VWPvFVq7sVsN7J7dWJVZz4SLT14qRUr", // TRX-A
            "TGQKnHDQNyc3QeHJ7YxH8wggdg89UVXyvX", // TRX-B
            "TPUPPLTYLdbW4jxwD5g2T7ystxsR9HL2mt", // TRX-C
            "TKha7zcAXZMaaWzoVmUHtvVFqr9GeiChgJ", // sTRX-A
            "TDUkQbjrXs6xUbxGCLknWwJHxVTdysXBhy", // USDT-A
            "TSUYvQ5tdd3DijCD1uGunGLpftHuSZ12sQ", // PSM-USDT
            "TXdYNjXaHn3c1whomRpzCkaFbjfCffMFGf", // SA001-A
            "TDea6uDwDgxkUwyEefhqMPij6NzRiPrVV1", // WBTC-A
            "TRoqYfXY7ZLZcjeiTQYNu2vDhJPeJYNf1w", // WBTC-B
        ],
        collateral: {
            // Wrapped TRX, 1:1 with TRX.
            "0x891cdb91d149f23B1a45D9c5Ca78a88d0cB44C18": "tron:TRX",
            "0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C": "tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        },
    },
    ethereum: {
        vat: "0xff77f6209239deb2c076179499f2346b0032097f",
        joins: [
            "0x7a69D5BfC49bC48AF6A2ed4969d32752362793Fc", // SA001-A
            "0x75a3a7075867AF105a9ca4b0D25a6806cd682079", // ETH-A
            "0x82756f17B455436dFADe82f71C01CE6daE9a9015", // ETH-B
            "0x2B65f7d21ea885dd4e5b5A44b5CaA033E6B2E953", // ETH-C
            "0xC677f105fC46E4E87597CE524f95298BB5897648", // WBTC-A
            "0xbB62eE7d003ee6Bf21d6244A2a919A4C29F2d255", // WBTC-B
            "0x5bD2cE3b0D81C54D43179264eBa4b4eDCabb991E", // WBTC-C
            "0x217e42ceb2eae9ecb788fdf0e31c806c531760a3", // PSM-USDT
            "0x9a7e1b324060db7342aea08c0dc56f55ced6f519", // PSM-USDC
        ],
        collateral: {
            "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2":
                "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
            "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599":
                "ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
            "0xdAC17F958D2ee523a2206206994597C13D831ec7":
                "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48":
                "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        },
    },
    bsc: {
        vat: "0x41f1402ab4d900115d1f16a14a3cf4bdf2f2705c",
        joins: [
            "0x062a738465F30EBe6dD06cFAd3256Ba783EDf000", // SA001-A
            "0xe229FdA620B8a9B98ef184830EE3063F0F86B790", // PSM-USDT
        ],
        // USDT on BNB Chain has no asset in bcked, so the PSM counts at its debt.
        collateral: {},
    },
};

const chain = new ChainProxy();

interface Reserves {
    underlying: Partial<Record<bcked.asset.Id, number>>;
    /** USDD minted by the vaults. */
    debt: number;
}

/** The collateral and debt in one chain's Vat, added to `reserves`. */
async function readVat(
    system: bcked.system.Id,
    deployment: Deployment,
    reserves: Reserves
): Promise<void> {
    const add = (id: bcked.asset.Id, amount: number) => {
        if (amount > 0) reserves.underlying[id] = (reserves.underlying[id] ?? 0) + amount;
    };
    for (const join of deployment.joins) {
        const [ilk, gem] = await Promise.all([
            chain.call<string>(join, "function ilk() view returns (bytes32)", [], system),
            chain.call<string>(join, "function gem() view returns (address)", [], system),
        ]);
        const [art, rate] = await chain.call<bigint[]>(deployment.vat, ILKS, [ilk], system);
        const debt = parseFloat(formatUnits(art! * rate!, 45));
        reserves.debt += debt;
        const asset = Object.entries(deployment.collateral).find(
            ([address]) => address.toLowerCase() == gem.toLowerCase()
        )?.[1];
        if (!asset) {
            add(UNTRACKED, debt);
            continue;
        }
        const holder = system == "tron" ? toHex(join) : join;
        const [balance, decimals] = await Promise.all([
            chain.call<bigint>(
                gem,
                "function balanceOf(address) view returns (uint256)",
                [holder],
                system
            ),
            chain.call<bigint>(gem, "function decimals() view returns (uint8)", [], system),
        ]);
        add(asset, parseFloat(formatUnits(balance, Number(decimals))));
    }
}

// The collateral and debt of all Vats, read once per process and shared by the chain assets.
let reserves: Promise<Reserves> | null = null;

function readReserves(): Promise<Reserves> {
    reserves ??= (async () => {
        const result: Reserves = { underlying: {}, debt: 0 };
        for (const [system, deployment] of Object.entries(DEPLOYMENTS))
            await readVat(system, deployment, result);
        return result;
    })().catch((error: unknown) => {
        reserves = null;
        throw error;
    });
    return reserves;
}

/**
 * The backing of one USDD chain asset: its share of the collateral of all Vats, by its supply over
 * all USDD minted.
 *
 * @param assets Every chain asset of USDD, as system:address
 * @param asset The chain asset to get the backing for
 */
export async function getUsddBacking(
    assets: bcked.asset.Id[],
    asset: bcked.asset.Id
): Promise<bcked.asset.Backing[]> {
    const [{ underlying, debt }, supplies] = await Promise.all([
        readReserves(),
        readSupplies(assets),
    ]);
    const supply = supplies[assets.indexOf(asset)];
    if (supply === undefined) throw Error(`${asset} is not one of the USDD assets`);
    if (!(debt > 0)) return [];
    const share = Math.min(1, supply / debt);
    console.log(`USDD: ${asset} holds ${supply.toFixed(0)} of ${debt.toFixed(0)} minted`);
    const backing: Partial<Record<bcked.asset.Id, number>> = {};
    for (const [id, amount] of Object.entries(underlying))
        backing[id as bcked.asset.Id] = amount! * share;
    return [{ timestamp: toISOString(Date.now()), underlying: backing }];
}
