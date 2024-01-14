import * as JsonRefs from "json-refs";
import _ from "lodash";
import path from "path";
import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { writeJson } from "../../utils/files";
import { RESOURCES } from "../resources/index";

parentPort?.on("message", async (uri: string) => {
    const resource = await RESOURCES.resolve(uri);

    const filePath = path.join(PATHS.api, resource.$id, "index.json");
    await writeJson(filePath, resource);

    const refs = JsonRefs.findRefs(resource, { filter: ["relative"] });

    parentPort?.postMessage(_.map(Object.values(refs), "uri"));
});
