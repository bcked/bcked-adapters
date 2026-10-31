/**
 * Positions of the Sky allocators (Spark, Grove, Obex), read on-chain from their ALM proxies.
 *
 * Allocator vaults mint USDS against debt in the Vat. The allocator moves it to its ALM proxy, which
 * deploys it into lending markets, vaults and tokenized funds, also on other chains. The Vat only
 * knows the debt, so the positions are read where they are held.
 *
 * Each position is mapped to what it is:
 * - Lending (SparkLend and Aave deposits, Morpho and Maple vaults, a CLO fund): secured loans (rwa:LOAN).
 *   For SparkLend deposits, the share of the deposit that is not lent out is the deposited token.
 * - Tokenized Treasury and money market funds: money market funds (rwa:MMF).
 * - Stablecoins bcked tracks: that asset.
 * - Sky's own tokens (USDS, DAI, sUSDS and vaults over them): these are claims on Sky itself. They are
 *   neither reserves nor holders' claims, so they are left out of both.
 *
 * Proxies and positions: Spark from https://github.com/sparkdotfi/spark-address-registry, Grove and
 * Obex from the USDS transfers of their allocator buffers in the Chainlog. Positions not listed here
 * are not seen. Debt that the listed positions do not cover stays "not traced yet".
 */
import { FunctionFragment, Interface, formatUnits, type Result } from "ethers";
import _ from "lodash";

import { ApiProxy } from "../apis/proxy";
import { ChainProxy } from "../chains/proxy";

const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const AGGREGATE3 =
    "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[])";

const LOAN: bcked.asset.Id = "rwa:LOAN";
const MMF: bcked.asset.Id = "rwa:MMF";
const UNTRACKED: bcked.asset.Id = "rwa:UNTRACKED";
const USDC: bcked.asset.Id = "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT: bcked.asset.Id = "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7";
const PYUSD: bcked.asset.Id = "ethereum:0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
// Sky's own tokens: they count against the circulating supply of USDS or DAI. sUSDS and vaults
// over it hold USDS.
type Sky = "USDS" | "DAI";
const SUSDS_ETHEREUM = "0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD";

type Position =
    // A token held as it is, counted in units of `to`.
    | { kind: "token"; address: string; to: bcked.asset.Id | Sky }
    // An ERC-4626 vault, counted as its assets.
    | { kind: "vault"; address: string; decimals: number; to: bcked.asset.Id | Sky }
    // sUSDS on another chain, counted at the sUSDS rate on Ethereum.
    | { kind: "susds"; address: string }
    // A SparkLend deposit (aToken). The part not lent out is the underlying token.
    | { kind: "lend"; address: string; underlying: string; idle: bcked.asset.Id | Sky }
    // A fund token, counted at its DefiLlama price in US dollars.
    | { kind: "fund"; address: string; to: bcked.asset.Id };

interface Proxy {
    system: bcked.system.Id;
    address: string;
    positions: Position[];
}

