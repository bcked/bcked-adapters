import { parentPort } from "worker_threads";

const API_PATH = "api";

parentPort?.on("message", async (filePath: string) => {
    // TODO use Template class to parse base folder (assets, systems, entities) and id Or just the path lib

    // TODO in API code add route to extend image URLs if .svg in folder

    // TODO convert svg to 16, 32, 48, 64, 128, 256 png images using https://github.com/yisibl/resvg-js

    // TODO Copy svg to API path
    // fs.mkdirSync(icon.target, { recursive: true });
    // fs.copyFileSync(path.resolve(icon.dir, icon.base), path.resolve(icon.target, icon.base));

    parentPort?.postMessage(null);
});
