/**
 * Runs single adapters and prints what they return, without writing records. For checking a new or
 * changed adapter against the live chains, e.g. through the "Verify Adapter" workflow, which has the
 * RPC keys.
 *
 * Usage: bun scripts/verify_adapter.ts <kind>/<id>... (kind: assets, tokens, entities, systems)
 * Example: bun scripts/verify_adapter.ts "assets/ethereum:0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
 */
import path from "node:path";

type Adapter = Record<string, ((...args: unknown[]) => Promise<unknown>) | unknown>;

const METHODS = ["getDetails", "getPrice", "getSupply", "getBacking", "update"];

let failed = false;
for (const target of process.argv.slice(2)) {
    const { default: Class } = (await import(path.resolve(target, "index.ts"))) as {
        default: new () => Adapter;
    };
    const adapter = new Class();
    console.log(`== ${target}`);
    for (const method of METHODS) {
        const fn = adapter[method];
        if (typeof fn !== "function") continue;
        try {
            // getBacking takes the latest recorded backing: null means "nothing recorded yet".
            const result = await (fn as (arg: null) => Promise<unknown>).call(adapter, null);
            console.log(`${method}:`, JSON.stringify(result, null, 2));
        } catch (error) {
            failed = true;
            console.log(`${method}: ERROR`, error instanceof Error ? error.message : error);
        }
    }
}
if (failed) process.exit(1);
