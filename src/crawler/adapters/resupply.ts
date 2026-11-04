/**
 * Resupply USD (reUSD) by Resupply. Resupply lists its contracts in its docs
 * (https://docs.resupply.finance/faq/contract-addresses) and in deployment/contracts.json of its
 * repository (https://github.com/resupplyfi/resupply).
 *
 * reUSD is borrowed from Resupply pairs against collateral. The collateral of each pair is a lending
 * position in Curve Lend or Fraxlend: shares of a vault that lends crvUSD or frxUSD. The pairs are
 * listed in the Resupply registry. The backing is the collateral of all pairs: each pair's
 * totalCollateral (including shares staked in Convex) converted to crvUSD or frxUSD by the vault's
 * convertToAssets, as Resupply's own oracle does. bcked does not track crvUSD and frxUSD yet, so their
 * amounts are counted at their US dollar value from the Chainlink crvUSD/USD and frxUSD/USD feeds
 * (rwa:UNTRACKED).
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../chains/proxy";
import { multicall } from "../chains/multicall";

export const REUSD = "0x57aB1E0003F623289CD798B1824Be09a793e4Bec";
export const REGISTRY = "0x10101010E0C3171D894B71B3400668aF311e7D94";

// The lent stablecoins and their Chainlink USD feeds on Ethereum (8 decimals).
const LENT: Record<string, { symbol: string; feed: string }> = {
    "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e": {
        symbol: "crvUSD",
        feed: "0xEEf0C605546958c1f899b6fB336C20671f9cD49F",
    },
    "0xcacd6fd266af91b8aed52accc382b4e165586e29": {
        symbol: "frxUSD",
        feed: "0x9B4a96210bc8D9D55b1908B465D8B0de68B7fF83",
    },
};

const LATEST = "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)";

/**
 * The collateral of all Resupply pairs at the given Ethereum block (latest if omitted), in crvUSD and
 * frxUSD and in US dollars. Null if no feed answer exists yet at that block.
 */
export async function resupplyCollateral(
    chain: ChainProxy,
    blockTag?: number
): Promise<{ lent: Record<string, number>; usd: number } | null> {
    const [registered] = await multicall(
        chain,
        "ethereum",
        [
            {
                target: REGISTRY,
                signature: "function getAllPairAddresses() view returns (address[])",
            },
        ],
        blockTag
    );
    const list = [...(registered![0] as string[])];
    if (!list.length) return { lent: {}, usd: 0 };

    const info = await multicall(
        chain,
        "ethereum",
        list.flatMap((pair) => [
            { target: pair, signature: "function totalCollateral() view returns (uint256)" },
            { target: pair, signature: "function collateral() view returns (address)" },
            { target: pair, signature: "function underlying() view returns (address)" },
        ]),
        blockTag
    );
    const positions = list
        .map((pair, i) => ({
            pair,
            shares: info[3 * i]![0] as bigint,
            vault: info[3 * i + 1]![0] as string,
            underlying: (info[3 * i + 2]![0] as string).toLowerCase(),
        }))
        .filter(({ shares }) => shares > 0n);
    for (const { pair, underlying } of positions)
        if (!LENT[underlying])
            throw Error(`Unknown underlying ${underlying} of Resupply pair ${pair}`);

    const assets = await multicall(
        chain,
        "ethereum",
        positions.map(({ vault, shares }) => ({
            target: vault,
            signature: "function convertToAssets(uint256) view returns (uint256)",
            args: [shares],
        })),
        blockTag
    );
    const lent: Record<string, bigint> = {};
    positions.forEach(({ underlying }, i) => {
        lent[underlying] = (lent[underlying] ?? 0n) + (assets[i]![0] as bigint);
    });

    const tokens = Object.keys(lent);
    let rounds;
    try {
        rounds = await multicall(
            chain,
            "ethereum",
            tokens.map((token) => ({ target: LENT[token]!.feed, signature: LATEST })),
            blockTag
        );
    } catch (error) {
        // A feed that did not exist yet at an old block.
        if (blockTag !== undefined) return null;
        throw error;
    }

    let usd = 0;
    const amounts: Record<string, number> = {};
    tokens.forEach((token, i) => {
        // Both lent stablecoins have 18 decimals.
        const amount = parseFloat(formatUnits(lent[token]!, 18));
        const answer = rounds[i]![1] as bigint;
        if (answer <= 0n) throw Error(`No Chainlink ${LENT[token]!.symbol}/USD answer`);
        amounts[LENT[token]!.symbol] = amount;
        usd += amount * parseFloat(formatUnits(answer, 8));
    });
    return { lent: amounts, usd };
}

/** Backing of reUSD at an Ethereum block, for the history rebuild (scripts/history). */
export async function backingAt(block: number): Promise<Record<string, number> | null> {
    const collateral = await resupplyCollateral(new ChainProxy(), block);
    return collateral ? { "rwa:UNTRACKED": collateral.usd } : null;
}
