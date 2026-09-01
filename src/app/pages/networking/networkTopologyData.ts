import type { TopologyStep } from "./networkTopologyTypes";
import { getUdnRecords, type UdnRecord } from "./networkingMockData";

export type TopologyDataScale = "compact" | "scale";

export type NetResourceKind = "bridge" | "interface" | "tunnel" | "port" | "cudn" | "udn";

/** Installation / reconciliation status for a network resource. */
export type ResourceInstallStatus =
  | "configured"
  | "pending"
  | "installing"
  | "creating"
  | "failed";

export type NetResource = {
  id: string;
  label: string;
  kind: NetResourceKind;
  x: number;
  y: number;
  status: ResourceInstallStatus;
  detail: string;
  highlightSteps: TopologyStep[];
  related?: string[];
  /** Worker group id when nested inside a node hull. */
  parentNode?: string;
};

/** Resource placed on the canvas outside any node group until linked or dropped into a group. */
export type StandaloneTopologyResource = NetResource & {
  canvasX: number;
  canvasY: number;
  targetNodeId: string;
  targetNodeLabel: string;
  /** Logical networks (CUDN/UDN) stay on the canvas and link to bridges via cross edges. */
  logicalNetwork?: boolean;
  detailPath?: string;
  topologyMode?: string;
};

export type TopologyEdge = { id: string; from: string; to: string };

/** Edge from a logical-network standalone to a bridge inside a worker group (HPUX-1768). */
export type TopologyCrossEdge = {
  id: string;
  fromStandaloneId: string;
  toGroupId: string;
  toResourceId: string;
};

export type WorkerNodeGroup = {
  id: string;
  shortName: string;
  hostname: string;
  x: number;
  y: number;
  width: number;
  height: number;
  resources: NetResource[];
  edges: TopologyEdge[];
};

export const GROUP_W = 304;
export const GROUP_H = 260;
export const GROUP_GAP = 72;
export const RESOURCE_W = 80;
export const RESOURCE_H = 92;
export const BASE_X = 40;
export const BASE_Y = 48;

export const LOGICAL_NETWORK_Y = 12;
export const LOGICAL_NETWORK_H_SPACING = 176;
/** Vertical gap between logical-network lane and worker node groups. */
export const LOGICAL_TO_WORKER_GAP = 40;

/** Matches `.ocs-net-topo-logical-lane` padding and label block in theme.css */
export const LOGICAL_LANE_PADDING_TOP = 6;
export const LOGICAL_LANE_PADDING_X = 12;
export const LOGICAL_LANE_PADDING_BOTTOM = 8;
export const LOGICAL_LANE_LABEL_BLOCK = 24;
export const LOGICAL_LANE_NODE_OFFSET = 20;
export const LOGICAL_LANE_BOTTOM_PAD = 24;

export function workerGroupBaseY(hasLogicalNetworks: boolean): number {
  if (!hasLogicalNetworks) return BASE_Y;
  const laneHeight =
    LOGICAL_LANE_PADDING_TOP +
    LOGICAL_LANE_LABEL_BLOCK +
    LOGICAL_LANE_NODE_OFFSET +
    RESOURCE_H +
    LOGICAL_LANE_BOTTOM_PAD +
    LOGICAL_LANE_PADDING_BOTTOM;
  return LOGICAL_NETWORK_Y - LOGICAL_LANE_PADDING_TOP + laneHeight + LOGICAL_TO_WORKER_GAP;
}

/** Non-overlapping grid cells inside each worker group. */
export const RESOURCE_CELL_W = 88;
export const RESOURCE_CELL_H = 100;
export const RESOURCE_GRID_ORIGIN_X = 16;
export const RESOURCE_GRID_ORIGIN_Y = 16;
export const RESOURCE_COL_GAP = 14;
export const RESOURCE_ROW_GAP = 16;

export function resourceGridPos(col: number, row: number) {
  return {
    x: RESOURCE_GRID_ORIGIN_X + col * (RESOURCE_CELL_W + RESOURCE_COL_GAP),
    y: RESOURCE_GRID_ORIGIN_Y + row * (RESOURCE_CELL_H + RESOURCE_ROW_GAP),
  };
}

