/**
 * View calls bundled through Multicall3, so an RPC provider sees a few requests instead of many.
 * Multicall3 has the same address on every EVM chain bcked reads: https://www.multicall3.com/
 */
import { FunctionFragment, Interface, type Result } from "ethers";
import _ from "lodash";

import type { ChainProxy } from "./proxy";

const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const AGGREGATE3 =
    "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[])";
const CHUNK_SIZE = 50;

export interface Call {
    target: string;
    signature: string;
    args?: unknown[];
}

/**
 * Runs view calls through Multicall3 in chunks of 50, at the given block (latest if omitted).
 * A failing call fails the whole request.
 */
export async function multicall(
    chain: ChainProxy,
    system: string,
    calls: Call[],
    blockTag?: number
): Promise<Result[]> {
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
            system,
            blockTag
        );
        chunk.forEach((i, j) => {
            results.push(
                new Interface([fragments[i]!]).decodeFunctionResult(fragments[i]!, returned[j]![1])
            );
        });
    }
    return results;
}
