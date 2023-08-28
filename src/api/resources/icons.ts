import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { writeBuffer } from "../../utils/files";
import { renderSvgToPng } from "../utils/renderSvg";

const API_PATH = "api";

export async function icons(group: string, id: string) {
    const svgPath = `${group}/${id}/icon.svg`;

    const $id = `/${group}/${id}/icons`;

    if (!existsSync(svgPath)) {
        return {
            $id,
            svg: null,
            pngs: null,
        };
    }

    const svg = await readFile(svgPath);

    const resource = {
        $id,
        svg: path.join($id, "icon.svg"),
        pngs: {
            "16": path.join($id, "icon16.png"),
            "32": path.join($id, "icon32.png"),
            "48": path.join($id, "icon48.png"),
            "64": path.join($id, "icon64.png"),
            "128": path.join($id, "icon128.png"),
            "256": path.join($id, "icon256.png"),
        },
    };

    await writeBuffer(path.join(API_PATH, resource.svg), svg);
    await Promise.all(
        Object.entries(resource.pngs).map(([key, value]) =>
            renderSvgToPng(svg, parseInt(key), path.join(API_PATH, value))
        )
    );

    return resource;
}
