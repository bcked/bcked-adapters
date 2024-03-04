"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.icons = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../constants");
async function icons(group, id) {
    const $id = `/${group}/${id}/icons`;
    const svg = path_1.default.join(group, id, constants_1.FILES.svg.icon);
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
        svg: path_1.default.join($id, constants_1.FILES.svg.icon),
        pngs: {
            "16": path_1.default.join($id, constants_1.FILES.png.icon16),
            "32": path_1.default.join($id, constants_1.FILES.png.icon32),
            "48": path_1.default.join($id, constants_1.FILES.png.icon48),
            "64": path_1.default.join($id, constants_1.FILES.png.icon64),
            "128": path_1.default.join($id, constants_1.FILES.png.icon128),
            "256": path_1.default.join($id, constants_1.FILES.png.icon256),
        },
    };
}
exports.icons = icons;
//# sourceMappingURL=icons.js.map