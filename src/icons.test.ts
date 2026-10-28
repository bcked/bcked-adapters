import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Rules from CONTRIBUTING.md#icons: every asset, issuer and chain has an icon.svg with a square
// view box, at most 30 KB, with text as outlines.
const folders = ["assets", "entities", "systems"].flatMap((kind) =>
    readdirSync(kind)
        .filter((name) => statSync(path.join(kind, name)).isDirectory())
        .map((name) => path.join(kind, name))
);

describe.each(folders)("%s", (folder) => {
    const file = path.join(folder, "icon.svg");

    test("has an icon.svg", () => {
        expect(existsSync(file)).toBe(true);
    });

    test("icon has a square view box, is at most 30 KB and has no text elements", () => {
        if (!existsSync(file)) return;
        const svg = readFileSync(file, "utf-8");
        const viewBox = /viewBox="([^"]+)"/
            .exec(svg)?.[1]
            ?.trim()
            .split(/[\s,]+/)
            .map(Number);
        expect(viewBox).toHaveLength(4);
        expect(viewBox![2]).toBe(viewBox![3]);
        expect(statSync(file).size).toBeLessThanOrEqual(30 * 1024);
        expect(svg).not.toMatch(/<text[\s>]/);
    });
});
