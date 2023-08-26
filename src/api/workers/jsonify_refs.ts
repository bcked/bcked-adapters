import * as JsonRefs from "json-refs";
import _ from "lodash";
import path from "path";
import { parentPort } from "worker_threads";
import { writeJson } from "../../utils/files";
import { RESOURCES } from "../resources/index";
import { templateToRegEx } from "../utils/helper";

const API_PATH = "api";

parentPort?.on("message", async (uri: string) => {
    const [template, fn] = Object.entries(RESOURCES)
        .map(([templ, fn]) => [templateToRegEx(templ), fn] as [RegExp, api.ResourceFn])
        .find(([templ]) => templ.test(uri))!;

    const params = template.exec(uri)!.slice(1);

    const resource = await fn(...params);

    const filePath = path.join(API_PATH, resource.$id);
    await writeJson(filePath, resource);

    const refs = JsonRefs.findRefs(resource, { filter: ["relative"] });

    parentPort?.postMessage(_.map(Object.values(refs), "uri"));
});
