import { readdir } from "fs/promises";
import path from "path";
import { readJson } from "../../utils/files";
import { JsonResources } from "../utils/resources";
import { icons } from "./icons";

const ENTITIES_PATH = "entities";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
    name: "Entities",
    description: "Everything about entities",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/entities",
    },
});

RESOURCES.register({
    path: "/entities",
    summary: "Retrieve a list of entities",
    description: "Get a list of entity IDs and references",
    type: "Entities",
    // TODO write schema
    schema: {},
    loader: async () => {
        const entityIds = await readdir(ENTITIES_PATH);

        const resource = {
            $id: "/entities",
            entities: entityIds.map((id) => ({
                $ref: `/entities/${id}`,
            })),
        };

        return resource;
    },
});

async function preProcess(id: bcked.entity.Id) {}

RESOURCES.register({
    path: "/entities/{id}",
    summary: "Get a entity",
    description: "Get an entity by its ID",
    type: "Entity",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        await preProcess(id);
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
RESOURCES.register({
    path: "/entities/{id}/details",
    summary: "Get details of a entity",
    description: "Get details of a entity by its ID",
    type: "EntityDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path.join(ENTITIES_PATH, id, RECORDS, "details.json");

        const details = await readJson<bcked.entity.DetailsRecord>(filePath);

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

RESOURCES.register({
    path: "/entities/{id}/icons",
    summary: "Get icons of a entity",
    description: "Get icons of a entity by its ID",
    type: "EntityIcons",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => await icons("entities", id),
});