/** Canonical slot layout — one resource per cell, never overlaps. */
export const RESOURCE_SLOT_LAYOUT: Record<string, { col: number; row: number }> = {
  "br-ex-a": { col: 0, row: 0 },
  "br-ex-b": { col: 1, row: 0 },
  "br-int": { col: 2, row: 0 },
  "ovn-k8s-mp0": { col: 1, row: 1 },
  "geneve": { col: 2, row: 1 },
  "ens5": { col: 0, row: 1 },
  "br-localnet": { col: 1, row: 2 },
};

export function slotKeyFromSuffix(suffix: string) {
  return RESOURCE_SLOT_LAYOUT[suffix] ?? { col: 0, row: 0 };
}

export const RESOURCE_INSTALL_STATUS_LABELS: Record<ResourceInstallStatus, string> = {
  configured: "Configured",
  pending: "Pending",
  installing: "Installing",
  creating: "Creating",
  failed: "Failed",
};

export const RESOURCE_INSTALL_STATUS_COLORS: Record<
  ResourceInstallStatus,
  "green" | "grey" | "blue" | "orange" | "red"
> = {
  configured: "green",
  pending: "grey",
  installing: "blue",
  creating: "orange",
  failed: "red",
};

function edgeId(from: string, to: string) {
  return `${from}__${to}`;
}

function buildWorkerGroup(
  id: string,
  shortName: string,
  hostname: string,
  gridX: number,
  gridY: number,
  geneSuffix: string,
  statuses: Record<string, ResourceInstallStatus>
): WorkerNodeGroup {
  const prefix = `${id}-`;
  const slotFor = (suffix: string) => {
    const slot = slotKeyFromSuffix(suffix);
    return resourceGridPos(slot.col, slot.row);
  };
  const resources: NetResource[] = [
    {
      id: `${prefix}br-ex-a`,
      label: "br-ex",
      kind: "bridge",
      ...slotFor("br-ex-a"),
      status: statuses[`${prefix}br-ex-a`] ?? "configured",
      detail: "External OVS bridge — uplink to the data center network.",
      highlightSteps: ["network-identity", "uplink-connection", "review"],
      related: [`${prefix}ens5`, `${prefix}br-ex-b`],
    },
    {
      id: `${prefix}br-ex-b`,
      label: "br-ex",
      kind: "bridge",
      ...slotFor("br-ex-b"),
      status: statuses[`${prefix}br-ex-b`] ?? "configured",
      detail: "External bridge patch port connecting br-ex to the integration bridge.",
      highlightSteps: ["uplink-connection", "review"],
      related: [`${prefix}br-ex-a`, `${prefix}br-int`],
    },
    {
      id: `${prefix}br-int`,
      label: "br-int",
      kind: "bridge",
      ...slotFor("br-int"),
      status: statuses[`${prefix}br-int`] ?? "pending",
      detail: "Integration bridge for pod and service traffic within the node.",
      highlightSteps: ["nodes-configuration", "review"],
      related: [`${prefix}ovn-k8s-mp0`, `${prefix}geneve`],
    },
    {
      id: `${prefix}geneve`,
      label: `gene_${geneSuffix}`,
      kind: "tunnel",
      ...slotFor("geneve"),
      status: statuses[`${prefix}geneve`] ?? "pending",
      detail: "Geneve tunnel endpoint for cross-node overlay traffic.",
      highlightSteps: ["settings", "review"],
    },
    {
      id: `${prefix}ovn-k8s-mp0`,
      label: "ovn-k8s-mp0",
      kind: "port",
      ...slotFor("ovn-k8s-mp0"),
      status: statuses[`${prefix}ovn-k8s-mp0`] ?? "pending",
      detail: "OVN Kubernetes management port attached to br-int.",
      highlightSteps: ["nodes-configuration", "review"],
    },
    {
      id: `${prefix}ens5`,
      label: "ens5",
      kind: "interface",
      ...slotFor("ens5"),
      status: statuses[`${prefix}ens5`] ?? "configured",
      detail: "Physical NIC uplink — VLAN 100 to the data center network.",
      highlightSteps: ["uplink-connection", "settings", "review"],
      related: [`${prefix}br-ex-a`],
    },
  ];

  const edgePairs: [string, string][] = [
    [`${prefix}br-ex-a`, `${prefix}br-ex-b`],
    [`${prefix}br-ex-b`, `${prefix}br-int`],
    [`${prefix}br-ex-a`, `${prefix}ens5`],
    [`${prefix}br-int`, `${prefix}ovn-k8s-mp0`],
    [`${prefix}br-int`, `${prefix}geneve`],
  ];

  return {
    id,
    shortName,
    hostname,
    x: gridX,
    y: gridY,
    width: GROUP_W,
    height: GROUP_H,
    resources,
    edges: edgePairs.map(([from, to]) => ({ id: edgeId(from, to), from, to })),
  };
}

