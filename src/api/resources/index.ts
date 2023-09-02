import { JsonResources } from "../utils/resources";
import { RESOURCES as ASSET_RESOURCES } from "./assets";
import { RESOURCES as ASSET_PRICE_RESOURCES } from "./assetsPrice";
import { RESOURCES as ENTITY_RESOURCES } from "./entities";
import { RESOURCES as SYSTEM_RESOURCES } from "./systems";

export const RESOURCES = new JsonResources(undefined, {
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

RESOURCES.register({
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

RESOURCES.extend(ASSET_RESOURCES, ENTITY_RESOURCES, SYSTEM_RESOURCES, ASSET_PRICE_RESOURCES);
