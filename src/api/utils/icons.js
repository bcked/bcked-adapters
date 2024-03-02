"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.icons = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function icons(group, id) {
    const $id = `/${group}/${id}/icons`;
    const svg = path_1.default.join(group, id, "icon.svg");
    if (!fs_1.default.existsSync(svg)) {
        console.info(`No SVG found for ${$id}`);
        return {
            $id,
            svg: null,
            pngs: null,
        };
    }
    return {
        $id,
        svg: path_1.default.join($id, "icon.svg"),
        pngs: {
            "16": path_1.default.join($id, "icon16.png"),
            "32": path_1.default.join($id, "icon32.png"),
            "48": path_1.default.join($id, "icon48.png"),
            "64": path_1.default.join($id, "icon64.png"),
            "128": path_1.default.join($id, "icon128.png"),
            "256": path_1.default.join($id, "icon256.png"),
        },
    };
}
exports.icons = icons;
//# sourceMappingURL=icons.js.map