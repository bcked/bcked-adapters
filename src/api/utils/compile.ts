import { readFile } from "fs/promises";
import { join } from "path";
import { PATHS } from "../../paths";
import { readJson, writeBuffer } from "../../utils/files";
import { renderSvgToPng } from "../utils/renderSvg";
import { JsonResources } from "./resources";

export async function compileDetails<
    Resources extends JsonResources & { details: (...args: any[]) => any }
>(resources: Resources, path: string, id: string) {
    const filePath = join(path, id, PATHS.records, "details.json");
    const details = await readJson(filePath);

    const resource = await resources.details(id, details!);

    return resource;
}

export async function compileIcons<
    Resources extends JsonResources & { icons: (...args: any[]) => any }
>(resources: Resources, path: string, id: string) {
    const resource = await resources.icons(id);

    if (resource.svg) {
        const svgPath = join(path, id, "icon.svg");
        const svg = await readFile(svgPath);
        await writeBuffer(join(PATHS.api, resource.svg), svg);
        await Promise.all(
            Object.entries(resource.pngs).map(([key, value]) =>
                renderSvgToPng(svg, parseInt(key), join(PATHS.api, value as string))
            )
        );
    }

    return resource;
}
