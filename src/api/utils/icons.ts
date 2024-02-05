import fs from "fs";
import path from "path";

export async function icons(group: string, id: bcked.entity.Id) {
    const $id = `/${group}/${id}/icons`;

    const svg = path.join(group, id, "icon.svg");
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
}
