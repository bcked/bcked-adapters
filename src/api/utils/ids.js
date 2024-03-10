"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemIds = exports.getEntityIds = exports.getAssetIds = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const constants_1 = require("../../constants");
async function getAssetIds() {
    const assetIds = await promises_1.default.readdir(constants_1.PATHS.assets);
    return assetIds;
}
exports.getAssetIds = getAssetIds;
async function getEntityIds() {
    const entityIds = await promises_1.default.readdir(constants_1.PATHS.entities);
    return entityIds;
}
exports.getEntityIds = getEntityIds;
async function getSystemIds() {
    const systemIds = await promises_1.default.readdir(constants_1.PATHS.systems);
    return systemIds;
}
exports.getSystemIds = getSystemIds;
//# sourceMappingURL=ids.js.map