/** Large-scale topology demo — grid of worker hulls with varied reconciliation status. */
export const TOPOLOGY_WORKER_COUNT = 48;
export const TOPOLOGY_WORKERS_PER_ROW = 8;

const CURATED_WORKER_HOSTNAMES: Record<number, string> = {
  0: "ip-10-0-24-42.us-east-2.compute.internal",
  1: "ip-10-0-25-18.us-east-2.compute.internal",
  2: "ip-10-0-26-91.us-east-2.compute.internal",
  3: "ip-10-0-27-14.us-east-2.compute.internal",
  4: "ip-10-0-28-55.us-east-2.compute.internal",
};

const CURATED_WORKER_STATUSES: Record<number, Record<string, ResourceInstallStatus>> = {
  0: {
    "worker-0-br-ex-a": "configured",
    "worker-0-br-ex-b": "configured",
    "worker-0-br-int": "configured",
    "worker-0-geneve": "configured",
    "worker-0-ovn-k8s-mp0": "configured",
    "worker-0-ens5": "configured",
  },
  1: {
    "worker-1-br-ex-a": "configured",
    "worker-1-br-ex-b": "configured",
    "worker-1-br-int": "installing",
    "worker-1-geneve": "pending",
    "worker-1-ovn-k8s-mp0": "creating",
    "worker-1-ens5": "configured",
  },
  2: {
    "worker-2-br-ex-a": "configured",
    "worker-2-br-ex-b": "pending",
    "worker-2-br-int": "pending",
    "worker-2-geneve": "failed",
    "worker-2-ovn-k8s-mp0": "creating",
    "worker-2-ens5": "installing",
  },
  3: {
    "worker-3-br-ex-a": "configured",
    "worker-3-br-ex-b": "configured",
    "worker-3-br-int": "pending",
    "worker-3-geneve": "pending",
    "worker-3-ovn-k8s-mp0": "pending",
    "worker-3-ens5": "configured",
  },
  4: {
    "worker-4-br-ex-a": "configured",
    "worker-4-br-ex-b": "pending",
    "worker-4-br-int": "pending",
    "worker-4-geneve": "pending",
    "worker-4-ovn-k8s-mp0": "pending",
    "worker-4-ens5": "configured",
  },
};

const RESOURCE_STATUS_CYCLE: ResourceInstallStatus[] = [
  "configured",
  "configured",
  "configured",
  "pending",
  "installing",
  "creating",
];

function workerHostname(index: number): string {
  return (
    CURATED_WORKER_HOSTNAMES[index] ??
    `ip-10-0-${20 + (index % 40)}-${(index * 11 + 14) % 100}.us-east-2.compute.internal`
  );
}

function workerGridPosition(index: number) {
  const col = index % TOPOLOGY_WORKERS_PER_ROW;
  const row = Math.floor(index / TOPOLOGY_WORKERS_PER_ROW);
  const baseY = workerGroupBaseY(true);
  return {
    x: BASE_X + col * (GROUP_W + GROUP_GAP),
    y: baseY + row * (GROUP_H + GROUP_GAP),
  };
}

function defaultWorkerStatuses(id: string, index: number): Record<string, ResourceInstallStatus> {
  const ready = index % 5 !== 2;
  const pick = (suffix: string, offset: number): ResourceInstallStatus => {
    if (suffix === "geneve" && index % 17 === 0) return "failed";
    if (ready) return "configured";
    return RESOURCE_STATUS_CYCLE[(index + offset) % RESOURCE_STATUS_CYCLE.length];
  };
  return {
    [`${id}-br-ex-a`]: "configured",
    [`${id}-br-ex-b`]: pick("br-ex-b", 1),
    [`${id}-br-int`]: pick("br-int", 2),
    [`${id}-geneve`]: pick("geneve", 3),
    [`${id}-ovn-k8s-mp0`]: pick("ovn-k8s-mp0", 4),
    [`${id}-ens5`]: pick("ens5", 5),
  };
}

