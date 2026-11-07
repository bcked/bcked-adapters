/**
 * Backing of a token on one chain as its share of a Chainlink Proof of Reserves feed that covers the
 * token on all chains together. The share is the chain's supply over the summed supply of every
 * chain the token is issued on, all read on-chain. This only works if bcked reads every one of
 * those chains: a chain left out would make the other shares too large.
 */
import { AbiCoder, formatUnits } from "ethers";
import { multicall } from "../chains/multicall";
import { retry } from "../chains/evm";
import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";

const chain = new ChainProxy();

// Supplies of each token's chains, read once per process and shared by all of its chain assets.
const supplies = new Map<string, Promise<number[]>>();

/**
 * totalSupply of each asset, read one chain after another: public RPCs reject bursts. One failed
 * read drops the cache entry, so the next asset tries again.
 */
// Chains without contract calls: their supply comes from the chain module.
const NOT_EVM = new Set(["solana", "aptos"]);

export function readSupplies(assets: bcked.asset.Id[]): Promise<number[]> {
    const key = assets.join(",");
    let cached = supplies.get(key);
    if (cached) return cached;
    cached = (async () => {
        const result: number[] = [];
        for (const id of assets) {
            const [system, address] = id.split(":") as [bcked.system.Id, string];
            if (NOT_EVM.has(system)) {
                // Retried after a pause: Alchemy answers bursts with 429.
                result.push((await retry(() => chain.getSupply(address, system))).issued);
                continue;
            }
            const [supply, decimals] = await Promise.all([
                chain.call<bigint>(
                    address,
                    "function totalSupply() view returns (uint256)",
                    [],
                    system
                ),
                chain.call<bigint>(address, "function decimals() view returns (uint8)", [], system),
            ]);
            result.push(parseFloat(formatUnits(supply, Number(decimals))));
        }
        return result;
    })().catch((error: unknown) => {
        supplies.delete(key);
        throw error;
    });
    supplies.set(key, cached);
    return cached;
}

/**
 * Share of one chain asset in the summed supply of all of a token's chain assets, or null if the
 * total is not positive.
 */
export async function supplyShare(
    assets: bcked.asset.Id[],
    asset: bcked.asset.Id
): Promise<number | null> {
    const amounts = await readSupplies(assets);
    const total = amounts.reduce((a, b) => a + b, 0);
    const own = amounts[assets.indexOf(asset)];
    if (own === undefined) throw Error(`${asset} is not one of the token's assets`);
    return total > 0 ? own / total : null;
}

export interface PorFeed {
    /** Feed contract and the chain it is on. */
    address: string;
    system: bcked.system.Id;
    /** What the answer is counted in, e.g. "rwa:USD". */
    underlying: bcked.asset.Id;
    /**
     * Set for an oracle that publishes a bundle (latestBundle(): abi-encoded timestamp and reserves,
     * bundleDecimals()) instead of a standard feed (latestRoundData()).
     */
    bundle?: true;
}

/** The latest reserves of a feed and their time. */
async function readFeed(
    feed: PorFeed
): Promise<{ reserves: number; timestamp: bcked.asset.Backing["timestamp"] }> {
    if (feed.bundle) {
        const [bundle, decimals] = await Promise.all([
            chain.call<string>(
                feed.address,
                "function latestBundle() view returns (bytes)",
                [],
                feed.system
            ),
            chain.call<bigint[]>(
                feed.address,
                "function bundleDecimals() view returns (uint8[])",
                [],
                feed.system
            ),
        ]);
        const [time, reserves] = AbiCoder.defaultAbiCoder().decode(
            ["uint256", "uint256"],
            bundle
        ) as unknown as [bigint, bigint];
        return {
            reserves: parseFloat(formatUnits(reserves, Number(decimals[0] ?? 18n))),
            timestamp: toISOString(Number(time) * 1000),
        };
    }
    const [round, decimals] = await multicall(chain, feed.system, [
        {
            target: feed.address,
            signature:
                "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
        },
        { target: feed.address, signature: "function decimals() view returns (uint8)" },
    ]);
    const [, answer, , updatedAt] = round as unknown as [bigint, bigint, bigint, bigint];
    return {
        reserves: parseFloat(formatUnits(answer, Number(decimals![0]))),
        timestamp: toISOString(Number(updatedAt) * 1000),
    };
}

/**
 * The chain's share of the reserves, or nothing if the feed has no new answer.
 *
 * @param feed Proof of Reserves feed covering all chains
 * @param assets Every chain asset of the token, as system:address
 * @param asset The chain asset to get the share for, one of `assets`
 */
export async function porBackingShare(
    feed: PorFeed,
    assets: bcked.asset.Id[],
    asset: bcked.asset.Id,
    lastRecorded: bcked.asset.Backing | null
): Promise<bcked.asset.Backing[]> {
    const { reserves, timestamp } = await readFeed(feed);
    if (lastRecorded && lastRecorded.timestamp >= timestamp) return [];

    const share = await supplyShare(assets, asset);
    if (share === null) return [];
    return [{ timestamp, underlying: { [feed.underlying]: reserves * share } }];
}
