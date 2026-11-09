import { describe, expect, it } from "bun:test";
import { blockNear } from "./blocks";

// A chain with 3-second blocks for its first 10 million blocks and 0.45-second blocks after,
// like BNB Chain.
const START = 1_600_000_000;
const SWITCH = 10_000_000;
const timeOf = async (block: number) =>
    block <= SWITCH ? START + block * 3 : START + SWITCH * 3 + Math.floor((block - SWITCH) * 0.45);
const LATEST = 80_000_000;

describe("blockNear", () => {
    it("finds a block within a minute on both sides of a change in block time", async () => {
        for (const unix of [START + 86_400 * 100, START + SWITCH * 3 + 86_400 * 200]) {
            const block = await blockNear(timeOf, unix, 1, LATEST);
            expect(Math.abs((await timeOf(block)) - unix)).toBeLessThanOrEqual(60);
        }
    });

    it("takes the last block before a gap without blocks", async () => {
        const sparse = async (block: number) =>
            block <= 100 ? block * 10 : 1000 + block * 10 + 86_400;
        expect(await blockNear(sparse, 1500, 1, 1000)).toBe(100);
    });

    it("returns the ends for times outside the range", async () => {
        expect(await blockNear(timeOf, START - 100, 1, LATEST)).toBe(1);
        expect(await blockNear(timeOf, (await timeOf(LATEST)) + 100, 1, LATEST)).toBe(LATEST);
    });
});
