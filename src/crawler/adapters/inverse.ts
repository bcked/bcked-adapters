/**
 * Reserves of DOLA, the stablecoin of Inverse Finance, read on-chain on Ethereum.
 *
 * DOLA is minted by Fed contracts (https://docs.inverse.finance/inverse-finance/inverse-finance/products/dola-feds):
 * - The FiRM Fed mints DOLA into the FiRM lending markets in advance. DOLA becomes circulating when a
 *   borrower takes it out against collateral in a personal escrow. Each market's totalDebt is the DOLA
 *   lent, counted as loans. The collateral in the escrows is not read.
 * - The PSM Fed mints DOLA into the Peg Stability Module, which sells it 1:1 for USDS and keeps the
 *   USDS in sUSDS. The reserves are read from the PSM (getTotalReserves) and recorded as USDS.
 * - The Frontier Fed lent DOLA in Frontier, the deprecated lending protocol.
 *
 * Circulating DOLA is the total supply less the DOLA the markets, the PSMs and Frontier hold unlent.
 * The part of it that the FiRM loans and the PSM reserves do not cover, for example Frontier loans,
 * is counted as not traced.
 *
 * Contracts: https://docs.inverse.finance/inverse-finance/inverse-finance/technical/smart-contracts
 * and https://docs.inverse.finance/inverse-finance/inverse-finance/products/peg-stability-module
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../chains/proxy";
import { multicall } from "../chains/multicall";
import { toISOString } from "../../utils/string_formatting";

const SYSTEM = "ethereum";
export const DOLA = "0x865377367054516e17014CcdED1e7d814EDC9ce4";
// FiRM launched in December 2022, its first market was deployed after this block.
export const FIRM_FED_START = 16_000_000;
// FiRM markets, active and sunset, from the smart contracts page of the Inverse Finance docs
// (October 2026). Markets missing here show up as a gap between globalSupply of the FiRM Fed
// (0x2b34548b865ad66A2B046cb82e59eE43F75B90fd) and the supplies of these markets.
const FIRM_MARKETS = [
    "0x63df5e23db45a2066508318f172ba45b9cd37035", // WETH
    "0x3FD3daBB9F9480621C8A111603D3Ba70F17550BC", // wstETH
    "0x48BA574Edf0bc4E2E40B529863aaA6a67c264E7C", // wBTC
    "0x2A256306D8ba899E33B01e495982656884Ac77FF", // cbBTC
    "0x79eF6d28C41e47A588E2F2ffB4140Eb6d952AEc4", // sUSDe
    "0xb427fc22561f3963b04202f9bb5bcebd76c14a99", // Convex DOLA-sUSDe
    "0x4e264618dc015219cd83dbc53b31251d73c2db1a", // Yearn DOLA-sUSDe
    "0xD68d3a44d46dd50BFeBa8Cca544717B76e7C4b29", // Convex DOLA-sUSDS
    "0x4A33baFA8a31E4ec9649f65646022cAD1957808b", // Yearn DOLA-sUSDS
    "0xC45E9c231ab5D9Bd3F1131E7901B100D8D236C4d", // Stake DAO sDOLA-scrvUSD
    "0xf9287c29Cb888F4834B7D2757a833D509e7f9D9A", // Stake DAO reUSD-sDOLA
    "0x1fD4985cdd57bDb1eD646B10B7952fCD58946916", // Yearn reUSD-sDOLA
    "0x3542b39dcedc01f82c6e7af0eec424726d019eaa", // sinvUSD
    "0xa95605313EB4544f784e699dE93e9232DbFcf02d", // ysyBOLD
    "0xb516247596Ca36bf32876199FBdCaD6B3322330B", // INV
    "0x63fAd99705a255fE2D500e498dbb3A9aE5AA1Ee8", // CRV
    "0x3474ad0e3a9775c9F68B415A7a9880B0CAB9397a", // cvxCRV
    "0xdc2265cBD15beD67b5F2c0B82e23FcE4a07ddF6b", // Staked CVX
    "0x27b6c301Fd441f3345d61B7a4245E1F823c3F9c4", // st-yCRV
    "0x2fed508aac87c0e6f0b647fe83164a7aa6eb2fc9", // Convex DOLA-scrvUSD (sunset)
    "0x5bb8f6aacff2971b42f9fe6945d24726a2541cf2", // Yearn DOLA-scrvUSD (sunset)
    "0x63D27fC9d463Ed727676367D3F818999962737E8", // Convex sDOLA-scrvUSD (sunset)
    "0xb8bc1E9c0a2d445bc39d2A745F47619E954dD565", // Yearn sDOLA-scrvUSD (sunset)
    "0x223f21a27f290972cba4e25c8e351ef2937fbe68", // PT-sUSDE-27NOV2025 (sunset)
    "0xf706289d0324a5e86c33ce54689a6f34cfd4b11f", // PT-USDe-27NOV2025 (sunset)
    "0xe4D47Ef77AC2C3FA4019Cd169Ac1Dd9E27cb12E4", // Convex DOLA-wstUSR (sunset)
    "0x28684485369f7478f42aAA62660123AB5D573537", // Yearn DOLA-wstUSR (sunset)
    "0x6a522f3bd3fda15e74180953f203cf55aa6c631e", // Convex crvUSD-DOLA (sunset)
];
// The current PSM (mill 343, December 2025) and the one before it.
const PSMS = [
    "0x1d02f2841afa3cc20435a8c804c24deac5f30dfa",
    "0x4dfd662622d766304cb539e66f893c4defa19398",
];
const FRONTIER_FED = "0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7";
const USDS = "0xdC035D45d973E3EC169d2276DDab16f1e407384F";

export const LOAN: bcked.asset.Id = "rwa:LOAN";
export const USDS_ID: bcked.asset.Id = `${SYSTEM}:${USDS}`;
export const UNTRACKED: bcked.asset.Id = "rwa:UNTRACKED";

const ABI = {
    totalSupply: "function totalSupply() view returns (uint256)",
    balanceOf: "function balanceOf(address) view returns (uint256)",
    totalDebt: "function totalDebt() view returns (uint256)",
    reserves: "function getTotalReserves() view returns (uint256)",
    collateral: "function collateral() view returns (address)",
    ctoken: "function ctoken() view returns (address)",
};

export interface DolaReserves {
    timestamp: primitive.ISODateTimeString;
    issued: number;
    circulating: number;
    underlying: Record<bcked.asset.Id, number>;
}

const amount = (value: unknown) => parseFloat(formatUnits(value as bigint, 18));

/** Whether a contract has code at the block, so that markets deployed later are left out. */
async function exists(chain: ChainProxy, address: string, blockTag?: number): Promise<boolean> {
    const block = blockTag === undefined ? "latest" : `0x${blockTag.toString(16)}`;
    const code = await chain.send<string>("eth_getCode", [address, block], SYSTEM);
    return code != "0x";
}

