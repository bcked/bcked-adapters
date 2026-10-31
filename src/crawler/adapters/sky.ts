/**
 * Reserves of Sky (formerly MakerDAO), read on-chain from the Vat, the core accounting contract.
 *
 * DAI and USDS are both minted against vaults in the Vat, so they share one pool of reserves. Each
 * vault type (ilk) holds collateral for its debt:
 * - The Lite PSM holds USDC in its pocket, plus DAI it minted in advance and keeps for swaps.
 * - Crypto vaults (ETH, wstETH, WBTC) hold their collateral in a join contract. All of it is counted,
 *   which is more than the debt, since these vaults are overcollateralized.
 * - Allocator vaults (Spark, Grove, Obex) deploy their USDS through ALM proxies. Their positions are
 *   read there, see sky_allocators.ts. Debt the positions do not cover is not reported.
 * - Real-world-asset, staking and other vaults have no collateral bcked can value on-chain. Their debt
 *   is counted as reserves whose composition is not reported.
 *
 * Holders' claims are all DAI in the Vat (Vat.debt) less the surplus of the protocol (Vat.dai of the
 * Vow), the DAI the Lite PSM keeps and the USDS and DAI the allocators hold. DAI and USDS each get the
 * share of the reserves that their circulating supply has of these claims. The rest belongs to DAI in
 * the Vat, for example in the DAI savings rate.
 *
 * Contracts: https://chainlog.sky.money/
 */
import {
    FunctionFragment,
    Interface,
    decodeBytes32String,
    encodeBytes32String,
    formatUnits,
    type Result,
} from "ethers";
import _ from "lodash";

import { ApiProxy } from "../apis/proxy";
import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";
import { ALLOCATORS, positionsValue, readAllocator } from "./sky_allocators";

const SYSTEM = "ethereum";
const CHAINLOG = "0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F";
export const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const USDS = "0xdC035D45d973E3EC169d2276DDab16f1e407384F";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const LITE_PSM_ILK = "LITE-PSM-USDC-A";
const UNREPORTED = "rwa:undefined";

// Collateral that bcked tracks, by token contract. Other collateral counts at the vault's debt.
const TRACKED_COLLATERAL: Record<string, bcked.asset.Id> = {
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2":
        "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0":
        "ethereum:0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599":
        "ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
};
// IlkRegistry class of vaults whose collateral sits in a standard GemJoin.
const GEM_JOIN_CLASS = 1n;
// Vaults with less debt than this are left out, to keep the number of calls small.
const MIN_DEBT = 1_000;

const ABI = {
    getAddress: "function getAddress(bytes32) view returns (address)",
    list: "function list() view returns (bytes32[])",
    info: "function info(bytes32) view returns (string, string, uint256, uint256, address, address, address, address)",
    ilks: "function ilks(bytes32) view returns (uint256, uint256, uint256, uint256, uint256)",
    debt: "function debt() view returns (uint256)",
    dai: "function dai(address) view returns (uint256)",
    balanceOf: "function balanceOf(address) view returns (uint256)",
};

const RAD = 45; // Vat amounts times rates have 45 decimals.

interface Reserves {
    timestamp: primitive.ISODateTimeString;
    underlying: Record<bcked.asset.Id, number>;
    claims: number;
    psmDai: number;
    // USDS and DAI held by the allocators, which are not circulating.
    held: { USDS: number; DAI: number };
}

let cached: Promise<Reserves> | null = null;

// Multicall3 bundles many view calls into one eth_call, so the RPC provider sees a few requests
// instead of hundreds. https://www.multicall3.com/
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const AGGREGATE3 =
    "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[])";
const CHUNK_SIZE = 50;

interface Call {
    target: string;
    signature: string;
    args?: unknown[];
}

/** Runs view calls through Multicall3, in chunks one after another. Returns the decoded results. */
async function multicall(chain: ChainProxy, calls: Call[]): Promise<Result[]> {
    const fragments = calls.map(({ signature }) => FunctionFragment.from(signature));
    const results: Result[] = [];
    for (const chunk of _.chunk(_.range(calls.length), CHUNK_SIZE)) {
        const encoded = chunk.map((i) => ({
            target: calls[i]!.target,
            allowFailure: false,
            callData: new Interface([fragments[i]!]).encodeFunctionData(
                fragments[i]!,
                calls[i]!.args ?? []
            ),
        }));
        const returned = await chain.call<[boolean, string][]>(
            MULTICALL3,
            AGGREGATE3,
            [encoded],
            SYSTEM
        );
        chunk.forEach((i, j) => {
            results.push(
                new Interface([fragments[i]!]).decodeFunctionResult(fragments[i]!, returned[j]![1])
            );
        });
    }
    return results;
}

