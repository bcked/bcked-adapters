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
const ENTITIES_PATH = "entities";
const RECORDS = "records";
exports.RESOURCES = new resources_1.JsonResources({
    name: "Entities",
    description: "Everything about entities",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/entities",
    },
});
exports.RESOURCES.register({
    path: "/entities",
    summary: "Retrieve a list of entities",
    description: "Get a list of entity IDs and references",
    type: "Entities",
    // TODO write schema
    schema: {},
    loader: async () => {
        const entityIds = await (0, promises_1.readdir)(ENTITIES_PATH);
        const resource = {
            $id: "/entities",
            entities: entityIds.map((id) => ({
                $ref: `/entities/${id}`,
            })),
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/entities/{id}",
    summary: "Get a entity",
    description: "Get an entity by its ID",
    type: "Entity",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const resource = {
            $id: `/entities/${id}`,
            details: {
                $ref: `/entities/${id}/details`,
            },
            icons: {
                $ref: `/entities/${id}/icons`,
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
//  *         description: The ID of the entity
exports.RESOURCES.register({
    path: "/entities/{id}/details",
    summary: "Get details of a entity",
    description: "Get details of a entity by its ID",
    type: "EntityDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path_1.default.join(ENTITIES_PATH, id, RECORDS, "details.json");
        const details = await (0, files_1.readJson)(filePath);
        const resource = {
            $id: `/entities/${id}/details`,
            name: details?.name,
            identifier: details?.identifier,
            reference: details?.reference,
            tags: details?.tags,
            listed: details?.listed,
            updated: details?.updated,
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/entities/{id}/icons",
    summary: "Get icons of a entity",
    description: "Get icons of a entity by its ID",
    type: "EntityIcons",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => await (0, icons_1.icons)("entities", id),
});
//# sourceMappingURL=entities.js.map