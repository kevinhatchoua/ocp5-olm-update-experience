import type { Graph, Node } from "@patternfly/react-topology";

/** Keep manually dragged groups/lanes instead of resetting them on relayout. */
export function shouldPreserveGroupPosition(
  groupElement: Node,
  respectManualPositions: boolean
): boolean {
  if (!respectManualPositions) return false;
  if (groupElement.isPositioned()) return true;
  return groupElement.getNodes().some((node) => node.isPositioned());
}

function nodeHasManualPosition(node: Node): boolean {
  if (node.isPositioned()) return true;
  if (node.isGroup()) {
    return node.getNodes().some((child) => nodeHasManualPosition(child));
  }
  return false;
}

/** True when any group or leaf on the canvas was manually dragged. */
export function graphHasManualPositions(graph: Graph): boolean {
  return graph.getNodes().some((node) => nodeHasManualPosition(node));
}

export function shouldRepositionGroup(
  groupElement: Node,
  respectManualPositions: boolean,
  freezeGroupLayout: boolean
): boolean {
  if (!respectManualPositions) return true;
  if (freezeGroupLayout) return false;
  return !shouldPreserveGroupPosition(groupElement, respectManualPositions);
}
