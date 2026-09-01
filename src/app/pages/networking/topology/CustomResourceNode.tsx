import React, { useSyncExternalStore } from "react";
import {
  BadgeLocation,
  CREATE_CONNECTOR_DROP_TYPE,
  DefaultNode,
  GraphComponent,
  isNode,
  nodeDropTargetSpec,
  observer,
  withContextMenu,
  withCreateConnector,
  withDndDrop,
  withDragNode,
  withPanZoom,
  withSelection,
  type Graph,
  type Node,
  type WithContextMenuProps,
  type WithCreateConnectorProps,
  type WithDndDropProps,
  type WithDragNodeProps,
  type WithSelectionProps,
} from "@patternfly/react-topology";
import { RESOURCE_INSTALL_STATUS_LABELS, RESOURCE_KIND_LABELS } from "../networkTopologyData";
import { onTopologyCreateConnector } from "./createTopologyConnection";
import { KIND_TOKEN_CLASS, STATUS_TOKEN_CLASS } from "./statusMap";
import {
  KIND_BADGE,
  KIND_BADGE_COLOR,
  KIND_BADGE_TEXT,
  TYPE_BADGE_BORDER,
  TYPE_BADGE_COLOR,
  TYPE_BADGE_TEXT,
} from "./topologyBadges";
import { TopologyKindIcon } from "./topologyKindIcons";
import { nodeShapeClass } from "./topologyNodeShapes";
import {
  getPathHighlightIds,
  subscribePathHighlight,
} from "./topologyActionHandlers";
import { buildNodeContextMenu } from "./topologyContextMenu";
import {
  isLogicalNetworkNodeData,
  isResourceNodeData,
  isWorkloadNodeData,
  type NetworkTopologyNodeData,
  type ResourceNodeData,
} from "./topologyNodeData";

const NODE_ICON = 26;

function usePathHighlightClass(id: string): string {
  const highlighted = useSyncExternalStore(
    subscribePathHighlight,
    () => getPathHighlightIds().has(id),
    () => false
  );
  return highlighted ? " ocs-pf-topo-path-highlight" : "";
}

function resourceTooltip(data: ResourceNodeData): string {
  const related = (data.resource.related ?? []).slice(0, 3);
  const lines = [
    data.resource.label,
    `Kind: ${RESOURCE_KIND_LABELS[data.kind]}`,
    `Status: ${RESOURCE_INSTALL_STATUS_LABELS[data.status]}`,
    `Worker: ${data.groupShortName}`,
  ];
  if (related.length > 0) {
    lines.push(`Connected to: ${related.join(", ")}`);
  }
  return lines.join("\n");
}

function KindIcon({ kind }: { kind: string }) {
  return <TopologyKindIcon kind={kind} size={NODE_ICON} />;
}

function resourceShapeModifier(element: Node): string {
  return nodeShapeClass(element.getNodeShape());
}

type NodeInnerProps = {
  element: Node;
} & WithSelectionProps &
  Partial<WithDragNodeProps> &
  Partial<WithContextMenuProps> &
  Partial<WithDndDropProps> &
  Partial<WithCreateConnectorProps> & {
    canDrop?: boolean;
    dropTarget?: boolean;
    edgeDragging?: boolean;
  };

