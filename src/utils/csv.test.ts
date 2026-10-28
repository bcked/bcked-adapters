import { describe, expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ConsecutiveLookup } from "./csv";

describe("ConsecutiveLookup", () => {
    test("returns only entries within the time window", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "lookup-"));
        const csvPath = path.join(dir, "values.csv");
        await writeFile(
            csvPath,
            "timestamp,usd\n2025-11-29T00:00:00.000Z,1\n2026-10-28T00:00:00.000Z,2\n"
        );
        const lookup = new ConsecutiveLookup<bcked.asset.Price>(csvPath);
        expect(await lookup.getClosest("2025-11-29T06:00:00.000Z")).toMatchObject({ usd: 1 });
        expect(await lookup.getClosest("2026-06-30T00:00:00.000Z")).toBeUndefined();
        expect(await lookup.getClosest("2026-10-28T00:00:00.000Z")).toMatchObject({ usd: 2 });
    });
});