async function readReserves(chain: ChainProxy): Promise<Reserves> {
    const api = new ApiProxy();
    const keys = [
        "MCD_VAT",
        "MCD_VOW",
        "ILK_REGISTRY",
        "MCD_LITE_PSM_USDC_A",
        "MCD_LITE_PSM_USDC_A_POCKET",
    ];
    const [vat, vow, registry, psm, pocket] = (
        await multicall(
            chain,
            keys.map((key) => ({
                target: CHAINLOG,
                signature: ABI.getAddress,
                args: [encodeBytes32String(key)],
            }))
        )
    ).map((result) => result[0] as string) as [string, string, string, string, string];

    const [debt, surplus, psmDai, usdc, list] = await multicall(chain, [
        { target: vat, signature: ABI.debt },
        { target: vat, signature: ABI.dai, args: [vow] },
        { target: DAI, signature: ABI.balanceOf, args: [psm] },
        { target: USDC, signature: ABI.balanceOf, args: [pocket] },
        { target: registry, signature: ABI.list },
    ]);

    // Debt of each vault type, without those below MIN_DEBT.
    const allIlks = [...(list![0] as string[])];
    const ilkData = await multicall(
        chain,
        allIlks.map((ilk) => ({ target: vat, signature: ABI.ilks, args: [ilk] }))
    );
    const ilks = allIlks
        .map((ilk, i) => {
            const [art, rate] = ilkData[i]! as unknown as [bigint, bigint];
            return { ilk, debt: parseFloat(formatUnits(art * rate, RAD)) };
        })
        .filter(({ debt }) => debt >= MIN_DEBT);

    const infos = await multicall(
        chain,
        ilks.map(({ ilk }) => ({ target: registry, signature: ABI.info, args: [ilk] }))
    );

    const underlying: Record<bcked.asset.Id, number> = {};
    const add = (id: bcked.asset.Id, amount: number) => {
        underlying[id] = (underlying[id] ?? 0) + amount;
    };
    add(`${SYSTEM}:${USDC}`, parseFloat(formatUnits(usdc![0] as bigint, 6)));

    // Collateral bcked tracks is read from the vault's join, the rest counts at the vault's debt.
    const joins: { id: bcked.asset.Id; gem: string; join: string; decimals: bigint }[] = [];
    const allocators: { ilk: string; debt: number }[] = [];
    ilks.forEach(({ ilk, debt }, i) => {
        if (decodeBytes32String(ilk) == LITE_PSM_ILK) return; // USDC in the pocket, added above
        const [, , ilkClass, decimals, gem, , join] = infos[i]! as unknown as [
            string,
            string,
            bigint,
            bigint,
            string,
            string,
            string,
        ];
        const tracked = TRACKED_COLLATERAL[gem];
        if (ilkClass == GEM_JOIN_CLASS && tracked) {
            joins.push({ id: tracked, gem, join, decimals });
        } else if (decodeBytes32String(ilk) in ALLOCATORS) {
            allocators.push({ ilk: decodeBytes32String(ilk), debt });
        } else {
            add(UNREPORTED, debt);
        }
    });

    // Allocators: their positions, all of them, even where they exceed the debt. Debt that the
    // positions do not cover stays not reported. Sky's own tokens they hold are not reserves and not
    // holders' claims either.
    const held = { USDS: 0, DAI: 0 };
    for (const { ilk, debt } of allocators) {
        const positions = (await readAllocator(chain, api, ilk))!;
        for (const [id, amount] of Object.entries(positions.underlying)) {
            add(id as bcked.asset.Id, amount);
        }
        add(UNREPORTED, Math.max(0, debt - positionsValue(positions)));
        held.USDS += positions.sky.USDS;
        held.DAI += positions.sky.DAI;
    }
    const balances = await multicall(
        chain,
        joins.map(({ gem, join }) => ({ target: gem, signature: ABI.balanceOf, args: [join] }))
    );
    joins.forEach(({ id, decimals }, i) => {
        add(id, parseFloat(formatUnits(balances[i]![0] as bigint, decimals)));
    });

    const psmDaiAmount = parseFloat(formatUnits(psmDai![0] as bigint, 18));
    const claims =
        parseFloat(formatUnits(debt![0] as bigint, RAD)) -
        parseFloat(formatUnits(surplus![0] as bigint, RAD)) -
        psmDaiAmount -
        held.USDS -
        held.DAI;

    return {
        timestamp: toISOString(Date.now()),
        underlying,
        claims,
        psmDai: psmDaiAmount,
        held,
    };
}

/** Reads the reserves once per crawl, DAI and USDS share them. */
export function getSkyReserves(chain: ChainProxy): Promise<Reserves> {
    cached ??= readReserves(chain).catch((error: unknown) => {
        cached = null;
        throw error;
    });
    return cached;
}

/**
 * Circulating supply of DAI or USDS: issued tokens less the DAI the Lite PSM keeps for swaps and the
 * tokens the allocators hold, directly or through sUSDS.
 */
export async function getSkyCirculating(token: string, chain: ChainProxy): Promise<number> {
    const [{ issued }, { psmDai, held }] = await Promise.all([
        chain.getSupply(token, SYSTEM),
        getSkyReserves(chain),
    ]);
    return token == DAI ? issued - psmDai - held.DAI : issued - held.USDS;
}

/** The share of the reserves that backs the circulating supply of DAI or USDS. */
export async function getSkyBacking(
    token: string,
    chain: ChainProxy
): Promise<bcked.asset.Backing[]> {
    const [reserves, circulating] = await Promise.all([
        getSkyReserves(chain),
        getSkyCirculating(token, chain),
    ]);
    const share = circulating / reserves.claims;
    const underlying = Object.fromEntries(
        Object.entries(reserves.underlying).map(([id, amount]) => [id, amount * share])
    );
    return [{ timestamp: reserves.timestamp, underlying }];
}
