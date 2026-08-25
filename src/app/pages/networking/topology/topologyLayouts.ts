/** Named canvas layouts — labels follow OVTools / cytoscape / yFiles conventions. */
export const TOPOLOGY_LAYOUTS = [
  {
    id: "DagreLR",
    label: "Hierarchical",
    description: "Compact left-to-right layers ranked by connections.",
  },
  {
    id: "DagreTB",
    label: "Tree",
    description: "Compact top-down hierarchy, similar to OVTools Tree.",
  },
  {
    id: "ColaGroups",
    label: "Organic",
    description: "Force-directed clusters that keep worker groups together.",
  },
  {
    id: "GroupsGrid",
    label: "Grid",
    description: "Resources in a grid inside each group; groups packed in rows.",
  },
  {
    id: "Concentric",
    label: "Radial",
    description: "Rings ordered by how connected each resource is.",
  },
  {
    id: "Force",
    label: "Force-directed",
    description: "Physics layout: related nodes pull together.",
  },
] as const;

export type TopologyLayoutId = (typeof TOPOLOGY_LAYOUTS)[number]["id"];

export const DEFAULT_TOPOLOGY_LAYOUT: TopologyLayoutId = "DagreLR";

export function isTopologyLayoutId(value: string): value is TopologyLayoutId {
  return TOPOLOGY_LAYOUTS.some((layout) => layout.id === value);
}
