import path from "node:path";
import { FILES, PATHS } from "../../constants";
import { writeJson } from "../../utils/files";

export async function writeResource(resource: any | Promise<any>) {
    const res = await resource;
    const filePath = path.join(PATHS.api, res.$id, FILES.json.index);
    await writeJson(filePath, res);
}
