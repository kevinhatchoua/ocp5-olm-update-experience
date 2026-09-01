import { Point, Rect, type Graph } from "@patternfly/react-topology";
import type { NetworkTopologyNodeData } from "./topologyNodeData";

export const TOPOLOGY_MINIMAP_WIDTH = 144;
export const TOPOLOGY_MINIMAP_HEIGHT = 96;

export type TopologyMinimapBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TopologyMinimapNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeKind?: NetworkTopologyNodeData["nodeKind"];
};

export type TopologyMinimapViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function computeTopologyContentBounds(graph: Graph): TopologyMinimapBounds | null {
  let rect: Rect | undefined;

  graph.getNodes().forEach((node) => {
    const bounds = node.getBounds();
    if (!rect) {
      rect = bounds.clone();
      return;
    }
    rect.union(bounds);
  });

  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const padding = Math.max(rect.width, rect.height) * 0.06 + 32;
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function collectTopologyMinimapNodes(graph: Graph): TopologyMinimapNode[] {
  return graph.getNodes().map((node) => {
    const bounds = node.getBounds();
    const data = node.getData() as NetworkTopologyNodeData | undefined;
    return {
      id: node.getId(),
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      nodeKind: data?.nodeKind,
    };
  });
}

export function computeTopologyViewport(
  graph: Graph,
  contentBounds: TopologyMinimapBounds
): TopologyMinimapViewport {
  const scale = graph.getScale();
  const { x: tx, y: ty } = graph.getPosition();
  const { width: viewWidth, height: viewHeight } = graph.getDimensions();

  const x = (-tx / scale - contentBounds.x) / contentBounds.width;
  const y = (-ty / scale - contentBounds.y) / contentBounds.height;
  const width = viewWidth / scale / contentBounds.width;
  const height = viewHeight / scale / contentBounds.height;

  return { x, y, width, height };
}

export function graphPointFromMinimap(
  localX: number,
  localY: number,
  contentBounds: TopologyMinimapBounds,
  mapWidth: number,
  mapHeight: number
): { x: number; y: number } {
  return {
    x: contentBounds.x + (localX / mapWidth) * contentBounds.width,
    y: contentBounds.y + (localY / mapHeight) * contentBounds.height,
  };
}

export function centerGraphOnPoint(graph: Graph, graphX: number, graphY: number): void {
  const scale = graph.getScale();
  const { width, height } = graph.getDimensions();
  graph.setPosition(new Point(width / 2 - graphX * scale, height / 2 - graphY * scale));
}

export function panGraphByMinimapDelta(
  graph: Graph,
  deltaX: number,
  deltaY: number,
  contentBounds: TopologyMinimapBounds,
  mapWidth: number,
  mapHeight: number
): void {
  const scale = graph.getScale();
  const graphDeltaX = deltaX / (mapWidth / contentBounds.width);
  const graphDeltaY = deltaY / (mapHeight / contentBounds.height);
  const { x, y } = graph.getPosition();
  graph.setPosition(new Point(x - graphDeltaX * scale, y - graphDeltaY * scale));
}

export function minimapNodeClass(nodeKind: NetworkTopologyNodeData["nodeKind"] | undefined, selected: boolean): string {
  const classes = ["ocs-pf-topo-minimap__node"];
  if (nodeKind) {
    classes.push(`ocs-pf-topo-minimap__node--${nodeKind}`);
  } else {
    classes.push("ocs-pf-topo-minimap__node--default");
  }
  if (selected) {
    classes.push("ocs-pf-topo-minimap__node--selected");
  }
  return classes.join(" ");
}
