declare namespace graph {
    type NodeData = {
        timestamp: primitive.ISODateTimeString;
        value: number;
    };

    type LinkData = {
        value: number | undefined;
    };

    type Node = {
        id: derived.AssetId;
        data: NodeData;
    };

    type Link = {
        fromId: derived.AssetId;
        toId: derived.AssetId;
        data: LinkData;
    };

    type Graph = {
        nodes: Node[];
        links: Link[];
    };
}
