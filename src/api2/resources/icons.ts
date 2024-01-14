import path from "path";

export async function icons(group: string, id: bcked.entity.Id) {
    const $id = `/${group}/${id}/icons`;

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
