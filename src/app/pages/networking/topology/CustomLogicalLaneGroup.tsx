import {
  DefaultGroup,
  LabelPosition,
  observer,
  withContextMenu,
  withSelection,
  type Node,
  type WithContextMenuProps,
  type WithSelectionProps,
} from "@patternfly/react-topology";
import { LANE_BADGE, LANE_BADGE_COLOR, LANE_BADGE_TEXT } from "./topologyBadges";
import { buildNodeContextMenu } from "./topologyContextMenu";

type LaneInnerProps = {
  element: Node;
} & WithSelectionProps &
  Partial<WithContextMenuProps>;

const LogicalLaneInner = observer(
  ({ element, onSelect, selected, onContextMenu, contextMenuOpen }: LaneInnerProps) => (
    <DefaultGroup
      element={element}
      onSelect={onSelect}
      selected={selected}
      onContextMenu={onContextMenu}
      contextMenuOpen={contextMenuOpen}
      className="ocs-pf-topo-logical-lane ocs-pf-topo-hull"
      label="Logical networks"
      badge={LANE_BADGE}
      badgeColor={LANE_BADGE_COLOR}
      badgeTextColor={LANE_BADGE_TEXT}
      badgeBorderColor={LANE_BADGE_COLOR}
      labelPosition={LabelPosition.top}
      collapsible={false}
      showLabel
      truncateLength={40}
    />
  )
);

export const CustomLogicalLaneGroup = withContextMenu(buildNodeContextMenu)(
  withSelection()(LogicalLaneInner)
);
