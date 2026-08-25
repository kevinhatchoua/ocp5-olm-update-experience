import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Label,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Switch,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { InnerScrollContainer, Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import ShareAltIcon from "@patternfly/react-icons/dist/esm/icons/share-alt-icon";
import ProjectDiagramIcon from "@patternfly/react-icons/dist/esm/icons/project-diagram-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon";
import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import NetworkWiredIcon from "@patternfly/react-icons/dist/esm/icons/network-wired-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import UndoIcon from "@patternfly/react-icons/dist/esm/icons/undo-icon";
import ZoomInIcon from "@patternfly/react-icons/dist/esm/icons/search-plus-icon";
import ZoomOutIcon from "@patternfly/react-icons/dist/esm/icons/search-minus-icon";
import {
  BASE_X,
  BASE_Y,
  GROUP_GAP,
  GROUP_H,
  GROUP_W,
  LOGICAL_NETWORK_Y,
  NNC_PROFILE_OPTIONS,
  RESOURCE_COL_GAP,
  RESOURCE_GRID_ORIGIN_X,
  RESOURCE_GRID_ORIGIN_Y,
  RESOURCE_CELL_H,
  RESOURCE_CELL_W,
  RESOURCE_H,
  RESOURCE_INSTALL_STATUS_COLORS,
  RESOURCE_INSTALL_STATUS_LABELS,
  RESOURCE_KIND_COLORS,
  RESOURCE_KIND_LABELS,
  RESOURCE_ROW_GAP,
  RESOURCE_W,
  WORKER_NODE_GROUPS,
  TOPOLOGY_WORKER_CATALOG,
  computeLogicalLaneLayout,
  effectiveLogicalCanvasY,
  isLogicalNetworkStandalone,
  isBridgeNetworkResource,
  logicalNodeAreaTop,
  networkResourceAssignmentKey,
  LOGICAL_LANE_PADDING_X,
  LOGICAL_TO_WORKER_GAP,
  type LogicalLaneLayout,
  visibleTopologyGroupIds,
  workerGroupBaseY,
  type NetResource,
  type NetResourceKind,
  type NetworkNodeAssignments,
  type NncProfile,
  type ResourceInstallStatus,
  type StandaloneTopologyResource,
  type TopologyCrossEdge,
  type TopologyEdge,
  type TopologyWorkerCatalogEntry,
  type WorkerNodeGroup,
} from "./networkTopologyData";
import type { TopologyStep } from "./networkTopologyTypes";
import NetworkNamespacePropagationTab from "./NetworkNamespacePropagationTab";
import NetworkTopologyCreatePanel, { type NetworkTopologyNncWizardProps } from "./NetworkTopologyCreatePanel";
import PhysicalUnderlayChain from "./PhysicalUnderlayChain";
import TopologyResizableSplit from "./TopologyResizableSplit";
import { buildNncpLineageConnections, resolveNncpLineageForBridge } from "./topologyNncpLineage";
import {
  hasActivePath,
  isCrossEdgeOnPath,
  isGroupOnPath,
  isInternalEdgeOnPath,
  isResourceOnPath,
  resolveTopologyPathHighlight,
} from "./topologyPathHighlight";
import {
  applyGridLayoutToGroupPositions,
  applyStructuredGridToAllGroups,
  applyStructuredGridToGroup,
  readTopologyLayoutMode,
  resourceSuffixFromId,
  separateOverlappingWorkerGroups,
  workerGroupGridPosition,
  writeTopologyLayoutMode,
  type CanvasLayoutMode,
} from "./topologyCanvasLayout";
import { computeGroupHullPath, HULL_RADIAL_PADDING, RESOURCE_VISUAL_BLEED } from "./topologyGroupHull";
import { NetworkResourceCreateDropdown, type NetworkCreateResource } from "./networkingCreateModals";
import NodeNetworkTableList, { type TableResourceConnection } from "./NodeNetworkTableList";
import TopologyResourceActionsMenu from "./TopologyResourceActionsMenu";
import TopologyViewToggle from "./TopologyViewToggle";
import type { NodeNetworkViewMode } from "./nodeNetworkViewMode";
import type { NadRecord, NncpRecord, UdnRecord } from "./networkingMockData";
import type {
  ResourceLifecycleAction,
  ResourceLifecycleTarget,
} from "./networkTopologyState";

export type { TopologyStep };

type SelectedResource =
  | (NetResource & { group: WorkerNodeGroup; placement: "group" })
  | (StandaloneTopologyResource & { placement: "standalone" });

type TopologySelection =
  | { type: "resource"; resource: SelectedResource }
  | { type: "workerGroup"; group: WorkerNodeGroup };

type CanvasEdgeSelection =
  | { scope: "group"; groupId: string; edgeId: string; from: string; to: string }
  | { scope: "cross"; edgeId: string; fromStandaloneId: string; toGroupId: string; toResourceId: string }
  | { scope: "standalone"; edgeId: string; from: string; to: string };

type AssignedWorkerRow = {
  id: string;
  shortName: string;
  hostname: string;
};

function selectedResourceFrom(selection: TopologySelection | null): SelectedResource | null {
  return selection?.type === "resource" ? selection.resource : null;
}

type TopologyHit =
  | { kind: "group"; group: WorkerNodeGroup; resource: NetResource; groupPos: { x: number; y: number } }
  | { kind: "standalone"; standalone: StandaloneTopologyResource };

type LinkDragState = {
  scope: "group" | "standalone";
  groupId?: string;
  resourceId: string;
  start: { x: number; y: number };
  current: { x: number; y: number };
};
type PositionMap = Record<string, { x: number; y: number }>;
type EdgeMap = Record<string, TopologyEdge[]>;
type ResourceFilterValue = NetResourceKind | "all";

const RESOURCE_FILTER_KINDS = Object.keys(RESOURCE_KIND_LABELS) as NetResourceKind[];

function standaloneCanvasRect(resource: StandaloneTopologyResource) {
  if (isLogicalNetworkStandalone(resource)) {
    const y = effectiveLogicalCanvasY(resource);
    return { x: resource.canvasX, y, w: RESOURCE_W, h: RESOURCE_H };
  }
  return { x: resource.canvasX, y: resource.canvasY, w: RESOURCE_W, h: RESOURCE_H };
}

function logicalNodeDisplayPosition(resource: StandaloneTopologyResource, lane: LogicalLaneLayout) {
  const y = effectiveLogicalCanvasY(resource);
  const nodeAreaTop = logicalNodeAreaTop(lane.top);
  return {
    left: resource.canvasX - lane.left - LOGICAL_LANE_PADDING_X,
    top: y - nodeAreaTop,
  };
}

function standaloneCanvasCenter(resource: StandaloneTopologyResource) {
  const rect = standaloneCanvasRect(resource);
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function countResourcesByKind(
  groups: WorkerNodeGroup[],
  standalones: StandaloneTopologyResource[]
): Record<ResourceFilterValue, number> {
  const counts: Record<ResourceFilterValue, number> = {
    all: 0,
    bridge: 0,
    interface: 0,
    tunnel: 0,
    port: 0,
    cudn: 0,
    udn: 0,
  };
  const bump = (kind: NetResourceKind) => {
    counts[kind] += 1;
    counts.all += 1;
  };
  groups.forEach((group) => group.resources.forEach((resource) => bump(resource.kind)));
  standalones.forEach((resource) => bump(resource.kind));
  return counts;
}

function EdgeDeleteHandle({
  x,
  y,
  visible,
  label,
  onDelete,
}: {
  x: number;
  y: number;
  visible: boolean;
  label: string;
  onDelete: () => void;
}) {
  if (!visible) return null;
  return (
    <g className="ocs-net-topo-edge__delete" transform={`translate(${x}, ${y})`}>
      <circle className="ocs-net-topo-edge__delete-bg" r={11} />
      <foreignObject x={-8} y={-8} width={16} height={16}>
        <button
          type="button"
          className="ocs-net-topo-edge__delete-btn"
          aria-label={label}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <TimesIcon aria-hidden />
        </button>
      </foreignObject>
    </g>
  );
}

function ResourceFilterOption({ label, count }: { label: string; count: number }) {
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      justifyContent={{ default: "justifyContentSpaceBetween" }}
      gap={{ default: "gapMd" }}
      className="ocs-net-topo-panel__filter-option"
    >
      <span>{label}</span>
      <Badge isRead aria-label={`${count} resources`}>
        {count}
      </Badge>
    </Flex>
  );
}

function posKey(groupId: string, resourceId: string) {
  return `${groupId}::${resourceId}`;
}

const GROUP_SURFACE_INSET = HULL_RADIAL_PADDING + RESOURCE_VISUAL_BLEED;
const GROUP_FOOTER_H = 40;
const GROUP_FOOTER_GAP = 14;
const BOTTOM_CANVAS_PAD = 56;
/** Max grid rows used in RESOURCE_SLOT_LAYOUT (includes br-localnet row). */
const RESOURCE_GRID_ROWS = 3;
/** Minimum gap between resource bounding boxes. */
const RESOURCE_GAP = 30;
/** Physical underlay strip rendered above bridge cards. */
const BRIDGE_UNDERLAY_HEIGHT = 36;

type GroupLayout = {
  minX: number;
  minY: number;
  width: number;
  surfaceHeight: number;
  totalHeight: number;
  hullPath: string;
  hullBounds: { minX: number; minY: number; maxX: number; maxY: number };
  footerTop: number;
};

function rectsOverlap(
  a: { x: number; y: number },
  b: { x: number; y: number },
  w: number,
  h: number,
  gap = RESOURCE_GAP
) {
  return a.x < b.x + w + gap && a.x + w + gap > b.x && a.y < b.y + h + gap && a.y + h + gap > b.y;
}

function getPos(positions: PositionMap, groupId: string, resource: NetResource) {
  return positions[posKey(groupId, resource.id)] ?? { x: resource.x, y: resource.y };
}

function groupHasOverlaps(group: WorkerNodeGroup, positions: PositionMap) {
  for (let i = 0; i < group.resources.length; i += 1) {
    for (let j = i + 1; j < group.resources.length; j += 1) {
      const a = group.resources[i];
      const b = group.resources[j];
      const pa = getPos(positions, group.id, a);
      const pb = getPos(positions, group.id, b);
      if (rectsOverlap(pa, pb, RESOURCE_W, RESOURCE_H, 0)) return true;
    }
  }
  return false;
}

/** Iteratively separate every overlapping pair; pinned node stays put when possible. */
function resolveGroupOverlaps(
  group: WorkerNodeGroup,
  positions: PositionMap,
  pinnedId?: string
): PositionMap {
  let next: PositionMap = { ...positions };
  const sepX = RESOURCE_W + RESOURCE_GAP;
  const sepY = RESOURCE_H + RESOURCE_GAP;

  for (let pass = 0; pass < 64; pass += 1) {
    let changed = false;

    for (let i = 0; i < group.resources.length; i += 1) {
      for (let j = i + 1; j < group.resources.length; j += 1) {
        const a = group.resources[i];
        const b = group.resources[j];
        const keyA = posKey(group.id, a.id);
        const keyB = posKey(group.id, b.id);
        let pa = next[keyA] ?? { x: a.x, y: a.y };
        let pb = next[keyB] ?? { x: b.x, y: b.y };

        if (!rectsOverlap(pa, pb, RESOURCE_W, RESOURCE_H, 0)) continue;

        changed = true;
        const dx = pb.x + RESOURCE_W / 2 - (pa.x + RESOURCE_W / 2);
        const dy = pb.y + RESOURCE_H / 2 - (pa.y + RESOURCE_H / 2);
        const overlapX = sepX - Math.abs(dx);
        const overlapY = sepY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX <= overlapY) {
            if (a.id === pinnedId) {
              pb = { ...pb, x: dx >= 0 ? pa.x + sepX : pa.x - sepX };
            } else if (b.id === pinnedId) {
              pa = { ...pa, x: dx >= 0 ? pb.x - sepX : pb.x + sepX };
            } else {
              const push = overlapX / 2 + 1;
              pa = { ...pa, x: dx >= 0 ? pa.x - push : pa.x + push };
              pb = { ...pb, x: dx >= 0 ? pb.x + push : pb.x - push };
            }
          } else if (a.id === pinnedId) {
            pb = { ...pb, y: dy >= 0 ? pa.y + sepY : pa.y - sepY };
          } else if (b.id === pinnedId) {
            pa = { ...pa, y: dy >= 0 ? pb.y - sepY : pb.y + sepY };
          } else {
            const push = overlapY / 2 + 1;
            pa = { ...pa, y: dy >= 0 ? pa.y - push : pa.y + push };
            pb = { ...pb, y: dy >= 0 ? pb.y + push : pb.y - push };
          }
        }

        pa = { x: Math.max(8, pa.x), y: Math.max(8, pa.y) };
        pb = { x: Math.max(8, pb.x), y: Math.max(8, pb.y) };
        next[keyA] = pa;
        next[keyB] = pb;
      }
    }

    if (!changed) break;
  }

  return next;
}

function dragWithPush(
  group: WorkerNodeGroup,
  movedId: string,
  desired: { x: number; y: number },
  positions: PositionMap
): PositionMap {
  const key = posKey(group.id, movedId);
  const movedPos = { x: Math.max(8, desired.x), y: Math.max(8, desired.y) };
  const sepX = RESOURCE_W + RESOURCE_GAP;
  const sepY = RESOURCE_H + RESOURCE_GAP;

  let next = resolveGroupOverlaps(group, { ...positions, [key]: movedPos }, movedId);

  if (groupHasOverlaps(group, next)) {
    next = { ...positions, [key]: movedPos };
    const mp = next[key];
    for (const other of group.resources) {
      if (other.id === movedId) continue;
      const otherKey = posKey(group.id, other.id);
      let op = next[otherKey] ?? { x: other.x, y: other.y };
      if (!rectsOverlap(mp, op, RESOURCE_W, RESOURCE_H, 0)) continue;

      const dx = op.x + RESOURCE_W / 2 - (mp.x + RESOURCE_W / 2);
      const dy = op.y + RESOURCE_H / 2 - (mp.y + RESOURCE_H / 2);
      if (Math.abs(dx) >= Math.abs(dy)) {
        op = { ...op, x: dx >= 0 ? mp.x + sepX : mp.x - sepX };
      } else {
        op = { ...op, y: dy >= 0 ? mp.y + sepY : mp.y - sepY };
      }
      next[otherKey] = { x: Math.max(8, op.x), y: Math.max(8, op.y) };
    }
    next = resolveGroupOverlaps(group, next, movedId);
  }

  return next;
}

function initializePositions(): PositionMap {
  let init: PositionMap = {};
  WORKER_NODE_GROUPS.forEach((group) => {
    group.resources.forEach((resource) => {
      init[posKey(group.id, resource.id)] = { x: resource.x, y: resource.y };
    });
    init = resolveGroupOverlaps(group, init);
  });
  return init;
}

