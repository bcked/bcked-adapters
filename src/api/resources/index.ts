import { JsonResources } from "../utils/openapi";

class Index extends JsonResources {
    constructor() {
        super(undefined, {
            openapi: "3.1.0",
            info: {
                title: "bcked API",
                description:
                    "Free API for all data on bcked.com. The data comes from issuer reports, on-chain data and third-party APIs, listed at https://bcked.com/methodology. Powered by Etherscan.io APIs.",
                termsOfService: "https://bcked.com/legal-notice",
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
    }

    @JsonResources.register({
        path: "/",
        summary: "Retrieve a list of all resources",
        description: "Get a list of all resource references",
        type: "Resources",
        // TODO write schema
        schema: {},
    })
    async index() {
        return {
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
            graphs: {
                $ref: `/graphs`,
            },
        };
    }
}

export const INDEX_RESOURCES = new Index();
