"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCES = void 0;
const resources_1 = require("../utils/resources");
const assets_1 = require("./assets");
const assetsPrice_1 = require("./assetsPrice");
const entities_1 = require("./entities");
const systems_1 = require("./systems");
exports.RESOURCES = new resources_1.JsonResources(undefined, {
    openapi: "3.1.0",
    info: {
        title: "bcked API",
        // TODO Multiline description.
        description: "Free API for all data on bcked.com",
        termsOfService: "https://github.com/bcked/bcked-adapters/blob/main/LEGAL_NOTICE.md",
        contact: {
            name: "API Support",
            url: "https://github.com/bcked/bcked-adapters/issues",
            email: "contact@bcked.com",
        },
        license: {
            name: "GPL-3.0 license",
            url: "https://github.com/bcked/bcked-adapters/blob/main/LICENSE",
        },
        // TODO maybe use the current commit hash here
        version: "1.0.0",
    },
    servers: [
        {
            url: "https://api.bcked.com",
        },
    ],
    paths: {},
    components: {},
    tags: [],
});
exports.RESOURCES.register({
    path: "/",
    summary: "Retrieve a list of all resources",
    description: "Get a list of all resource references",
    type: "Resources",
    // TODO write schema
    schema: {},
    loader: async () => {
        const resource = {
            $id: "/",
            assets: {
                $ref: `/assets`,
            },
            entities: {
                $ref: `/entities`,
            },
            systems: {
                $ref: `/systems`,
            },
        };
        return resource;
    },
});
exports.RESOURCES.extend(assets_1.RESOURCES, entities_1.RESOURCES, systems_1.RESOURCES, assetsPrice_1.RESOURCES);
//# sourceMappingURL=index.js.map