function buildScaleWorkerGroups(): WorkerNodeGroup[] {
  return Array.from({ length: TOPOLOGY_WORKER_COUNT }, (_, index) => {
    const id = `worker-${index}`;
    const { x, y } = workerGridPosition(index);
    const geneSuffix = String(100 + index * 17).slice(-3);
    const statuses = CURATED_WORKER_STATUSES[index] ?? defaultWorkerStatuses(id, index);
    return buildWorkerGroup(id, id, workerHostname(index), x, y, geneSuffix, statuses);
  });
}

/** Compact demo topology — single row of workers for presentations. */
export const COMPACT_TOPOLOGY_WORKER_COUNT = 5;
export const COMPACT_TOPOLOGY_UDN_RECORD_LIMIT = 4;

function buildCompactWorkerGroups(): WorkerNodeGroup[] {
  const baseY = workerGroupBaseY(true);
  return Array.from({ length: COMPACT_TOPOLOGY_WORKER_COUNT }, (_, index) => {
    const id = `worker-${index}`;
    const x = BASE_X + index * (GROUP_W + GROUP_GAP);
    const geneSuffix = String(100 + index * 17).slice(-3);
    const statuses = CURATED_WORKER_STATUSES[index] ?? defaultWorkerStatuses(id, index);
    return buildWorkerGroup(id, id, workerHostname(index), x, baseY, geneSuffix, statuses);
  });
}

export const COMPACT_WORKER_NODE_GROUPS: WorkerNodeGroup[] = buildCompactWorkerGroups();
export const WORKER_NODE_GROUPS: WorkerNodeGroup[] = buildScaleWorkerGroups();

const BOND_WORKER_IDS = new Set(["worker-1", "worker-2", "worker-3"]);

function injectBondResources(group: WorkerNodeGroup): WorkerNodeGroup {
  if (!BOND_WORKER_IDS.has(group.id)) return group;
  const prefix = `${group.id}-`;
  const bondStatus: ResourceInstallStatus =
    group.id === "worker-2" ? "failed" : group.id === "worker-1" ? "configured" : "pending";
  const bondSlot = resourceGridPos(0, 2);
  const bondResource: NetResource = {
    id: `${prefix}bond0`,
    label: "bond0",
    kind: "interface",
    x: bondSlot.x,
    y: bondSlot.y,
    status: bondStatus,
    detail: "802.3ad LACP bond uplink aggregating physical NICs to br-ex.",
    highlightSteps: ["uplink-connection", "review"],
    related: [`${prefix}ens5`, `${prefix}br-ex-a`],
  };
  const resources = group.resources.map((resource) =>
    resource.id === `${prefix}ens5`
      ? { ...resource, detail: "Bond member — VLAN 100 uplink to the data center network." }
      : resource
  );
  resources.push(bondResource);
  const edges = [
    ...group.edges,
    { id: edgeId(`${prefix}bond0`, `${prefix}ens5`), from: `${prefix}bond0`, to: `${prefix}ens5` },
    { id: edgeId(`${prefix}bond0`, `${prefix}br-ex-a`), from: `${prefix}bond0`, to: `${prefix}br-ex-a` },
  ];
  return { ...group, resources, edges };
}

export function getWorkerGroupsForScale(scale: TopologyDataScale): WorkerNodeGroup[] {
  const source = scale === "compact" ? COMPACT_WORKER_NODE_GROUPS : WORKER_NODE_GROUPS;
  return source.map(injectBondResources);
}

/** CUDN/UDN records shown on the topology graph for the active demo scale. */
export function getUdnRecordsForScale(scale: TopologyDataScale): UdnRecord[] {
  const all = getUdnRecords();
  if (scale === "scale") return all;
  const cudns = all.filter((record) => record.kind === "CUDN").slice(0, 2);
  const udns = all.filter((record) => record.kind === "UDN").slice(0, 2);
  return [...cudns, ...udns].slice(0, COMPACT_TOPOLOGY_UDN_RECORD_LIMIT);
}

export function computeCanvasWidth(groupWidths: number[]) {
  if (groupWidths.length === 0) return BASE_X + GROUP_W + 40;
  const total =
    BASE_X +
    groupWidths.reduce((sum, w) => sum + w, 0) +
    GROUP_GAP * Math.max(0, groupWidths.length - 1) +
    40;
  return total;
}

export const TOPOLOGY_CANVAS_WIDTH = computeCanvasWidth(
  WORKER_NODE_GROUPS.map(() => GROUP_W)
);

