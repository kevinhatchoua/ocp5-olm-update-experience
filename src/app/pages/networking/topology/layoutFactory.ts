import {
  ColaGroupsLayout,
  ConcentricLayout,
  DagreLayout,
  ForceLayout,
  type Graph,
  type Layout,
  type LayoutFactory,
} from "@patternfly/react-topology";
import { GroupsGridLayout } from "./GroupsGridLayout";

/** Compact dagre spacing so Hierarchical (LR) and Tree (TB) stay scannable at scale. */
const DAGRE_COMPACT = {
  layoutOnDrag: false,
  ranker: "tight-tree" as const,
  edgesep: 16,
  marginx: 24,
  marginy: 24,
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
        ranksep: 56,
        nodesep: 40,
      });
    case "ColaGroups":
      return new ColaGroupsLayout(graph, {
        layoutOnDrag: false,
        maxTicks: 400,
        linkDistance: 72,
        nodeDistance: 48,
        groupDistance: 80,
      });
    case "GroupsGrid":
      return new GroupsGridLayout(graph, { layoutOnDrag: false });
    case "Concentric":
      return new ConcentricLayout(graph, {
        layoutOnDrag: false,
        nodeDistance: 56,
        splitLevel: 4,
      });
    case "Force":
      return new ForceLayout(graph, {
        layoutOnDrag: false,
        linkDistance: 80,
        nodeDistance: 52,
        chargeStrength: -80,
      });
    case "DagreLR":
    default:
      return new DagreLayout(graph, {
        ...DAGRE_COMPACT,
        rankdir: "LR",
        ranksep: 48,
        nodesep: 44,
      });
  }
};
