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
  element?: { isPositioned(): boolean };
};

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
  respectManualPositions = false
) {
  if (leaves.length === 0) {
    return;
  }

  if (mode === "lane") {
    leaves.forEach((node, index) => {
      if (shouldKeepManualPosition(node, respectManualPositions)) return;
      node.x = index * (Math.max(node.width, 64) + LOGICAL_H_SPACING);
      node.y = 0;
      node.update();
    });
    return;
  }

  if (mode === "slots") {
    leaves.forEach((node) => {
      if (shouldKeepManualPosition(node, respectManualPositions)) return;
      const suffix = resourceSuffixFromNodeId(node.id);
      const slot = RESOURCE_SLOT_LAYOUT[suffix] ?? { col: 0, row: 0 };
      const pos = resourceGridPos(slot.col, slot.row);
      node.x = pos.x;
      node.y = pos.y;
      node.update();
    });
    return;
  }

  const cols = Math.max(2, Math.ceil(Math.sqrt(leaves.length)));
  leaves.forEach((node, index) => {
    if (shouldKeepManualPosition(node, respectManualPositions)) return;
    const col = index % cols;
    const row = Math.floor(index / cols);
    node.x = col * (Math.max(node.width, 75) + INNER_GAP);
    node.y = row * (Math.max(node.height, 75) + INNER_GAP);
    node.update();
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
