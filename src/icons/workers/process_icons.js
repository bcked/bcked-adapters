"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const API_PATH = "api";
worker_threads_1.parentPort?.on("message", async (filePath) => {
    // TODO use Template class to parse base folder (assets, systems, entities) and id Or just the path lib
    // TODO in API code add route to extend image URLs if .svg in folder
    // TODO convert svg to 16, 32, 48, 64, 128, 256 png images using https://github.com/yisibl/resvg-js
    // TODO Copy svg to API path
    // fs.mkdirSync(icon.target, { recursive: true });
    // fs.copyFileSync(path.resolve(icon.dir, icon.base), path.resolve(icon.target, icon.base));
    worker_threads_1.parentPort?.postMessage(null);
});
//# sourceMappingURL=process_icons.js.map