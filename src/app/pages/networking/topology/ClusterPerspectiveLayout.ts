import {
  BaseLayout,
  GRAPH_LAYOUT_END_EVENT,
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

const WORKLOAD_GAP = 48;

/**
 * Pack each group's children at that group's target origin. Packing everyone at 0,0
 * then moving the hull leaves resources stacked when group.setPosition is a no-op
 * (shared center after BaseLayout.initializeNodePositions).
 */
export class ClusterPerspectiveLayout extends BaseLayout {
  startLayout(graph: Graph, _initialRun: boolean, _addingNodes: boolean) {
    let maxWorkerBottom = LOGICAL_NETWORK_Y;

    const placeGroup = (group: (typeof this.groups)[number], x: number, y: number) => {
      layoutGroupChildren(group.id, group.leaves ?? [], layoutModeForGroup(group.id), false, x, y);
      group.element.setDimensions(getGroupChildrenDimensions(group.element));
      const dim = group.element.getDimensions();
      maxWorkerBottom = Math.max(maxWorkerBottom, y + dim.height);
    };

    const logicalLane = this.groups.find((group) => group.id === LOGICAL_LANE_ID);
    if (logicalLane) {
      placeGroup(logicalLane, BASE_X, LOGICAL_NETWORK_Y);
    }

    this.groups
      .filter((group) => group.id !== LOGICAL_LANE_ID && group.id !== WORKLOAD_LANE_ID)
      .forEach((group) => {
        const data = group.element.getData();
        const workerGroup = isWorkerGroupNodeData(data) ? data.group : undefined;
        const x = workerGroup?.x ?? BASE_X;
        const y = workerGroup?.y ?? maxWorkerBottom + GROUP_GAP;
        placeGroup(group, x, y);
      });

    const workloadLane = this.groups.find((group) => group.id === WORKLOAD_LANE_ID);
    if (workloadLane) {
      placeGroup(workloadLane, BASE_X, maxWorkerBottom + GROUP_GAP);
    }

    const groupedIds = new Set(this.groups.flatMap((group) => (group.leaves ?? []).map((leaf) => leaf.id)));
    const orphans = this.nodes.filter((node) => !groupedIds.has(node.id));
    orphans.forEach((node, index) => {
      node.x = BASE_X + (index % 8) * (Math.max(node.width, 75) + WORKLOAD_GAP);
      node.y = maxWorkerBottom + GROUP_GAP + Math.floor(index / 8) * (Math.max(node.height, 75) + WORKLOAD_GAP);
      node.update();
    });

    graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph });
  }
}
