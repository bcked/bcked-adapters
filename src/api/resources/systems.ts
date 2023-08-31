import { readdir } from "fs/promises";
import path from "path";
import { readJson } from "../../utils/files";
import { JsonResources } from "../utils/resources";
import { icons } from "./icons";

const SYSTEMS_PATH = "systems";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
    name: "Systems",
    description: "Everything about systems",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/systems",
    },
});

RESOURCES.register({
    path: "/systems",
    summary: "Retrieve a list of systems",
    description: "Get a list of system IDs and references",
    type: "Systems",
    // TODO write schema
    schema: {},
    loader: async () => {
        const systemIds = await readdir(SYSTEMS_PATH);

        const resource = {
            $id: "/systems",
            systems: systemIds.map((id) => ({
                $ref: `/systems/${id}`,
            })),
        };

        return resource;
    },
});

RESOURCES.register({
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
RESOURCES.register({
    path: "/systems/{id}/details",
    summary: "Get details of a system",
    description: "Get details of a system by its ID",
    type: "SystemDetails",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path.join(SYSTEMS_PATH, id, RECORDS, "details.json");

        const details = await readJson<bcked.system.DetailsRecord>(filePath);

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

RESOURCES.register({
    path: "/systems/{id}/icons",
    summary: "Get icons of a system",
    description: "Get icons of a system by its ID",
    type: "SystemIcons",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => await icons("systems", id),
});