export const RESOURCE_KIND_LABELS: Record<NetResourceKind, string> = {
  bridge: "Bridge",
  interface: "Interface",
  tunnel: "Tunnel",
  port: "Port",
  cudn: "ClusterUserDefinedNetwork",
  udn: "UserDefinedNetwork",
};

export const RESOURCE_KIND_COLORS: Record<NetResourceKind, string> = {
  bridge: "#0066cc",
  interface: "#3e8635",
  tunnel: "#6753ac",
  port: "#8f4700",
  cudn: "#6753ac",
  udn: "#009596",
};

export function logicalNetworkLaneWidth(logicalCount: number, maxIndex?: number): number {
  if (logicalCount <= 0) return 0;
  const index = maxIndex ?? logicalCount - 1;
  return RESOURCE_W + index * LOGICAL_NETWORK_H_SPACING + 32;
}

export type LogicalLaneLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  nodeCanvasY: number;
};

export function defaultLogicalNodeCanvasY(): number {
  return (
    LOGICAL_NETWORK_Y - LOGICAL_LANE_PADDING_TOP + LOGICAL_LANE_PADDING_TOP + LOGICAL_LANE_LABEL_BLOCK + LOGICAL_LANE_NODE_OFFSET
  );
}

export function logicalNodeAreaTop(laneTop: number): number {
  return laneTop + LOGICAL_LANE_PADDING_TOP + LOGICAL_LANE_LABEL_BLOCK;
}

export function effectiveLogicalCanvasY(resource: StandaloneTopologyResource): number {
  const defaultY = defaultLogicalNodeCanvasY();
  if (resource.canvasY < defaultY - 8) return defaultY;
  return resource.canvasY;
}

export function computeLogicalLaneLayout(
  standalones: StandaloneTopologyResource[]
): LogicalLaneLayout | null {
  if (standalones.length === 0) return null;

  const defaultTop = LOGICAL_NETWORK_Y - LOGICAL_LANE_PADDING_TOP;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  standalones.forEach((resource) => {
    const y = effectiveLogicalCanvasY(resource);
    minX = Math.min(minX, resource.canvasX);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, resource.canvasX + RESOURCE_W);
    maxY = Math.max(maxY, y + RESOURCE_H);
  });

  const left = minX - LOGICAL_LANE_PADDING_X;
  const top = Math.min(defaultTop, minY - LOGICAL_LANE_PADDING_TOP - LOGICAL_LANE_LABEL_BLOCK);
  const width = Math.max(
    logicalNetworkLaneWidth(standalones.length),
    maxX - left + LOGICAL_LANE_PADDING_X
  );
  const height = Math.max(
    LOGICAL_LANE_PADDING_TOP +
      LOGICAL_LANE_LABEL_BLOCK +
      LOGICAL_LANE_NODE_OFFSET +
      RESOURCE_H +
      LOGICAL_LANE_BOTTOM_PAD +
      LOGICAL_LANE_PADDING_BOTTOM,
    maxY - top + LOGICAL_LANE_BOTTOM_PAD + LOGICAL_LANE_PADDING_BOTTOM
  );
  const nodeCanvasY = logicalNodeAreaTop(top) + LOGICAL_LANE_NODE_OFFSET;

  return { left, top, width, height, nodeCanvasY };
}

/** Prototype Node Network Configuration profiles for toolbar switching. */
export type NncProfile = {
  id: string;
  physicalNetworkName: string;
  label: string;
  description: string;
};

export const NNC_PROFILE_OPTIONS: NncProfile[] = [
  {
    id: "localnet-rzpi1d",
    physicalNetworkName: "localnet-rzpi1d",
    label: "localnet-rzpi1d",
    description: "Default localnet VLAN 100 uplink on worker nodes",
  },
  {
    id: "localnet-secondary",
    physicalNetworkName: "localnet-secondary",
    label: "localnet-secondary",
    description: "Secondary localnet segment for tenant workloads",
  },
  {
    id: "external-mgmt",
    physicalNetworkName: "external-mgmt",
    label: "external-mgmt",
    description: "External management network for cluster operations",
  },
];

export function isLogicalNetworkStandalone(resource: StandaloneTopologyResource): boolean {
  return resource.logicalNetwork === true || resource.kind === "cudn" || resource.kind === "udn";
}

export function logicalNetworkId(name: string, kind: "CUDN" | "UDN"): string {
  return `logical-${kind === "CUDN" ? "cudn" : "udn"}-${name}`;
}

