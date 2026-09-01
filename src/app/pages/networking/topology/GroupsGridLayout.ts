import {
  BaseLayout,
  GRAPH_LAYOUT_END_EVENT,
  Point,
  getGroupChildrenDimensions,
  type Graph,
} from "@patternfly/react-topology";
import { GROUP_W, GROUP_GAP, GROUP_H } from "../networkTopologyData";
import { layoutGroupChildren, layoutModeForGroup } from "./topologyGroupLayout";
import { graphHasManualPositions, shouldPreserveGroupPosition, shouldRepositionGroup } from "./topologyLayoutUtils";

const ORIGIN = 48;
const GROUP_TILE_GAP = 96;
const MAX_GROUP_COLS = 6;

/** Pack each worker group on a fixed slot grid, then tile groups in rows. */
export class GroupsGridLayout extends BaseLayout {
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

    const groupCols = Math.min(MAX_GROUP_COLS, Math.max(1, Math.ceil(Math.sqrt(Math.max(this.groups.length, 1)))));
    let x = ORIGIN;
    let y = ORIGIN;
    let col = 0;
    let rowHeight = 0;

    this.groups.forEach((group) => {
      const dim = getGroupChildrenDimensions(group.element);
      const tileWidth = Math.max(dim.width, GROUP_W);
      const tileHeight = Math.max(dim.height, GROUP_H);
      if (dim.width !== tileWidth || dim.height !== tileHeight) {
        dim.width = tileWidth;
        dim.height = tileHeight;
      }
      group.element.setDimensions(dim);
      if (shouldRepositionGroup(group.element, hasManualPositions, freezeGroupLayout)) {
        group.element.setPosition(new Point(x, y));
      }
      const pos = group.element.getPosition();
      rowHeight = Math.max(rowHeight, tileHeight);
      col += 1;
      if (col >= groupCols) {
        col = 0;
        x = ORIGIN;
        y = pos.y + tileHeight + GROUP_TILE_GAP;
        rowHeight = 0;
      } else {
        x = pos.x + tileWidth + GROUP_TILE_GAP;
      }
    });

    const groupedIds = new Set(this.groups.flatMap((group) => (group.leaves ?? []).map((leaf) => leaf.id)));
    const orphans = this.nodes.filter((node) => !groupedIds.has(node.id));
    const orphanY = this.groups.length > 0 ? y + rowHeight + GROUP_TILE_GAP : ORIGIN;
    orphans.forEach((node, index) => {
      if (hasManualPositions && node.element.isPositioned()) return;
      node.x = ORIGIN + (index % 8) * (Math.max(node.width, 75) + GROUP_GAP);
      node.y = orphanY + Math.floor(index / 8) * (Math.max(node.height, 75) + GROUP_GAP);
      node.update();
    });

    graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph });
  }
}
