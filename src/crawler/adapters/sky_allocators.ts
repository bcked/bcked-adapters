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
 * Proxies and positions: Spark from https://github.com/sparkdotfi/spark-address-registry, Grove from
 * https://github.com/grove-labs/grove-address-registry, Obex from the USDS transfers of its allocator
 * buffer in the Chainlog. USDC Grove lends off-chain (Galaxy, FalconX) counts as sent to the
 * borrowers' deposit addresses in its registry, less what came back. Positions not listed here
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

// Uniswap V3 on Ethereum, AUSD/USDC positions. AUSD (Agora) is not tracked yet.
const UNISWAP_AUSD_USDC = {
    kind: "uniswap",
    manager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    tokens: {
        "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a": "rwa:UNTRACKED",
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48":
            "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
} as const;

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
    // A fund token, counted at its DefiLlama price in US dollars. `llama` is DefiLlama's chain name
    // where it differs from the system id.
    | { kind: "fund"; address: string; to: bcked.asset.Id; llama?: string }
    // Uniswap V3 positions of the holder, each token in units of the asset it maps to.
    | { kind: "uniswap"; manager: string; factory: string; tokens: Record<string, bcked.asset.Id> }
    // Tokens sent to an off-chain borrower's deposit address, less what came back from it. Read
    // with Alchemy's transfer API on Ethereum. If that fails, the amount stays not traced yet.
    | { kind: "sent"; address: string; to: string; decimals: number; as: bcked.asset.Id };

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
                // Other Grove x Steakhouse vaults (Morpho): AUSD and an earlier USDC vault.
                {
                    kind: "vault",
                    address: "0xBEEfF0d672ab7F5018dFB614c93981045D4aA98a",
                    decimals: 6,
                    to: LOAN,
                },
                {
                    kind: "vault",
                    address: "0xBEEf2B5FD3D94469b7782aeBe6364E6e6FB1B709",
                    decimals: 6,
                    to: LOAN,
                },
                // RLUSD lent on Aave Core and Aave Horizon. RLUSD is not tracked yet.
                ...[
                    "0xFa82580c16A31D0c1bC632A36F82e83EfEF3Eec0",
                    "0xE3190143Eb552456F88464662f0c0C4aC67A77eB",
                ].map((address): Position => ({
                    kind: "lend",
                    address,
                    underlying: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
                    idle: UNTRACKED,
                })),
                // Agora AUSD is not tracked yet.
                {
                    kind: "token",
                    address: "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a",
                    to: UNTRACKED,
                },
                // Securitize Tokenized AAA CLO Fund (STAC): pools of corporate loans.
                { kind: "fund", address: "0x51C2d74017390CbBd30550179A16A1c28F7210fc", to: LOAN },
                // USDC lent off-chain: Galaxy Arch CLO, Galaxy warehouse facility, FalconX.
                ...[
                    "0x2E3A11807B94E689387f60CD4BF52A56857f2eDC",
                    "0x3E23311f9FF660E3c3d87E4b7c207b3c3D7e04f0",
                    "0xD94F9ef3395BBE41C1f05ced3C9a7dc520D08036",
                ].map((to): Position => ({
                    kind: "sent",
                    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                    to,
                    decimals: 6,
                    as: LOAN,
                })),
            ],
        },
        {
            // Grove on Base: Grove x Steakhouse USDC and other Steakhouse USDC vaults (Morpho).
            system: "base",
            address: "0x9B746dBC5269e1DF6e4193Bcb441C0FbBF1CeCEe",
            positions: [
                "0xbeef0786756810478b88982DE00F3CD7fdB8e7c7",
                "0xBeEf2d50B428675a1921bC6bBF4bfb9D8cF1461A",
                "0xbeef0e0834849aCC03f0089F01f4F1Eeb06873C9",
            ].map((address): Position => ({ kind: "vault", address, decimals: 6, to: LOAN })),
        },
        {
            // Grove on Avalanche: Janus Henderson Anemoy AAA CLO Fund.
            system: "avalanche",
            address: "0x7107DD8F56642327945294a18A4280C78e153644",
            positions: [
                {
                    kind: "fund",
                    address: "0x58f93d6b1ef2f44ec379cb975657c132cbed3b6b",
                    to: LOAN,
                    llama: "avax",
                },
            ],
        },
        {
            // Grove on Plume: Apollo Diversified Credit (ACRDX), private credit.
            system: "plume",
            address: "0x1DB91ad50446a671e2231f77e00948E68876F812",
            positions: [
                {
                    kind: "fund",
                    address: "0x9477724Bb54AD5417de8Baff29e59DF3fB4DA74f",
                    to: LOAN,
                    llama: "plume_mainnet",
                },
            ],
        },
        {
            // Grove on Robinhood Chain: USDG and Grove x Steakhouse USDG (Morpho).
            system: "robinhood",
            address: "0x29626c2d8Ca49A51E4dECEEc5499e52983c42BD5",
            positions: [
                {
                    kind: "token",
                    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
                    to: "robinhood:0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
                },
                {
                    kind: "vault",
                    address: "0xBEEff039907422219Fb367e525954DDC092854d9",
                    decimals: 6,
                    to: LOAN,
                },
            ],
        },
    ],
    "ALLOCATOR-GROVE-A": [
        {
            // Grove's PAU proxy keeps idle USDS in a pocket contract: Sky's own token.
            system: "ethereum",
            address: "0x2Cd296095788A2741e72056D66B3Ae1fAeE23ea2",
            positions: [
                {
                    kind: "token",
                    address: "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
                    to: "USDS",
                },
            ],
        },
        {
            // Uniswap V3 AUSD/USDC positions of the PAU proxy.
            system: "ethereum",
            address: "0x0DcD9298e163dFD3c0B5b00F0d9093C36e40A153",
            positions: [UNISWAP_AUSD_USDC],
        },
    ],
    "ALLOCATOR-PRYSM-A": [
        {
            // Osero x Gauntlet USDC Prime (Morpho).
            system: "ethereum",
            address: "0x6d370e359e9cbd0Fd35Bb38fAF705D84238CB884",
            positions: [
                {
                    kind: "vault",
                    address: "0x802148D518A6De2aF866f9A61ffB5e5C39156dB2",
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

/**
 * Token amounts of all Uniswap V3 positions of a holder, from each position's liquidity and range
 * at the pool's current price. Uncollected fees are left out.
 */
async function uniswapAmounts(
    chain: ChainProxy,
    system: string,
    manager: string,
    factory: string,
    holder: string
): Promise<[string, number][]> {
    const [count] = await multicall(chain, system, [
        {
            target: manager,
            signature: "function balanceOf(address) view returns (uint256)",
            args: [holder],
        },
    ]);
    const ids = await multicall(
        chain,
        system,
        _.range(Number(big(count))).map((i) => ({
            target: manager,
            signature: "function tokenOfOwnerByIndex(address,uint256) view returns (uint256)",
            args: [holder, i],
        }))
    );
    const amounts: [string, number][] = [];
    for (const id of ids) {
        const [position] = await multicall(chain, system, [
            {
                target: manager,
                signature:
                    "function positions(uint256) view returns (uint96, address, address, address, uint24, int24, int24, uint128, uint256, uint256, uint128, uint128)",
                args: [big(id)],
            },
        ]);
        const [, , token0, token1, fee, tickLower, tickUpper, liquidity] = position as unknown as [
            bigint,
            string,
            string,
            string,
            bigint,
            bigint,
            bigint,
            bigint,
        ];
        if (liquidity == 0n) continue;
        const [pool] = await multicall(chain, system, [
            {
                target: factory,
                signature: "function getPool(address,address,uint24) view returns (address)",
                args: [token0, token1, fee],
            },
        ]);
        const [slot0, decimals0, decimals1] = await multicall(chain, system, [
            {
                target: pool![0] as string,
                signature:
                    "function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
            },
            { target: token0, signature: ABI.decimals },
            { target: token1, signature: ABI.decimals },
        ]);
        const price = Number(big(slot0)) / 2 ** 96;
        const lower = Math.sqrt(1.0001 ** Number(tickLower));
        const upper = Math.sqrt(1.0001 ** Number(tickUpper));
        const current = Math.min(Math.max(price, lower), upper);
        const L = Number(liquidity);
        amounts.push([
            token0,
            (L * (upper - current)) / (current * upper) / 10 ** Number(big(decimals0)),
        ]);
        amounts.push([token1, (L * (current - lower)) / 10 ** Number(big(decimals1))]);
    }
    return amounts;
}

interface AssetTransfers {
    transfers: { rawContract: { value: string | null } }[];
    pageKey?: string;
}

/** Sum of all transfers of a token from one address to another, with Alchemy's transfer API. */
async function transferred(
    chain: ChainProxy,
    system: string,
    token: string,
    from: string,
    to: string,
    decimals: number
): Promise<number> {
    let total = 0n;
    let pageKey: string | undefined;
    do {
        const page: AssetTransfers = await chain.send<AssetTransfers>(
            "alchemy_getAssetTransfers",
            [
                {
                    fromBlock: "0x0",
                    toBlock: "latest",
                    fromAddress: from,
                    toAddress: to,
                    contractAddresses: [token],
                    category: ["erc20"],
                    excludeZeroValue: true,
                    maxCount: "0x3e8",
                    ...(pageKey ? { pageKey } : {}),
                },
            ],
            system
        );
        for (const transfer of page.transfers) total += BigInt(transfer.rawContract.value ?? 0);
        pageKey = page.pageKey;
    } while (pageKey);
    return parseFloat(formatUnits(total, decimals));
}

/** Reads one proxy: its positions, each mapped to reserves or to Sky's own tokens. */
async function readProxy(
    chain: ChainProxy,
    api: ApiProxy,
    proxy: Proxy,
    susdsRate: number
): Promise<AllocatorPositions> {
    const { system, address: holder, positions } = proxy;
    // Balance and decimals of each position, plus what each kind needs to value it.
    const result: AllocatorPositions = { underlying: {}, sky: { USDS: 0, DAI: 0 } };
    const add = (to: bcked.asset.Id | Sky, amount: number) => {
        if (amount <= 0) return;
        if (to == "USDS" || to == "DAI") result.sky[to] += amount;
        else result.underlying[to] = (result.underlying[to] ?? 0) + amount;
    };

    for (const p of positions) {
        if (p.kind != "sent") continue;
        try {
            const out = await transferred(chain, system, p.address, holder, p.to, p.decimals);
            const back = await transferred(chain, system, p.address, p.to, holder, p.decimals);
            add(p.as, out - back);
        } catch (error) {
            console.log(`Transfers of ${holder} to ${p.to} not read:`, error);
        }
    }
    for (const p of positions) {
        if (p.kind != "uniswap") continue;
        for (const [token, amount] of await uniswapAmounts(
            chain,
            system,
            p.manager,
            p.factory,
            holder
        )) {
            const to = p.tokens[token];
            add(to ?? UNTRACKED, amount);
        }
    }
    const held = positions.filter((p) => p.kind != "sent" && p.kind != "uniswap");

    const calls: Call[] = held.flatMap((p) => [
        { target: p.address, signature: ABI.balanceOf, args: [holder] },
        { target: p.address, signature: ABI.decimals },
    ]);
    const base = await multicall(chain, system, calls);

    for (const [i, p] of held.entries()) {
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
                const price = await api.getPrice({ address: p.address, system: p.llama ?? system });
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