export function logicalNetworkFromRecord(
  record: {
    name: string;
    kind: "CUDN" | "UDN";
    topology: string;
    namespace?: string;
    condition?: string;
  },
  index: number,
  detailPath: string
): StandaloneTopologyResource {
  const kind = record.kind === "CUDN" ? "cudn" : "udn";
  const id = logicalNetworkId(record.name, record.kind);
  const configured = !record.condition?.includes("False");

  return {
    id,
    label: record.name,
    kind,
    x: 0,
    y: 0,
    canvasX: BASE_X + index * LOGICAL_NETWORK_H_SPACING,
    canvasY: defaultLogicalNodeCanvasY(),
    status: configured ? "configured" : "creating",
    targetNodeId: "",
    targetNodeLabel: record.kind === "CUDN" ? "Cluster-scoped" : record.namespace ?? "Project",
    logicalNetwork: true,
    detailPath,
    topologyMode: record.topology,
    detail:
      record.kind === "CUDN"
        ? `Cluster user-defined network (${record.topology}). Runs on OVS bridges across worker nodes.`
        : `Project user-defined network (${record.topology}). Runs on OVS bridges on selected nodes.`,
    highlightSteps: [],
  };
}

/** Worker nodes available for assignment to logical networks in the topology prototype. */
export type TopologyWorkerCatalogEntry = {
  id: string;
  shortName: string;
  hostname: string;
  ready: boolean;
};

export const TOPOLOGY_WORKER_CATALOG: TopologyWorkerCatalogEntry[] = WORKER_NODE_GROUPS.map((group) => ({
  id: group.id,
  shortName: group.shortName,
  hostname: group.hostname,
  ready: group.resources.every((resource) => resource.status !== "failed"),
}));

export function topologyWorkerCatalogFromGroups(groups: WorkerNodeGroup[]): TopologyWorkerCatalogEntry[] {
  return groups.map((group) => ({
    id: group.id,
    shortName: group.shortName,
    hostname: group.hostname,
    ready: group.resources.every((resource) => resource.status !== "failed"),
  }));
}

/** logicalNetworkId → worker node ids assigned to run that network. */
export type NetworkNodeAssignments = Record<string, string[]>;

export function bridgeForLogicalOnGroup(
  group: WorkerNodeGroup,
  logicalKind: "cudn" | "udn"
): NetResource | undefined {
  const bridgeSuffix = logicalKind === "cudn" ? "br-int" : "br-ex-a";
  return group.resources.find(
    (resource) => resource.id.endsWith(bridgeSuffix) && resource.kind === "bridge"
  );
}

export function crossEdgeForLogicalOnWorker(
  logicalId: string,
  logicalKind: "cudn" | "udn",
  group: WorkerNodeGroup
): TopologyCrossEdge | null {
  const bridge = bridgeForLogicalOnGroup(group, logicalKind);
  if (!bridge || bridge.status === "failed") return null;
  return {
    id: `${logicalId}__${bridge.id}`,
    fromStandaloneId: logicalId,
    toGroupId: group.id,
    toResourceId: bridge.id,
  };
}

export function crossEdgesForAssignments(
  assignments: NetworkNodeAssignments,
  standalones: StandaloneTopologyResource[],
  groups: WorkerNodeGroup[]
): TopologyCrossEdge[] {
  const edges: TopologyCrossEdge[] = [];
  for (const [logicalId, workerIds] of Object.entries(assignments)) {
    const standalone = standalones.find((resource) => resource.id === logicalId);
    if (!standalone || (standalone.kind !== "cudn" && standalone.kind !== "udn")) continue;
    for (const workerId of workerIds) {
      const group = groups.find((entry) => entry.id === workerId);
      if (!group) continue;
      const edge = crossEdgeForLogicalOnWorker(logicalId, standalone.kind, group);
      if (edge) edges.push(edge);
    }
  }
  return edges;
}

export function assignedGroupIds(assignments: NetworkNodeAssignments): Set<string> {
  const ids = new Set<string>();
  Object.values(assignments).forEach((workerIds) => workerIds.forEach((id) => ids.add(id)));
  return ids;
}

export function visibleTopologyGroupIds(
  assignments: NetworkNodeAssignments,
  revealedGroupIds: string[]
): Set<string> {
  const ids = assignedGroupIds(assignments);
  revealedGroupIds.forEach((id) => ids.add(id));
  return ids;
}

