import type { TableResourceConnection } from "../NodeNetworkTableList";
import type {
  NetResource,
  StandaloneTopologyResource,
  TopologyCrossEdge,
  WorkerNodeGroup,
} from "../networkTopologyData";
import type { TopologyDetailSelection } from "./TopologyDetailPanel";
import {
  isConnectionEdgeData,
  type ConnectionEdgeData,
  type LogicalNetworkNodeData,
  type NetworkTopologyNodeData,
  type ResourceNodeData,
} from "./topologyNodeData";
import { hostRoleForResource } from "./topologyPerspective";

type TopologyModelLike = {
  nodes?: { id: string; data?: unknown }[];
  edges?: { id: string; source?: unknown; target?: unknown; data?: unknown }[];
};

function resolvePeerDescriptor(
  peerId: string,
  groups: WorkerNodeGroup[],
  standaloneResources: StandaloneTopologyResource[]
): { label: string } {
  const standalone = standaloneResources.find((resource) => resource.id === peerId);
  if (standalone) {
    return { label: standalone.label };
  }
  for (const group of groups) {
    const resource = group.resources.find((entry) => entry.id === peerId);
    if (resource) {
      return { label: resource.label };
    }
  }
  return { label: peerId };
}

function resourceNodeData(group: WorkerNodeGroup, resource: NetResource): ResourceNodeData {
  return {
    nodeKind: "resource",
    resource,
    groupId: group.id,
    groupShortName: group.shortName,
    groupHostname: group.hostname,
    kind: resource.kind,
    status: resource.status,
    hostRole: hostRoleForResource(resource),
  };
}

function standaloneNodeData(resource: StandaloneTopologyResource): LogicalNetworkNodeData {
  return {
    nodeKind: "logical-network",
    resource,
    kind: resource.kind,
    status: resource.status,
    topologyMode: resource.topologyMode,
    detailPath: resource.detailPath,
  };
}

/** Resolve inspector selection for graph and table modes (table can pick nodes filtered off-canvas). */
export function resolveTopologyDetailSelection(
  selectedId: string,
  model: TopologyModelLike,
  groups: WorkerNodeGroup[],
  standaloneResources: StandaloneTopologyResource[]
): TopologyDetailSelection {
  const node = model.nodes?.find((entry) => entry.id === selectedId);
  if (node?.data) {
    return {
      id: selectedId,
      data: node.data as NetworkTopologyNodeData,
    };
  }

  const edge = model.edges?.find((entry) => entry.id === selectedId);
  if (edge?.data && isConnectionEdgeData(edge.data)) {
    return {
      id: selectedId,
      edgeData: edge.data as ConnectionEdgeData,
      edgeSourceId: typeof edge.source === "string" ? edge.source : undefined,
      edgeTargetId: typeof edge.target === "string" ? edge.target : undefined,
    };
  }

  const group = groups.find((entry) => entry.id === selectedId);
  if (group) {
    return {
      id: selectedId,
      data: { nodeKind: "worker-group", group },
    };
  }

  for (const workerGroup of groups) {
    const resource = workerGroup.resources.find((entry) => entry.id === selectedId);
    if (resource) {
      return {
        id: selectedId,
        data: resourceNodeData(workerGroup, resource),
      };
    }
  }

  const standalone = standaloneResources.find((entry) => entry.id === selectedId);
  if (standalone) {
    return {
      id: selectedId,
      data: standaloneNodeData(standalone),
    };
  }

  return { id: selectedId, data: undefined };
}

export function resolveTableResourceConnections(
  groupId: string,
  resourceId: string,
  groups: WorkerNodeGroup[],
  standaloneResources: StandaloneTopologyResource[],
  crossEdges: TopologyCrossEdge[]
): TableResourceConnection[] {
  const group = groups.find((entry) => entry.id === groupId);
  const resource = group?.resources.find((entry) => entry.id === resourceId);
  if (!group || !resource) return [];

  const entries: TableResourceConnection[] = [];

  crossEdges
    .filter((edge) => edge.toGroupId === group.id && edge.toResourceId === resourceId)
    .forEach((edge) => {
      const logical = standaloneResources.find((entry) => entry.id === edge.fromStandaloneId);
      const peer = logical
        ? { label: logical.label }
        : resolvePeerDescriptor(edge.fromStandaloneId, groups, standaloneResources);
      entries.push({
        peerId: edge.fromStandaloneId,
        peerLabel: peer.label,
        direction: "in",
      });
    });

  group.edges
    .filter((edge) => edge.from === resourceId || edge.to === resourceId)
    .forEach((edge) => {
      const peerId = edge.from === resourceId ? edge.to : edge.from;
      const peer = resolvePeerDescriptor(peerId, groups, standaloneResources);
      entries.push({
        peerId,
        peerLabel: peer.label,
        direction: edge.from === resourceId ? "out" : "in",
      });
    });

  return entries;
}