/** FiRM markets with a contract at the block. */
async function firmMarkets(chain: ChainProxy, blockTag?: number): Promise<string[]> {
    const deployed = await Promise.all(
        FIRM_MARKETS.map((market) => exists(chain, market, blockTag))
    );
    return FIRM_MARKETS.filter((_, i) => deployed[i]);
}

/** A view call that returns null where the contract does not exist yet or reverts. */
async function tryCall<T>(
    chain: ChainProxy,
    target: string,
    signature: string,
    blockTag?: number
): Promise<T | null> {
    try {
        return await chain.call<T>(target, signature, [], SYSTEM, blockTag);
    } catch {
        return null;
    }
}

/** Reads the DOLA reserves at a block (latest if omitted). */
export async function readDolaReserves(
    chain: ChainProxy,
    blockTag?: number
): Promise<DolaReserves> {
    const markets = await firmMarkets(chain, blockTag);

    // PSMs that exist at the block, with their collateral (USDS) and reserves.
    const psms: { address: string; collateral: string; reserves: number }[] = [];
    for (const address of PSMS) {
        const collateral = await tryCall<string>(chain, address, ABI.collateral, blockTag);
        const reserves = await tryCall<bigint>(chain, address, ABI.reserves, blockTag);
        if (collateral && reserves !== null)
            psms.push({ address, collateral, reserves: amount(reserves) });
    }
    const frontier = await tryCall<string>(chain, FRONTIER_FED, ABI.ctoken, blockTag);

    // DOLA minted in advance and not lent: in the markets, the PSMs and Frontier's DOLA market.
    const holders = [
        ...markets,
        ...psms.map(({ address }) => address),
        ...(frontier ? [frontier] : []),
    ];
    const results = await multicall(
        chain,
        SYSTEM,
        [
            { target: DOLA, signature: ABI.totalSupply },
            ...holders.map((holder) => ({
                target: DOLA,
                signature: ABI.balanceOf,
                args: [holder],
            })),
            ...markets.map((market) => ({ target: market, signature: ABI.totalDebt })),
        ],
        blockTag
    );
    const values = results.map((result) => amount(result[0]));
    const issued = values[0]!;
    const held = values.slice(1, 1 + holders.length).reduce((sum, value) => sum + value, 0);
    const loans = values
        .slice(1 + holders.length, 1 + holders.length + markets.length)
        .reduce((sum, value) => sum + value, 0);

    const underlying: Record<bcked.asset.Id, number> = { [LOAN]: loans };
    psms.forEach(({ collateral, reserves }) => {
        const asset = collateral.toLowerCase() == USDS.toLowerCase() ? USDS_ID : UNTRACKED;
        underlying[asset] = (underlying[asset] ?? 0) + reserves;
    });

    const circulating = issued - held;
    const traced = Object.values(underlying).reduce((sum, value) => sum + value, 0);
    underlying[UNTRACKED] = (underlying[UNTRACKED] ?? 0) + Math.max(0, circulating - traced);

    return { timestamp: toISOString(Date.now()), issued, circulating, underlying };
}

let cached: Promise<DolaReserves> | null = null;

/** The latest DOLA reserves, read once per crawl. */
export function getDolaReserves(chain: ChainProxy): Promise<DolaReserves> {
    cached ??= readDolaReserves(chain).catch((error: unknown) => {
        cached = null;
        throw error;
    });
    return cached;
}
