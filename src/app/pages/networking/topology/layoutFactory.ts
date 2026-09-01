import {
  ColaGroupsLayout,
  ConcentricLayout,
  DagreLayout,
  ForceLayout,
  type Graph,
  type Layout,
  type LayoutFactory,
} from "@patternfly/react-topology";
import { ClusterPerspectiveLayout } from "./ClusterPerspectiveLayout";
import { GroupsGridLayout } from "./GroupsGridLayout";

/** Slot/grid layouts: never run force simulation on drag — only explicit graph.layout(). */
const MANUAL_LAYOUT = { layoutOnDrag: false, respectManualPositions: true };

/** Dagre: keep drag off so positioned nodes stay put; dagre runs on full layout only. */
const DAGRE_COMPACT = {
  layoutOnDrag: false,
  ranker: "tight-tree" as const,
  edgesep: 24,
  marginx: 32,
  marginy: 32,
};

export const networkTopologyLayoutFactory: LayoutFactory = (
  type: string,
  graph: Graph
): Layout | undefined => {
  switch (type) {
    case "DagreTB":
      return new DagreLayout(graph, {
        ...DAGRE_COMPACT,
        rankdir: "TB",
        ranksep: 64,
        nodesep: 48,
      });
    case "ColaGroups":
      return new ColaGroupsLayout(graph, {
        ...MANUAL_LAYOUT,
        maxTicks: 400,
        linkDistance: 72,
        nodeDistance: 48,
        groupDistance: 80,
      });
    case "ClusterPerspective":
      return new ClusterPerspectiveLayout(graph, MANUAL_LAYOUT);
    case "GroupsGrid":
      return new GroupsGridLayout(graph, MANUAL_LAYOUT);
    case "Concentric":
      return new ConcentricLayout(graph, {
        ...MANUAL_LAYOUT,
        nodeDistance: 56,
        splitLevel: 4,
      });
    case "Force":
      return new ForceLayout(graph, {
        ...MANUAL_LAYOUT,
        linkDistance: 80,
        nodeDistance: 52,
        chargeStrength: -80,
      });
    case "DagreLR":
    default:
      return new DagreLayout(graph, {
        ...DAGRE_COMPACT,
        rankdir: "LR",
        ranksep: 56,
        nodesep: 52,
      });
  }
};
