import { icons } from "../utils/icons";
import { JsonResources } from "../utils/resources";

class System extends JsonResources {
    constructor() {
        super({
            name: "Systems",
            description: "Everything about systems",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/systems",
            },
        });
    }

    @JsonResources.register({
        path: "/systems",
        summary: "Retrieve a list of systems",
        description: "Get a list of system IDs and references",
        type: "Systems",
        // TODO write schema
        schema: {},
    })
    async index(ids: bcked.system.Id[]) {
        return {
            $id: "/systems",
            systems: ids.map((id) => ({
                $ref: `/systems/${id}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/systems/{id}",
        summary: "Get a system",
        description: "Get an system by its ID",
        type: "System",
        // TODO write schema
        schema: {},
    })
    async system(id: bcked.system.Id) {
        return {
            $id: `/systems/${id}`,
            details: {
                $ref: `/systems/${id}/details`,
            },
            icons: {
                $ref: `/systems/${id}/icons`,
            },
        };
    }

    @JsonResources.register({
        path: "/systems/{id}/details",
        summary: "Get details of a system",
        description: "Get details of a system by its ID",
        type: "SystemDetails",
        // TODO write schema
        schema: {},
    })
    async details(id: bcked.system.Id, details: bcked.system.DetailsRecord) {
        return {
            $id: `/systems/${id}/details`,
            name: details?.name,
            // TODO reference to asset
            native: details?.native,
            explorer: details?.explorer,
            listed: details?.listed,
            updated: details?.updated,
        };
    }

    @JsonResources.register({
        path: "/systems/{id}/icons",
        summary: "Get icons of a system",
        description: "Get icons of a system by its ID",
        type: "SystemIcons",
        // TODO write schema
        schema: {},
    })
    async icons(id: bcked.system.Id) {
        return icons("systems", id);
    }
}

export const SYSTEM_RESOURCES = new System();
