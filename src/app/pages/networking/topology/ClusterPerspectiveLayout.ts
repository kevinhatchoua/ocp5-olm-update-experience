import {
  BaseLayout,
  GRAPH_LAYOUT_END_EVENT,
  Point,
  getGroupChildrenDimensions,
  type Graph,
} from "@patternfly/react-topology";
import {
  BASE_X,
  GROUP_GAP,
  LOGICAL_NETWORK_Y,
} from "../networkTopologyData";
import { LOGICAL_LANE_ID, WORKLOAD_LANE_ID, isWorkerGroupNodeData } from "./topologyNodeData";
import { layoutGroupChildren, layoutModeForGroup } from "./topologyGroupLayout";
import { graphHasManualPositions, shouldPreserveGroupPosition, shouldRepositionGroup } from "./topologyLayoutUtils";

const WORKLOAD_GAP = 48;

/** Positions logical / workload lanes and worker hulls using prototype grid coordinates. */
export class ClusterPerspectiveLayout extends BaseLayout {
  startLayout(graph: Graph, _initialRun: boolean, _addingNodes: boolean) {
    const hasManualPositions = graphHasManualPositions(graph);
    const freezeGroupLayout = hasManualPositions;

    this.groups.forEach((group) => {
      const leaves = (group.leaves ?? []).map((leaf) => ({
        ...leaf,
        element: leaf.element,
      }));
      if (!shouldPreserveGroupPosition(group.element, hasManualPositions)) {
        layoutGroupChildren(group.id, leaves, layoutModeForGroup(group.id), hasManualPositions);
      }
      const dim = getGroupChildrenDimensions(group.element);
      group.element.setDimensions(dim);
    });

    let maxWorkerBottom = LOGICAL_NETWORK_Y;

    const logicalLane = this.groups.find((group) => group.id === LOGICAL_LANE_ID);
    if (logicalLane) {
      if (shouldRepositionGroup(logicalLane.element, hasManualPositions, freezeGroupLayout)) {
        logicalLane.element.setPosition(new Point(BASE_X, LOGICAL_NETWORK_Y));
      }
      const pos = logicalLane.element.getPosition();
      const dim = logicalLane.element.getDimensions();
      maxWorkerBottom = Math.max(maxWorkerBottom, pos.y + dim.height);
    }

    this.groups
      .filter((group) => group.id !== LOGICAL_LANE_ID && group.id !== WORKLOAD_LANE_ID)
      .forEach((group) => {
        if (shouldRepositionGroup(group.element, hasManualPositions, freezeGroupLayout)) {
          const data = group.element.getData();
          const workerGroup = isWorkerGroupNodeData(data) ? data.group : undefined;
          const x = workerGroup?.x ?? BASE_X;
          const y = workerGroup?.y ?? maxWorkerBottom + GROUP_GAP;
          group.element.setPosition(new Point(x, y));
        }
        const pos = group.element.getPosition();
        const dim = group.element.getDimensions();
        maxWorkerBottom = Math.max(maxWorkerBottom, pos.y + dim.height);
      });

    const workloadLane = this.groups.find((group) => group.id === WORKLOAD_LANE_ID);
    if (workloadLane) {
      if (shouldRepositionGroup(workloadLane.element, hasManualPositions, freezeGroupLayout)) {
        workloadLane.element.setPosition(new Point(BASE_X, maxWorkerBottom + GROUP_GAP));
      }
      const dim = workloadLane.element.getDimensions();
      maxWorkerBottom = workloadLane.element.getPosition().y + dim.height;
    }

    const groupedIds = new Set(this.groups.flatMap((group) => (group.leaves ?? []).map((leaf) => leaf.id)));
    const orphans = this.nodes.filter((node) => !groupedIds.has(node.id));
    orphans.forEach((node, index) => {
      if (hasManualPositions && node.element.isPositioned()) return;
      node.x = BASE_X + (index % 8) * (Math.max(node.width, 75) + WORKLOAD_GAP);
      node.y = maxWorkerBottom + GROUP_GAP + Math.floor(index / 8) * (Math.max(node.height, 75) + WORKLOAD_GAP);
      node.update();
    });

    graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph });
  }
}
