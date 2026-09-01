import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GRAPH_LAYOUT_END_EVENT,
  GRAPH_POSITION_CHANGE_EVENT,
  type Visualization,
} from "@patternfly/react-topology";
import {
  TOPOLOGY_MINIMAP_HEIGHT,
  TOPOLOGY_MINIMAP_WIDTH,
  centerGraphOnPoint,
  collectTopologyMinimapNodes,
  computeTopologyContentBounds,
  computeTopologyViewport,
  graphPointFromMinimap,
  minimapNodeClass,
  panGraphByMinimapDelta,
} from "./topologyMinimapUtils";

type TopologyMinimapProps = {
  controller: Visualization;
  selectedIds?: string[];
  refreshKey?: string | number;
};

export default function TopologyMinimap({
  controller,
  selectedIds = [],
  refreshKey = 0,
}: TopologyMinimapProps) {
  const [tick, setTick] = useState(0);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    const bump = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setTick((value) => value + 1);
      });
    };
    controller.addEventListener(GRAPH_POSITION_CHANGE_EVENT, bump);
    controller.addEventListener(GRAPH_LAYOUT_END_EVENT, bump);
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      controller.removeEventListener(GRAPH_POSITION_CHANGE_EVENT, bump);
      controller.removeEventListener(GRAPH_LAYOUT_END_EVENT, bump);
    };
  }, [controller]);

  useEffect(() => {
    setTick((value) => value + 1);
  }, [refreshKey]);

  const graph = controller.getGraph();
  const contentBounds = useMemo(() => computeTopologyContentBounds(graph), [graph, tick]);
  const nodes = useMemo(() => collectTopologyMinimapNodes(graph), [graph, tick]);
  const viewport = useMemo(
    () => (contentBounds ? computeTopologyViewport(graph, contentBounds) : null),
    [graph, contentBounds, tick]
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toLocalPoint = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(TOPOLOGY_MINIMAP_WIDTH, event.clientX - rect.left)),
      y: Math.max(0, Math.min(TOPOLOGY_MINIMAP_HEIGHT, event.clientY - rect.top)),
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!contentBounds) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };

      const local = toLocalPoint(event);
      const graphPoint = graphPointFromMinimap(
        local.x,
        local.y,
        contentBounds,
        TOPOLOGY_MINIMAP_WIDTH,
        TOPOLOGY_MINIMAP_HEIGHT
      );
      centerGraphOnPoint(graph, graphPoint.x, graphPoint.y);
    },
    [contentBounds, graph, toLocalPoint]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!contentBounds || !dragRef.current || dragRef.current.pointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - dragRef.current.x;
      const deltaY = event.clientY - dragRef.current.y;
      if (deltaX === 0 && deltaY === 0) return;
      dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      panGraphByMinimapDelta(
        graph,
        deltaX,
        deltaY,
        contentBounds,
        TOPOLOGY_MINIMAP_WIDTH,
        TOPOLOGY_MINIMAP_HEIGHT
      );
    },
    [contentBounds, graph]
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  if (!contentBounds || !viewport) {
    return null;
  }

  return (
    <div className="ocs-pf-topo-minimap" role="group" aria-label="Topology overview map">
      <span className="ocs-pf-topo-minimap__label">Overview</span>
      <svg
        className="ocs-pf-topo-minimap__svg"
        width={TOPOLOGY_MINIMAP_WIDTH}
        height={TOPOLOGY_MINIMAP_HEIGHT}
        viewBox={`0 0 ${TOPOLOGY_MINIMAP_WIDTH} ${TOPOLOGY_MINIMAP_HEIGHT}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <rect
          className="ocs-pf-topo-minimap__canvas"
          x={0}
          y={0}
          width={TOPOLOGY_MINIMAP_WIDTH}
          height={TOPOLOGY_MINIMAP_HEIGHT}
          rx={4}
        />
        {nodes.map((node) => {
          const x = ((node.x - contentBounds.x) / contentBounds.width) * TOPOLOGY_MINIMAP_WIDTH;
          const y = ((node.y - contentBounds.y) / contentBounds.height) * TOPOLOGY_MINIMAP_HEIGHT;
          const width = Math.max(
            2,
            (node.width / contentBounds.width) * TOPOLOGY_MINIMAP_WIDTH
          );
          const height = Math.max(
            2,
            (node.height / contentBounds.height) * TOPOLOGY_MINIMAP_HEIGHT
          );
          return (
            <rect
              key={node.id}
              className={minimapNodeClass(node.nodeKind, selectedSet.has(node.id))}
              x={x}
              y={y}
              width={width}
              height={height}
              rx={1}
            />
          );
        })}
        <rect
          className="ocs-pf-topo-minimap__viewport"
          x={viewport.x * TOPOLOGY_MINIMAP_WIDTH}
          y={viewport.y * TOPOLOGY_MINIMAP_HEIGHT}
          width={Math.max(8, viewport.width * TOPOLOGY_MINIMAP_WIDTH)}
          height={Math.max(8, viewport.height * TOPOLOGY_MINIMAP_HEIGHT)}
          rx={2}
        />
      </svg>
    </div>
  );
}
