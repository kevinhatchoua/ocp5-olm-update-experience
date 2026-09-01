import type { NetworkNodeAssignments, StandaloneTopologyResource, WorkerNodeGroup } from "../networkTopologyData";
import { getPhysicalUnderlayForBridge } from "../nodeNetworkStateMockData";
import {
  isLogicalNetworkNodeData,
  isResourceNodeData,
  isWorkerGroupNodeData,
  isWorkloadNodeData,
  type ConnectionEdgeData,
  type NetworkTopologyNodeData,
} from "./topologyNodeData";

export type OvnPathSelection = {
  id: string;
  data?: NetworkTopologyNodeData;
  edgeData?: ConnectionEdgeData;
  edgeSourceId?: string;
  edgeTargetId?: string;
};

export type OvnPathTier = "configured" | "observed" | "ovn-logical";

export type OvnPathSegment = {
  id: string;
  role: string;
  label: string;
  detail?: string;
  tier: OvnPathTier;
  nodeId?: string;
  anchor?: boolean;
};

export type OvnNetworkPathModel = {
  nodeName: string;
  nodeHostname: string;
  summary: string;
  segments: OvnPathSegment[];
  peerNodes: string[];
  anchorId: string;
};

type BuildStackArgs = {
  group: WorkerNodeGroup;
  anchorNodeId?: string;
  anchorRole?: string;
  anchorLabel?: string;
  prepend?: OvnPathSegment[];
  append?: OvnPathSegment[];
};

function resourceId(group: WorkerNodeGroup, suffix: string): string {
  return `${group.id}-${suffix}`;
}

function markAnchor(segments: OvnPathSegment[], anchorNodeId?: string, anchorLabel?: string, anchorRole?: string) {
  return segments.map((segment) => ({
    ...segment,
    anchor:
      (anchorNodeId && segment.nodeId === anchorNodeId) ||
      (anchorLabel && segment.label === anchorLabel) ||
      (anchorRole && segment.role === anchorRole) ||
      segment.anchor === true,
  }));
}

/** DO282-style per-node stack: physical uplink → OVN logical fabric → integration → workloads. */
export function buildWorkerOvnStack({
  group,
  anchorNodeId,
  anchorRole,
  anchorLabel,
  prepend = [],
  append = [],
}: BuildStackArgs): OvnPathSegment[] {
  const short = group.shortName;
  const nicLabel = getPhysicalUnderlayForBridge(resourceId(group, "br-ex-a"))?.segments.find((s) => s.kind === "nic")
    ?.label ?? "ens5";

  const core: OvnPathSegment[] = [
    {
      id: `${group.id}-nic`,
      role: "Physical NIC",
      label: nicLabel,
      detail: "Host underlay network",
      tier: "configured",
      nodeId: resourceId(group, "ens5"),
    },
    {
      id: `${group.id}-br-ex`,
      role: "External network bridge",
      label: "br-ex",
      detail: "OVS external bridge",
      tier: "configured",
      nodeId: resourceId(group, "br-ex-a"),
    },
    {
      id: `${group.id}-ext-switch`,
      role: "External logical switch",
      label: `ext_${short}`,
      detail: "OVN external switch",
      tier: "ovn-logical",
    },
    {
      id: `${group.id}-gateway-router`,
      role: "Gateway router",
      label: `GR_${short}`,
      detail: "OVN gateway router",
      tier: "ovn-logical",
    },
    {
      id: `${group.id}-join`,
      role: "Logical join switch",
      label: "join",
      detail: "Joins gateway to cluster router",
      tier: "ovn-logical",
    },
    {
      id: `${group.id}-cluster-router`,
      role: "OVN cluster router",
      label: "ovn_cluster_router",
      detail: "Cluster-wide routing; linked via transit switch",
      tier: "ovn-logical",
    },
    {
      id: `${group.id}-node-switch`,
      role: "Node logical switch",
      label: short,
      detail: "Per-node OVN logical switch",
      tier: "ovn-logical",
    },
    {
      id: `${group.id}-br-int`,
      role: "Integration network bridge",
      label: "br-int",
      detail: "OVS integration bridge for pod traffic",
      tier: "configured",
      nodeId: resourceId(group, "br-int"),
    },
    {
      id: `${group.id}-mgmt-port`,
      role: "Management port",
      label: "ovn-k8s-mp0",
      detail: "OVN Kubernetes management port",
      tier: "observed",
      nodeId: resourceId(group, "ovn-k8s-mp0"),
    },
  ];

  return markAnchor([...prepend, ...core, ...append], anchorNodeId, anchorLabel, anchorRole);
}

function peerNodesFor(group: WorkerNodeGroup, groups: WorkerNodeGroup[]): string[] {
  return groups.filter((entry) => entry.id !== group.id).map((entry) => entry.shortName);
}

function resolveWorkerGroup(
  groups: WorkerNodeGroup[],
  workerId?: string,
  hostname?: string
): WorkerNodeGroup | undefined {
  if (workerId) {
    return groups.find((group) => group.id === workerId);
  }
  if (hostname) {
    return groups.find((group) => group.hostname === hostname);
  }
  return groups[0];
}

