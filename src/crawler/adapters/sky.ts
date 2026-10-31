/**
 * Reserves of Sky (formerly MakerDAO), read on-chain from the Vat, the core accounting contract.
 *
 * DAI and USDS are both minted against vaults in the Vat, so they share one pool of reserves. Each
 * vault type (ilk) holds collateral for its debt:
 * - The Lite PSM holds USDC in its pocket, plus DAI it minted in advance and keeps for swaps.
 * - Crypto vaults (ETH, wstETH, WBTC) hold their collateral in a join contract. All of it is counted,
 *   which is more than the debt, since these vaults are overcollateralized.
 * - Allocator, real-world-asset and staking vaults have no collateral bcked can value on-chain. Their
 *   debt is counted as reserves whose composition is not reported.
 *
 * Holders' claims are all DAI in the Vat (Vat.debt) less the surplus of the protocol (Vat.dai of the
 * Vow) and the DAI the Lite PSM keeps. DAI and USDS each get the share of the reserves that their
 * circulating supply has of these claims. The rest belongs to savings (sUSDS, sDAI) and DAI in the Vat.
 *
 * Contracts: https://chainlog.sky.money/
 */
import { decodeBytes32String, encodeBytes32String, formatUnits } from "ethers";

import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";

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
}

let cached: Promise<Reserves> | null = null;

async function readReserves(chain: ChainProxy): Promise<Reserves> {
    const call = <T>(address: string, signature: string, args: unknown[] = []) =>
        chain.call<T>(address, signature, args, SYSTEM);
    const address = (key: string) =>
        call<string>(CHAINLOG, ABI.getAddress, [encodeBytes32String(key)]);

    const [vat, vow, registry, psm, pocket] = await Promise.all(
        [
            "MCD_VAT",
            "MCD_VOW",
            "ILK_REGISTRY",
            "MCD_LITE_PSM_USDC_A",
            "MCD_LITE_PSM_USDC_A_POCKET",
        ].map(address)
    );
    const [debt, surplus, psmDai, ilks] = await Promise.all([
        call<bigint>(vat!, ABI.debt),
        call<bigint>(vat!, ABI.dai, [vow]),
        call<bigint>(DAI, ABI.balanceOf, [psm]),
        call<string[]>(registry!, ABI.list),
    ]);

    const underlying: Record<bcked.asset.Id, number> = {};
    const add = (id: bcked.asset.Id, amount: number) => {
        underlying[id] = (underlying[id] ?? 0) + amount;
    };

    await Promise.all(
        ilks.map(async (ilk) => {
            const [art, rate] = await call<bigint[]>(vat!, ABI.ilks, [ilk]);
            const ilkDebt = parseFloat(formatUnits(art! * rate!, RAD));
            if (ilkDebt < MIN_DEBT) return;

            if (decodeBytes32String(ilk) == LITE_PSM_ILK) {
                const usdc = await call<bigint>(USDC, ABI.balanceOf, [pocket]);
                add(`${SYSTEM}:${USDC}`, parseFloat(formatUnits(usdc, 6)));
                return;
            }

            const info = await call<[string, string, bigint, bigint, string, string, string]>(
                registry!,
                ABI.info,
                [ilk]
            );
            const [, , ilkClass, decimals, gem, , join] = info;
            const tracked = TRACKED_COLLATERAL[gem];
            if (ilkClass == GEM_JOIN_CLASS && tracked) {
                const balance = await call<bigint>(gem, ABI.balanceOf, [join]);
                add(tracked, parseFloat(formatUnits(balance, decimals)));
            } else {
                add(UNREPORTED, ilkDebt);
            }
        })
    );

    const psmDaiAmount = parseFloat(formatUnits(psmDai, 18));
    const claims =
        parseFloat(formatUnits(debt, RAD)) - parseFloat(formatUnits(surplus, RAD)) - psmDaiAmount;

    return { timestamp: toISOString(Date.now()), underlying, claims, psmDai: psmDaiAmount };
}

/** Reads the reserves once per crawl, DAI and USDS share them. */
export function getSkyReserves(chain: ChainProxy): Promise<Reserves> {
    cached ??= readReserves(chain).catch((error: unknown) => {
        cached = null;
        throw error;
    });
    return cached;
}

/** Circulating supply of DAI or USDS: issued tokens less the DAI the Lite PSM keeps for swaps. */
export async function getSkyCirculating(token: string, chain: ChainProxy): Promise<number> {
    const { issued } = await chain.getSupply(token, SYSTEM);
    if (token != DAI) return issued;
    const { psmDai } = await getSkyReserves(chain);
    return issued - psmDai;
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
