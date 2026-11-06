/**
 * Backing of a token on one chain as its share of a Chainlink Proof of Reserves feed that covers the
 * token on all chains together. The share is the chain's supply over the summed supply of every
 * chain the token is issued on, all read on-chain. This only works if bcked reads every one of
 * those chains: a chain left out would make the other shares too large.
 */
import { formatUnits } from "ethers";
import { multicall } from "../chains/multicall";
import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";

const chain = new ChainProxy();

// Supplies of each token's chains, read once per process and shared by all of its chain assets.
const supplies: Record<string, Promise<number[]>> = {};

/**
 * totalSupply of each asset, read one chain after another: public RPCs reject bursts. One failed
 * read drops the cache entry, so the next asset tries again.
 */
function readSupplies(assets: bcked.asset.Id[]): Promise<number[]> {
    const key = assets.join(",");
    supplies[key] ??= (async () => {
        const result: number[] = [];
        for (const id of assets) {
            const [system, address] = id.split(":") as [bcked.system.Id, string];
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
        delete supplies[key];
        throw error;
    });
    return supplies[key];
}

export interface PorFeed {
    /** Feed contract and the chain it is on. */
    address: string;
    system: bcked.system.Id;
    /** What the answer is counted in, e.g. "rwa:USD". */
    underlying: bcked.asset.Id;
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
    const [round, decimals] = await multicall(chain, feed.system, [
        {
            target: feed.address,
            signature:
                "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
        },
        { target: feed.address, signature: "function decimals() view returns (uint8)" },
    ]);
    const [, answer, , updatedAt] = round as unknown as [bigint, bigint, bigint, bigint];
    const timestamp = toISOString(Number(updatedAt) * 1000);
    if (lastRecorded && lastRecorded.timestamp >= timestamp) return [];

    const amounts = await readSupplies(assets);
    const total = amounts.reduce((a, b) => a + b, 0);
    const own = amounts[assets.indexOf(asset)];
    if (own === undefined) throw Error(`${asset} is not one of the token's assets`);
    if (!(total > 0)) return [];
    const reserves = parseFloat(formatUnits(answer, Number(decimals![0])));
    return [{ timestamp, underlying: { [feed.underlying]: (reserves * own) / total } }];
}