function pathModel(
  group: WorkerNodeGroup,
  groups: WorkerNodeGroup[],
  segments: OvnPathSegment[],
  anchorId: string,
  summary: string
): OvnNetworkPathModel {
  return {
    nodeName: group.shortName,
    nodeHostname: group.hostname,
    summary,
    segments,
    peerNodes: peerNodesFor(group, groups),
    anchorId,
  };
}

export function resolveOvnNetworkPath(args: {
  selection: OvnPathSelection;
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  networkNodeAssignments: NetworkNodeAssignments;
}): OvnNetworkPathModel | null {
  const { selection, groups, standaloneResources, networkNodeAssignments } = args;
  const data = selection.data;

  if (data && isResourceNodeData(data)) {
    const group = groups.find((entry) => entry.id === data.groupId);
    if (!group) return null;
    const segments = buildWorkerOvnStack({
      group,
      anchorNodeId: selection.id,
    });
    return pathModel(
      group,
      groups,
      segments,
      selection.id,
      `${data.resource.label} on ${group.shortName} — host underlay through OVN fabric`
    );
  }

  if (data && isWorkerGroupNodeData(data)) {
    const { group } = data;
    const segments = buildWorkerOvnStack({
      group,
      anchorNodeId: group.id,
      anchorRole: "Node logical switch",
    });
    return pathModel(
      group,
      groups,
      segments,
      group.id,
      `Full network stack for ${group.shortName}`
    );
  }

  if (data && isWorkloadNodeData(data)) {
    const { attachment } = data;
    const group =
      resolveWorkerGroup(groups, attachment.workerId) ??
      groups.find((entry) => networkNodeAssignments[attachment.networkId]?.includes(entry.id)) ??
      groups[0];
    if (!group) return null;

    const workloadSegment: OvnPathSegment = {
      id: selection.id,
      role: attachment.kind === "vm" ? "VirtualMachine" : "Pod",
      label: attachment.label,
      detail: `${attachment.namespace} · ${attachment.networkLabel}`,
      tier: "configured",
      nodeId: selection.id,
      anchor: true,
    };

    const networkSegment: OvnPathSegment | undefined = attachment.networkId
      ? {
          id: `network-${attachment.networkId}`,
          role: "Logical network",
          label: attachment.networkLabel,
          detail: "User-defined or default cluster network",
          tier: "configured",
          nodeId: attachment.networkId,
        }
      : undefined;

    const segments = buildWorkerOvnStack({
      group,
      append: networkSegment ? [networkSegment, workloadSegment] : [workloadSegment],
    });

    return pathModel(
      group,
      groups,
      segments,
      selection.id,
      `${attachment.label} → ${attachment.networkLabel} → br-int on ${group.shortName}`
    );
  }

  if (data && isLogicalNetworkNodeData(data)) {
    const resource = data.resource;
    const assignedWorkers = networkNodeAssignments[resource.id] ?? [];
    const group = resolveWorkerGroup(groups, assignedWorkers[0]) ?? groups[0];
    if (!group) return null;

    const bridgeSuffix = resource.kind === "cudn" ? "br-int" : "br-ex-a";
    const networkSegment: OvnPathSegment = {
      id: resource.id,
      role: resource.kind === "cudn" ? "ClusterUserDefinedNetwork" : "UserDefinedNetwork",
      label: resource.label,
      detail: resource.topologyMode ? `${resource.topologyMode} topology` : undefined,
      tier: "configured",
      nodeId: resource.id,
      anchor: true,
    };

    const segments = buildWorkerOvnStack({
      group,
      append: [networkSegment],
    });

    return pathModel(
      group,
      groups,
      segments,
      resource.id,
      `${resource.label} on ${group.shortName} via ${bridgeSuffix}${
        assignedWorkers.length > 1 ? ` (+${assignedWorkers.length - 1} workers)` : ""
      }`
    );
  }

  if (selection.edgeData && selection.edgeSourceId && selection.edgeTargetId) {
    const sourceGroup = groups.find((group) =>
      group.resources.some((resource) => resource.id === selection.edgeSourceId)
    );
    const group = sourceGroup ?? groups[0];
    if (!group) return null;

    const segments = buildWorkerOvnStack({
      group,
      anchorNodeId: selection.edgeSourceId,
    });

    return pathModel(
      group,
      groups,
      segments,
      selection.id,
      `Connection: ${selection.edgeData.sourceLabel} → ${selection.edgeData.targetLabel}`
    );
  }

  return null;
}

export function ovnPathSummaryLine(model: OvnNetworkPathModel): string {
  const anchorIndex = model.segments.findIndex((segment) => segment.anchor);
  const start = Math.max(0, anchorIndex - 1);
  const slice = model.segments.slice(start, anchorIndex + 2);
  return slice.map((segment) => segment.label).join(" → ");
}

export function hasOvnNetworkPath(data?: NetworkTopologyNodeData, selection?: OvnPathSelection | null): boolean {
  if (!selection) return false;
  if (selection.edgeData) return true;
  if (!data) return false;
  return (
    isResourceNodeData(data) ||
    isWorkerGroupNodeData(data) ||
    isWorkloadNodeData(data) ||
    isLogicalNetworkNodeData(data)
  );
}
