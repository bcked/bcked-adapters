import { sortBy } from "lodash";
import { type Graph, type Link, type Node } from "ngraph.graph";
import _toJson from "ngraph.tojson";

export function getLinks<nodeData, linkData>(
    graph: Graph<nodeData, linkData>,
    node: Node<nodeData>
): Link<linkData>[] {
    return [...(graph.getLinks(node.id) ?? [])];
}

export function getIncomingLinks<nodeData, linkData>(
    graph: Graph<nodeData, linkData>,
    node: Node<nodeData>
): Link<linkData>[] {
    return getLinks(graph, node).filter((link) => link.toId === node.id);
}

export function getOutgoingLinks<nodeData, linkData>(
    graph: Graph<nodeData, linkData>,
    node: Node<nodeData>
): Link<linkData>[] {
    return getLinks(graph, node).filter((link) => link.fromId === node.id);
}

export function toJson<nodeData, linkData>(graph: Graph<nodeData, linkData>): graph.Graph {
    const json = JSON.parse(_toJson(graph));
    return { nodes: sortBy(json.nodes, "id"), links: sortBy(json.links, ["fromId", "toId"]) };
}
