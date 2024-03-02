"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeResource = void 0;
const node_path_1 = __importDefault(require("node:path"));
const paths_1 = require("../../paths");
const files_1 = require("../../utils/files");
async function writeResource(resource) {
    const res = await resource;
    const filePath = node_path_1.default.join(paths_1.PATHS.api, res.$id, "index.json");
    await (0, files_1.writeJson)(filePath, res);
}
exports.writeResource = writeResource;
//# sourceMappingURL=file.js.map