// By Vat ilk.
export const ALLOCATORS: Record<string, Proxy[]> = {
    "ALLOCATOR-SPARK-A": [
        {
            system: "ethereum",
            address: "0x1601843c5E9bC251A3272907010AFa41Fa18347E",
            positions: [
                { kind: "vault", address: SUSDS_ETHEREUM, decimals: 18, to: "USDS" },
                { kind: "token", address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", to: PYUSD },
                // RLUSD is not tracked yet.
                {
                    kind: "token",
                    address: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
                    to: UNTRACKED,
                },
                // Morpho vaults: sparkUSDCbc, sparkUSDTbc, Sentora RLUSD, Arkis (USDC).
                {
                    kind: "vault",
                    address: "0x56A76b428244a50513ec81e225a293d128fd581D",
                    decimals: 6,
                    to: LOAN,
                },
                {
                    kind: "vault",
                    address: "0xb0c424116172B55CbB6dD3136F5989F7959e5B91",
                    decimals: 6,
                    to: LOAN,
                },
                {
                    kind: "vault",
                    address: "0xFC8C624B6080a0a780583799f2A862DE936F6E22",
                    decimals: 18,
                    to: LOAN,
                },
                {
                    kind: "vault",
                    address: "0x38464507E02c983F20428a6E8566693fE9e422a9",
                    decimals: 6,
                    to: LOAN,
                },
                // SparkLend deposits: DAI, USDS, USDC, USDT, PYUSD, RLUSD.
                {
                    kind: "lend",
                    address: "0x4DEDf26112B3Ec8eC46e7E31EA5e123490B05B8B",
                    underlying: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                    idle: "DAI",
                },
                {
                    kind: "lend",
                    address: "0xC02aB1A5eaA8d1B114EF786D9bde108cD4364359",
                    underlying: "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
                    idle: "USDS",
                },
                {
                    kind: "lend",
                    address: "0x377C3bd93f2a2984E1E7bE6A5C22c525eD4A4815",
                    underlying: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                    idle: USDC,
                },
                {
                    kind: "lend",
                    address: "0xe7dF13b8e3d6740fe17CBE928C7334243d86c92f",
                    underlying: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                    idle: USDT,
                },
                {
                    kind: "lend",
                    address: "0x779224df1c756b4EDD899854F32a53E8c2B2ce5d",
                    underlying: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
                    idle: PYUSD,
                },
                {
                    kind: "lend",
                    address: "0x59275Fb72c8004F44BA44432e25082932Fd677f1",
                    underlying: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
                    idle: UNTRACKED,
                },
            ],
        },
        {
            // Spark's savings vault sUSDC holds sUSDS, so it is Sky's own token.
            system: "ethereum",
            address: "0x8D719A830b00e5571db00D173505CD56c0Ec224a",
            positions: [
                {
                    kind: "vault",
                    address: "0xBc65ad17c5C0a2A4D159fa5a503f4992c7B545FE",
                    decimals: 6,
                    to: "USDS",
                },
            ],
        },
        {
            system: "base",
            address: "0x2917956eFF0B5eaF030abDB4EF4296DF775009cA",
            positions: [
                {
                    kind: "vault",
                    address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
                    decimals: 6,
                    to: LOAN,
                },
                {
                    kind: "token",
                    address: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
                    to: "USDS",
                },
            ],
        },
        {
            system: "arbitrum",
            address: "0x92afd6F2385a90e44da3a8B60fe36f6cBe1D8709",
            positions: [{ kind: "susds", address: "0xdDb46999F8891663a8F2828d25298f70416d7610" }],
        },
    ],
    "ALLOCATOR-BLOOM-A": [
        {
            // Grove
            system: "ethereum",
            address: "0x491EDFB0B8b608044e227225C715981a30F3A44E",
            positions: [
                // Janus Henderson Anemoy AAA CLO Fund: pools of corporate loans.
                { kind: "fund", address: "0x5a0F93D040De44e78F251b03c43be9CF317Dcf64", to: LOAN },
                // BlackRock BUIDL-I and Janus Henderson Anemoy Treasury Fund.
                { kind: "fund", address: "0x6a9DA2D710BB9B700acde7Cb81F10F1fF8C89041", to: MMF },
                { kind: "fund", address: "0x8c213ee79581Ff4984583C6a801e5263418C4b86", to: MMF },
                // Grove x Steakhouse USDC (Morpho).
                {
                    kind: "vault",
                    address: "0xBeefF08dF54897e7544aB01d0e86f013DA354111",
                    decimals: 6,
                    to: LOAN,
                },
            ],
        },
    ],
    "ALLOCATOR-OBEX-A": [
        {
            system: "ethereum",
            address: "0xb6dD7ae22C9922AFEe0642f9Ac13e58633f715A2",
            // Maple syrupUSDC.
            positions: [
                {
                    kind: "vault",
                    address: "0x80ac24aA929eaF5013f6436cdA2a7ba190f5Cc0b",
                    decimals: 6,
                    to: LOAN,
                },
            ],
        },
    ],
};

export interface AllocatorPositions {
    // Reserves in units of each asset (US dollars for rwa:LOAN, rwa:MMF and rwa:UNTRACKED).
    underlying: Record<bcked.asset.Id, number>;
    // Sky's own tokens held by the allocator, in USDS and DAI.
    sky: Record<Sky, number>;
}

const ABI = {
    balanceOf: "function balanceOf(address) view returns (uint256)",
    decimals: "function decimals() view returns (uint8)",
    totalSupply: "function totalSupply() view returns (uint256)",
    convertToAssets: "function convertToAssets(uint256) view returns (uint256)",
};

interface Call {
    target: string;
    signature: string;
    args?: unknown[];
}

async function multicall(chain: ChainProxy, system: string, calls: Call[]): Promise<Result[]> {
    const fragments = calls.map(({ signature }) => FunctionFragment.from(signature));
    const encoded = calls.map(({ target, args }, i) => ({
        target,
        allowFailure: false,
        callData: new Interface([fragments[i]!]).encodeFunctionData(fragments[i]!, args ?? []),
    }));
    const returned = await chain.call<[boolean, string][]>(
        MULTICALL3,
        AGGREGATE3,
        [encoded],
        system
    );
    return returned.map(([, data], i) =>
        new Interface([fragments[i]!]).decodeFunctionResult(fragments[i]!, data)
    );
}

const big = (result: Result | undefined) => result![0] as bigint;

/** Reads one proxy: its positions, each mapped to reserves or to Sky's own tokens. */
async function readProxy(
    chain: ChainProxy,
    api: ApiProxy,
    proxy: Proxy,
    susdsRate: number
): Promise<AllocatorPositions> {
    const { system, address: holder, positions } = proxy;
    // Balance and decimals of each position, plus what each kind needs to value it.
    const calls: Call[] = positions.flatMap((p) => [
        { target: p.address, signature: ABI.balanceOf, args: [holder] },
        { target: p.address, signature: ABI.decimals },
    ]);
    const base = await multicall(chain, system, calls);

    const result: AllocatorPositions = { underlying: {}, sky: { USDS: 0, DAI: 0 } };
    const add = (to: bcked.asset.Id | Sky, amount: number) => {
        if (amount <= 0) return;
        if (to == "USDS" || to == "DAI") result.sky[to] += amount;
        else result.underlying[to] = (result.underlying[to] ?? 0) + amount;
    };

    for (const [i, p] of positions.entries()) {
        const raw = big(base[2 * i]);
        const decimals = Number(big(base[2 * i + 1]));
        const balance = parseFloat(formatUnits(raw, decimals));
        if (raw == 0n) continue;

        switch (p.kind) {
            case "token":
                add(p.to, balance);
                break;
            case "susds":
                add("USDS", balance * susdsRate);
                break;
            case "vault": {
                const [assets] = await multicall(chain, system, [
                    { target: p.address, signature: ABI.convertToAssets, args: [raw] },
                ]);
                add(p.to, parseFloat(formatUnits(big(assets), p.decimals)));
                break;
            }
            case "lend": {
                // The aToken holds what is not lent out. The proxy's share of it is the idle part.
                const [idleRaw, supplyRaw] = await multicall(chain, system, [
                    { target: p.underlying, signature: ABI.balanceOf, args: [p.address] },
                    { target: p.address, signature: ABI.totalSupply },
                ]);
                const share = Number(raw) / Number(big(supplyRaw));
                const idle = Math.min(
                    balance,
                    parseFloat(formatUnits(big(idleRaw), decimals)) * share
                );
                add(p.idle, idle);
                add(LOAN, balance - idle);
                break;
            }
            case "fund": {
                const price = await api.getPrice({ address: p.address, system });
                if (!price) throw Error(`No price for fund ${system}:${p.address}.`);
                add(p.to, balance * price.usd);
                break;
            }
        }
    }
    return result;
}

/** Positions of one allocator ilk over all its proxies. */
export async function readAllocator(
    chain: ChainProxy,
    api: ApiProxy,
    ilk: string
): Promise<AllocatorPositions | null> {
    const proxies = ALLOCATORS[ilk];
    if (!proxies) return null;

    const [rate] = await multicall(chain, "ethereum", [
        { target: SUSDS_ETHEREUM, signature: ABI.convertToAssets, args: [10n ** 18n] },
    ]);
    const susdsRate = parseFloat(formatUnits(big(rate), 18));

    const total: AllocatorPositions = { underlying: {}, sky: { USDS: 0, DAI: 0 } };
    for (const proxy of proxies) {
        const read = await readProxy(chain, api, proxy, susdsRate);
        total.sky.USDS += read.sky.USDS;
        total.sky.DAI += read.sky.DAI;
        for (const [id, amount] of Object.entries(read.underlying)) {
            total.underlying[id as bcked.asset.Id] =
                (total.underlying[id as bcked.asset.Id] ?? 0) + amount;
        }
    }
    return total;
}

/** US dollar value of positions, with tracked stablecoins at $1. */
export function positionsValue(positions: AllocatorPositions): number {
    return _.sum(Object.values(positions.underlying)) + positions.sky.USDS + positions.sky.DAI;
}
