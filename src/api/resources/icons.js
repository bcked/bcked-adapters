"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.icons = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const files_1 = require("../../utils/files");
const renderSvg_1 = require("../utils/renderSvg");
const API_PATH = "api";
async function icons(group, id) {
    const svgPath = `${group}/${id}/icon.svg`;
    const $id = `/${group}/${id}/icons`;
    if (!(0, fs_1.existsSync)(svgPath)) {
        return {
            $id,
            svg: null,
            pngs: null,
        };
    }
    const svg = await (0, promises_1.readFile)(svgPath);
    const resource = {
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
    await (0, files_1.writeBuffer)(path_1.default.join(API_PATH, resource.svg), svg);
    await Promise.all(Object.entries(resource.pngs).map(([key, value]) => (0, renderSvg_1.renderSvgToPng)(svg, parseInt(key), path_1.default.join(API_PATH, value))));
    return resource;
}
exports.icons = icons;
//# sourceMappingURL=icons.js.map