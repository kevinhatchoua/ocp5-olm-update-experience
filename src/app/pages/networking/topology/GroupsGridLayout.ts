import {
  BaseLayout,
  GRAPH_LAYOUT_END_EVENT,
  getGroupChildrenDimensions,
  type Graph,
} from "@patternfly/react-topology";
import { GROUP_W, GROUP_GAP, GROUP_H } from "../networkTopologyData";
import { layoutGroupChildren, layoutModeForGroup } from "./topologyGroupLayout";

const ORIGIN = 48;
const GROUP_TILE_GAP = 96;
const MAX_GROUP_COLS = 6;

/**
 * Pack each group's children at that group's tile origin so resources are not
 * stacked on the same slots before the hull is moved.
 */
export class GroupsGridLayout extends BaseLayout {
  startLayout(graph: Graph, _initialRun: boolean, _addingNodes: boolean) {
    const groupCols = Math.min(MAX_GROUP_COLS, Math.max(1, Math.ceil(Math.sqrt(Math.max(this.groups.length, 1)))));
    let x = ORIGIN;
    let y = ORIGIN;
    let col = 0;
    let rowHeight = 0;

    this.groups.forEach((group) => {
      layoutGroupChildren(group.id, group.leaves ?? [], layoutModeForGroup(group.id), false, x, y);
      const dim = getGroupChildrenDimensions(group.element);
      const tileWidth = Math.max(dim.width, GROUP_W);
      const tileHeight = Math.max(dim.height, GROUP_H);
      group.element.setDimensions(dim);
      rowHeight = Math.max(rowHeight, tileHeight);
      col += 1;
      if (col >= groupCols) {
        col = 0;
        x = ORIGIN;
        y += tileHeight + GROUP_TILE_GAP;
        rowHeight = 0;
      } else {
        x += tileWidth + GROUP_TILE_GAP;
      }
    });

    const groupedIds = new Set(this.groups.flatMap((group) => (group.leaves ?? []).map((leaf) => leaf.id)));
    const orphans = this.nodes.filter((node) => !groupedIds.has(node.id));
    const orphanY = this.groups.length > 0 ? y + rowHeight + GROUP_TILE_GAP : ORIGIN;
    orphans.forEach((node, index) => {
      node.x = ORIGIN + (index % 8) * (Math.max(node.width, 75) + GROUP_GAP);
      node.y = orphanY + Math.floor(index / 8) * (Math.max(node.height, 75) + GROUP_GAP);
      node.update();
    });

    graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph });
  }
}
