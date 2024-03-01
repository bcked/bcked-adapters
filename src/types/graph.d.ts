declare namespace graph {
    interface NodeData {
        timestamp: primitive.ISODateTimeString;
        value: number;
    }

    interface LinkData {
        value: number | undefined;
    }

    interface Node {
        id: derived.AssetId;
        data?: NodeData;
    }

    interface Link {
        fromId: derived.AssetId;
        toId: derived.AssetId;
        data: LinkData;
    }

    interface Graph {
        nodes: Node[];
        links: Link[];
    }

    interface Stats {
        numNodes: number;
        numLinks: number;
        averageDegree: number;
        numLeaves: number;
        numRoots: number;
        numIsolated: number;
        rootCollateralization: number;
        leaveCollateralization: number;
        totalCollateralization: number;
    }
}
