import { readFile } from "fs/promises";
import path from "path";
import { PATHS } from "../../paths";
import { readJson, writeBuffer } from "../../utils/files";
import { renderSvgToPng } from "../utils/renderSvg";
import { JsonResources } from "./resources";

export async function compileDetails<Resources extends JsonResources & { details: Function }>(
    resources: Resources,
    id: string
) {
    const filePath = path.join(PATHS.assets, id, PATHS.records, "details.json");
    const details = await readJson(filePath);

    const resource = await resources.details(id, details!);

    return resource;
}

export async function compileIcons<Resources extends JsonResources & { icons: Function }>(
    resources: Resources,
    group: string,
    id: string
) {
    const resource = await resources.icons(id);

    const svgPath = `${group}/${id}/icon.svg`;
    const svg = await readFile(svgPath);
    await writeBuffer(path.join(PATHS.api, resource.svg), svg);
    await Promise.all(
        Object.entries(resource.pngs).map(([key, value]) =>
            renderSvgToPng(svg, parseInt(key), path.join(PATHS.api, value as string))
        )
    );

    return resource;
}
