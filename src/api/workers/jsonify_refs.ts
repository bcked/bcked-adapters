import * as JsonRefs from "json-refs";
import _ from "lodash";
import path from "path";
import { parentPort } from "worker_threads";
import { writeJson } from "../../utils/files";
import { RESOURCES } from "../resources/index";

const API_PATH = "api";

parentPort?.on("message", async (uri: string) => {
    const resource = await RESOURCES.resolve(uri);

    const filePath = path.join(API_PATH, resource.$id);
    await writeJson(filePath, resource);

    const refs = JsonRefs.findRefs(resource, { filter: ["relative"] });

    parentPort?.postMessage(_.map(Object.values(refs), "uri"));
});
