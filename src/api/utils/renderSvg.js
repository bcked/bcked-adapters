"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSvgToPng = void 0;
const resvg_js_1 = require("@resvg/resvg-js");
const files_1 = require("../../utils/files");
async function renderSvgToPng(svg, size, filePath) {
    const opts = {
        dpi: 300,
        shapeRendering: 2,
        textRendering: 2,
        imageRendering: 0,
        fitTo: {
            mode: "width",
            value: size,
        },
        crop: {
            left: size,
            top: size,
            right: size,
            bottom: size,
        },
        logLevel: "error",
    };
    const resvg = await (0, resvg_js_1.renderAsync)(svg, opts);
    const pngBuffer = resvg.asPng();
    if (filePath) {
        await (0, files_1.writeBuffer)(filePath, pngBuffer);
    }
}
exports.renderSvgToPng = renderSvgToPng;
//# sourceMappingURL=renderSvg.js.map