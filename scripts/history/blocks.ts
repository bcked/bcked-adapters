/**
 * Finds the block of a chain closest to a time, for the history scripts. Block times change over a
 * chain's life (BNB Chain went from 3 seconds to under one), so a guess from the average block time
 * can be off by years. The search keeps a bracket around the time and alternates interpolation
 * with bisection, so it always narrows down, in about 2 * log2(blocks) reads at worst.
 */

/**
 * A block within `tolerance` seconds of `unix` between the blocks `low` and `high`. When no block is
 * that close (a chain that made blocks only for transactions, like Avalanche in 2020), the last block
 * before the time, whose state is the state at that time. Returns `low` for a time before it and
 * `high` for a time after it.
 */
export async function blockNear(
    timeOf: (block: number) => Promise<number>,
    unix: number,
    low: number,
    high: number,
    tolerance = 60
): Promise<number> {
    let lowTime = await timeOf(low);
    if (unix <= lowTime) return low;
    let highTime = await timeOf(high);
    if (unix >= highTime) return high;
    for (let step = 0; high - low > 1; step++) {
        const guess =
            step % 2 == 0
                ? low + Math.round(((unix - lowTime) * (high - low)) / (highTime - lowTime))
                : Math.floor((low + high) / 2);
        const block = Math.min(high - 1, Math.max(low + 1, guess));
        const time = await timeOf(block);
        if (Math.abs(time - unix) <= tolerance) return block;
        if (time < unix) [low, lowTime] = [block, time];
        else [high, highTime] = [block, time];
    }
    return low;
}
