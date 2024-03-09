import type { Stats } from "../../utils/stream";
import { setDateParts } from "../../utils/time";
import { JsonResources } from "../utils/openapi";
import { historyResource, monthResource, yearResource } from "../utils/resources";

export class Graph extends JsonResources {
    constructor() {
        super({
            name: "Graphs",
            description: "Everything about graphs",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/graph",
            },
        });
    }

    @JsonResources.register({
        path: "/graphs",
        summary: "Retrieve a list of endpoints to retrieve graphs",
        description: "Get a list of asset IDs and references",
        type: "Graphs",
        // TODO write schema
        schema: {},
    })
    async index() {
        return {
            $id: "/graphs",
            collateralization: {
                $ref: `/graphs/collateralization`,
            },
        };
    }

    @JsonResources.register({
        path: "/graphs/collateralization",
        summary: "Get collateralization graph",
        description: "Get the global collateralization graph of all assets",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphHistory<T extends primitive.Timestamped>(
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(
            "/graphs/collateralization",
            latestTimestamp,
            stats,
            years,
            "{year}/{month}/{day}"
        );
    }

    @JsonResources.register({
        path: "/graphs/collateralization/{year}",
        summary: "Get collateralization graph for a specific year",
        description: "Get the collateralization graph of all assets for a specific year",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphYear<T extends primitive.Timestamped>(
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(
            "/graphs/collateralization",
            stats,
            year,
            months,
            "{year}/{month}/{day}"
        );
    }

    @JsonResources.register({
        path: "/graphs/collateralization/{year}/{month}",
        summary: "Get collateralization graph for a specific month",
        description: "Get the collateralization graph of all assets for a specific month",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphMonth<T extends primitive.Timestamped>(
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource(
            "/graphs/collateralization",
            stats,
            year,
            month,
            days,
            "{year}/{month}/{day}"
        );
    }

    @JsonResources.register({
        path: "/graphs/collateralization/{year}/{month}/{day}",
        summary: "Get collateralization graph for a specific day",
        description: "Get the collateralization graph of all assets for a specific day",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphDay<T extends primitive.Timestamped & bcked.asset.Graph>(
        stats: Stats<T> | undefined
    ) {
        if (!stats?.min || !stats.max || !stats.median) return;

        return {
            $id: setDateParts(
                `/graphs/collateralization/{year}/{month}/{day}`,
                stats.median.timestamp
            ),
            graph: {
                nodes: stats.median.graph.nodes
                    .filter((node) => node.id) // TODO Somehow there are nodes without ID
                    .map((node) => ({
                        id: node.id,
                        data: {
                            asset: {
                                $ref: `/assets/${node.id}`,
                            },
                            "collateralization-ratio": node.data?.value
                                ? {
                                      $ref: setDateParts(
                                          `/assets/${node.id}/collateralization-ratio/{year}/{month}/{day}/{hour}`,
                                          node.data.timestamp
                                      ),
                                  }
                                : undefined,
                            value: node.data?.value
                                ? {
                                      "rwa:USD": node.data.value,
                                  }
                                : undefined,
                        },
                    })),
                links: stats.median.graph.links
                    .filter((link) => link.fromId && link.toId) // TODO Somehow there are links without ID
                    .map((link) => ({
                        fromId: link.fromId,
                        toId: link.toId,
                        data: {
                            value: {
                                "rwa:USD": link.data.value,
                            },
                        },
                    })),
            },
            stats: stats.median.stats,
        };
    }
}

export const GRAPH_RESOURCES = new Graph();
