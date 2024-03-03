import fs from "fs";
import path from "path";
import { FILES } from "../../constants";

export async function icons(group: string, id: bcked.entity.Id) {
    const $id = `/${group}/${id}/icons`;

    const svg = path.join(group, id, FILES.svg.icon);
    if (!fs.existsSync(svg)) {
        console.info(`No SVG found for ${$id}`);
        return {
            $id,
            svg: null,
            pngs: null,
        };
    }

    return {
        $id,
        svg: path.join($id, FILES.svg.icon),
        pngs: {
            "16": path.join($id, FILES.png.icon16),
            "32": path.join($id, FILES.png.icon32),
            "48": path.join($id, FILES.png.icon48),
            "64": path.join($id, FILES.png.icon64),
            "128": path.join($id, FILES.png.icon128),
            "256": path.join($id, FILES.png.icon256),
        },
    };
}
