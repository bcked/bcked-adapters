"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileAssets = exports.compileIcons = exports.compileDetails = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const constants_1 = require("../../constants");
const files_1 = require("../../utils/files");
const renderSvg_1 = require("../utils/renderSvg");
async function compileDetails(resources, path, id) {
    const filePath = (0, path_1.join)(path, id, constants_1.PATHS.records, constants_1.FILES.json.details);
    const details = await (0, files_1.readJson)(filePath);
    const resource = await resources.details(id, details);
    return resource;
}
exports.compileDetails = compileDetails;
async function compileIcons(resources, path, id) {
    const resource = await resources.icons(id);
    if (resource.svg) {
        const svgPath = (0, path_1.join)(path, id, constants_1.FILES.svg.icon);
        const svg = await (0, promises_1.readFile)(svgPath);
        await (0, files_1.writeBuffer)((0, path_1.join)(constants_1.PATHS.api, resource.svg), svg);
        await Promise.all(Object.entries(resource.pngs).map(([key, value]) => (0, renderSvg_1.renderSvgToPng)(svg, parseInt(key), (0, path_1.join)(constants_1.PATHS.api, value))));
    }
    return resource;
}
exports.compileIcons = compileIcons;
async function compileAssets(resources, path, id) {
    const filePath = (0, path_1.join)(path, id, constants_1.PATHS.records, constants_1.FILES.json.assets);
    const assets = await (0, files_1.readJson)(filePath);
    if (!assets?.ids?.length) {
        throw new Error(`No assets found for ${id}`);
    }
    const resource = await resources.assets(id, assets.ids);
    return resource;
}
exports.compileAssets = compileAssets;
//# sourceMappingURL=compile.js.map