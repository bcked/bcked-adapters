import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { isConsolidated, monthOf, relink } from "./consolidate";

describe("consolidate", () => {
    beforeEach(() => {
        process.env["API_CONSOLIDATE_BEFORE"] = "2026/08";
    });
    afterEach(() => {
        delete process.env["API_CONSOLIDATE_BEFORE"];
    });

    it("consolidates days and hours of months before the cutoff", () => {
        expect(isConsolidated("/assets/ethereum:0x1/price/2026/07/31/23")).toBe(true);
        expect(isConsolidated("/assets/ethereum:0x1/price/2026/07/31")).toBe(true);
        expect(isConsolidated("/assets/ethereum:0x1/price/2026/08/01/00")).toBe(false);
        // Months and years keep their files, and so do graphs.
        expect(isConsolidated("/assets/ethereum:0x1/price/2026/07")).toBe(false);
        expect(isConsolidated("/graphs/collateralization/2026/07/31/23")).toBe(false);
    });

    it("finds the month of a point", () => {
        expect(monthOf("/entities/tether/total-value-locked/2024/03/05/00")).toBe(
            "/entities/tether/total-value-locked/2024/03"
        );
    });

    it("relinks points of consolidated months to the month", () => {
        const resource = {
            low: { $ref: "/assets/x/price/2024/03/05/00" },
            data: [{ value: { $ref: "/assets/y/supply/2024/03/05" } }],
            latest: { $ref: "/assets/x/price/2026/09/05/13" },
        };
        expect(relink(resource) as unknown).toEqual({
            low: { $ref: "/assets/x/price/2024/03", hour: "2024-03-05T00" },
            data: [{ value: { $ref: "/assets/y/supply/2024/03", day: "2024-03-05" } }],
            latest: { $ref: "/assets/x/price/2026/09/05/13" },
        });
    });
});
