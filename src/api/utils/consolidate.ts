/**
 * Older history is kept in one file per month instead of a file per day and per hour.
 *
 * GitHub Pages syncs a deployment within 10 minutes, and a file per data point made the API too
 * many files for that (1.34 million in November 2026). Months that end more than CONSOLIDATE_DAYS
 * ago hold their data points inline (`data`), and their day and hour files are not written. Links
 * to such a point name the month file and the point's hour. The latest point of a history always
 * keeps its own hour file.
 */
import { getDateParts } from "../../utils/time";

export const CONSOLIDATE_DAYS = 90;

/** Months before this one ("yyyy/mm") are consolidated. Set once per build in the API job. */
export function consolidateBefore(): string {
    const fixed = process.env["API_CONSOLIDATE_BEFORE"];
    if (fixed) return fixed;
    const { year, month } = getDateParts(Date.now() - CONSOLIDATE_DAYS * 24 * 60 * 60 * 1000);
    return `${year}/${month}`;
}

// Day and hour resources of assets, entities and systems: /<kind>/<id>/<metric>/yyyy/mm/dd[/hh].
const POINT_ID = /^(\/(?:assets|entities|systems)\/.+)\/(\d{4})\/(\d{2})\/(\d{2})(?:\/(\d{2}))?$/;

/** Whether a resource is a day or hour of a consolidated month, so it is not written. */
export function isConsolidated(id: string): boolean {
    const match = POINT_ID.exec(id);
    return !!match && `${match[2]}/${match[3]}` < consolidateBefore();
}

/** The month resource a day or hour resource belongs to. */
export function monthOf(id: string): string | undefined {
    const match = POINT_ID.exec(id);
    return match ? `${match[1]}/${match[2]}/${match[3]}` : undefined;
}

/**
 * Rewrites links to days and hours of consolidated months, anywhere in a resource: the month
 * resource plus the `hour` ("yyyy-mm-ddThh") or `day` ("yyyy-mm-dd") the point is in. Returns the
 * resource itself, changed in place.
 */
export function relink<T>(resource: T): T {
    const visit = (node: unknown): void => {
        if (Array.isArray(node)) {
            node.forEach(visit);
        } else if (node && typeof node === "object") {
            const object = node as Record<string, unknown>;
            const ref = object["$ref"];
            if (typeof ref === "string" && isConsolidated(ref)) {
                const [, base, year, month, day, hour] = POINT_ID.exec(ref)!;
                object["$ref"] = `${base}/${year}/${month}`;
                if (hour) object["hour"] = `${year}-${month}-${day}T${hour}`;
                else object["day"] = `${year}-${month}-${day}`;
            }
            Object.values(object).forEach(visit);
        }
    };
    visit(resource);
    return resource;
}