function computeGroupLayout(
  group: WorkerNodeGroup,
  positions: PositionMap,
  visibleResources: NetResource[]
): GroupLayout {
  const minSurfaceHeight =
    RESOURCE_GRID_ORIGIN_Y +
    RESOURCE_GRID_ROWS * RESOURCE_CELL_H +
    (RESOURCE_GRID_ROWS - 1) * RESOURCE_ROW_GAP +
    BRIDGE_UNDERLAY_HEIGHT +
    HULL_RADIAL_PADDING;
  const minWidth =
    RESOURCE_GRID_ORIGIN_X +
    3 * RESOURCE_CELL_W +
    2 * RESOURCE_COL_GAP +
    RESOURCE_GRID_ORIGIN_X;

  if (visibleResources.length === 0) {
    const surfaceHeight = Math.max(GROUP_H - GROUP_FOOTER_GAP - GROUP_FOOTER_H, minSurfaceHeight);
    const width = Math.max(GROUP_W, minWidth);
    const hull = computeGroupHullPath([], width, surfaceHeight);
    return {
      minX: 0,
      minY: 0,
      width: Math.max(width, hull.bounds.maxX),
      surfaceHeight: Math.max(surfaceHeight, hull.bounds.maxY),
      totalHeight: Math.max(surfaceHeight, hull.bounds.maxY) + GROUP_FOOTER_GAP + GROUP_FOOTER_H,
      hullPath: hull.path,
      hullBounds: hull.bounds,
      footerTop: hull.bounds.maxY + GROUP_FOOTER_GAP,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  visibleResources.forEach((resource) => {
    const p = getPos(positions, group.id, resource);
    const underlay = resource.kind === "bridge" ? BRIDGE_UNDERLAY_HEIGHT : 0;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y - underlay);
    maxX = Math.max(maxX, p.x + RESOURCE_W);
    maxY = Math.max(maxY, p.y + RESOURCE_H);
  });

  const preliminary: GroupLayout = {
    minX,
    minY,
    width: Math.max(GROUP_W, minWidth, maxX - minX + GROUP_SURFACE_INSET * 2),
    surfaceHeight: Math.max(
      minSurfaceHeight,
      maxY - minY + GROUP_SURFACE_INSET * 2 + BRIDGE_UNDERLAY_HEIGHT
    ),
    totalHeight: 0,
    hullPath: "",
    hullBounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    footerTop: 0,
  };

  const displayRects = visibleResources.map((resource) => {
    const p = getPos(positions, group.id, resource);
    const d = displayPos(p, preliminary);
    const underlay = resource.kind === "bridge" ? BRIDGE_UNDERLAY_HEIGHT : 0;
    return { x: d.x, y: d.y - underlay, w: RESOURCE_W, h: RESOURCE_H + underlay };
  });

  const hull = computeGroupHullPath(displayRects, preliminary.width, preliminary.surfaceHeight);
  const width = Math.max(preliminary.width, hull.bounds.maxX);
  const surfaceHeight = Math.max(preliminary.surfaceHeight, hull.bounds.maxY);

  return {
    minX,
    minY,
    width,
    surfaceHeight,
    totalHeight: surfaceHeight + GROUP_FOOTER_GAP + GROUP_FOOTER_H,
    hullPath: hull.path,
    hullBounds: hull.bounds,
    footerTop: hull.bounds.maxY + GROUP_FOOTER_GAP,
  };
}

function displayPos(pos: { x: number; y: number }, layout: GroupLayout) {
  return {
    x: pos.x - layout.minX + GROUP_SURFACE_INSET,
    y: pos.y - layout.minY + GROUP_SURFACE_INSET,
  };
}

function canvasResourceRect(
  groupPos: { x: number; y: number },
  layout: GroupLayout,
  pos: { x: number; y: number }
) {
  const d = displayPos(pos, layout);
  return {
    x: groupPos.x + d.x,
    y: groupPos.y + d.y,
    w: RESOURCE_W,
    h: RESOURCE_H,
  };
}

function pointInGroupSurface(
  canvasX: number,
  canvasY: number,
  groupPos: { x: number; y: number },
  layout: GroupLayout
) {
  return (
    canvasX >= groupPos.x &&
    canvasX <= groupPos.x + layout.width &&
    canvasY >= groupPos.y &&
    canvasY <= groupPos.y + layout.surfaceHeight
  );
}

type TopologyConnectionEntry = {
  edgeId: string;
  direction: "out" | "in";
  peerId: string;
  peerLabel: string;
  peerSubtitle: string;
  onRemove: () => void;
};

function resolvePeerDescriptor(
  peerId: string,
  groups: WorkerNodeGroup[],
  standaloneResources: StandaloneTopologyResource[]
): { label: string; subtitle: string } {
  const standalone = standaloneResources.find((resource) => resource.id === peerId);
  if (standalone) {
    return {
      label: standalone.label,
      subtitle: RESOURCE_KIND_LABELS[standalone.kind],
    };
  }
  for (const group of groups) {
    const resource = group.resources.find((entry) => entry.id === peerId);
    if (resource) {
      return {
        label: resource.label,
        subtitle: `${RESOURCE_KIND_LABELS[resource.kind]} on ${group.shortName}`,
      };
    }
  }
  return { label: peerId, subtitle: "" };
}

function resolveTopologyConnections(
  resource: SelectedResource,
  edges: EdgeMap,
  standaloneEdges: TopologyEdge[],
  crossEdges: TopologyCrossEdge[],
  groups: WorkerNodeGroup[],
  standaloneResources: StandaloneTopologyResource[],
  onRemoveEdge: (groupId: string, edgeId: string) => void,
  onRemoveStandaloneEdge: (edgeId: string) => void,
  onWorkerAssignmentChange: (logicalId: string, workerId: string, assigned: boolean) => void
): TopologyConnectionEntry[] {
  const entries: TopologyConnectionEntry[] = [];
  const isStandalone = resource.placement === "standalone";
  const isLogical = isStandalone && isLogicalNetworkStandalone(resource);

  if (isLogical) {
    crossEdges
      .filter((edge) => edge.fromStandaloneId === resource.id)
      .forEach((edge) => {
        const group = groups.find((entry) => entry.id === edge.toGroupId);
        const bridge = group?.resources.find((entry) => entry.id === edge.toResourceId);
        const peerId = bridge?.id ?? edge.toResourceId;
        entries.push({
          edgeId: edge.id,
          direction: "out",
          peerId,
          peerLabel: bridge ? bridge.label : edge.toResourceId,
          peerSubtitle: group ? `${RESOURCE_KIND_LABELS.bridge} on ${group.shortName}` : "",
          onRemove: () => onWorkerAssignmentChange(resource.id, edge.toGroupId, false),
        });
      });
  } else if (isStandalone) {
    standaloneEdges
      .filter((edge) => edge.from === resource.id || edge.to === resource.id)
      .forEach((edge) => {
        const peerId = edge.from === resource.id ? edge.to : edge.from;
        const peer = resolvePeerDescriptor(peerId, groups, standaloneResources);
        entries.push({
          edgeId: edge.id,
          direction: edge.from === resource.id ? "out" : "in",
          peerId,
          peerLabel: peer.label,
          peerSubtitle: peer.subtitle,
          onRemove: () => onRemoveStandaloneEdge(edge.id),
        });
      });
  } else {
    crossEdges
      .filter((edge) => edge.toGroupId === resource.group.id && edge.toResourceId === resource.id)
      .forEach((edge) => {
        const logical = standaloneResources.find((entry) => entry.id === edge.fromStandaloneId);
        const peer = logical
          ? { label: logical.label, subtitle: RESOURCE_KIND_LABELS[logical.kind] }
          : resolvePeerDescriptor(edge.fromStandaloneId, groups, standaloneResources);
        entries.push({
          edgeId: edge.id,
          direction: "in",
          peerId: edge.fromStandaloneId,
          peerLabel: peer.label,
          peerSubtitle: peer.subtitle,
          onRemove: () => onWorkerAssignmentChange(edge.fromStandaloneId, resource.group.id, false),
        });
      });

    (edges[resource.group.id] ?? [])
      .filter((edge) => edge.from === resource.id || edge.to === resource.id)
      .forEach((edge) => {
        const peerId = edge.from === resource.id ? edge.to : edge.from;
        const peer = resolvePeerDescriptor(peerId, groups, standaloneResources);
        entries.push({
          edgeId: edge.id,
          direction: edge.from === resource.id ? "out" : "in",
          peerId,
          peerLabel: peer.label,
          peerSubtitle: peer.subtitle,
          onRemove: () => onRemoveEdge(resource.group.id, edge.id),
        });
      });
  }

  return entries;
}

function findResourceAtCanvasPoint(
  groups: WorkerNodeGroup[],
  groupPositions: Record<string, { x: number; y: number }>,
  groupLayouts: Record<string, GroupLayout>,
  positions: PositionMap,
  standalones: StandaloneTopologyResource[],
  canvasX: number,
  canvasY: number,
  exclude?: { scope: "group" | "standalone"; groupId?: string; resourceId: string }
) {
  for (const standalone of standalones) {
    if (exclude?.scope === "standalone" && exclude.resourceId === standalone.id) continue;
    const rect = standaloneCanvasRect(standalone);
    if (
      canvasX >= rect.x &&
      canvasX <= rect.x + rect.w &&
      canvasY >= rect.y &&
      canvasY <= rect.y + rect.h
    ) {
      return { kind: "standalone" as const, standalone };
    }
  }

  for (const group of groups) {
    const groupPos = groupPositions[group.id] ?? { x: group.x, y: group.y };
    const layout = groupLayouts[group.id];
    if (!layout) continue;
    for (const resource of group.resources) {
      if (exclude?.scope === "group" && exclude.groupId === group.id && exclude.resourceId === resource.id) {
        continue;
      }
      const p = getPos(positions, group.id, resource);
      const rect = canvasResourceRect(groupPos, layout, p);
      if (canvasX >= rect.x && canvasX <= rect.x + rect.w && canvasY >= rect.y && canvasY <= rect.y + rect.h) {
        return { kind: "group" as const, group, resource, groupPos };
      }
    }
  }
  return null;
}

function ResourceIcon({ kind }: { kind: NetResourceKind }) {
  if (kind === "interface") return <NetworkWiredIcon aria-hidden />;
  if (kind === "cudn") return <ShareAltIcon aria-hidden />;
  if (kind === "udn") return <ProjectDiagramIcon aria-hidden />;
  return <ServerIcon aria-hidden />;
}

function ResourceStatusIcon({ status }: { status: ResourceInstallStatus }) {
  if (status === "configured") {
    return (
      <CheckCircleIcon
        aria-hidden
        className="ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--configured"
      />
    );
  }
  if (status === "failed") {
    return (
      <ExclamationCircleIcon
        aria-hidden
        className="ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--failed"
      />
    );
  }
  if (status === "pending") {
    return <span className="ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--pending" aria-hidden />;
  }
  return (
    <InProgressIcon
      aria-hidden
      className={`ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--${status} ocs-net-topo-spin`}
    />
  );
}

function StatusBadge({ status }: { status: ResourceInstallStatus }) {
  const label = RESOURCE_INSTALL_STATUS_LABELS[status];
  const color = RESOURCE_INSTALL_STATUS_COLORS[status];
  const icon =
    status === "configured" ? (
      <CheckCircleIcon aria-hidden />
    ) : status === "failed" ? (
      <ExclamationCircleIcon aria-hidden />
    ) : status === "pending" ? null : (
      <InProgressIcon aria-hidden className={status === "installing" || status === "creating" ? "ocs-net-topo-spin" : undefined} />
    );

  return (
    <Label color={color} isCompact icon={icon ?? undefined} className={`ocs-net-topo-status ocs-net-topo-status--${status}`}>
      {label}
    </Label>
  );
}

function StandaloneCanvasNode({
  resource,
  isLogical,
  logicalLane,
  highlighted,
  peerHighlighted = false,
  pathActive = false,
  pathDimmed = false,
  isSelected,
  isLinkSource,
  isDraggingThis,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onClick,
  onConnectorPointerDown,
}: {
  resource: StandaloneTopologyResource;
  isLogical: boolean;
  logicalLane?: LogicalLaneLayout | null;
  highlighted: boolean;
  peerHighlighted?: boolean;
  pathActive?: boolean;
  pathDimmed?: boolean;
  isSelected: boolean;
  isLinkSource: boolean;
  isDraggingThis: boolean;
  onPointerDown: (e: React.PointerEvent, resource: StandaloneTopologyResource) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
  onClick: (resource: StandaloneTopologyResource) => void;
  onConnectorPointerDown: (e: React.PointerEvent, resource: StandaloneTopologyResource) => void;
}) {
  const kindColor = RESOURCE_KIND_COLORS[resource.kind];
  const statusLabel = RESOURCE_INSTALL_STATUS_LABELS[resource.status];
  const logicalPosition =
    isLogical && logicalLane ? logicalNodeDisplayPosition(resource, logicalLane) : null;

  return (
    <div
      className={`ocs-net-topo-standalone${isLogical ? " ocs-net-topo-standalone--logical" : ""}${
        pathDimmed ? " ocs-net-topo-standalone--path-dim" : ""
      }`}
      style={
        logicalPosition
          ? logicalPosition
          : { left: resource.canvasX, top: resource.canvasY }
      }
    >
      {!isLogical ? <div className="ocs-net-topo-standalone__halo" aria-hidden /> : null}
      <div
        role="button"
        tabIndex={0}
        className={`ocs-net-topo-resource ocs-net-topo-resource--${resource.status} ocs-net-topo-resource--standalone${
          isLogical ? " ocs-net-topo-resource--logical" : ""
        }${highlighted ? " ocs-net-topo-resource--highlight" : ""}${
          peerHighlighted || pathActive ? " ocs-net-topo-resource--peer-highlight" : ""
        }${pathActive ? " ocs-net-topo-resource--path-active" : ""}${
          pathDimmed ? " ocs-net-topo-resource--path-dim" : ""
        }${isSelected ? " ocs-net-topo-resource--selected" : ""}${
          isLinkSource ? " ocs-net-topo-resource--link-source" : ""
        }${isDraggingThis ? " ocs-net-topo-resource--dragging" : ""
        }${!isDraggingThis ? " ocs-net-topo-resource--animated" : ""}`}
        style={{ borderColor: kindColor }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest(".ocs-net-topo-resource__connector")) return;
          onPointerDown(e, resource);
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={(e) => {
          e.stopPropagation();
          onClick(resource);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(resource);
          }
        }}
        aria-pressed={isSelected}
        aria-label={
          isLogical
            ? `${resource.label}, ${RESOURCE_KIND_LABELS[resource.kind]}, ${statusLabel}. Drag the arrow to link to an OVS bridge.`
            : `${resource.label} for ${resource.targetNodeLabel}, ${RESOURCE_KIND_LABELS[resource.kind]}, ${statusLabel}. Drag onto a node group to attach.`
        }
      >
        <span className="ocs-net-topo-resource__icon" style={{ color: kindColor }}>
          <ResourceIcon kind={resource.kind} />
        </span>
        <span className="ocs-net-topo-resource__label">{resource.label}</span>
        <span className="ocs-net-topo-resource__status-row">
          <ResourceStatusIcon status={resource.status} />
          <span className="ocs-net-topo-resource__status">{statusLabel}</span>
        </span>
        <button
          type="button"
          className="ocs-net-topo-resource__connector"
          aria-label={`Connect ${resource.label} to another resource`}
          onPointerDown={(e) => onConnectorPointerDown(e, resource)}
        >
          <span aria-hidden>›</span>
        </button>
      </div>
      {!isLogical ? <span className="ocs-net-topo-standalone__target">{resource.targetNodeLabel}</span> : null}
    </div>
  );
}