/** Default prototype links: CUDN → br-int, UDN → br-ex (Layer2 vs Layer3 topology). */
export function defaultCrossEdgesForLogical(
  logicalId: string,
  logicalKind: "cudn" | "udn",
  groups: WorkerNodeGroup[]
): TopologyCrossEdge[] {
  const bridgeSuffix = logicalKind === "cudn" ? "br-int" : "br-ex-a";
  const edges: TopologyCrossEdge[] = [];

  for (const group of groups) {
    const bridge = group.resources.find(
      (resource) => resource.id.endsWith(bridgeSuffix) && resource.kind === "bridge"
    );
    if (!bridge || bridge.status === "failed") continue;
    edges.push({
      id: `${logicalId}__${bridge.id}`,
      fromStandaloneId: logicalId,
      toGroupId: group.id,
      toResourceId: bridge.id,
    });
  }

  return edges.slice(0, logicalKind === "cudn" ? 3 : 2);
}

export function resourceCenter(group: WorkerNodeGroup, resource: NetResource, pos?: { x: number; y: number }) {
  const x = pos?.x ?? resource.x;
  const y = pos?.y ?? resource.y;
  return {
    x: group.x + x + RESOURCE_W / 2,
    y: group.y + y + RESOURCE_H / 2,
  };
}

export type NodeNetworkConfigurationInput = {
  physicalNetworkName: string;
  bridgeName?: string;
};

export const STANDALONE_CANVAS_Y = BASE_Y + GROUP_H + 96;
export const STANDALONE_H_SPACING = 168;

export const BRIDGE_ASSIGNMENT_PREFIX = "bridge::";

export function bridgeAssignmentKey(bridgeLabel: string): string {
  return `${BRIDGE_ASSIGNMENT_PREFIX}${bridgeLabel}`;
}

export function isBridgeAssignmentKey(key: string): boolean {
  return key.startsWith(BRIDGE_ASSIGNMENT_PREFIX);
}

export function bridgeLabelFromAssignmentKey(key: string): string {
  return key.slice(BRIDGE_ASSIGNMENT_PREFIX.length);
}

export function isBridgeNetworkResource(resource: { kind: string; label: string; id?: string }): boolean {
  return (
    resource.kind === "bridge" &&
    (resource.label === "br-localnet" || Boolean(resource.id?.endsWith("br-localnet")))
  );
}

/** Canonical assignment key for logical networks and provisioned bridge resources. */
export function networkResourceAssignmentKey(resource: {
  id: string;
  label: string;
  kind: string;
  logicalNetwork?: boolean;
}): string | null {
  if (resource.logicalNetwork || resource.kind === "cudn" || resource.kind === "udn") {
    return resource.id;
  }
  if (isBridgeNetworkResource(resource)) {
    return bridgeAssignmentKey(resource.label);
  }
  return null;
}

/** NNCP config entity on the canvas — worker assignments start empty. */
export function createBridgeConfigStandalone(config: NodeNetworkConfigurationInput): StandaloneTopologyResource {
  const bridgeName = config.bridgeName ?? "br-localnet";
  return {
    id: `nncp-${bridgeName}`,
    label: bridgeName,
    kind: "bridge",
    x: 0,
    y: 0,
    canvasX: BASE_X,
    canvasY: STANDALONE_CANVAS_Y,
    status: "creating",
    targetNodeId: "",
    targetNodeLabel: "Unassigned",
    detail: `Node network configuration for physical network ${config.physicalNetworkName}. Assign worker nodes from Assigned Nodes to project instances on the topology.`,
    highlightSteps: ["network-identity", "uplink-connection", "settings", "review"],
  };
}

/** Per-worker br-localnet card injected when a node is manually assigned. */
export function createStandaloneBridgeForWorker(
  config: NodeNetworkConfigurationInput,
  node: TopologyWorkerCatalogEntry,
  canvasIndex: number
): StandaloneTopologyResource {
  const bridgeName = config.bridgeName ?? "br-localnet";
  return {
    id: `${node.id}-${bridgeName}`,
    label: bridgeName,
    kind: "bridge",
    x: 0,
    y: 0,
    canvasX: BASE_X + canvasIndex * STANDALONE_H_SPACING,
    canvasY: STANDALONE_CANVAS_Y,
    status: "creating",
    targetNodeId: node.id,
    targetNodeLabel: node.shortName,
    detail: `Localnet bridge for physical network ${config.physicalNetworkName} on ${node.shortName}. Drag onto a node group or link to a resource to attach.`,
    highlightSteps: ["network-identity", "uplink-connection", "settings", "review"],
  };
}