const ResourceNodeInner = observer(
  ({
    element,
    onSelect,
    selected,
    dragNodeRef,
    onContextMenu,
    contextMenuOpen,
    dndDropRef,
    canDrop,
    dropTarget,
    edgeDragging,
    onShowCreateConnector,
    onHideCreateConnector,
  }: NodeInnerProps) => {
    const data = element.getData() as NetworkTopologyNodeData | undefined;
    const pathClass = usePathHighlightClass(element.getId());

    if (isWorkloadNodeData(data)) {
      const size = element.getBounds().width;
      const iconOffset = Math.max(0, (size - NODE_ICON) / 2);
      const badge = data.attachment.kind === "vm" ? "VM" : "POD";
      const tip = [
        data.attachment.label,
        `Kind: ${data.attachment.kind === "vm" ? "VirtualMachine" : "Pod"}`,
        `Status: ${data.attachment.status}`,
        `Network: ${data.attachment.networkLabel}`,
      ].join("\n");
      return (
        <DefaultNode
          element={element}
          onSelect={onSelect}
          selected={selected}
          dragNodeRef={dragNodeRef}
          dndDropRef={dndDropRef}
          canDrop={canDrop}
          dropTarget={dropTarget}
          edgeDragging={edgeDragging}
          onShowCreateConnector={onShowCreateConnector}
          onHideCreateConnector={onHideCreateConnector}
          onContextMenu={onContextMenu}
          contextMenuOpen={contextMenuOpen}
          badge={badge}
          badgeColor={TYPE_BADGE_COLOR}
          badgeTextColor={TYPE_BADGE_TEXT}
          badgeBorderColor={TYPE_BADGE_BORDER}
          badgeLocation={BadgeLocation.inner}
          secondaryLabel={data.attachment.namespace}
          className={`ocs-pf-topo-node ${resourceShapeModifier(element)} ocs-pf-topo-node--workload${pathClass}`}
          truncateLength={18}
        >
          <title>{tip}</title>
          <g transform={`translate(${iconOffset}, ${iconOffset})`} className="ocs-pf-topo-node__icon">
            <KindIcon kind={data.attachment.kind} />
          </g>
        </DefaultNode>
      );
    }

    if (!isResourceNodeData(data)) {
      return (
        <DefaultNode
          element={element}
          onSelect={onSelect}
          selected={selected}
          dragNodeRef={dragNodeRef}
          dndDropRef={dndDropRef}
          canDrop={canDrop}
          dropTarget={dropTarget}
          edgeDragging={edgeDragging}
          onShowCreateConnector={onShowCreateConnector}
          onHideCreateConnector={onHideCreateConnector}
          onContextMenu={onContextMenu}
          contextMenuOpen={contextMenuOpen}
          className={pathClass.trim() || undefined}
        />
      );
    }

    const kindClass = KIND_TOKEN_CLASS[data.kind];
    const statusClass = STATUS_TOKEN_CLASS[data.status];
    const size = element.getBounds().width;
    const iconOffset = Math.max(0, (size - NODE_ICON) / 2);

    return (
      <DefaultNode
        element={element}
        onSelect={onSelect}
        selected={selected}
        dragNodeRef={dragNodeRef}
        dndDropRef={dndDropRef}
        canDrop={canDrop}
        dropTarget={dropTarget}
        edgeDragging={edgeDragging}
        onShowCreateConnector={onShowCreateConnector}
        onHideCreateConnector={onHideCreateConnector}
        onContextMenu={onContextMenu}
        contextMenuOpen={contextMenuOpen}
        showStatusDecorator
        statusDecoratorTooltip={RESOURCE_INSTALL_STATUS_LABELS[data.status]}
        onStatusDecoratorClick={(event) => onSelect?.(event)}
        badge={KIND_BADGE[data.kind]}
        badgeColor={KIND_BADGE_COLOR[data.kind]}
        badgeTextColor={KIND_BADGE_TEXT[data.kind]}
        badgeBorderColor={KIND_BADGE_COLOR[data.kind]}
        badgeLocation={BadgeLocation.inner}
        className={`ocs-pf-topo-node ${resourceShapeModifier(element)} ${kindClass} ${statusClass}${pathClass}`}
        truncateLength={18}
      >
        <title>{resourceTooltip(data)}</title>
        <g transform={`translate(${iconOffset}, ${iconOffset})`} className="ocs-pf-topo-node__icon">
          <KindIcon kind={data.kind} />
        </g>
      </DefaultNode>
    );
  }
);

