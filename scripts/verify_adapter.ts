/**
 * Runs single adapters and prints what they return, without writing records. For checking a new or
 * changed adapter against the live chains, e.g. through the "Verify Adapter" workflow, which has the
 * RPC keys.
 *
 * With --strict (used on every pull request), an adapter also fails when it returns data that would
 * show up wrong on the site (reserve kinds like rwa:USD are skipped):
 * - an asset without a positive supply, unless it is listed in NO_SUPPLY (src/constants.ts),
 * - an asset with a Chainlink feed but no positive price,
 * - an asset without a backing source in its details or its token's (declare "unbacked" for an
 *   asset without backing, "not-tracked" with the reason when backing exists but is not recorded),
 * - a token with report backing but no reports in its records,
 * - a backing source other than "unbacked" or "not-tracked" that yields no backing (for reports of the asset
 *   alone: no rows in its records/backing.csv).
 *
 * Usage: bun scripts/verify_adapter.ts [--strict] <kind>/<id>... (kind: assets, tokens, entities, systems)
 * Example: bun scripts/verify_adapter.ts "assets/ethereum:0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PRICE_SOURCES } from "../src/crawler/apis/chainlink";
import { NO_SUPPLY } from "../src/constants";

type Adapter = Record<string, ((...args: unknown[]) => Promise<unknown>) | unknown>;

const METHODS = ["getDetails", "getPrice", "getSupply", "getBacking", "update"];

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const targets = args.filter((arg) => arg !== "--strict");

async function load(target: string): Promise<Adapter> {
    const { default: Class } = (await import(path.resolve(target, "index.ts"))) as {
        default: new () => Adapter;
    };
    return new Class();
}

/** Data rows of a records CSV, 0 if it does not exist. */
function csvRows(file: string): number {
    if (!existsSync(file)) return 0;
    return readFileSync(file, "utf8").trim().split("\n").length - 1;
}

/** The problems --strict finds in the results of one adapter. */
async function check(target: string, results: Record<string, unknown>): Promise<string[]> {
    const [kind, id] = target.replace(/\/$/, "").split("/") as [string, string];
    const problems: string[] = [];
    const details = results["getDetails"] as
        (bcked.asset.Details & bcked.token.Details) | undefined;
    if (!details) return problems; // getDetails failed, already counted
    if (kind === "tokens") {
        // The chain assets are checked on their own, with the token's backing source if they have none.
        if (
            details.backing?.method === "reports" &&
            csvRows(path.join("tokens", id, "records", "backing.csv")) === 0
        )
            problems.push("reports backing, but no rows in records/backing.csv");
        return problems;
    }
    // Reserve kinds (rwa:USD, rwa:USTB, ...) only appear as backing: no supply, no backing of their own.
    if (kind !== "assets" || id.startsWith("rwa:")) return problems;

    const supply = (results["getSupply"] as bcked.asset.Supply[] | undefined)?.at(-1);
    const amount = supply ? (supply.circulating ?? supply.total ?? supply.issued) : null;
    if (!NO_SUPPLY.has(id) && !(amount && amount > 0))
        problems.push(`no positive supply (${JSON.stringify(supply)})`);

    if (id in PRICE_SOURCES) {
        const usd = (results["getPrice"] as bcked.asset.Price[] | undefined)?.at(-1)?.usd;
        if (!(usd && usd > 0)) problems.push("has a Chainlink feed but returned no positive price");
    }

    let source = details.backing;
    if (!source && details.token) {
        const token = await load(path.join("tokens", details.token));
        source = (await (token["getDetails"] as () => Promise<bcked.token.Details>)()).backing;
    }
    if (!source) problems.push("no backing source in the asset or its token (use not-tracked)");
    else if (source.method === "reports" && source.reports !== "token" && details.backing) {
        // Reports of this asset alone are written to its records by scripts/attestations.
        if (csvRows(path.join("assets", id, "records", "backing.csv")) === 0)
            problems.push("reports backing, but no rows in records/backing.csv");
    } else if (source.method !== "not-tracked" && source.method !== "unbacked") {
        const backing = (results["getBacking"] as bcked.asset.Backing[] | undefined)?.at(-1);
        const amounts = Object.values(backing?.underlying ?? {}) as number[];
        const total = amounts.reduce((a, b) => a + b, 0);
        if (!(total > 0)) problems.push(`${source.method} backing, but getBacking returned none`);
    }
    return problems;
}

let failed = false;
for (const target of targets) {
    const adapter = await load(target);
    console.log(`== ${target}`);
    const results: Record<string, unknown> = {};
    for (const method of METHODS) {
        const fn = adapter[method];
        if (typeof fn !== "function") continue;
        try {
            // getBacking takes the latest recorded backing: null means "nothing recorded yet".
            const result = await (fn as (arg: null) => Promise<unknown>).call(adapter, null);
            results[method] = result;
            console.log(`${method}:`, JSON.stringify(result, null, 2));
        } catch (error) {
            failed = true;
            console.log(`${method}: ERROR`, error instanceof Error ? error.message : error);
        }
    }
    if (strict) {
        for (const problem of await check(target, results)) {
            failed = true;
            console.log(`FAIL ${target}: ${problem}`);
        }
    }
}
// RPC providers keep the process alive, so exit explicitly.
process.exit(failed ? 1 : 0);
