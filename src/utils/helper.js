"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackingCsvPath = exports.getSupplyCsvPath = exports.getPriceCsvPath = exports.getAssetRecordsPath = exports.fromId = exports.toId = exports._toId = void 0;
const path = require("path");
function _toId(system, address) {
    return `${system}:${address}`;
}
exports._toId = _toId;
function toId(identifier) {
    return _toId(identifier.system, identifier.address);
}
exports.toId = toId;
function fromId(assetId) {
    const [system, address] = assetId.split(":", 2);
    if (system == undefined || address == undefined)
        throw new Error(`Asset ID ${assetId} invalid.`);
    return { address, system };
}
exports.fromId = fromId;
function getAssetRecordsPath(identifier) {
    return path.resolve(`assets/${toId(identifier)}/records`);
}
exports.getAssetRecordsPath = getAssetRecordsPath;
function getPriceCsvPath(identifier) {
    return path.resolve(getAssetRecordsPath(identifier), "price.csv");
}
exports.getPriceCsvPath = getPriceCsvPath;
function getSupplyCsvPath(identifier) {
    return path.resolve(getAssetRecordsPath(identifier), "supply.csv");
}
exports.getSupplyCsvPath = getSupplyCsvPath;
function getBackingCsvPath(identifier) {
    return path.resolve(getAssetRecordsPath(identifier), "backing.csv");
}
exports.getBackingCsvPath = getBackingCsvPath;
//# sourceMappingURL=helper.js.map