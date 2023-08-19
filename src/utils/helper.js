"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromId = exports.toId = exports._toId = void 0;
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
//# sourceMappingURL=helper.js.map