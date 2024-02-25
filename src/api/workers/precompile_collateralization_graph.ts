import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import createGraph, { type Graph } from "ngraph.graph";

import path from "path";
import { ConsecutiveLookup, writeToCsv } from "../../utils/csv";
import { remove } from "../../utils/files";
import { getIncomingLinks, getOutgoingLinks, toJson } from "../../utils/graph";
import { round } from "../../utils/math";
import { toISOString } from "../../utils/string_formatting";
import { daysInMs, getDatesBetween } from "../../utils/time";

type CollateralizationLookup = {
    assetId: bcked.asset.Id;
    lookup: ConsecutiveLookup<bcked.asset.Collateralization>;
};

async function createGraphForTimestamp(
    timestamp: primitive.DateLike,
    collateralizationLookups: CollateralizationLookup[],
    window: number = hoursToMilliseconds(12)
) {
    const graph = createGraph<graph.NodeData, graph.LinkData>();

    // Get closest prices to the current entry for all underlying assets
    await Promise.all(
        collateralizationLookups.map(async ({ assetId, lookup }) => {
            const collateralization = await lookup.getClosest(timestamp, window);

            if (!collateralization) return;

            graph.addNode(assetId, {
                timestamp: collateralization.timestamp,
                value: collateralization.collateral.usd,
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
        const csvPath = path.join(PATHS.assets, assetId, "records", "collateralization_ratio.csv");

        if (!existsSync(csvPath)) continue;

        collateralizationLookups.push({
            assetId,
            lookup: new ConsecutiveLookup<bcked.asset.Collateralization>(csvPath),
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

async function* createGraphs(window: number = hoursToMilliseconds(12)): AsyncIterableIterator<any> {
    const assetIds = (await readdir(PATHS.assets)) as bcked.asset.Id[];

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
        const graph = await createGraphForTimestamp(timestamp, collateralizationLookups, window);

        if (graph.getNodesCount() === 0 || graph.getLinksCount() === 0) continue;

        const stats = computeStats(graph);

        yield { timestamp: toISOString(timestamp), graph: toJson(graph), stats };
    }
}

parentPort?.on("message", async () => {
    console.log(`Precompiling global graph`);
    const filePath = path.join(PATHS.graph, PATHS.records, "collateralization_graph.csv");

    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await remove(filePath);

        const entries = createGraphs();
        await writeToCsv(filePath, entries, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        const step = `Compile Global Graph`;
        console.error(step, error);
        await sendErrorReport(step, error);
        parentPort?.postMessage(null);
    }
});
