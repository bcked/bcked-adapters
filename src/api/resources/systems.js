"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCES = void 0;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const files_1 = require("../../utils/files");
const resources_1 = require("../utils/resources");
const icons_1 = require("./icons");
const SYSTEMS_PATH = "systems";
const RECORDS = "records";
exports.RESOURCES = new resources_1.JsonResources({
    name: "Systems",
    description: "Everything about systems",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/systems",
    },
});
exports.RESOURCES.register({
    path: "/systems",
    summary: "Retrieve a list of systems",
    description: "Get a list of system IDs and references",
    type: "Systems",
    // TODO write schema
    schema: {},
    loader: async () => {
        const systemIds = await (0, promises_1.readdir)(SYSTEMS_PATH);
        const resource = {
            $id: "/systems",
            systems: systemIds.map((id) => ({
                $ref: `/systems/${id}`,
            })),
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/systems/{id}",
    summary: "Get a system",
    description: "Get an system by its ID",
    type: "System",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const resource = {
            $id: `/systems/${id}`,
            details: {
                $ref: `/systems/${id}/details`,
            },
            icons: {
                $ref: `/systems/${id}/icons`,
            },
        };
        return resource;
    },
});
// parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The ID of the system
exports.RESOURCES.register({
    path: "/systems/{id}/details",
    summary: "Get details of a system",
    description: "Get details of a system by its ID",
    type: "SystemDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path_1.default.join(SYSTEMS_PATH, id, RECORDS, "details.json");
        const details = await (0, files_1.readJson)(filePath);
        const resource = {
            $id: `/systems/${id}/details`,
            name: details?.name,
            // TODO reference to asset
            native: details?.native,
            explorer: details?.explorer,
            listed: details?.listed,
            updated: details?.updated,
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/systems/{id}/icons",
    summary: "Get icons of a system",
    description: "Get icons of a system by its ID",
    type: "SystemIcons",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => await (0, icons_1.icons)("systems", id),
});
//# sourceMappingURL=systems.js.map