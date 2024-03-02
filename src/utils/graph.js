"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJson = exports.getOutgoingLinks = exports.getIncomingLinks = exports.getLinks = void 0;
const lodash_1 = require("lodash");
const ngraph_tojson_1 = __importDefault(require("ngraph.tojson"));
function getLinks(graph, node) {
    return [...(graph.getLinks(node.id) ?? [])];
}
exports.getLinks = getLinks;
function getIncomingLinks(graph, node) {
    return getLinks(graph, node).filter((link) => link.toId === node.id);
}
exports.getIncomingLinks = getIncomingLinks;
function getOutgoingLinks(graph, node) {
    return getLinks(graph, node).filter((link) => link.fromId === node.id);
}
exports.getOutgoingLinks = getOutgoingLinks;
function toJson(graph) {
    const json = JSON.parse((0, ngraph_tojson_1.default)(graph));
    return { nodes: (0, lodash_1.sortBy)(json.nodes, "id"), links: (0, lodash_1.sortBy)(json.links, ["fromId", "toId"]) };
}
exports.toJson = toJson;
//# sourceMappingURL=graph.js.map