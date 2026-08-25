import {
  BaseLayout,
  GRAPH_LAYOUT_END_EVENT,
  Point,
  getGroupChildrenDimensions,
  type Graph,
} from "@patternfly/react-topology";

const INNER_GAP = 36;
const GROUP_GAP = 72;
const ORIGIN = 48;

/** Pack each worker group as a small grid, then tile groups in rows. */
export class GroupsGridLayout extends BaseLayout {
  startLayout(graph: Graph, initialRun: boolean, addingNodes: boolean) {
    if (!initialRun && !addingNodes) {
      graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph });
      return;
    }

    this.groups.forEach((group) => {
      const leaves = group.leaves ?? [];
      const cols = Math.max(2, Math.ceil(Math.sqrt(Math.max(leaves.length, 1))));
      leaves.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        node.x = col * (Math.max(node.width, 75) + INNER_GAP);
        node.y = row * (Math.max(node.height, 75) + INNER_GAP);
        node.update();
      });
    });

    const groupCols = Math.max(1, Math.ceil(Math.sqrt(Math.max(this.groups.length, 1))));
    let x = ORIGIN;
    let y = ORIGIN;
    let col = 0;
    let rowHeight = 0;

    this.groups.forEach((group) => {
      const dim = getGroupChildrenDimensions(group.element);
      group.element.setDimensions(dim);
      group.element.setPosition(new Point(x, y));
      rowHeight = Math.max(rowHeight, dim.height);
      col += 1;
      if (col >= groupCols) {
        col = 0;
        x = ORIGIN;
        y += rowHeight + GROUP_GAP;
        rowHeight = 0;
      } else {
        x += dim.width + GROUP_GAP;
      }
    });

    const groupedIds = new Set(this.groups.flatMap((group) => (group.leaves ?? []).map((leaf) => leaf.id)));
    const orphans = this.nodes.filter((node) => !groupedIds.has(node.id));
    const orphanY = this.groups.length > 0 ? y + rowHeight + GROUP_GAP : ORIGIN;
    orphans.forEach((node, index) => {
      node.x = ORIGIN + (index % 8) * (Math.max(node.width, 75) + INNER_GAP);
      node.y = orphanY + Math.floor(index / 8) * (Math.max(node.height, 75) + INNER_GAP);
      node.update();
    });

    graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph });
  }
}
