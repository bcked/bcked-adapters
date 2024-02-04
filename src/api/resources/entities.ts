import { icons } from "../utils/icons";
import { JsonResources } from "../utils/resources";

class Entity extends JsonResources {
    constructor() {
        super({
            name: "Entity",
            description: "Everything about entities",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/entities",
            },
        });
    }

    @JsonResources.register({
        path: "/entities",
        summary: "Retrieve a list of entities",
        description: "Get a list of entity IDs and references",
        type: "Entities",
        // TODO write schema
        schema: {},
    })
    async index(ids: bcked.entity.Id[]) {
        return {
            $id: "/entities",
            entities: ids.map((id) => ({
                $ref: `/entities/${id}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/entities/{id}",
        summary: "Get a entity",
        description: "Get an entity by its ID",
        type: "Entity",
        // TODO write schema
        schema: {},
    })
    async entity(id: bcked.entity.Id) {
        return {
            $id: `/entities/${id}`,
            details: {
                $ref: `/entities/${id}/details`,
            },
            icons: {
                $ref: `/entities/${id}/icons`,
            },
        };
    }

    @JsonResources.register({
        path: "/entities/{id}/details",
        summary: "Get details of a entity",
        description: "Get details of a entity by its ID",
        type: "EntityDetails",
        // TODO write schema
        schema: {},
    })
    async details(id: bcked.entity.Id, details: bcked.entity.DetailsRecord) {
        return {
            $id: `/entities/${id}/details`,
            name: details?.name,
            identifier: details?.identifier,
            reference: details?.reference,
            tags: details?.tags,
            listed: details?.listed,
            updated: details?.updated,
        };
    }

    @JsonResources.register({
        path: "/entities/{id}/icons",
        summary: "Get icons of a entity",
        description: "Get icons of a entity by its ID",
        type: "EntityIcons",
        // TODO write schema
        schema: {},
    })
    async icons(id: bcked.entity.Id) {
        return icons("entities", id);
    }
}

export const ENTITY_RESOURCES = new Entity();
