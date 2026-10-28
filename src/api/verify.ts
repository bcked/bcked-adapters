/**
 * Verifies that the API build produced a resource for every asset, entity and system.
 * Exits with a non-zero code otherwise, so CI does not deploy a partial API.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { FILES, PATHS } from "../constants";
import { getAssetIds, getEntityIds, getSystemIds } from "./utils/ids";

const [assetIds, entityIds, systemIds] = await Promise.all([
    getAssetIds(),
    getEntityIds(),
    getSystemIds(),
]);

const expected = [
    path.join(PATHS.api, FILES.json.index),
    path.join(PATHS.api, FILES.json.openapi),
    ...[PATHS.assets, PATHS.entities, PATHS.systems].map((kind) =>
        path.join(PATHS.api, kind, "summary", FILES.json.index)
    ),
    ...assetIds.flatMap((id) => [
        path.join(PATHS.api, PATHS.assets, id, FILES.json.index),
        path.join(PATHS.api, PATHS.assets, id, "series", FILES.json.index),
    ]),
    ...entityIds.flatMap((id) => [
        path.join(PATHS.api, PATHS.entities, id, FILES.json.index),
        path.join(PATHS.api, PATHS.entities, id, "series", FILES.json.index),
    ]),
    ...systemIds.flatMap((id) => [
        path.join(PATHS.api, PATHS.systems, id, FILES.json.index),
        path.join(PATHS.api, PATHS.systems, id, "series", FILES.json.index),
    ]),
];

const missing = expected.filter((file) => !existsSync(file));

if (missing.length) {
    console.error(`API build is missing ${missing.length} of ${expected.length} resources:`);
    for (const file of missing) console.error(`- ${file}`);
    process.exit(1);
}

console.log(`API build verified: all ${expected.length} resources exist.`);