const LogicalNodeInner = observer(
  ({
    element,
    onSelect,
    selected,
    dragNodeRef,
    onContextMenu,
    contextMenuOpen,
    dndDropRef,
    canDrop,
    dropTarget,
    edgeDragging,
    onShowCreateConnector,
    onHideCreateConnector,
  }: NodeInnerProps) => {
    const data = element.getData() as NetworkTopologyNodeData | undefined;
    const pathClass = usePathHighlightClass(element.getId());
    if (!isLogicalNetworkNodeData(data)) {
      return (
        <DefaultNode
          element={element}
          onSelect={onSelect}
          selected={selected}
          dragNodeRef={dragNodeRef}
          dndDropRef={dndDropRef}
          canDrop={canDrop}
          dropTarget={dropTarget}
          edgeDragging={edgeDragging}
          onShowCreateConnector={onShowCreateConnector}
          onHideCreateConnector={onHideCreateConnector}
          onContextMenu={onContextMenu}
          contextMenuOpen={contextMenuOpen}
          className={pathClass.trim() || undefined}
        />
      );
    }

    const kindClass = KIND_TOKEN_CLASS[data.kind];
    const statusClass = STATUS_TOKEN_CLASS[data.status];
    const size = element.getBounds().width;
    const iconOffset = Math.max(0, (size - NODE_ICON) / 2);
    const secondary = data.topologyMode ?? undefined;
    const tip = [
      data.resource.label,
      `Kind: ${RESOURCE_KIND_LABELS[data.kind]}`,
      `Status: ${RESOURCE_INSTALL_STATUS_LABELS[data.status]}`,
      data.topologyMode ? `Mode: ${data.topologyMode}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return (
      <DefaultNode
        element={element}
        onSelect={onSelect}
        selected={selected}
        dragNodeRef={dragNodeRef}
        dndDropRef={dndDropRef}
        canDrop={canDrop}
        dropTarget={dropTarget}
        edgeDragging={edgeDragging}
        onShowCreateConnector={onShowCreateConnector}
        onHideCreateConnector={onHideCreateConnector}
        onContextMenu={onContextMenu}
        contextMenuOpen={contextMenuOpen}
        showStatusDecorator
        statusDecoratorTooltip={RESOURCE_INSTALL_STATUS_LABELS[data.status]}
        onStatusDecoratorClick={(event) => onSelect?.(event)}
        badge={KIND_BADGE[data.kind]}
        badgeColor={KIND_BADGE_COLOR[data.kind]}
        badgeTextColor={KIND_BADGE_TEXT[data.kind]}
        badgeBorderColor={KIND_BADGE_COLOR[data.kind]}
        badgeLocation={BadgeLocation.inner}
        secondaryLabel={secondary}
        className={`ocs-pf-topo-node ${resourceShapeModifier(element)} ocs-pf-topo-node--logical ${kindClass} ${statusClass}${pathClass}`}
        truncateLength={22}
      >
        <title>{tip}</title>
        <g transform={`translate(${iconOffset}, ${iconOffset})`} className="ocs-pf-topo-node__icon">
          <KindIcon kind={data.kind} />
        </g>
      </DefaultNode>
    );
  }
);

const handleCreateConnector = (source: Node, target: Node | Graph) => {
  if (!isNode(target)) return;
  onTopologyCreateConnector(source, target);
};

const withNodeBehaviors = (Component: React.ComponentType<NodeInnerProps>) => {
  const selected = withSelection()(Component);
  const draggable = withDragNode()(selected);
  const withMenu = withContextMenu(buildNodeContextMenu)(draggable);
  const droppable = withDndDrop(nodeDropTargetSpec([CREATE_CONNECTOR_DROP_TYPE]))(
    withMenu as never
  );
  return withCreateConnector(handleCreateConnector)(droppable as never);
};

export const CustomResourceNode = withNodeBehaviors(ResourceNodeInner);
export const CustomLogicalNode = withNodeBehaviors(LogicalNodeInner);

export { GraphComponent };
export const PanZoomGraph = withPanZoom()(GraphComponent);