function NncProfileSwitcher({
  profiles,
  selectedPhysicalNetwork,
  onSelect,
}: {
  profiles: NncProfile[];
  selectedPhysicalNetwork: string;
  onSelect: (physicalNetworkName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected =
    profiles.find((profile) => profile.physicalNetworkName === selectedPhysicalNetwork) ?? profiles[0];

  return (
    <Dropdown
      className="ocs-net-topo-panel__nnc-switcher"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="secondary"
          isExpanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          aria-label={`Physical network: ${selected?.label ?? selectedPhysicalNetwork}. Switch node network configuration.`}
        >
          Physical network: {selected?.label ?? selectedPhysicalNetwork}
        </MenuToggle>
      )}
    >
      <DropdownList aria-label="Node network configuration profiles">
        {profiles.map((profile) => (
          <DropdownItem
            key={profile.id}
            itemId={profile.id}
            isSelected={profile.physicalNetworkName === selectedPhysicalNetwork}
            description={profile.description}
            onClick={() => {
              onSelect(profile.physicalNetworkName);
              setIsOpen(false);
            }}
          >
            {profile.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

function roundViewportPoint(x: number, y: number) {
  return { x: Math.round(x), y: Math.round(y) };
}

function CanvasContextMenu({
  x,
  y,
  onClose,
  onAddNode,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const position = roundViewportPoint(x, y);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onScroll = () => onClose();

    const frame = window.requestAnimationFrame(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    });
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="ocs-net-topo-canvas-menu"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="presentation"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Menu isPlain aria-label="Topology canvas actions">
        <MenuContent>
          <MenuList>
            <MenuItem
              itemId="add-node"
              icon={<PlusCircleIcon aria-hidden />}
              onClick={(event) => {
                event.stopPropagation();
                onAddNode();
                onClose();
              }}
            >
              Add node
            </MenuItem>
          </MenuList>
        </MenuContent>
      </Menu>
    </div>,
    document.body
  );
}

function GroupActionsMenu({
  group,
  isOpen,
  onOpenChange,
  onResetLayout,
  onNotice,
  onRemoveFromTopology,
}: {
  group: WorkerNodeGroup;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onResetLayout: () => void;
  onNotice: (notice: { title: string; variant: "success" | "warning" | "info" }) => void;
  onRemoveFromTopology?: () => void;
}) {
  const navigate = useNavigate();

  const close = () => onOpenChange(false);

  const viewNodeDetails = () => {
    close();
    navigate(`/compute/nodes/${encodeURIComponent(group.hostname)}`);
  };

  const copyHostname = async () => {
    try {
      await navigator.clipboard.writeText(group.hostname);
      onNotice({
        variant: "success",
        title: `Copied ${group.shortName} hostname to clipboard.`,
      });
    } catch {
      onNotice({
        variant: "warning",
        title: `Could not copy hostname. Copy manually: ${group.hostname}`,
      });
    }
    close();
  };

  const resetLayout = () => {
    onResetLayout();
    onNotice({
      variant: "info",
      title: `Reset resource layout for ${group.shortName}.`,
    });
    close();
  };

  return (
    <Dropdown
      className="ocs-net-topo-group__actions"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSelect={() => onOpenChange(false)}
      popperProps={{ position: "right-end" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          isExpanded={isOpen}
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(!isOpen);
          }}
          aria-label={`Actions for ${group.shortName}`}
        >
          <EllipsisVIcon aria-hidden />
        </MenuToggle>
      )}
    >
      <DropdownList aria-label={`Actions for ${group.shortName}`}>
        <DropdownItem itemId="view" icon={<EyeIcon aria-hidden />} onClick={viewNodeDetails}>
          View node details
        </DropdownItem>
        <DropdownItem itemId="copy" icon={<CopyIcon aria-hidden />} onClick={() => void copyHostname()}>
          Copy hostname
        </DropdownItem>
        <DropdownItem itemId="reset" icon={<UndoIcon aria-hidden />} onClick={resetLayout}>
          Reset node layout
        </DropdownItem>
        {onRemoveFromTopology ? (
          <DropdownItem
            itemId="remove"
            isDanger
            icon={<TrashIcon aria-hidden />}
            onClick={() => {
              onRemoveFromTopology();
              close();
            }}
          >
            Remove from topology
          </DropdownItem>
        ) : null}
      </DropdownList>
    </Dropdown>
  );
}

function resolveAssignedWorkers(
  resource: SelectedResource,
  groups: WorkerNodeGroup[],
  networkNodeAssignments: NetworkNodeAssignments
): AssignedWorkerRow[] {
  const assignmentKey = networkResourceAssignmentKey(resource);
  if (assignmentKey && isBridgeNetworkResource(resource)) {
    return (networkNodeAssignments[assignmentKey] ?? []).map((workerId) => {
      const group = groups.find((entry) => entry.id === workerId);
      return {
        id: workerId,
        shortName: group?.shortName ?? workerId,
        hostname: group?.hostname ?? "—",
      };
    });
  }

  if (resource.placement === "group") {
    const suffix = resourceSuffixFromId(resource.id, resource.group.id);
    const matchingGroups = groups.filter((group) =>
      group.resources.some((entry) => resourceSuffixFromId(entry.id, group.id) === suffix)
    );
    const hosts = matchingGroups.length > 0 ? matchingGroups : [resource.group];
    return hosts.map((group) => ({
      id: group.id,
      shortName: group.shortName,
      hostname: group.hostname,
    }));
  }

  if (isLogicalNetworkStandalone(resource)) {
    const workerIds = networkNodeAssignments[resource.id] ?? [];
    return workerIds.map((workerId) => {
      const group = groups.find((entry) => entry.id === workerId);
      return {
        id: workerId,
        shortName: group?.shortName ?? workerId,
        hostname: group?.hostname ?? "—",
      };
    });
  }

  const labelMatch = groups.filter((group) =>
    group.resources.some((entry) => entry.label === resource.label)
  );
  if (labelMatch.length > 0) {
    return labelMatch.map((group) => ({
      id: group.id,
      shortName: group.shortName,
      hostname: group.hostname,
    }));
  }

  if (resource.targetNodeLabel) {
    const group = groups.find((entry) => entry.hostname === resource.targetNodeLabel);
    if (group) {
      return [{ id: group.id, shortName: group.shortName, hostname: group.hostname }];
    }
    return [{ id: resource.targetNodeLabel, shortName: resource.targetNodeLabel, hostname: resource.targetNodeLabel }];
  }

  return [];
}

function TopologySidePanel({
  resource,
  positions,
  edges,
  standaloneEdges,
  crossEdges,
  groups,
  standaloneResources,
  networkNodeAssignments,
  workerCatalog,
  onClose,
  onRemoveEdge,
  onRemoveStandaloneEdge,
  onWorkerAssignmentChange,
  onResourceLifecycleAction,
  onNotice,
  onPeerHover,
  onPeerSelect,
}: {
  resource: SelectedResource;
  positions: PositionMap;
  edges: EdgeMap;
  standaloneEdges: TopologyEdge[];
  crossEdges: TopologyCrossEdge[];
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  networkNodeAssignments: NetworkNodeAssignments;
  workerCatalog: TopologyWorkerCatalogEntry[];
  onClose: () => void;
  onRemoveEdge: (groupId: string, edgeId: string) => void;
  onRemoveStandaloneEdge: (edgeId: string) => void;
  onWorkerAssignmentChange: (logicalId: string, workerId: string, assigned: boolean) => void;
  onResourceLifecycleAction?: (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => void;
  onNotice?: (notice: { title: string; variant: "success" | "warning" | "info" }) => void;
  onPeerHover?: (peerId: string | null) => void;
  onPeerSelect?: (peerId: string) => void;
}) {
  const [tab, setTab] = useState<string>("details");
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const color = RESOURCE_KIND_COLORS[resource.kind];
  const isStandalone = resource.placement === "standalone";
  const isLogical = isStandalone && isLogicalNetworkStandalone(resource);
  const assignmentKey = networkResourceAssignmentKey(resource);
  const canEditAssignedNodes = Boolean(assignmentKey) && isBridgeNetworkResource(resource);
  const nncpLineage = useMemo(
    () => (!isLogical ? resolveNncpLineageForBridge(resource) : null),
    [isLogical, resource]
  );
  const nncpLineageConnections = useMemo(
    () => (nncpLineage ? buildNncpLineageConnections(resource, nncpLineage) : []),
    [nncpLineage, resource]
  );
  const logicalNetworkKind =
    resource.kind === "cudn" ? "CUDN" : resource.kind === "udn" ? "UDN" : null;

  useEffect(() => {
    if (isLogical) setTab("nodes");
  }, [resource.id, isLogical]);
  const assignedWorkers = isLogical ? (networkNodeAssignments[resource.id] ?? []) : [];
  const assignedNodeRows = useMemo(
    () => (isLogical ? [] : resolveAssignedWorkers(resource, groups, networkNodeAssignments)),
    [resource, groups, networkNodeAssignments, isLogical]
  );
  const unassignedWorkers = useMemo(() => {
    if (!canEditAssignedNodes || !assignmentKey) return [];
    const assignedIds = new Set(networkNodeAssignments[assignmentKey] ?? []);
    return workerCatalog.filter((worker) => !assignedIds.has(worker.id));
  }, [assignmentKey, canEditAssignedNodes, networkNodeAssignments, workerCatalog]);

  const handleAssignNode = (nodeId: string) => {
    if (!assignmentKey) return;
    onWorkerAssignmentChange(assignmentKey, nodeId, true);
    setIsAddWorkerOpen(false);
  };

  const handleRemoveNode = (nodeId: string) => {
    if (!assignmentKey) return;
    onWorkerAssignmentChange(assignmentKey, nodeId, false);
  };

  const lifecycleTarget = useMemo<ResourceLifecycleTarget>(
    () => ({
      resourceId: resource.id,
      placement: resource.placement,
      groupId: resource.placement === "group" ? resource.group.id : undefined,
      label: resource.label,
    }),
    [resource]
  );

  const connectionEntries = useMemo(
    () =>
      resolveTopologyConnections(
        resource,
        edges,
        standaloneEdges,
        crossEdges,
        groups,
        standaloneResources,
        onRemoveEdge,
        onRemoveStandaloneEdge,
        onWorkerAssignmentChange
      ),
    [
      resource,
      edges,
      standaloneEdges,
      crossEdges,
      groups,
      standaloneResources,
      onRemoveEdge,
      onRemoveStandaloneEdge,
      onWorkerAssignmentChange,
    ]
  );

  useEffect(() => {
    if (tab !== "connections") {
      onPeerHover?.(null);
    }
  }, [tab, onPeerHover]);

  const pos = isStandalone
    ? { x: resource.canvasX, y: resource.canvasY }
    : positions[posKey(resource.group.id, resource.id)] ?? { x: resource.x, y: resource.y };

  return (
  <>
      <DrawerHead>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flex={{ default: "flex_1" }}>
          <span
            className={`ocs-net-topo-sidepanel__icon${isLogical ? " ocs-net-topo-sidepanel__icon--logical" : ""}`}
            style={{ color, borderColor: color }}
          >
            <ResourceIcon kind={resource.kind} />
          </span>
          <Flex direction={{ default: "column" }} flex={{ default: "flex_1" }}>
            <Title headingLevel="h3" size="md">
              {resource.label}
            </Title>
            <Content component="small">{RESOURCE_KIND_LABELS[resource.kind]}</Content>
          </Flex>
        </Flex>
        <DrawerActions>
          <TopologyResourceActionsMenu
            label={resource.label}
            lifecycleTarget={lifecycleTarget}
            onResourceLifecycleAction={onResourceLifecycleAction}
            onNotice={onNotice}
            onDeleted={onClose}
            isOpen={actionsOpen}
            onOpenChange={setActionsOpen}
            toggleVariant="secondary"
            showActionsLabel
          />
          <DrawerCloseButton onClose={onClose} />
        </DrawerActions>
      </DrawerHead>

      <DrawerPanelBody>
        <Tabs activeKey={tab} onSelect={(_e, key) => setTab(String(key))} aria-label="Resource details">
          <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
          {isLogical ? <Tab eventKey="nodes" title={<TabTitleText>Worker nodes</TabTitleText>} /> : null}
          {isLogical && logicalNetworkKind ? (
            <Tab eventKey="propagation" title={<TabTitleText>Namespace propagation</TabTitleText>} />
          ) : null}
          {!isLogical ? <Tab eventKey="assigned-nodes" title={<TabTitleText>Assigned Nodes</TabTitleText>} /> : null}
          <Tab eventKey="connections" title={<TabTitleText>Connections</TabTitleText>} />
          <Tab eventKey="observe" title={<TabTitleText>Observe</TabTitleText>} />
        </Tabs>

        {tab === "details" && (
          <DescriptionList isCompact className="pf-v6-u-mt-md">
            {isLogical ? (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>Scope</DescriptionListTerm>
                  <DescriptionListDescription>{resource.targetNodeLabel}</DescriptionListDescription>
                </DescriptionListGroup>
                {resource.topologyMode ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Topology</DescriptionListTerm>
                    <DescriptionListDescription>{resource.topologyMode}</DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                {resource.detailPath ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Network</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        component={Link}
                        to={resource.detailPath}
                        icon={<ExternalLinkAltIcon />}
                        iconPosition="right"
                      >
                        View network details
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
              </>
            ) : (
              <DescriptionListGroup>
                <DescriptionListTerm>{isStandalone ? "Target node" : "Node"}</DescriptionListTerm>
                <DescriptionListDescription>
                  {isStandalone ? (
                    <>
                      {resource.targetNodeLabel} —{" "}
                      <Content component="small" className="ocs-net-topo-sidepanel__hint">
                        Not attached. Drag onto a node group or link to connect.
                      </Content>
                    </>
                  ) : (
                    resource.group.hostname
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Installation status</DescriptionListTerm>
              <DescriptionListDescription>
                <StatusBadge status={resource.status} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Description</DescriptionListTerm>
              <DescriptionListDescription>{resource.detail}</DescriptionListDescription>
            </DescriptionListGroup>
            {nncpLineage ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Orchestrated by</DescriptionListTerm>
                <DescriptionListDescription>
                  <Button
                    variant="link"
                    isInline
                    component={Link}
                    to={nncpLineage.nncpPath}
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                  >
                    {nncpLineage.nncpName}
                  </Button>
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
            {!isLogical ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Position</DescriptionListTerm>
                <DescriptionListDescription>
                  x: {Math.round(pos.x)}, y: {Math.round(pos.y)}
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
          </DescriptionList>
        )}
        {tab === "nodes" && isLogical ? (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Content component="p" className="ocs-net-topo-sidepanel__hint">
              Select worker nodes where this network runs. Each assigned node appears on the topology with its OVS
              resources and bridge linkage.
            </Content>
            {assignedWorkers.length > 0 ? (
              <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                {assignedWorkers.map((workerId) => {
                  const worker = workerCatalog.find((entry) => entry.id === workerId);
                  return (
                    <Label
                      key={workerId}
                      color="blue"
                      isCompact
                      onClose={() => onWorkerAssignmentChange(resource.id, workerId, false)}
                    >
                      {worker?.shortName ?? workerId}
                    </Label>
                  );
                })}
              </Flex>
            ) : (
              <Content component="p">No worker nodes assigned yet.</Content>
            )}
            <div className="ocs-net-topo-sidepanel__worker-list" role="group" aria-label="Available worker nodes">
              {workerCatalog.map((worker) => {
                const isAssigned = assignedWorkers.includes(worker.id);
                return (
                  <Checkbox
                    key={worker.id}
                    id={`topo-worker-${resource.id}-${worker.id}`}
                    label={
                      <Flex
                        alignItems={{ default: "alignItemsCenter" }}
                        justifyContent={{ default: "justifyContentSpaceBetween" }}
                        gap={{ default: "gapMd" }}
                        className="ocs-net-topo-sidepanel__worker-row"
                      >
                        <span>{worker.shortName}</span>
                        <Label color={worker.ready ? "green" : "orange"} isCompact>
                          {worker.ready ? "Ready" : "Not ready"}
                        </Label>
                      </Flex>
                    }
                    isChecked={isAssigned}
                    onChange={(_event, checked) =>
                      onWorkerAssignmentChange(resource.id, worker.id, Boolean(checked))
                    }
                  />
                );
              })}
            </div>
          </Flex>
        ) : null}
        {tab === "propagation" && isLogical && logicalNetworkKind ? (
          <NetworkNamespacePropagationTab networkName={resource.label} networkKind={logicalNetworkKind} />
        ) : null}
        {tab === "assigned-nodes" && !isLogical ? (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-mt-md">
            <Content component="p" className="ocs-net-topo-sidepanel__hint">
              Worker nodes where this resource is deployed or configured in the cluster topology.
            </Content>
            {canEditAssignedNodes ? (
              <>
                {assignedNodeRows.length === 0 ? (
                  <Content component="p">No worker nodes assigned to this network resource.</Content>
                ) : (
                  <ul className="ocs-net-topo-connection-list" aria-label="Assigned worker nodes">
                    {assignedNodeRows.map((worker) => (
                      <li key={worker.id}>
                        <Flex
                          alignItems={{ default: "alignItemsCenter" }}
                          justifyContent={{ default: "justifyContentSpaceBetween" }}
                          className="ocs-net-topo-connection-row"
                        >
                          <Flex direction={{ default: "column" }} gap={{ default: "gapNone" }}>
                            <span className="ocs-net-topo-connection-row__name">{worker.shortName}</span>
                            <Content component="small">{worker.hostname}</Content>
                          </Flex>
                          <Button
                            variant="plain"
                            aria-label={`Remove ${worker.shortName} from ${resource.label}`}
                            icon={<TrashIcon aria-hidden />}
                            onClick={() => handleRemoveNode(worker.id)}
                          />
                        </Flex>
                      </li>
                    ))}
                  </ul>
                )}
                <Title headingLevel="h4" size="md">
                  Add worker node
                </Title>
                {unassignedWorkers.length === 0 ? (
                  <Content component="small">All worker nodes are already assigned to this resource.</Content>
                ) : (
                  <Select
                    isOpen={isAddWorkerOpen}
                    selected={null}
                    onSelect={(_event, value) => {
                      if (typeof value === "string") handleAssignNode(value);
                    }}
                    onOpenChange={(open) => setIsAddWorkerOpen(open)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsAddWorkerOpen(!isAddWorkerOpen)}
                        isExpanded={isAddWorkerOpen}
                      >
                        Select a worker node
                      </MenuToggle>
                    )}
                    aria-label="Add worker node to network resource"
                  >
                    <SelectList>
                      {unassignedWorkers.map((worker) => (
                        <SelectOption key={worker.id} value={worker.id}>
                          {worker.shortName} ({worker.hostname})
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                )}
              </>
            ) : assignedNodeRows.length === 0 ? (
              <Content component="p">No worker nodes assigned to this network resource.</Content>
            ) : (
              <ul className="ocs-net-topo-connection-list" aria-label="Assigned worker nodes">
                {assignedNodeRows.map((worker) => (
                  <li key={worker.id}>
                    <Flex
                      alignItems={{ default: "alignItemsCenter" }}
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      className="ocs-net-topo-connection-row"
                    >
                      <Flex direction={{ default: "column" }} gap={{ default: "gapNone" }}>
                        <span className="ocs-net-topo-connection-row__name">{worker.shortName}</span>
                        <Content component="small">{worker.hostname}</Content>
                      </Flex>
                      {canEditAssignedNodes ? (
                        <Button
                          variant="plain"
                          aria-label={`Remove ${worker.shortName} from ${resource.label}`}
                          icon={<TrashIcon aria-hidden />}
                          onClick={() => handleRemoveNode(worker.id)}
                        />
                      ) : (
                        <Button
                          variant="plain"
                          aria-label={`Unassign ${worker.shortName} from ${resource.label}`}
                          icon={<TrashIcon aria-hidden />}
                          onClick={() => {
                            if (assignmentKey) {
                              onWorkerAssignmentChange(assignmentKey, worker.id, false);
                            }
                          }}
                        />
                      )}
                    </Flex>
                  </li>
                ))}
              </ul>
            )}
          </Flex>
        ) : null}
        {tab === "connections" && (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Content component="p" className="ocs-net-topo-sidepanel__hint">
              {isLogical
                ? "Bridge connections are created when worker nodes are assigned. You can also drag the arrow to link to a bridge."
                : isStandalone
                  ? "Drag onto a node group to attach, or drag the arrow to link to another resource."
                  : "Drag the arrow on a resource to connect it to another resource in the same node."}
            </Content>
            {connectionEntries.length === 0 && nncpLineageConnections.length === 0 ? (
              <Content component="p">No connections for this resource.</Content>
            ) : (
              <ul className="ocs-net-topo-connection-list" aria-label="Connected resources">
                {nncpLineageConnections.map((entry) => (
                  <li key={entry.edgeId}>
                    <Flex
                      alignItems={{ default: "alignItemsCenter" }}
                      className="ocs-net-topo-connection-row ocs-net-topo-connection-row--lineage"
                    >
                      <span className="ocs-net-topo-connection-row__direction" aria-hidden>
                        →
                      </span>
                      <span className="ocs-net-topo-connection-row__labels">
                        <span className="ocs-net-topo-connection-row__name">{entry.peerLabel}</span>
                        <span className="ocs-net-topo-connection-row__meta">{entry.peerSubtitle}</span>
                      </span>
                    </Flex>
                  </li>
                ))}
                {connectionEntries.map((entry) => (
                  <li key={entry.edgeId}>
                    <Flex
                      alignItems={{ default: "alignItemsCenter" }}
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      className="ocs-net-topo-connection-row ocs-net-topo-connection-row--interactive"
                    >
                      <button
                        type="button"
                        className="ocs-net-topo-connection-row__peer"
                        onMouseEnter={() => onPeerHover?.(entry.peerId)}
                        onMouseLeave={() => onPeerHover?.(null)}
                        onFocus={() => onPeerHover?.(entry.peerId)}
                        onBlur={() => onPeerHover?.(null)}
                        onClick={() => onPeerSelect?.(entry.peerId)}
                      >
                        <span className="ocs-net-topo-connection-row__direction" aria-hidden>
                          {entry.direction === "out" ? "→" : "←"}
                        </span>
                        <span className="ocs-net-topo-connection-row__labels">
                          <span className="ocs-net-topo-connection-row__name">{entry.peerLabel}</span>
                          {entry.peerSubtitle ? (
                            <span className="ocs-net-topo-connection-row__meta">{entry.peerSubtitle}</span>
                          ) : null}
                        </span>
                      </button>
                      <Button
                        variant="plain"
                        aria-label={`Remove connection to ${entry.peerLabel}`}
                        icon={<TrashIcon aria-hidden />}
                        onClick={entry.onRemove}
                      />
                    </Flex>
                  </li>
                ))}
              </ul>
            )}
          </Flex>
        )}
        {tab === "observe" && (
          <Content component="p" className="pf-v6-u-mt-md">
            Metrics and events for <strong>{resource.label}</strong> ({RESOURCE_INSTALL_STATUS_LABELS[resource.status]})
            would appear here in a connected cluster.
          </Content>
        )}
      </DrawerPanelBody>
    </>
  );
}

function WorkerGroupSidePanel({
  group,
  standaloneResources,
  networkNodeAssignments,
  onWorkerAssignmentChange,
  onClose,
}: {
  group: WorkerNodeGroup;
  standaloneResources: StandaloneTopologyResource[];
  networkNodeAssignments: NetworkNodeAssignments;
  onWorkerAssignmentChange?: (logicalId: string, workerId: string, assigned: boolean) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("details");
  const [isAddNetworkOpen, setIsAddNetworkOpen] = useState(false);

  useEffect(() => {
    setTab("details");
    setIsAddNetworkOpen(false);
  }, [group.id]);

  const logicalNetworks = useMemo(
    () => standaloneResources.filter(isLogicalNetworkStandalone),
    [standaloneResources]
  );

  const assignedNetworks = useMemo(
    () => logicalNetworks.filter((network) => (networkNodeAssignments[network.id] ?? []).includes(group.id)),
    [logicalNetworks, networkNodeAssignments, group.id]
  );

  const unassignedNetworks = useMemo(
    () => logicalNetworks.filter((network) => !(networkNodeAssignments[network.id] ?? []).includes(group.id)),
    [logicalNetworks, networkNodeAssignments, group.id]
  );

  return (
    <>
      <DrawerHead>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flex={{ default: "flex_1" }}>
          <span className="ocs-net-topo-sidepanel__icon ocs-net-topo-sidepanel__icon--worker">
            <ServerIcon aria-hidden />
          </span>
          <Flex direction={{ default: "column" }} flex={{ default: "flex_1" }}>
            <Title headingLevel="h3" size="md">
              {group.shortName}
            </Title>
            <Content component="small">Worker node group</Content>
          </Flex>
        </Flex>
        <DrawerActions>
          <DrawerCloseButton onClose={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <Tabs
          activeKey={tab}
          onSelect={(_event, key) => setTab(String(key))}
          aria-label="Worker node details"
        >
          <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
          <Tab eventKey="networks" title={<TabTitleText>Networks</TabTitleText>} />
        </Tabs>

        {tab === "details" ? (
          <>
            <DescriptionList isCompact className="pf-v6-u-mt-md">
              <DescriptionListGroup>
                <DescriptionListTerm>Hostname</DescriptionListTerm>
                <DescriptionListDescription>{group.hostname}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Configured resources</DescriptionListTerm>
                <DescriptionListDescription>{group.resources.length}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }} className="pf-v6-u-mt-lg">
              <Title headingLevel="h4" size="md">
                Host configuration
              </Title>
              <Content component="p" className="ocs-net-topo-sidepanel__hint">
                Open the node details page to review capacity, conditions, and host-level networking context.
              </Content>
              <Button
                variant="secondary"
                icon={<ExternalLinkAltIcon aria-hidden />}
                onClick={() => navigate(`/compute/nodes/${encodeURIComponent(group.hostname)}`)}
              >
                View node details
              </Button>
            </Flex>
          </>
        ) : null}

        {tab === "networks" ? (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-mt-md">
            <Content component="p" className="ocs-net-topo-sidepanel__hint">
              Assign logical networks to this worker. Changes sync to the topology canvas immediately.
            </Content>

            <Title headingLevel="h4" size="md">
              Assigned networks
            </Title>
            {assignedNetworks.length === 0 ? (
              <Content component="p">No logical networks assigned to this worker.</Content>
            ) : (
              <ul className="ocs-net-topo-connection-list" aria-label="Assigned logical networks">
                {assignedNetworks.map((network) => (
                  <li key={network.id}>
                    <Flex
                      alignItems={{ default: "alignItemsCenter" }}
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      className="ocs-net-topo-connection-row"
                    >
                      <Flex direction={{ default: "column" }} gap={{ default: "gapNone" }}>
                        <span className="ocs-net-topo-connection-row__name">{network.label}</span>
                        <Content component="small">{RESOURCE_KIND_LABELS[network.kind]}</Content>
                      </Flex>
                      <Button
                        variant="plain"
                        aria-label={`Remove ${network.label} from ${group.shortName}`}
                        icon={<TrashIcon aria-hidden />}
                        onClick={() => onWorkerAssignmentChange?.(network.id, group.id, false)}
                      />
                    </Flex>
                  </li>
                ))}
              </ul>
            )}

            <Title headingLevel="h4" size="md">
              Add network
            </Title>
            {unassignedNetworks.length === 0 ? (
              <Content component="small">All logical networks are already assigned to this worker.</Content>
            ) : (
              <Select
                isOpen={isAddNetworkOpen}
                selected={null}
                onSelect={(_event, value) => {
                  if (typeof value === "string") {
                    onWorkerAssignmentChange?.(value, group.id, true);
                  }
                  setIsAddNetworkOpen(false);
                }}
                onOpenChange={(open) => setIsAddNetworkOpen(open)}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setIsAddNetworkOpen(!isAddNetworkOpen)} isExpanded={isAddNetworkOpen}>
                    Select a logical network
                  </MenuToggle>
                )}
                aria-label="Add logical network to worker"
              >
                <SelectList>
                  {unassignedNetworks.map((network) => (
                    <SelectOption key={network.id} value={network.id}>
                      {network.label} ({RESOURCE_KIND_LABELS[network.kind]})
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            )}

            <Title headingLevel="h4" size="md">
              Configured resources
            </Title>
            <DescriptionList isCompact>
              {group.resources.map((resource) => (
                <DescriptionListGroup key={resource.id}>
                  <DescriptionListTerm>{resource.label}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {RESOURCE_KIND_LABELS[resource.kind]} · {RESOURCE_INSTALL_STATUS_LABELS[resource.status]}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </Flex>
        ) : null}
      </DrawerPanelBody>
    </>
  );
}

export default function NetworkTopologyPanel({
  groups = WORKER_NODE_GROUPS,
  standaloneResources = [],
  crossEdges = [],
  networkNodeAssignments = {},
  revealedGroupIds = [],
  onStandaloneResourcesChange,
  onCrossEdgesChange,
  onWorkerAssignmentChange,
  onAttachStandaloneToGroup,
  onResourceLifecycleAction,
  onCreateResource,
  onOpenWorkerNodeModal,
  onRequestRemoveWorkerGroup,
  onNadCreated,
  onUdnCreated,
  onCudnCreated,
  onNncpCreated,
  nncWizard,
  activeStep,
  physicalNetworkName,
  provisionGeneration = 0,
  nncProfiles = NNC_PROFILE_OPTIONS,
  onPhysicalNetworkChange,
  fitContentToken = 0,
  highlightResourceSuffix,
  viewMode = "topology",
  onViewModeChange,
}: {
  groups?: WorkerNodeGroup[];
  standaloneResources?: StandaloneTopologyResource[];
  crossEdges?: TopologyCrossEdge[];
  networkNodeAssignments?: NetworkNodeAssignments;
  revealedGroupIds?: string[];
  onStandaloneResourcesChange?: (resources: StandaloneTopologyResource[]) => void;
  onCrossEdgesChange?: (edges: TopologyCrossEdge[] | ((prev: TopologyCrossEdge[]) => TopologyCrossEdge[])) => void;
  onWorkerAssignmentChange?: (logicalId: string, workerId: string, assigned: boolean) => void;
  onResourceLifecycleAction?: (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => void;
  onAttachStandaloneToGroup?: (resourceId: string, groupId: string, connectToResourceId?: string) => void;
  onCreateResource?: (resource: NetworkCreateResource) => void;
  onOpenWorkerNodeModal?: () => void;
  onRequestRemoveWorkerGroup?: (worker: { id: string; shortName: string; hostname: string }) => void;
  onNadCreated?: (record: NadRecord) => void;
  onUdnCreated?: (record: UdnRecord) => void;
  onCudnCreated?: (record: UdnRecord) => void;
  onNncpCreated?: (record: NncpRecord) => void;
  nncWizard?: NetworkTopologyNncWizardProps;
  activeStep?: TopologyStep;
  physicalNetworkName?: string;
  provisionGeneration?: number;
  nncProfiles?: NncProfile[];
  onPhysicalNetworkChange?: (physicalNetworkName: string) => void;
  fitContentToken?: number;
  highlightResourceSuffix?: string;
  viewMode?: NodeNetworkViewMode;
  onViewModeChange?: (mode: NodeNetworkViewMode) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 24, y: 48 });
  const [selection, setSelection] = useState<TopologySelection | null>(null);
  const selected = selectedResourceFrom(selection);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKind, setFilterKind] = useState<ResourceFilterValue>("all");
  const [filterSelectOpen, setFilterSelectOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
  const [activeCreateResource, setActiveCreateResource] = useState<NetworkCreateResource | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    title: string;
    variant: "success" | "warning" | "info";
  } | null>(null);
  const [smoothTransform, setSmoothTransform] = useState(false);
  const smoothTimer = useRef<number | null>(null);
  const groupDragMoved = useRef(false);
  const groupDragStart = useRef({ x: 0, y: 0 });
  const dragSessionRef = useRef<
    | { kind: "group"; groupId: string; offsetX: number; offsetY: number }
    | {
        kind: "resource";
        groupId: string;
        resourceId: string;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
      }
    | { kind: "standalone"; resourceId: string; offsetX: number; offsetY: number }
    | null
  >(null);
  const dragCaptureRef = useRef<{ element: HTMLElement; pointerId: number } | null>(null);

  const registerDragCapture = useCallback((element: HTMLElement, pointerId: number) => {
    dragCaptureRef.current = { element, pointerId };
    element.setPointerCapture(pointerId);
  }, []);

  const releaseDragCapture = useCallback(() => {
    const capture = dragCaptureRef.current;
    if (!capture) return;
    try {
      if (capture.element.hasPointerCapture(capture.pointerId)) {
        capture.element.releasePointerCapture(capture.pointerId);
      }
    } catch {
      /* pointer already released */
    }
    dragCaptureRef.current = null;
  }, []);

  const [positions, setPositions] = useState<PositionMap>(initializePositions);

  const [edgesByGroup, setEdgesByGroup] = useState<EdgeMap>(() =>
    Object.fromEntries(WORKER_NODE_GROUPS.map((g) => [g.id, [...g.edges]]))
  );
  const [standaloneEdges, setStandaloneEdges] = useState<TopologyEdge[]>([]);

  const [linkDrag, setLinkDrag] = useState<LinkDragState | null>(null);
  const [dragging, setDragging] = useState<{
    groupId: string;
    resourceId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [draggingStandalone, setDraggingStandalone] = useState<{
    resourceId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [draggingGroup, setDraggingGroup] = useState<{
    groupId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [groupPositions, setGroupPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hoveredPeerId, setHoveredPeerId] = useState<string | null>(null);
  const [hoveredEdgeKey, setHoveredEdgeKey] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<CanvasEdgeSelection | null>(null);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [layoutMode, setLayoutMode] = useState<CanvasLayoutMode>(() => readTopologyLayoutMode());

  const isolateCanvasPointerEvent = useCallback((event: React.PointerEvent) => {
    if (dragSessionRef.current) return;
    event.stopPropagation();
  }, []);

  useEffect(() => {
    if (layoutMode !== "grid") return;
    setPositions((prev) => applyStructuredGridToAllGroups(groups, prev));
  }, [layoutMode, groups]);

  useEffect(() => {
    setEdgesByGroup((prev) => {
      const next: EdgeMap = { ...prev };
      groups.forEach((group) => {
        const merged = [...(next[group.id] ?? [])];
        group.edges.forEach((edge) => {
          if (!merged.some((e) => e.id === edge.id)) merged.push(edge);
        });
        next[group.id] = merged;
      });
      return next;
    });

    setPositions((prev) => {
      let next = { ...prev };
      groups.forEach((group) => {
        group.resources.forEach((resource) => {
          const key = posKey(group.id, resource.id);
          if (!next[key] || resource.status === "creating") {
            next[key] = { x: resource.x, y: resource.y };
          }
        });
        next = resolveGroupOverlaps(group, next);
      });
      return next;
    });
  }, [groups]);

  const isHighlighted = useCallback(
    (resource: NetResource) => (activeStep ? resource.highlightSteps.includes(activeStep) : false),
    [activeStep]
  );

  const pathHighlight = useMemo(
    () =>
      resolveTopologyPathHighlight({
        anchorResourceId: selection?.type === "resource" ? selection.resource.id : null,
        anchorGroupId:
          selection?.type === "workerGroup"
            ? selection.group.id
            : selection?.type === "resource" && selection.resource.placement === "group"
              ? selection.resource.group.id
              : null,
        hoverResourceId: hoveredPeerId,
        groups,
        standaloneResources,
        crossEdges,
        edgesByGroup,
        networkNodeAssignments,
      }),
    [
      selection,
      hoveredPeerId,
      groups,
      standaloneResources,
      crossEdges,
      edgesByGroup,
      networkNodeAssignments,
    ]
  );

  const pathTraversalActive = hasActivePath(pathHighlight);

  const isPathHighlighted = useCallback(
    (resourceId: string) => isResourceOnPath(pathHighlight, resourceId),
    [pathHighlight]
  );

  const isPathEdgeHighlighted = useCallback(
    (fromId: string, toId: string) => isInternalEdgeOnPath(pathHighlight, fromId, toId),
    [pathHighlight]
  );

  const assignedIds = useMemo(
    () => visibleTopologyGroupIds(networkNodeAssignments, revealedGroupIds),
    [networkNodeAssignments, revealedGroupIds]
  );

  const visibleGroups = useMemo(
    () => groups.filter((group) => assignedIds.has(group.id)),
    [groups, assignedIds]
  );

  const resourceVisible = useCallback(
    (resource: NetResource) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        resource.label.toLowerCase().includes(q) ||
        RESOURCE_KIND_LABELS[resource.kind].toLowerCase().includes(q) ||
        RESOURCE_INSTALL_STATUS_LABELS[resource.status].toLowerCase().includes(q);
      const matchesKind = filterKind === "all" || resource.kind === filterKind;
      return matchesSearch && matchesKind;
    },
    [searchTerm, filterKind]
  );

  const standaloneVisible = useCallback(
    (resource: StandaloneTopologyResource) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        resource.label.toLowerCase().includes(q) ||
        resource.targetNodeLabel.toLowerCase().includes(q) ||
        RESOURCE_KIND_LABELS[resource.kind].toLowerCase().includes(q) ||
        RESOURCE_INSTALL_STATUS_LABELS[resource.status].toLowerCase().includes(q);
      const matchesKind = filterKind === "all" || resource.kind === filterKind;
      return matchesSearch && matchesKind;
    },
    [searchTerm, filterKind]
  );

  const visibleGroupsFiltered = useMemo(
    () => visibleGroups.filter((g) => g.resources.some(resourceVisible)),
    [visibleGroups, resourceVisible]
  );

  const visibleStandalones = useMemo(
    () => standaloneResources.filter(standaloneVisible),
    [standaloneResources, standaloneVisible]
  );

  const visibleLogicalStandalones = useMemo(
    () => visibleStandalones.filter(isLogicalNetworkStandalone),
    [visibleStandalones]
  );

  const visibleBridgeStandalones = useMemo(
    () => visibleStandalones.filter((resource) => !isLogicalNetworkStandalone(resource)),
    [visibleStandalones]
  );

  const logicalLaneLayout = useMemo(
    () => computeLogicalLaneLayout(visibleLogicalStandalones),
    [visibleLogicalStandalones]
  );

  const workerGroupY = useMemo(() => {
    if (logicalLaneLayout) {
      return logicalLaneLayout.top + logicalLaneLayout.height + LOGICAL_TO_WORKER_GAP;
    }
    return workerGroupBaseY(false);
  }, [logicalLaneLayout]);

  const resourceKindCounts = useMemo(
    () => countResourcesByKind(groups, standaloneResources),
    [groups, standaloneResources]
  );

  const layoutPositions = useMemo(() => {
    let next: PositionMap = { ...positions };
    groups.forEach((group) => {
      next = resolveGroupOverlaps(group, next);
    });
    return next;
  }, [groups, positions, layoutRevision]);

  const groupLayouts = useMemo(() => {
    const layouts: Record<string, GroupLayout> = {};
    groups.forEach((group) => {
      layouts[group.id] = computeGroupLayout(
        group,
        layoutPositions,
        group.resources.filter(resourceVisible)
      );
    });
    return layouts;
  }, [groups, layoutPositions, resourceVisible, layoutRevision]);

  useEffect(() => {
    const onResize = () => setLayoutRevision((revision) => revision + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const edgeKeyFor = useCallback((scope: CanvasEdgeSelection["scope"], edgeId: string) => {
    return `${scope}:${edgeId}`;
  }, []);

  const topologyGroupIdsKey = visibleGroups.map((group) => group.id).join(",");

  useEffect(() => {
    setGroupPositions((prev) => {
      const onCanvasIds = new Set(visibleGroups.map((group) => group.id));
      const next: Record<string, { x: number; y: number }> = {};
      let changed = false;

      Object.entries(prev).forEach(([id, pos]) => {
        if (onCanvasIds.has(id)) {
          next[id] = pos;
        } else {
          changed = true;
        }
      });

      visibleGroups.forEach((group, index) => {
        if (!next[group.id]) {
          const slotWidth = Math.max(GROUP_W, 280);
          next[group.id] =
            layoutMode === "grid"
              ? workerGroupGridPosition(index, workerGroupY)
              : { x: BASE_X + index * (slotWidth + 64), y: workerGroupY };
          changed = true;
        }
      });

      const layoutMetrics = Object.fromEntries(
        visibleGroups.map((group) => [
          group.id,
          {
            width: groupLayouts[group.id]?.width ?? GROUP_W,
            totalHeight: groupLayouts[group.id]?.totalHeight ?? GROUP_H,
          },
        ])
      );

      if (layoutMode === "grid" && visibleGroups.length > 0 && !dragSessionRef.current) {
        Object.assign(next, applyGridLayoutToGroupPositions(visibleGroups, workerGroupY, layoutMetrics));
        changed = true;
      } else if (layoutMode === "freeform" && visibleGroups.length > 1 && !dragSessionRef.current) {
        const separated = separateOverlappingWorkerGroups(
          next,
          visibleGroups.map((group) => group.id),
          layoutMetrics
        );
        const moved = visibleGroups.some(
          (group) =>
            separated[group.id]?.x !== next[group.id]?.x || separated[group.id]?.y !== next[group.id]?.y
        );
        if (moved) {
          Object.assign(next, separated);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [topologyGroupIdsKey, workerGroupY, visibleGroups, layoutMode, groupLayouts]);

  const canvasWidth = useMemo(() => {
    let width = BASE_X + GROUP_W + 48;
    visibleGroupsFiltered.forEach((group) => {
      const pos = groupPositions[group.id];
      const groupWidth = groupLayouts[group.id]?.width ?? GROUP_W;
      if (pos) width = Math.max(width, pos.x + groupWidth + 48);
    });
    visibleStandalones.forEach((resource) => {
      width = Math.max(width, resource.canvasX + RESOURCE_W + 48);
    });
    return width;
  }, [visibleGroupsFiltered, groupLayouts, groupPositions, visibleStandalones]);

  const canvasHeight = useMemo(() => {
    let maxBottom = workerGroupY + GROUP_H + 80;
    visibleGroupsFiltered.forEach((group) => {
      const layout = groupLayouts[group.id];
      const groupY = groupPositions[group.id]?.y ?? workerGroupY;
      maxBottom = Math.max(maxBottom, groupY + (layout?.totalHeight ?? GROUP_H) + 40);
    });
    visibleBridgeStandalones.forEach((resource) => {
      maxBottom = Math.max(maxBottom, resource.canvasY + RESOURCE_H + 56);
    });
    if (logicalLaneLayout) {
      maxBottom = Math.max(maxBottom, logicalLaneLayout.top + logicalLaneLayout.height + 24);
    }
    return maxBottom + BOTTOM_CANVAS_PAD;
  }, [
    visibleGroupsFiltered,
    groupLayouts,
    groupPositions,
    visibleBridgeStandalones,
    logicalLaneLayout,
    workerGroupY,
  ]);

  const getGroupPos = useCallback(
    (group: WorkerNodeGroup) => {
      const stored = groupPositions[group.id];
      if (stored) return stored;
      const index = visibleGroups.findIndex((entry) => entry.id === group.id);
      if (layoutMode === "grid" && index >= 0) {
        return workerGroupGridPosition(index, workerGroupY);
      }
      return { x: group.x, y: workerGroupY };
    },
    [groupPositions, visibleGroups, layoutMode, workerGroupY]
  );

  const getResourcePos = useCallback(
    (groupId: string, resource: NetResource) =>
      layoutPositions[posKey(groupId, resource.id)] ?? { x: resource.x, y: resource.y },
    [layoutPositions]
  );

  const triggerSmoothTransform = useCallback(() => {
    setSmoothTransform(true);
    if (smoothTimer.current) window.clearTimeout(smoothTimer.current);
    smoothTimer.current = window.setTimeout(() => setSmoothTransform(false), 480);
  }, []);

  const applyGridLayout = useCallback(() => {
    setPositions((prev) => applyStructuredGridToAllGroups(groups, prev));
    setGroupPositions((prev) => {
      const gridPositions = applyGridLayoutToGroupPositions(
        visibleGroups,
        workerGroupY,
        Object.fromEntries(
          visibleGroups.map((group) => [
            group.id,
            {
              width: groupLayouts[group.id]?.width ?? GROUP_W,
              totalHeight: groupLayouts[group.id]?.totalHeight ?? GROUP_H,
            },
          ])
        )
      );
      return { ...prev, ...gridPositions };
    });
  }, [groups, visibleGroups, workerGroupY, groupLayouts]);

  const handleLayoutModeChange = useCallback(
    (mode: CanvasLayoutMode) => {
      setLayoutMode(mode);
      writeTopologyLayoutMode(mode);
      if (mode === "grid") {
        applyGridLayout();
        triggerSmoothTransform();
      }
    },
    [applyGridLayout, triggerSmoothTransform]
  );

  const fitToContent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || (visibleGroupsFiltered.length === 0 && visibleStandalones.length === 0)) return;

    const rect = canvas.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    visibleGroupsFiltered.forEach((group) => {
      const groupPos = groupPositions[group.id] ?? { x: BASE_X, y: BASE_Y };
      const layout = groupLayouts[group.id];
      if (!layout) return;

      group.resources.filter(resourceVisible).forEach((resource) => {
        const stored = getResourcePos(group.id, resource);
        const d = displayPos(stored, layout);
        minX = Math.min(minX, groupPos.x + d.x);
        minY = Math.min(minY, groupPos.y + d.y);
        maxX = Math.max(maxX, groupPos.x + d.x + RESOURCE_W);
        maxY = Math.max(maxY, groupPos.y + d.y + RESOURCE_H);
      });
      maxY = Math.max(maxY, groupPos.y + layout.totalHeight);
    });

    visibleStandalones.forEach((resource) => {
      minX = Math.min(minX, resource.canvasX);
      minY = Math.min(minY, resource.canvasY);
      maxX = Math.max(maxX, resource.canvasX + RESOURCE_W);
      maxY = Math.max(maxY, resource.canvasY + RESOURCE_H + 28);
    });

    if (!Number.isFinite(minX)) return;

    const pad = 40;
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;
    const scaleX = rect.width / contentW;
    const scaleY = rect.height / contentH;
    const nextZoom = Math.min(1, Math.max(0.45, Math.min(scaleX, scaleY)));

    setZoom(nextZoom);
    setPan({ x: pad - minX * nextZoom, y: pad - minY * nextZoom });
    triggerSmoothTransform();
  }, [
    visibleGroupsFiltered,
    visibleStandalones,
    groupPositions,
    groupLayouts,
    getResourcePos,
    resourceVisible,
    triggerSmoothTransform,
  ]);

  useEffect(() => {
    if (fitContentToken === 0) return undefined;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => fitToContent());
    });
    return () => cancelAnimationFrame(frame);
  }, [fitContentToken, fitToContent]);

  const clientToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan.x, pan.y, zoom]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (openGroupMenuId) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-resource")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-resource__connector")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-edge-hit")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-group")) return;
    setOpenGroupMenuId(null);
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const resetGroupLayout = useCallback((group: WorkerNodeGroup) => {
    if (layoutMode === "grid") {
      setPositions((prev) => applyStructuredGridToGroup(group, prev));
      triggerSmoothTransform();
      return;
    }
    const baseline = WORKER_NODE_GROUPS.find((g) => g.id === group.id);
    setPositions((prev) => {
      let next = { ...prev };
      group.resources.forEach((resource) => {
        const baselineResource = baseline?.resources.find((r) => r.id === resource.id);
        next[posKey(group.id, resource.id)] = baselineResource
          ? { x: baselineResource.x, y: baselineResource.y }
          : { x: resource.x, y: resource.y };
      });
      next = resolveGroupOverlaps(group, next);
      return next;
    });
    triggerSmoothTransform();
  }, [layoutMode, triggerSmoothTransform]);

  const attachStandalone = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      setStandaloneEdges((prev) => prev.filter((e) => e.from !== resourceId && e.to !== resourceId));
      onAttachStandaloneToGroup?.(resourceId, groupId, connectToResourceId);
    },
    [onAttachStandaloneToGroup]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragSessionRef.current || draggingStandalone || dragging || draggingGroup) return;
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  };

  const finishDrag = useCallback(() => {
    const session = dragSessionRef.current;
    const activeStandalone = session?.kind === "standalone" ? session : draggingStandalone;
    const activeResource = session?.kind === "resource" ? session : dragging;
    const activeGroup = session?.kind === "group" ? session : draggingGroup;

    releaseDragCapture();

    if (activeStandalone) {
      const resource = standaloneResources.find((r) => r.id === activeStandalone.resourceId);
      if (resource && !isLogicalNetworkStandalone(resource)) {
        const rect = standaloneCanvasRect(resource);
        const centerX = rect.x + RESOURCE_W / 2;
        const centerY = rect.y + RESOURCE_H / 2;
        for (const group of visibleGroupsFiltered) {
          const groupPos = getGroupPos(group);
          const layout = groupLayouts[group.id];
          if (layout && pointInGroupSurface(centerX, centerY, groupPos, layout)) {
            attachStandalone(resource.id, group.id);
            break;
          }
        }
      }
      triggerSmoothTransform();
      setDraggingStandalone(null);
    }
    if (activeResource) {
      const group = groups.find((g) => g.id === activeResource.groupId);
      if (group) {
        setPositions((prev) =>
          layoutMode === "grid"
            ? applyStructuredGridToGroup(group, prev)
            : resolveGroupOverlaps(group, prev)
        );
      }
      triggerSmoothTransform();
      setDragging(null);
    }
    if (activeGroup) {
      const draggedGroup = groups.find((g) => g.id === activeGroup.groupId);
      if (draggedGroup && !groupDragMoved.current) {
        setSelection({ type: "workerGroup", group: draggedGroup });
      }
      triggerSmoothTransform();
      setDraggingGroup(null);
    }

    dragSessionRef.current = null;
    setIsPanning(false);
  }, [
    draggingStandalone,
    dragging,
    draggingGroup,
    standaloneResources,
    visibleGroupsFiltered,
    getGroupPos,
    groupLayouts,
    attachStandalone,
    triggerSmoothTransform,
    groups,
    layoutMode,
    releaseDragCapture,
  ]);

  const handleDragRelease = useCallback(
    (event: React.PointerEvent | PointerEvent) => {
      if (!dragSessionRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      finishDrag();
    },
    [finishDrag]
  );

  const handleMouseUp = () => {
    finishDrag();
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;
      const canvas = clientToCanvas(e.clientX, e.clientY);
      if (session.kind === "group") {
        const moved =
          Math.abs(e.clientX - groupDragStart.current.x) > 4 ||
          Math.abs(e.clientY - groupDragStart.current.y) > 4;
        if (moved) groupDragMoved.current = true;
        setGroupPositions((prev) => ({
          ...prev,
          [session.groupId]: {
            x: canvas.x - session.offsetX,
            y: canvas.y - session.offsetY,
          },
        }));
        return;
      }
      if (session.kind === "standalone" && onStandaloneResourcesChange) {
        onStandaloneResourcesChange(
          standaloneResources.map((resource) => {
            if (resource.id !== session.resourceId) return resource;
            return {
              ...resource,
              canvasX: canvas.x - session.offsetX,
              canvasY: canvas.y - session.offsetY,
            };
          })
        );
        return;
      }
      if (session.kind === "resource") {
        const group = groups.find((g) => g.id === session.groupId);
        if (!group) return;
        const groupPos = getGroupPos(group);
        const layout = groupLayouts[group.id];
        if (!layout) return;
        const displayX = canvas.x - groupPos.x - session.startX;
        const displayY = canvas.y - groupPos.y - session.startY;
        const next = {
          x: displayX + layout.minX - GROUP_SURFACE_INSET,
          y: displayY + layout.minY - GROUP_SURFACE_INSET,
        };
        setPositions((prev) => dragWithPush(group, session.resourceId, next, prev));
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (!dragSessionRef.current) return;
      e.preventDefault();
      finishDrag();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [
    clientToCanvas,
    onStandaloneResourcesChange,
    standaloneResources,
    groups,
    getGroupPos,
    groupLayouts,
    finishDrag,
  ]);

  const addEdge = (groupId: string, from: string, to: string) => {
    if (from === to) return;
    const id = `${from}__${to}`;
    setEdgesByGroup((prev) => {
      const list = prev[groupId] ?? [];
      if (list.some((e) => e.id === id || (e.from === from && e.to === to))) return prev;
      return { ...prev, [groupId]: [...list, { id, from, to }] };
    });
  };

  const removeEdge = (groupId: string, edgeId: string) => {
    setEdgesByGroup((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).filter((e) => e.id !== edgeId),
    }));
  };

  const addStandaloneEdge = (from: string, to: string) => {
    if (from === to) return;
    const id = `${from}__${to}`;
    setStandaloneEdges((prev) => {
      if (prev.some((e) => e.id === id || (e.from === from && e.to === to))) return prev;
      return [...prev, { id, from, to }];
    });
  };

  const removeStandaloneEdge = (edgeId: string) => {
    setStandaloneEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    if (selectedEdge.scope === "group") {
      setEdgesByGroup((prev) => ({
        ...prev,
        [selectedEdge.groupId]: (prev[selectedEdge.groupId] ?? []).filter((e) => e.id !== selectedEdge.edgeId),
      }));
    } else if (selectedEdge.scope === "cross") {
      onWorkerAssignmentChange?.(selectedEdge.fromStandaloneId, selectedEdge.toGroupId, false);
    } else {
      setStandaloneEdges((prev) => prev.filter((e) => e.id !== selectedEdge.edgeId));
    }
    setSelectedEdge(null);
    setHoveredEdgeKey(null);
  }, [selectedEdge, onWorkerAssignmentChange]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedEdge) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      deleteSelectedEdge();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEdge, deleteSelectedEdge]);

  useEffect(() => {
    if (!linkDrag) return;

    const onPointerMove = (e: PointerEvent) => {
      setLinkDrag((prev) =>
        prev ? { ...prev, current: clientToCanvas(e.clientX, e.clientY) } : null
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      const canvas = clientToCanvas(e.clientX, e.clientY);
      const target = findResourceAtCanvasPoint(
        groups,
        groupPositions,
        groupLayouts,
        positions,
        standaloneResources,
        canvas.x,
        canvas.y,
        { scope: linkDrag.scope, groupId: linkDrag.groupId, resourceId: linkDrag.resourceId }
      );

      const sourceStandalone = standaloneResources.find((r) => r.id === linkDrag.resourceId);
      const isLogicalSource = sourceStandalone ? isLogicalNetworkStandalone(sourceStandalone) : false;

      if (linkDrag.scope === "standalone") {
        if (isLogicalSource) {
          if (target?.kind === "group" && target.resource.kind === "bridge") {
            onWorkerAssignmentChange?.(linkDrag.resourceId, target.group.id, true);
          }
        } else if (target?.kind === "group") {
          attachStandalone(linkDrag.resourceId, target.group.id, target.resource.id);
        } else if (target?.kind === "standalone" && !isLogicalNetworkStandalone(target.standalone)) {
          addStandaloneEdge(linkDrag.resourceId, target.standalone.id);
        }
      } else if (linkDrag.scope === "group" && linkDrag.groupId) {
        if (target?.kind === "standalone" && isLogicalNetworkStandalone(target.standalone)) {
          onWorkerAssignmentChange?.(target.standalone.id, linkDrag.groupId, true);
        } else if (target?.kind === "standalone") {
          attachStandalone(target.standalone.id, linkDrag.groupId, linkDrag.resourceId);
        } else if (target?.kind === "group" && target.group.id === linkDrag.groupId) {
          addEdge(linkDrag.groupId, linkDrag.resourceId, target.resource.id);
        }
      }

      setLinkDrag(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    linkDrag,
    groups,
    groupPositions,
    groupLayouts,
    positions,
    standaloneResources,
    clientToCanvas,
    attachStandalone,
    addStandaloneEdge,
    addEdge,
    onWorkerAssignmentChange,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLinkDrag(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleResourcePointerDown = (
    e: React.PointerEvent,
    group: WorkerNodeGroup,
    resource: NetResource
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (layoutMode === "grid") return;
    const pos = getResourcePos(group.id, resource);
    const groupPos = getGroupPos(group);
    const layout = groupLayouts[group.id];
    const display = layout ? displayPos(pos, layout) : pos;
    const canvas = clientToCanvas(e.clientX, e.clientY);
    const session = {
      kind: "resource" as const,
      groupId: group.id,
      resourceId: resource.id,
      startX: canvas.x - groupPos.x - display.x,
      startY: canvas.y - groupPos.y - display.y,
      origX: pos.x,
      origY: pos.y,
    };
    dragSessionRef.current = session;
    setDragging(session);
    registerDragCapture(e.currentTarget as HTMLElement, e.pointerId);
  };

  const handleGroupPointerDown = (e: React.PointerEvent, group: WorkerNodeGroup) => {
    if (e.button !== 0) return;
    if (layoutMode === "grid") return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-group__actions")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-resource")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-resource__connector")) return;
    e.stopPropagation();
    groupDragMoved.current = false;
    groupDragStart.current = { x: e.clientX, y: e.clientY };
    const groupPos = getGroupPos(group);
    const canvas = clientToCanvas(e.clientX, e.clientY);
    const session = {
      kind: "group" as const,
      groupId: group.id,
      offsetX: canvas.x - groupPos.x,
      offsetY: canvas.y - groupPos.y,
    };
    dragSessionRef.current = session;
    setDraggingGroup(session);
    registerDragCapture(e.currentTarget as HTMLElement, e.pointerId);
  };

  const handleGroupSurfaceClick = (e: React.MouseEvent, group: WorkerNodeGroup) => {
    e.stopPropagation();
    if (groupDragMoved.current) return;
    setSelection({ type: "workerGroup", group });
  };

  const selectPeerResource = useCallback(
    (peerId: string) => {
      const standalone = standaloneResources.find((resource) => resource.id === peerId);
      if (standalone) {
        setSelection({ type: "resource", resource: { ...standalone, placement: "standalone" } });
        return;
      }
      for (const group of groups) {
        const resource = group.resources.find((entry) => entry.id === peerId);
        if (resource) {
          setSelection({ type: "resource", resource: { ...resource, group, placement: "group" } });
          return;
        }
      }
    },
    [groups, standaloneResources]
  );

  const getTableResourceConnections = useCallback(
    (groupId: string, resourceId: string): TableResourceConnection[] => {
      const group = groups.find((entry) => entry.id === groupId);
      const resource = group?.resources.find((entry) => entry.id === resourceId);
      if (!group || !resource) return [];
      const selected: SelectedResource = { ...resource, group, placement: "group" };
      return resolveTopologyConnections(
        selected,
        edgesByGroup,
        standaloneEdges,
        crossEdges,
        groups,
        standaloneResources,
        removeEdge,
        removeStandaloneEdge,
        onWorkerAssignmentChange ?? (() => undefined)
      ).map(({ peerId, peerLabel, direction }) => ({ peerId, peerLabel, direction }));
    },
    [
      groups,
      edgesByGroup,
      standaloneEdges,
      crossEdges,
      standaloneResources,
      removeEdge,
      removeStandaloneEdge,
      onWorkerAssignmentChange,
    ]
  );

  const isPeerHighlighted = useCallback(
    (resourceId: string) => isPathHighlighted(resourceId),
    [isPathHighlighted]
  );

  const isPeerEdgeHighlighted = useCallback(
    (fromId: string, toId: string) => isPathEdgeHighlighted(fromId, toId),
    [isPathEdgeHighlighted]
  );

  const handleConnectorPointerDown = (
    e: React.PointerEvent,
    group: WorkerNodeGroup,
    resource: NetResource
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = getResourcePos(group.id, resource);
    const groupPos = getGroupPos(group);
    const layout = groupLayouts[group.id];
    const display = layout ? displayPos(pos, layout) : pos;
    const center = {
      x: groupPos.x + display.x + RESOURCE_W / 2,
      y: groupPos.y + display.y + RESOURCE_H / 2,
    };
    setLinkDrag({
      scope: "group",
      groupId: group.id,
      resourceId: resource.id,
      start: center,
      current: center,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStandalonePointerDown = (e: React.PointerEvent, resource: StandaloneTopologyResource) => {
    e.stopPropagation();
    if (layoutMode === "grid") return;
    const canvas = clientToCanvas(e.clientX, e.clientY);
    const rect = standaloneCanvasRect(resource);
    const session = {
      kind: "standalone" as const,
      resourceId: resource.id,
      offsetX: canvas.x - rect.x,
      offsetY: canvas.y - rect.y,
    };
    dragSessionRef.current = session;
    setDraggingStandalone(session);
    registerDragCapture(e.currentTarget as HTMLElement, e.pointerId);
  };

  const handleStandaloneConnectorPointerDown = (e: React.PointerEvent, resource: StandaloneTopologyResource) => {
    e.stopPropagation();
    e.preventDefault();
    const center = standaloneCanvasCenter(resource);
    setLinkDrag({
      scope: "standalone",
      resourceId: resource.id,
      start: center,
      current: center,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResourceClick = (
    e: React.MouseEvent,
    group: WorkerNodeGroup,
    resource: NetResource
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelection({ type: "resource", resource: { ...resource, group, placement: "group" } });
  };

  const handleStandaloneClick = (resource: StandaloneTopologyResource) => {
    setSelection({ type: "resource", resource: { ...resource, placement: "standalone" } });
  };

  const renderEdgeLine = (
    group: WorkerNodeGroup,
    groupPos: { x: number; y: number },
    layout: GroupLayout,
    edge: TopologyEdge,
    from: NetResource,
    to: NetResource
  ) => {
    const fromPos = getResourcePos(group.id, from);
    const toPos = getResourcePos(group.id, to);
    const fromDisplay = displayPos(fromPos, layout);
    const toDisplay = displayPos(toPos, layout);
    const c1 = {
      x: groupPos.x + fromDisplay.x + RESOURCE_W / 2,
      y: groupPos.y + fromDisplay.y + RESOURCE_H / 2,
    };
    const c2 = {
      x: groupPos.x + toDisplay.x + RESOURCE_W / 2,
      y: groupPos.y + toDisplay.y + RESOURCE_H / 2,
    };
    const active =
      isPathEdgeHighlighted(from.id, to.id) || (isHighlighted(from) && isHighlighted(to));
    const pathActive = isPathEdgeHighlighted(from.id, to.id);
    const midX = (c1.x + c2.x) / 2;
    const midY = (c1.y + c2.y) / 2;
    const edgeKey = edgeKeyFor("group", edge.id);
    const edgeFocused =
      selectedEdge?.scope === "group" &&
      selectedEdge.groupId === group.id &&
      selectedEdge.edgeId === edge.id;
    const edgeHovered = hoveredEdgeKey === edgeKey;
    const showDelete = edgeFocused || edgeHovered;

    return (
      <g
        key={edge.id}
        className={`ocs-net-topo-edge${active ? " ocs-net-topo-edge--peer-highlight" : ""}${
          pathActive ? " ocs-net-topo-edge--path-active" : ""
        }${pathTraversalActive && !pathActive ? " ocs-net-topo-edge--path-dim" : ""}${
          edgeFocused ? " ocs-net-topo-edge--selected" : ""
        }`}
        onMouseEnter={() => setHoveredEdgeKey(edgeKey)}
        onMouseLeave={() => setHoveredEdgeKey((current) => (current === edgeKey ? null : current))}
      >
        <path
          d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
          fill="none"
          stroke="transparent"
          strokeWidth={14}
          className="ocs-net-topo-edge-hit"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEdge({
              scope: "group",
              groupId: group.id,
              edgeId: edge.id,
              from: edge.from,
              to: edge.to,
            });
            setSelection(null);
          }}
        />
        <path
          d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
          fill="none"
          stroke={active ? "var(--pf-t--global--color--brand--default)" : "var(--ocs-net-topo-edge-stroke)"}
          strokeWidth={active ? 2.5 : 2}
          strokeOpacity={active ? 1 : 0.65}
          markerEnd="url(#net-topo-arrow)"
          className="ocs-net-topo-edge__line"
          pointerEvents="none"
        />
        <EdgeDeleteHandle
          x={midX}
          y={midY}
          visible={showDelete}
          label={`Remove connection between ${from.label} and ${to.label}`}
          onDelete={() => {
            removeEdge(group.id, edge.id);
            setSelectedEdge(null);
            setHoveredEdgeKey(null);
          }}
        />
      </g>
    );
  };

  const isCanvasMenuOpen = openGroupMenuId !== null || canvasContextMenu !== null;
  const isCreateEnabled = Boolean(nncWizard || onNadCreated || onUdnCreated || onCudnCreated || onNncpCreated);

  const closeCreateDrawer = useCallback(() => {
    setActiveCreateResource(null);
  }, []);

  const handleCreateSelect = useCallback(
    (resource: NetworkCreateResource) => {
      setActiveCreateResource(resource);
      onCreateResource?.(resource);
      if (resource === "node-network-configuration") {
        nncWizard?.onOpen?.();
      }
    },
    [nncWizard, onCreateResource]
  );

  const createPanelContent = useMemo(() => {
    if (!activeCreateResource) return undefined;
    return (
      <NetworkTopologyCreatePanel
        resource={activeCreateResource}
        onClose={closeCreateDrawer}
        nncWizard={nncWizard}
        onNadCreated={onNadCreated}
        onUdnCreated={onUdnCreated}
        onCudnCreated={onCudnCreated}
        onNncpCreated={onNncpCreated}
      />
    );
  }, [
    activeCreateResource,
    closeCreateDrawer,
    nncWizard,
    onNadCreated,
    onUdnCreated,
    onCudnCreated,
    onNncpCreated,
  ]);

  const detailPanelContent = useMemo(() => {
    if (!selection) return undefined;
    return (
      <DrawerPanelContent
        isPlain
        hasNoGlass
        className="ocs-net-topo-detail-drawer"
        widths={{ default: "width_33" }}
        focusTrap={{ enabled: true }}
      >
        {selection.type === "workerGroup" ? (
          <WorkerGroupSidePanel
            group={selection.group}
            standaloneResources={standaloneResources}
            networkNodeAssignments={networkNodeAssignments}
            onWorkerAssignmentChange={onWorkerAssignmentChange}
            onClose={() => {
              setHoveredPeerId(null);
              setSelection(null);
            }}
          />
        ) : (
          <TopologySidePanel
            resource={selection.resource}
            positions={positions}
            edges={edgesByGroup}
            standaloneEdges={standaloneEdges}
            crossEdges={crossEdges}
            groups={groups}
            standaloneResources={standaloneResources}
            networkNodeAssignments={networkNodeAssignments}
            workerCatalog={TOPOLOGY_WORKER_CATALOG}
            onClose={() => {
              setHoveredPeerId(null);
              setSelection(null);
            }}
            onRemoveEdge={removeEdge}
            onRemoveStandaloneEdge={removeStandaloneEdge}
            onWorkerAssignmentChange={(logicalId, workerId, assigned) =>
              onWorkerAssignmentChange?.(logicalId, workerId, assigned)
            }
            onResourceLifecycleAction={onResourceLifecycleAction}
            onNotice={setActionNotice}
            onPeerHover={setHoveredPeerId}
            onPeerSelect={selectPeerResource}
          />
        )}
      </DrawerPanelContent>
    );
  }, [
    selection,
    positions,
    edgesByGroup,
    standaloneEdges,
    crossEdges,
    groups,
    standaloneResources,
    networkNodeAssignments,
    removeEdge,
    removeStandaloneEdge,
    onWorkerAssignmentChange,
    onResourceLifecycleAction,
    selectPeerResource,
  ]);

  const isCreateDrawerExpanded = Boolean(createPanelContent);
  const isDetailDrawerExpanded = Boolean(detailPanelContent);

  return (
    <div className="ocs-net-topo-panel">
      {actionNotice ? (
        <Alert
          variant={actionNotice.variant}
          title={actionNotice.title}
          isInline
          className="ocs-net-topo-panel__notice"
          onTimeout={() => setActionNotice(null)}
          timeout={5000}
        />
      ) : null}
      <div className="ocs-net-topo-panel__toolbar">
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          gap={{ default: "gapMd" }}
          flexWrap={{ default: "wrap" }}
          className="ocs-net-topo-panel__toolbar-row"
        >
          {viewMode === "topology" ? (
            <>
              <div className="ocs-net-topo-panel__search">
                <SearchIcon aria-hidden className="ocs-net-topo-panel__search-icon" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Find by name..."
                  aria-label="Find by name"
                />
              </div>

              <Select
                id="net-topo-resource-filter"
                aria-label="Filter by resource type"
                isOpen={filterSelectOpen}
                selected={filterKind}
                onSelect={(_event, value) => {
                  setFilterKind(String(value) as ResourceFilterValue);
                  setFilterSelectOpen(false);
                }}
                onOpenChange={setFilterSelectOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    variant={filterKind !== "all" ? "primary" : "default"}
                    onClick={() => setFilterSelectOpen((open) => !open)}
                    isExpanded={filterSelectOpen}
                    icon={<FilterIcon aria-hidden />}
                    aria-label={
                      filterKind === "all"
                        ? "Filter by resource type"
                        : `Resource filter: ${RESOURCE_KIND_LABELS[filterKind]}`
                    }
                  >
                    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                      <span>
                        {filterKind === "all" ? "Filter by resource" : RESOURCE_KIND_LABELS[filterKind]}
                      </span>
                      {filterKind !== "all" ? (
                        <Badge isRead aria-hidden>
                          {resourceKindCounts[filterKind]}
                        </Badge>
                      ) : null}
                    </Flex>
                  </MenuToggle>
                )}
              >
                <SelectList aria-label="Resource type options">
                  <SelectOption value="all">
                    <ResourceFilterOption label="All types" count={resourceKindCounts.all} />
                  </SelectOption>
                  {RESOURCE_FILTER_KINDS.map((kind) => (
                    <SelectOption key={kind} value={kind}>
                      <ResourceFilterOption label={RESOURCE_KIND_LABELS[kind]} count={resourceKindCounts[kind]} />
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>

              {isCreateEnabled ? <NetworkResourceCreateDropdown onSelect={handleCreateSelect} /> : null}

              {onOpenWorkerNodeModal ? (
                <Button
                  variant="link"
                  icon={<PlusCircleIcon aria-hidden />}
                  onClick={onOpenWorkerNodeModal}
                  aria-label="Add worker node to topology"
                >
                  Add worker node
                </Button>
              ) : null}

              {physicalNetworkName && provisionGeneration > 0 && onPhysicalNetworkChange ? (
                <NncProfileSwitcher
                  profiles={nncProfiles}
                  selectedPhysicalNetwork={physicalNetworkName}
                  onSelect={onPhysicalNetworkChange}
                />
              ) : null}
            </>
          ) : null}

          <FlexItem flex={{ default: "flex_1" }} />

          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            gap={{ default: "gapMd" }}
            className="ocs-net-topo-panel__layout-controls"
          >
            <div className="ocs-net-topo-panel__layout-switch-slot" aria-hidden={viewMode !== "topology"}>
              {viewMode === "topology" ? (
                <Switch
                  id="net-topo-grid-layout"
                  label="Grid layout"
                  isChecked={layoutMode === "grid"}
                  onChange={(_event, checked) => handleLayoutModeChange(checked ? "grid" : "freeform")}
                />
              ) : null}
            </div>
            {onViewModeChange ? (
              <TopologyViewToggle currentView={viewMode} onChange={onViewModeChange} />
            ) : null}
          </Flex>
        </Flex>
      </div>

      <div className="ocs-net-topo-panel__stage">
        {viewMode === "table" ? (
          <Drawer isExpanded={isDetailDrawerExpanded} isInline position="end">
            <DrawerContent panelContent={detailPanelContent}>
              <DrawerContentBody className="ocs-net-topo-panel__drawer-body ocs-net-topo-panel__drawer-body--table">
                <NodeNetworkTableList
                  groups={visibleGroupsFiltered}
                  selectedGroupId={selection?.type === "workerGroup" ? selection.group.id : null}
                  selectedResourceId={
                    selection?.type === "resource" && selection.resource.placement === "group"
                      ? selection.resource.id
                      : null
                  }
                  onSelectWorkerGroup={(group) => {
                    setHoveredPeerId(null);
                    setSelection({ type: "workerGroup", group });
                  }}
                  onSelectResource={(group, resourceId) => {
                    const resource = group.resources.find((entry) => entry.id === resourceId);
                    if (!resource) return;
                    setHoveredPeerId(null);
                    setSelection({ type: "resource", resource: { ...resource, group, placement: "group" } });
                  }}
                  onSelectPeer={selectPeerResource}
                  getResourceConnections={getTableResourceConnections}
                  onResourceLifecycleAction={onResourceLifecycleAction}
                  onNotice={setActionNotice}
                  onResourceDeleted={(resourceId) => {
                    if (selection?.type === "resource" && selection.resource.id === resourceId) {
                      setHoveredPeerId(null);
                      setSelection(null);
                    }
                  }}
                />
              </DrawerContentBody>
            </DrawerContent>
          </Drawer>
        ) : (
        <TopologyResizableSplit isPanelOpen={isCreateDrawerExpanded} panel={createPanelContent}>
          <Drawer isExpanded={isDetailDrawerExpanded} isInline position="end">
            <DrawerContent panelContent={detailPanelContent}>
              <DrawerContentBody className="ocs-net-topo-panel__drawer-body">
            <div
              ref={canvasRef}
              className={`ocs-net-topo-panel__canvas${
                isCanvasMenuOpen ? " ocs-net-topo-panel__canvas--menu-open" : ""
              }${layoutMode === "grid" ? " ocs-net-topo-panel__canvas--grid" : ""}${
                pathTraversalActive ? " ocs-net-topo-panel__canvas--path-active" : ""
              }`}
              onPointerDown={isolateCanvasPointerEvent}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpenGroupMenuId(null);
                const { x, y } = roundViewportPoint(event.clientX, event.clientY);
                setCanvasContextMenu({ x, y });
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (!linkDrag) {
                  setSelection(null);
                  setSelectedEdge(null);
                }
                setCanvasContextMenu(null);
              }}
              role="application"
              aria-label="Node network topology. Drag resources to reposition. Drag the arrow on a resource to connect."
            >
          <div
            className={`ocs-net-topo-panel__transform${smoothTransform ? " ocs-net-topo-panel__transform--smooth" : ""}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: canvasWidth,
              minHeight: canvasHeight,
            }}
          >
            <svg
              className="ocs-net-topo-panel__edges"
              width={canvasWidth}
              height={canvasHeight}
              aria-hidden
            >
              <defs>
                <marker id="net-topo-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="currentColor" opacity="0.7" />
                </marker>
                <marker id="net-topo-link-preview-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--pf-t--global--icon--color--regular)" opacity="0.75" />
                </marker>
              </defs>
              {standaloneEdges.map((edge) => {
                const from = visibleStandalones.find((r) => r.id === edge.from);
                const to = visibleStandalones.find((r) => r.id === edge.to);
                if (!from || !to) return null;
                const c1 = standaloneCanvasCenter(from);
                const c2 = standaloneCanvasCenter(to);
                const midX = (c1.x + c2.x) / 2;
                const midY = (c1.y + c2.y) / 2;
                const peerLit = isPeerEdgeHighlighted(edge.from, edge.to);
                const edgeKey = edgeKeyFor("standalone", edge.id);
                const edgeFocused = selectedEdge?.scope === "standalone" && selectedEdge.edgeId === edge.id;
                const edgeHovered = hoveredEdgeKey === edgeKey;
                const showDelete = edgeFocused || edgeHovered;
                return (
                  <g
                    key={edge.id}
                    className={`ocs-net-topo-edge${peerLit ? " ocs-net-topo-edge--peer-highlight" : ""}${
                      edgeFocused ? " ocs-net-topo-edge--selected" : ""
                    }`}
                    onMouseEnter={() => setHoveredEdgeKey(edgeKey)}
                    onMouseLeave={() => setHoveredEdgeKey((current) => (current === edgeKey ? null : current))}
                  >
                    <path
                      d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="ocs-net-topo-edge-hit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdge({
                          scope: "standalone",
                          edgeId: edge.id,
                          from: edge.from,
                          to: edge.to,
                        });
                        setSelection(null);
                      }}
                    />
                    <path
                      d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
                      fill="none"
                      stroke={
                        peerLit ? "var(--pf-t--global--color--brand--default)" : "var(--ocs-net-topo-edge-stroke)"
                      }
                      strokeWidth={peerLit ? 2.5 : 2}
                      strokeOpacity={peerLit ? 1 : 0.65}
                      markerEnd="url(#net-topo-arrow)"
                      className="ocs-net-topo-edge__line"
                      pointerEvents="none"
                    />
                    <EdgeDeleteHandle
                      x={midX}
                      y={midY}
                      visible={showDelete}
                      label={`Remove connection between ${from.label} and ${to.label}`}
                      onDelete={() => {
                        removeStandaloneEdge(edge.id);
                        setSelectedEdge(null);
                        setHoveredEdgeKey(null);
                      }}
                    />
                  </g>
                );
              })}
              {crossEdges.map((edge) => {
                const from = visibleStandalones.find((r) => r.id === edge.fromStandaloneId);
                const group = visibleGroupsFiltered.find((g) => g.id === edge.toGroupId);
                const bridge = group?.resources.find((r) => r.id === edge.toResourceId);
                if (!from || !group || !bridge || !resourceVisible(bridge)) return null;
                const groupPos = getGroupPos(group);
                const layout = groupLayouts[group.id];
                if (!layout) return null;
                const bridgePos = getResourcePos(group.id, bridge);
                const bridgeDisplay = displayPos(bridgePos, layout);
                const c1 = standaloneCanvasCenter(from);
                const c2 = {
                  x: groupPos.x + bridgeDisplay.x + RESOURCE_W / 2,
                  y: groupPos.y + bridgeDisplay.y + RESOURCE_H / 2,
                };
                const midY = (c1.y + c2.y) / 2;
                const midX = (c1.x + c2.x) / 2;
                const peerLit = isCrossEdgeOnPath(pathHighlight, edge.id);
                const edgeKey = edgeKeyFor("cross", edge.id);
                const edgeFocused = selectedEdge?.scope === "cross" && selectedEdge.edgeId === edge.id;
                const edgeHovered = hoveredEdgeKey === edgeKey;
                const showDelete = edgeFocused || edgeHovered;
                return (
                  <g
                    key={edge.id}
                    className={`ocs-net-topo-edge ocs-net-topo-edge--cross${
                      peerLit ? " ocs-net-topo-edge--peer-highlight ocs-net-topo-edge--path-active" : ""
                    }${pathTraversalActive && !peerLit ? " ocs-net-topo-edge--path-dim" : ""}${
                      edgeFocused ? " ocs-net-topo-edge--selected" : ""
                    }`}
                    onMouseEnter={() => setHoveredEdgeKey(edgeKey)}
                    onMouseLeave={() => setHoveredEdgeKey((current) => (current === edgeKey ? null : current))}
                  >
                    <path
                      d={`M ${c1.x} ${c1.y} C ${c1.x} ${midY}, ${c2.x} ${midY}, ${c2.x} ${c2.y}`}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="ocs-net-topo-edge-hit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdge({
                          scope: "cross",
                          edgeId: edge.id,
                          fromStandaloneId: edge.fromStandaloneId,
                          toGroupId: edge.toGroupId,
                          toResourceId: edge.toResourceId,
                        });
                        setSelection(null);
                      }}
                    />
                    <path
                      d={`M ${c1.x} ${c1.y} C ${c1.x} ${midY}, ${c2.x} ${midY}, ${c2.x} ${c2.y}`}
                      fill="none"
                      stroke={
                        peerLit
                          ? "var(--pf-t--global--color--brand--default)"
                          : RESOURCE_KIND_COLORS[from.kind]
                      }
                      strokeWidth={peerLit ? 2.5 : 2}
                      strokeOpacity={peerLit ? 1 : 0.7}
                      markerEnd="url(#net-topo-arrow)"
                      className="ocs-net-topo-edge__line"
                      pointerEvents="none"
                    />
                    <EdgeDeleteHandle
                      x={midX}
                      y={midY}
                      visible={showDelete}
                      label={`Remove connection between ${from.label} and ${bridge.label}`}
                      onDelete={() => {
                        onWorkerAssignmentChange?.(edge.fromStandaloneId, edge.toGroupId, false);
                        setSelectedEdge(null);
                        setHoveredEdgeKey(null);
                      }}
                    />
                  </g>
                );
              })}
              {visibleGroupsFiltered.flatMap((group) => {
                const edges = edgesByGroup[group.id] ?? [];
                const groupPos = getGroupPos(group);
                const layout = groupLayouts[group.id];
                if (!layout) return [];
                return edges
                  .map((edge) => {
                    const from = group.resources.find((r) => r.id === edge.from);
                    const to = group.resources.find((r) => r.id === edge.to);
                    if (!from || !to || !resourceVisible(from) || !resourceVisible(to)) return null;
                    return renderEdgeLine(group, groupPos, layout, edge, from, to);
                  })
                  .filter(Boolean);
              })}
              {linkDrag ? (
                <line
                  x1={linkDrag.start.x}
                  y1={linkDrag.start.y}
                  x2={linkDrag.current.x}
                  y2={linkDrag.current.y}
                  className="ocs-net-topo-link-preview"
                  markerEnd="url(#net-topo-link-preview-arrow)"
                />
              ) : null}
            </svg>

            {visibleGroupsFiltered.map((group) => {
              const layout = groupLayouts[group.id] ?? {
                minX: 0,
                minY: 0,
                width: group.width,
                surfaceHeight: GROUP_H - GROUP_FOOTER_GAP - GROUP_FOOTER_H,
                totalHeight: GROUP_H,
                hullPath: "",
                hullBounds: { minX: 0, minY: 0, maxX: group.width, maxY: GROUP_H },
                footerTop: GROUP_H - GROUP_FOOTER_H,
              };
              const groupPos = getGroupPos(group);
              const isGroupSelected = selection?.type === "workerGroup" && selection.group.id === group.id;
              const groupOnPath = isGroupOnPath(pathHighlight, group.id);
              return (
              <div
                key={group.id}
                className={`ocs-net-topo-group${
                  draggingGroup?.groupId === group.id ? " ocs-net-topo-group--dragging" : ""
                }${isGroupSelected ? " ocs-net-topo-group--selected" : ""}${
                  pathTraversalActive && groupOnPath ? " ocs-net-topo-group--path-active" : ""
                }${pathTraversalActive && !groupOnPath ? " ocs-net-topo-group--path-dim" : ""}`}
                style={{ left: groupPos.x, top: groupPos.y, width: layout.width, height: layout.totalHeight }}
                role="group"
                aria-label={`Node ${group.shortName}. Select or drag empty space to move the whole node group.`}
              >
                <svg
                  className="ocs-net-topo-group__hull"
                  width={layout.width}
                  height={layout.surfaceHeight}
                  aria-hidden
                >
                  <path
                    d={layout.hullPath}
                    className="ocs-net-topo-group__hull-path"
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${group.shortName} worker node group`}
                    aria-pressed={isGroupSelected}
                    onPointerDown={(e) => handleGroupPointerDown(e, group)}
                    onPointerUp={handleDragRelease}
                    onPointerCancel={handleDragRelease}
                    onClick={(e) => handleGroupSurfaceClick(e, group)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelection({ type: "workerGroup", group });
                      }
                    }}
                  />
                </svg>
                {group.resources.filter(resourceVisible).map((resource) => {
                  const onPath = isPathHighlighted(resource.id);
                  const peerHighlighted = onPath;
                  const pathDimmed = pathTraversalActive && !onPath;
                  const highlighted =
                    isHighlighted(resource) ||
                    peerHighlighted ||
                    (highlightResourceSuffix !== undefined && resource.id.endsWith(highlightResourceSuffix));
                  const isSelected =
                    selection?.type === "resource" &&
                    selection.resource.placement === "group" &&
                    selection.resource.id === resource.id &&
                    selection.resource.group.id === group.id;
                  const isLinkSource =
                    linkDrag?.scope === "group" &&
                    linkDrag.groupId === group.id &&
                    linkDrag.resourceId === resource.id;
                  const storedPos = getResourcePos(group.id, resource);
                  const pos = displayPos(storedPos, layout);
                  const kindColor = RESOURCE_KIND_COLORS[resource.kind];
                  const statusLabel = RESOURCE_INSTALL_STATUS_LABELS[resource.status];
                  const isDraggingThis = dragging?.resourceId === resource.id;
                  const underlayOffset = resource.kind === "bridge" ? BRIDGE_UNDERLAY_HEIGHT : 0;

                  return (
                    <div
                      key={resource.id}
                      className="ocs-net-topo-resource-stack"
                      style={{ left: pos.x, top: pos.y - underlayOffset }}
                    >
                      {resource.kind === "bridge" ? (
                        <PhysicalUnderlayChain bridgeResourceId={resource.id} highlighted={onPath} />
                      ) : null}
                      <div
                      role="button"
                      tabIndex={0}
                      className={`ocs-net-topo-resource ocs-net-topo-resource--${resource.status}${
                        highlighted ? " ocs-net-topo-resource--highlight" : ""
                      }${peerHighlighted ? " ocs-net-topo-resource--peer-highlight" : ""}${
                        onPath ? " ocs-net-topo-resource--path-active" : ""
                      }${pathDimmed ? " ocs-net-topo-resource--path-dim" : ""}${
                        isSelected ? " ocs-net-topo-resource--selected" : ""
                      }${isLinkSource ? " ocs-net-topo-resource--link-source" : ""}${
                        isDraggingThis ? " ocs-net-topo-resource--dragging" : ""
                      }${
                        !isDraggingThis ? " ocs-net-topo-resource--animated" : ""
                      }`}
                      style={{ borderColor: kindColor }}
                      onPointerDown={(e) => {
                        if ((e.target as HTMLElement).closest(".ocs-net-topo-resource__connector")) return;
                        handleResourcePointerDown(e, group, resource);
                      }}
                      onPointerUp={handleDragRelease}
                      onPointerCancel={handleDragRelease}
                      onClick={(e) => handleResourceClick(e, group, resource)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelection({
                            type: "resource",
                            resource: { ...resource, group, placement: "group" },
                          });
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${resource.label}, ${RESOURCE_KIND_LABELS[resource.kind]}, ${statusLabel}. Drag to move.`}
                    >
                      <span className="ocs-net-topo-resource__icon" style={{ color: kindColor }}>
                        <ResourceIcon kind={resource.kind} />
                      </span>
                      <span className="ocs-net-topo-resource__label">{resource.label}</span>
                      <span className="ocs-net-topo-resource__status-row">
                        <ResourceStatusIcon status={resource.status} />
                        <span className="ocs-net-topo-resource__status">{statusLabel}</span>
                      </span>
                      <button
                        type="button"
                        className="ocs-net-topo-resource__connector"
                        aria-label={`Connect ${resource.label} to another resource`}
                        onPointerDown={(e) => handleConnectorPointerDown(e, group, resource)}
                      >
                        <span aria-hidden>›</span>
                      </button>
                    </div>
                    </div>
                  );
                })}
                <div
                  className="ocs-net-topo-group__footer"
                  style={{
                    top: layout.footerTop,
                    left: "50%",
                    transform: "translateX(-50%)",
                    maxWidth: Math.max(160, layout.width - 24),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Label color="blue" isCompact className="ocs-resource-label">
                    N
                  </Label>
                  <span className="ocs-net-topo-group__hostname" title={group.hostname}>
                    {group.hostname}
                  </span>
                  <GroupActionsMenu
                    group={group}
                    isOpen={openGroupMenuId === group.id}
                    onOpenChange={(open) => setOpenGroupMenuId(open ? group.id : null)}
                    onResetLayout={() => resetGroupLayout(group)}
                    onNotice={setActionNotice}
                    onRemoveFromTopology={
                      onRequestRemoveWorkerGroup
                        ? () =>
                            onRequestRemoveWorkerGroup({
                              id: group.id,
                              shortName: group.shortName,
                              hostname: group.hostname,
                            })
                        : undefined
                    }
                  />
                </div>
              </div>
            );
            })}

            {logicalLaneLayout ? (
              <div
                className="ocs-net-topo-logical-lane"
                style={{
                  left: logicalLaneLayout.left,
                  top: logicalLaneLayout.top,
                  width: logicalLaneLayout.width,
                  height: logicalLaneLayout.height,
                }}
                role="region"
                aria-label="Logical networks"
              >
                <Content component="small" className="ocs-net-topo-logical-lane__label">
                  Logical networks
                </Content>
                <div className="ocs-net-topo-logical-lane__nodes">
                  {visibleLogicalStandalones.map((resource) => (
                    <StandaloneCanvasNode
                      key={resource.id}
                      resource={resource}
                      isLogical
                      logicalLane={logicalLaneLayout}
                      peerHighlighted={isPathHighlighted(resource.id)}
                      pathActive={isPathHighlighted(resource.id)}
                      pathDimmed={pathTraversalActive && !isPathHighlighted(resource.id)}
                      highlighted={
                        isHighlighted(resource) ||
                        isPeerHighlighted(resource.id) ||
                        (highlightResourceSuffix !== undefined && resource.id.endsWith(highlightResourceSuffix))
                      }
                      isSelected={selection?.type === "resource" && selection.resource.placement === "standalone" && selection.resource.id === resource.id}
                      isLinkSource={linkDrag?.scope === "standalone" && linkDrag.resourceId === resource.id}
                      isDraggingThis={draggingStandalone?.resourceId === resource.id}
                      onPointerDown={handleStandalonePointerDown}
                      onPointerUp={handleDragRelease}
                      onPointerCancel={handleDragRelease}
                      onClick={handleStandaloneClick}
                      onConnectorPointerDown={handleStandaloneConnectorPointerDown}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {visibleBridgeStandalones.map((resource) => (
              <StandaloneCanvasNode
                key={resource.id}
                resource={resource}
                isLogical={false}
                peerHighlighted={isPathHighlighted(resource.id)}
                pathActive={isPathHighlighted(resource.id)}
                pathDimmed={pathTraversalActive && !isPathHighlighted(resource.id)}
                highlighted={
                  isHighlighted(resource) ||
                  isPeerHighlighted(resource.id) ||
                  (highlightResourceSuffix !== undefined && resource.id.endsWith(highlightResourceSuffix))
                }
                isSelected={
                  selection?.type === "resource" &&
                  selection.resource.placement === "standalone" &&
                  selection.resource.id === resource.id
                }
                isLinkSource={linkDrag?.scope === "standalone" && linkDrag.resourceId === resource.id}
                isDraggingThis={draggingStandalone?.resourceId === resource.id}
                onPointerDown={handleStandalonePointerDown}
                onPointerUp={handleDragRelease}
                onPointerCancel={handleDragRelease}
                onClick={handleStandaloneClick}
                onConnectorPointerDown={handleStandaloneConnectorPointerDown}
              />
            ))}
          </div>

          <div className="ocs-net-topo-panel__controls app-glass-panel">
            <Button variant="plain" aria-label="Zoom in" icon={<ZoomInIcon />} onClick={() => setZoom((z) => Math.min(z + 0.12, 2))} />
            <Button variant="plain" aria-label="Zoom out" icon={<ZoomOutIcon />} onClick={() => setZoom((z) => Math.max(z - 0.12, 0.35))} />
            <Button variant="plain" aria-label="Fit to screen" icon={<ExpandIcon />} onClick={fitToContent} />
            <Button variant="plain" aria-expanded={showLegend} onClick={() => setShowLegend((l) => !l)}>
              Legend
            </Button>
          </div>

          {showLegend && (
            <div className="ocs-net-topo-panel__legend app-glass-panel" role="region" aria-label="Topology legend">
              <Content component="p" className="ocs-net-topo-panel__legend-title">
                Resource types
              </Content>
              {(Object.keys(RESOURCE_KIND_LABELS) as NetResourceKind[]).map((kind) => (
                <Flex key={kind} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                  <span className="ocs-net-topo-panel__legend-swatch" style={{ background: RESOURCE_KIND_COLORS[kind] }} />
                  <Content component="small">{RESOURCE_KIND_LABELS[kind]}</Content>
                </Flex>
              ))}
              <Content component="p" className="ocs-net-topo-panel__legend-title pf-v6-u-mt-md">
                Installation status
              </Content>
              {(Object.keys(RESOURCE_INSTALL_STATUS_LABELS) as ResourceInstallStatus[]).map((st) => (
                <Flex key={st} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                  <StatusBadge status={st} />
                </Flex>
              ))}
              <Content component="small" className="ocs-net-topo-panel__legend-hint pf-v6-u-mt-sm">
                CUDN and UDN appear above the canvas. Assign worker nodes from the side panel, toolbar, or right-click
                the canvas and choose Add node. Click a connection line to remove it.
              </Content>
            </div>
          )}

            </div>
                {canvasContextMenu && onOpenWorkerNodeModal ? (
                  <CanvasContextMenu
                    x={canvasContextMenu.x}
                    y={canvasContextMenu.y}
                    onClose={() => setCanvasContextMenu(null)}
                    onAddNode={onOpenWorkerNodeModal}
                  />
                ) : null}
              </DrawerContentBody>
            </DrawerContent>
          </Drawer>
        </TopologyResizableSplit>
        )}
      </div>
    </div>
  );
}
