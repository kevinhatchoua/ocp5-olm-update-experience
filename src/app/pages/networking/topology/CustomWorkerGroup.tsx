import { useSyncExternalStore } from "react";
import {
  DefaultGroup,
  LabelPosition,
  observer,
  withContextMenu,
  withDragNode,
  withSelection,
  type Node,
  type WithContextMenuProps,
  type WithDragNodeProps,
  type WithSelectionProps,
} from "@patternfly/react-topology";
import { WORKER_BADGE, WORKER_BADGE_COLOR, WORKER_BADGE_TEXT } from "./topologyBadges";
import { getPathHighlightIds, subscribePathHighlight } from "./topologyActionHandlers";
import { buildNodeContextMenu } from "./topologyContextMenu";
import { isWorkerGroupNodeData, type NetworkTopologyNodeData } from "./topologyNodeData";

type GroupInnerProps = {
  element: Node;
} & WithSelectionProps &
  Partial<WithDragNodeProps> &
  Partial<WithContextMenuProps>;

const WorkerGroupInner = observer(
  ({ element, onSelect, selected, dragNodeRef, onContextMenu, contextMenuOpen }: GroupInnerProps) => {
    const data = element.getData() as NetworkTopologyNodeData | undefined;
    const group = isWorkerGroupNodeData(data) ? data.group : undefined;
    const pathHighlighted = useSyncExternalStore(
      subscribePathHighlight,
      () => getPathHighlightIds().has(element.getId()),
      () => false
    );

    return (
      <DefaultGroup
        element={element}
        onSelect={onSelect}
        selected={selected}
        dragNodeRef={dragNodeRef}
        onContextMenu={onContextMenu}
        contextMenuOpen={contextMenuOpen}
        className={`ocs-pf-topo-worker-group ocs-pf-topo-hull${
          pathHighlighted ? " ocs-pf-topo-path-highlight" : ""
        }`}
        label={group?.shortName ?? element.getLabel()}
        badge={WORKER_BADGE}
        badgeColor={WORKER_BADGE_COLOR}
        badgeTextColor={WORKER_BADGE_TEXT}
        badgeBorderColor={WORKER_BADGE_COLOR}
        labelPosition={LabelPosition.top}
        collapsible={false}
        showLabel
        truncateLength={28}
      />
    );
  }
);

export const CustomWorkerGroup = withContextMenu(buildNodeContextMenu)(
  withDragNode()(withSelection()(WorkerGroupInner))
);
