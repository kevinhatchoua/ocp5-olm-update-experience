import { Point, type Graph } from "@patternfly/react-topology";
import {
  RESOURCE_SLOT_LAYOUT,
  resourceGridPos,
} from "../networkTopologyData";
import { LOGICAL_LANE_ID, WORKLOAD_LANE_ID } from "./topologyNodeData";

const INNER_GAP = 48;
const LOGICAL_H_SPACING = 176;

export type LayoutLeaf = {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  update: () => void;
  setFixed?: (fixed: boolean) => void;
  setPosition?: (x: number, y: number) => void;
  element?: { isPositioned(): boolean };
};

export function applyLeafPosition(node: LayoutLeaf, x: number, y: number) {
  node.setFixed?.(false);
  node.x = x;
  node.y = y;
  if (node.setPosition) {
    node.setPosition(x, y);
    return;
  }
  node.update();
}

function resourceSuffixFromNodeId(nodeId: string): string {
  const match = nodeId.match(/^worker-\d+-(.+)$/);
  return match?.[1] ?? nodeId;
}

function shouldKeepManualPosition(leaf: LayoutLeaf, respectManualPositions: boolean): boolean {
  return respectManualPositions && Boolean(leaf.element?.isPositioned());
}

/** Lay out group children using canonical per-worker slot positions (no overlap). */
export function layoutGroupChildren(
  groupId: string,
  leaves: LayoutLeaf[],
  mode: "lane" | "grid" | "slots",
  respectManualPositions = false,
  originX = 0,
  originY = 0
) {
  if (leaves.length === 0) {
    return;
  }

  if (mode === "lane") {
    leaves.forEach((node, index) => {
      if (shouldKeepManualPosition(node, respectManualPositions)) return;
      applyLeafPosition(node, originX + index * (Math.max(node.width, 64) + LOGICAL_H_SPACING), originY);
    });
    return;
  }

  if (mode === "slots") {
    const occupied = new Set<string>();
    const slotKey = (slot: { col: number; row: number }) => `${slot.col},${slot.row}`;
    const nextFreeSlot = (startIndex: number) => {
      let i = startIndex;
      while (true) {
        const candidate = { col: i % 3, row: Math.floor(i / 3) };
        if (!occupied.has(slotKey(candidate))) return candidate;
        i += 1;
      }
    };
    leaves.forEach((node, index) => {
      if (shouldKeepManualPosition(node, respectManualPositions)) return;
      const suffix = resourceSuffixFromNodeId(node.id);
      const preferred = RESOURCE_SLOT_LAYOUT[suffix];
      const slot = preferred && !occupied.has(slotKey(preferred)) ? preferred : nextFreeSlot(index);
      occupied.add(slotKey(slot));
      const pos = resourceGridPos(slot.col, slot.row);
      applyLeafPosition(node, originX + pos.x, originY + pos.y);
    });
    return;
  }

  const cols = Math.max(2, Math.ceil(Math.sqrt(leaves.length)));
  leaves.forEach((node, index) => {
    if (shouldKeepManualPosition(node, respectManualPositions)) return;
    const col = index % cols;
    const row = Math.floor(index / cols);
    applyLeafPosition(
      node,
      originX + col * (Math.max(node.width, 75) + INNER_GAP),
      originY + row * (Math.max(node.height, 75) + INNER_GAP)
    );
  });
}

export function layoutModeForGroup(groupId: string): "lane" | "grid" | "slots" {
  if (groupId === LOGICAL_LANE_ID) {
    return "lane";
  }
  if (groupId === WORKLOAD_LANE_ID) {
    return "grid";
  }
  return "slots";
}

/**
 * Pack children inside every group relative to that group's current origin.
 * Absolute 0,0 packing piles every group's leaves on the same slots; layouts that
 * only move the hull (or skip nested nodes) then leave resources stacked.
 */
export function packGraphGroupChildren(graph: Graph) {
  graph.getNodes().forEach((group) => {
    if (!group.isGroup()) return;
    const children = group.getNodes().filter((child) => !child.isGroup());
    if (children.length === 0) return;
    const origin = group.getBounds();
    const originX = origin.x;
    const originY = origin.y;
    const leaves: LayoutLeaf[] = children.map((child) => {
      const dim = child.getDimensions();
      const leaf: LayoutLeaf = {
        id: child.getId(),
        width: Math.max(dim.width, 64),
        height: Math.max(dim.height, 64),
        x: 0,
        y: 0,
        update() {
          child.setPosition(new Point(originX + leaf.x, originY + leaf.y));
        },
        element: child,
      };
      return leaf;
    });
    layoutGroupChildren(group.getId(), leaves, layoutModeForGroup(group.getId()));
  });
}

/** Drop Dagre/Force spline points so edges follow live node anchors, not empty space. */
export function clearGraphEdgeBendpoints(graph: Graph) {
  graph.getEdges().forEach((edge) => {
    if (edge.getBendpoints().length > 0) {
      edge.setBendpoints([]);
    }
  });
}
