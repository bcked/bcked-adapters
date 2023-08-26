import { JsonResources } from "../utils/resources";
import { RESOURCES as ASSET_RESOURCES } from "./assets";

export const RESOURCES = new JsonResources(
    {
        openapi: "3.1.0",
        info: {
            title: "bcked API",
            summary: "Free API for all data on bcked.com",
            // TODO Multiline description.
            description: "",
            termsOfService: "https://github.com/bcked/bcked-adapters/blob/main/LEGAL_NOTICE.md",
            contact: {
                name: "API Support",
                url: "https://github.com/bcked/bcked-adapters/issues",
                email: "contact@bcked.com",
            },
            license: {
                name: "GNU General Public License v3.0 only",
                identifier: "GPL-3.0",
                url: "https://github.com/bcked/bcked-adapters/blob/main/LICENSE",
            },
            // TODO maybe use the current commit hash here
            version: "1.0.0",
        },
        paths: {},
        components: {},
        tags: [],
    },
    ASSET_RESOURCES
);
