"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const bot_1 = require("../../watcher/bot");
const date_fns_1 = require("date-fns");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const ngraph_graph_1 = __importDefault(require("ngraph.graph"));
const path_1 = __importDefault(require("path"));
const csv_1 = require("../../utils/csv");
const files_1 = require("../../utils/files");
const graph_1 = require("../../utils/graph");
const math_1 = require("../../utils/math");
const string_formatting_1 = require("../../utils/string_formatting");
const time_1 = require("../../utils/time");
async function createGraphForTimestamp(timestamp, collateralizationLookups, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
    const graph = (0, ngraph_graph_1.default)();
    // Get closest prices to the current entry for all underlying assets
    await Promise.all(collateralizationLookups.map(async ({ assetId, lookup }) => {
        const collateralization = await lookup.getClosest(timestamp, window);
        if (!collateralization)
            return;
        graph.addNode(assetId, {
            timestamp: collateralization.timestamp,
            value: collateralization.collateral.usd,
        });
        for (const [collateralAssetId, value] of Object.entries(collateralization.collateral.breakdown)) {
            graph.addLink(assetId, collateralAssetId, { value: value.usd });
        }
    }));
    return graph;
}
function initializeCollateralizationLookups(assetIds) {
    const collateralizationLookups = [];
    for (const assetId of assetIds) {
        const csvPath = path_1.default.join(paths_1.PATHS.assets, assetId, "records", "collateralization_ratio.csv");
        if (!(0, fs_1.existsSync)(csvPath))
            continue;
        collateralizationLookups.push({
            assetId,
            lookup: new csv_1.ConsecutiveLookup(csvPath),
        });
    }
    return collateralizationLookups;
}
function computeStats(graph) {
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
        const outgoingLinks = (0, graph_1.getOutgoingLinks)(graph, node);
        const incomingLinks = (0, graph_1.getIncomingLinks)(graph, node);
        if (outgoingLinks.length === 0 && incomingLinks.length === 0) {
            numIsolated++;
        }
        else if (outgoingLinks.length === 0) {
            numLeaves++;
            for (const link of incomingLinks) {
                leaveCollateralization += link.data.value ?? 0;
            }
        }
        else if (incomingLinks.length === 0) {
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
        averageDegree: (0, math_1.round)(averageDegree, 2),
        numLeaves,
        numRoots,
        numIsolated,
        rootCollateralization: (0, math_1.round)(rootCollateralization, 2),
        leaveCollateralization: (0, math_1.round)(leaveCollateralization, 2),
        totalCollateralization: (0, math_1.round)(totalCollateralization, 2),
    };
}
async function* createGraphs(window = (0, date_fns_1.hoursToMilliseconds)(12)) {
    const assetIds = (await (0, promises_1.readdir)(paths_1.PATHS.assets));
    const collateralizationLookups = initializeCollateralizationLookups(assetIds);
    // TODO get latest entry from global graph and continue from that time
    // const lastEntry = await getLatest<bcked.asset.Backing>(csvPath);
    // // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
    // if (lastEntry !== null && isClose(lastEntry.timestamp, Date.now(), hoursInMs(23.99))) return;
    // const startOfRecordings = new Date("2022-11-02");
    // const startDate = new Date(lastEntry?.timestamp ?? startOfRecordings);
    const startDate = new Date("2022-11-02");
    // Loop through the dates using timestamps and create Date objects
    for (const timestamp of (0, time_1.getDatesBetween)(startDate, Date.now(), (0, time_1.daysInMs)(1))) {
        const graph = await createGraphForTimestamp(timestamp, collateralizationLookups, window);
        if (graph.getNodesCount() === 0 || graph.getLinksCount() === 0)
            continue;
        const stats = computeStats(graph);
        yield { timestamp: (0, string_formatting_1.toISOString)(timestamp), graph: (0, graph_1.toJson)(graph), stats };
    }
}
worker_threads_1.parentPort?.on("message", async () => {
    const step = `Precompiling Collateralization Graph`;
    console.log(step);
    const filePath = path_1.default.join(paths_1.PATHS.graph, paths_1.PATHS.records, "collateralization_graph.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await (0, files_1.remove)(filePath);
        const entries = createGraphs();
        await (0, csv_1.writeToCsv)(filePath, entries, "timestamp");
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(step, error);
        await (0, bot_1.sendErrorReport)(step, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=precompile_collateralization_graph.js.map