/** Prototype: provision NNCP with empty worker assignments; one config resource on canvas. */
export function createStandaloneNetworkResources(
  config: NodeNetworkConfigurationInput
): StandaloneTopologyResource[] {
  return [createBridgeConfigStandalone(config)];
}

export function updateStandaloneResourcesByIdSuffix(
  resources: StandaloneTopologyResource[],
  idSuffix: string,
  status: ResourceInstallStatus
): StandaloneTopologyResource[] {
  return resources.map((resource) =>
    resource.id.endsWith(idSuffix) ? { ...resource, status } : resource
  );
}

/** Move a standalone resource into a worker group (optionally connect to an existing resource). */
export function attachStandaloneResourceToGroup(
  group: WorkerNodeGroup,
  standalone: StandaloneTopologyResource,
  connectToResourceId?: string
): WorkerNodeGroup {
  const slot = RESOURCE_SLOT_LAYOUT["br-localnet"] ?? { col: 1, row: 2 };
  const pos = resourceGridPos(slot.col, slot.row);
  const resource: NetResource = {
    id: standalone.id,
    label: standalone.label,
    kind: standalone.kind,
    ...pos,
    status: standalone.status,
    parentNode: group.id,
    detail: standalone.detail.replace(
      "Drag onto a node group or link to a resource to attach.",
      `Attached to ${group.shortName}.`
    ),
    highlightSteps: standalone.highlightSteps,
    related: connectToResourceId ? [connectToResourceId] : standalone.related,
  };

  const existing = group.resources.find((r) => r.id === standalone.id);
  const resources = existing
    ? group.resources.map((r) => (r.id === standalone.id ? resource : r))
    : [...group.resources, resource];

  let edges = group.edges;
  if (connectToResourceId) {
    const newEdge = { id: edgeId(connectToResourceId, standalone.id), from: connectToResourceId, to: standalone.id };
    edges = edges.some((e) => e.id === newEdge.id) ? edges : [...edges, newEdge];
  }

  return { ...group, resources, edges };
}

/** @deprecated Use createStandaloneNetworkResources — resources start outside groups. */
export function applyNodeNetworkConfiguration(
  groups: WorkerNodeGroup[],
  config: NodeNetworkConfigurationInput
): WorkerNodeGroup[] {
  const bridgeName = config.bridgeName ?? "br-localnet";

  return groups.map((group) => {
    const prefix = `${group.id}-`;
    const localnetId = `${prefix}br-localnet`;
    const uplinkId = `${prefix}br-ex-a`;
    const pos = resourceGridPos(
      RESOURCE_SLOT_LAYOUT["br-localnet"]?.col ?? 1,
      RESOURCE_SLOT_LAYOUT["br-localnet"]?.row ?? 2
    );

    const existing = group.resources.find((r) => r.id === localnetId);
    const localnetResource: NetResource = existing
      ? {
          ...existing,
          label: bridgeName,
          status: "creating",
          detail: `Localnet bridge for physical network ${config.physicalNetworkName}. VLAN 100 uplink on eth1.`,
        }
      : {
          id: localnetId,
          label: bridgeName,
          kind: "bridge",
          ...pos,
          status: "creating",
          detail: `Localnet bridge for physical network ${config.physicalNetworkName}. VLAN 100 uplink on eth1.`,
          highlightSteps: ["network-identity", "uplink-connection", "settings", "review"],
          related: [uplinkId, `${prefix}ens5`],
        };

    const resources = existing
      ? group.resources.map((r) => (r.id === localnetId ? localnetResource : r))
      : [...group.resources, localnetResource];

    const edgeToLocalnet = { id: edgeId(uplinkId, localnetId), from: uplinkId, to: localnetId };
    const edges = group.edges.some((e) => e.id === edgeToLocalnet.id)
      ? group.edges
      : [...group.edges, edgeToLocalnet];

    return { ...group, resources, edges };
  });
}

export function updateResourcesByIdSuffix(
  groups: WorkerNodeGroup[],
  idSuffix: string,
  status: ResourceInstallStatus
): WorkerNodeGroup[] {
  return groups.map((group) => ({
    ...group,
    resources: group.resources.map((resource) =>
      resource.id.endsWith(idSuffix) ? { ...resource, status } : resource
    ),
  }));
}
