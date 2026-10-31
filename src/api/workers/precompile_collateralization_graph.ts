import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";

import { existsSync } from "fs";
import createGraph, { type Graph } from "ngraph.graph";

import path from "path";
import { flatten } from "flat";
import _ from "lodash";
import { toAsync } from "../../utils/array";
import { createCsv, LatestLookup } from "../../utils/csv";
import { remove } from "../../utils/files";
import { getIncomingLinks, getOutgoingLinks, toJson } from "../../utils/graph";
import { round } from "../../utils/math";
import { toISOString } from "../../utils/string_formatting";
import { daysInMs, getDatesBetween } from "../../utils/time";

interface CollateralizationLookup {
    assetId: bcked.asset.Id;
    lookup: LatestLookup<bcked.asset.Collateralization>;
}

/**
 * Backing from reports is only recorded per report date, so each asset keeps its latest backing
 * until it is older than this. Tether reports quarterly and publishes about six weeks later.
 */
const MAX_BACKING_AGE = daysInMs(140);

async function createGraphForTimestamp(
    timestamp: primitive.DateLike,
    collateralizationLookups: CollateralizationLookup[]
) {
    const graph = createGraph<graph.NodeData, graph.LinkData>();

    // Get closest prices to the current entry for all underlying assets
    await Promise.all(
        collateralizationLookups.map(async ({ assetId, lookup }) => {
            const collateralization = await lookup.getLatest(timestamp, MAX_BACKING_AGE);

            if (!collateralization) return;

            graph.addNode(assetId, {
                timestamp: collateralization.timestamp,
                // Collateralization entries only exist where the collateral value is known.
                value: collateralization.collateral.usd!,
            });

            for (const [collateralAssetId, value] of Object.entries(
                collateralization.collateral.breakdown
            )) {
                graph.addLink(assetId, collateralAssetId, { value: value.usd });
            }
        })
    );

    return graph;
}

function initializeCollateralizationLookups(assetIds: bcked.asset.Id[]) {
    const collateralizationLookups: CollateralizationLookup[] = [];

    for (const assetId of assetIds) {
        const csvPath = path.join(
            PATHS.assets,
            assetId,
            PATHS.records,
            FILES.csv.collateralizationRatio
        );

        if (!existsSync(csvPath)) continue;

        collateralizationLookups.push({
            assetId,
            lookup: new LatestLookup<bcked.asset.Collateralization>(csvPath),
        });
    }

    return collateralizationLookups;
}

function computeStats(graph: Graph<graph.NodeData, graph.LinkData>): graph.Stats {
    const numNodes = graph.getNodeCount();
    const numLinks = graph.getLinkCount();
    const averageDegree = numLinks / numNodes;

    let numLeaves = 0;
    let numRoots = 0;
    let numIsolated = 0;
    let rootCollateralization = 0;
    let leaveCollateralization = 0;
    let totalCollateralization = 0;

    graph.forEachNode((node) => {
        const outgoingLinks = getOutgoingLinks(graph, node);
        const incomingLinks = getIncomingLinks(graph, node);

        if (outgoingLinks.length === 0 && incomingLinks.length === 0) {
            numIsolated++;
        } else if (outgoingLinks.length === 0) {
            numLeaves++;

            for (const link of incomingLinks) {
                leaveCollateralization += link.data.value ?? 0;
            }
        } else if (incomingLinks.length === 0) {
            numRoots++;

            for (const link of outgoingLinks) {
                rootCollateralization += link.data.value ?? 0;
            }
        }
    });

    graph.forEachLink((link) => {
        totalCollateralization += link.data.value ?? 0;
    });

    return {
        numNodes,
        numLinks,
        averageDegree: round(averageDegree, 2),
        numLeaves,
        numRoots,
        numIsolated,
        rootCollateralization: round(rootCollateralization, 2),
        leaveCollateralization: round(leaveCollateralization, 2),
        totalCollateralization: round(totalCollateralization, 2),
    };
}

async function* createGraphs(assetIds: bcked.asset.Id[]): AsyncIterableIterator<any> {
    const collateralizationLookups = initializeCollateralizationLookups(assetIds);

    // TODO get latest entry from global graph and continue from that time
    // const lastEntry = await getLatest<bcked.asset.Backing>(csvPath);
    // // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
    // if (lastEntry !== null && isClose(lastEntry.timestamp, Date.now(), hoursInMs(23.99))) return;

    // const startOfRecordings = new Date("2022-11-02");
    // const startDate = new Date(lastEntry?.timestamp ?? startOfRecordings);
    const startDate = new Date("2022-11-02");

    // Loop through the dates using timestamps and create Date objects
    for (const timestamp of getDatesBetween(startDate, Date.now(), daysInMs(1))) {
        // The graph of a day shows the backing at its end, or now for today. At its start, an asset
        // added during the day would only show up the next day.
        const endOfDay = Math.min(new Date(timestamp).getTime() + daysInMs(1) - 1, Date.now());
        const graph = await createGraphForTimestamp(endOfDay, collateralizationLookups);

        if (graph.getNodesCount() === 0 || graph.getLinksCount() === 0) continue;

        const stats = computeStats(graph);

        yield { timestamp: toISOString(timestamp), graph: toJson(graph), stats };
    }
}

parentPort?.on("message", async (assetIds: bcked.asset.Id[]) => {
    const step = `Precompiling Collateralization Graph`;
    console.log(step);
    const filePath = path.join(PATHS.graphs, PATHS.records, FILES.csv.collateralizationGraph);

    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await remove(filePath);

        // The graphs are flattened into columns and grow over time. The CSV header must cover all
        // of them, otherwise later graphs are cut to the columns of the first one.
        const entries = [];
        for await (const entry of createGraphs(assetIds)) entries.push(entry);
        const columns = _.union(
            ...entries.map((entry) => Object.keys(flatten<object, object>(entry)))
        );
        const header = ["timestamp", ...columns.filter((column) => column != "timestamp").sort()];
        await createCsv(filePath, toAsync(entries), header);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(step, error);
        await sendErrorReport(step, error);
        parentPort?.postMessage(null);
    }
});
