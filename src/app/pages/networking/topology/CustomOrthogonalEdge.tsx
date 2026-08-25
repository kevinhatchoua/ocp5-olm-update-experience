import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  AnchorEnd,
  DefaultEdge,
  EdgeTerminalType,
  Point,
  observer,
  withSelection,
  type Edge,
  type Node,
  type WithSelectionProps,
} from "@patternfly/react-topology";
import {
  elbowBendpointsInsideHull,
  paddedHullPolygon,
  sharedParentGroup,
} from "./groupHull";
import { roundedElbowBendpoints } from "./roundedEdgePath";
import { getPathHighlightIds, subscribePathHighlight } from "./topologyActionHandlers";
import { isConnectionEdgeData, type ConnectionEdgeData } from "./topologyNodeData";

type OrthogonalEdgeProps = {
  element: Edge;
  className?: string;
} & WithSelectionProps;

const LINK_TYPE_LABEL: Record<ConnectionEdgeData["linkType"], string> = {
  underlay: "Underlay",
  "logical-attachment": "Logical attachment",
  "workload-attachment": "Workload attachment",
};

function edgeTooltip(data: ConnectionEdgeData | undefined): string | undefined {
  if (!data) return undefined;
  const lines = [
    `${data.sourceLabel} → ${data.targetLabel}`,
    `Edge type: ${LINK_TYPE_LABEL[data.linkType]}`,
  ];
  if (data.vlan) lines.push(`VLAN ID: ${data.vlan}`);
  if (data.bridgeMapping) lines.push(`Bridge mapping: ${data.bridgeMapping}`);
  return lines.join("\n");
}

function almostEqual(a: number, b: number) {
  return Math.abs(a - b) < 1;
}

/** Single-elbow orthogonal path (Hermes-style) instead of dagre's multi-point splines. */
function elbowBendpoints(start: Point, end: Point): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 6 || Math.abs(dy) < 6) {
    return [];
  }
  const midX = start.x + dx / 2;
  return [new Point(midX, start.y), new Point(midX, end.y)];
}

function elbowsForEdge(element: Edge, start: Point, end: Point): Point[] {
  const group = sharedParentGroup(element.getSourceAnchorNode(), element.getTargetAnchorNode());
  if (!group) return elbowBendpoints(start, end);
  return elbowBendpointsInsideHull(start, end, paddedHullPolygon(group));
}

function bendpointsMatch(current: Point[], next: Point[]) {
  if (current.length !== next.length) return false;
  return next.every((point, index) => almostEqual(point.x, current[index].x) && almostEqual(point.y, current[index].y));
}

function nodeCenter(node: Node): Point {
  const bounds = node.getBounds();
  return new Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}

/**
 * Compute elbow bendpoints from live node positions.
 * Do NOT use Edge.getStartPoint()/getEndPoint() here — those use existing bendpoints as
 * the anchor reference, so stored elbows "stick" when a group is dragged.
 */
function computeRoundedElbowFromNodes(element: Edge): Point[] {
  const sourceNode = element.getSourceAnchorNode();
  const targetNode = element.getTargetAnchorNode();
  const start = sourceNode.getAnchor(AnchorEnd.source, element.getType()).getLocation(nodeCenter(targetNode));
  const end = targetNode.getAnchor(AnchorEnd.target, element.getType()).getLocation(nodeCenter(sourceNode));
  const elbows = elbowsForEdge(element, start, end);
  return roundedElbowBendpoints(start, elbows, end);
}

const OrthogonalEdgeInner = observer(({ element, onSelect, selected, className }: OrthogonalEdgeProps) => {
  const sourceBounds = element.getSourceAnchorNode().getBounds();
  const targetBounds = element.getTargetAnchorNode().getBounds();
  const pathHighlighted = useSyncExternalStore(
    subscribePathHighlight,
    () => getPathHighlightIds().has(element.getId()),
    () => false
  );

  useLayoutEffect(() => {
    const next = computeRoundedElbowFromNodes(element);
    if (bendpointsMatch(element.getBendpoints(), next)) return;
    element.setBendpoints(next);
  }, [
    element,
    sourceBounds.x,
    sourceBounds.y,
    sourceBounds.width,
    sourceBounds.height,
    targetBounds.x,
    targetBounds.y,
    targetBounds.width,
    targetBounds.height,
  ]);

  const mergedClass = [className, pathHighlighted ? "ocs-pf-topo-path-highlight" : ""]
    .filter(Boolean)
    .join(" ");

  const data = element.getData();
  const tip = isConnectionEdgeData(data) ? edgeTooltip(data) : undefined;

  return (
    <DefaultEdge
      element={element}
      onSelect={onSelect}
      selected={selected}
      className={mergedClass || undefined}
      startTerminalType={EdgeTerminalType.none}
      endTerminalType={EdgeTerminalType.directional}
      endTerminalSize={10}
    >
      {tip ? <title>{tip}</title> : null}
    </DefaultEdge>
  );
});

export const CustomOrthogonalEdge = withSelection()(OrthogonalEdgeInner);

export const CustomCrossEdge = withSelection()((props: OrthogonalEdgeProps) => (
  <OrthogonalEdgeInner {...props} className="ocs-pf-topo-cross-edge" />
));
