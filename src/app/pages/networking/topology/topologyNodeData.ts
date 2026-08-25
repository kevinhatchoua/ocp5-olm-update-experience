import type {
  NetResource,
  NetResourceKind,
  ResourceInstallStatus,
  StandaloneTopologyResource,
  WorkerNodeGroup,
} from "../networkTopologyData";
import type { HostResourceRole, WorkloadAttachment } from "./topologyPerspective";

export type TopologyNodeKind =
  | "resource"
  | "logical-network"
  | "worker-group"
  | "logical-lane"
  | "workload";

export type ResourceNodeData = {
  nodeKind: "resource";
  resource: NetResource;
  groupId: string;
  groupShortName: string;
  groupHostname: string;
  kind: NetResourceKind;
  status: ResourceInstallStatus;
  hostRole: HostResourceRole;
};

export type LogicalNetworkNodeData = {
  nodeKind: "logical-network";
  resource: StandaloneTopologyResource;
  kind: NetResourceKind;
  status: ResourceInstallStatus;
  topologyMode?: string;
  detailPath?: string;
};

export type WorkerGroupNodeData = {
  nodeKind: "worker-group";
  group: WorkerNodeGroup;
};

export type LogicalLaneNodeData = {
  nodeKind: "logical-lane";
};

export type WorkloadNodeData = {
  nodeKind: "workload";
  attachment: WorkloadAttachment;
};

export type ConnectionEdgeData = {
  edgeKind: "connection";
  linkType: "underlay" | "logical-attachment" | "workload-attachment";
  sourceLabel: string;
  targetLabel: string;
  sourceKind?: string;
  targetKind?: string;
  vlan?: string;
  interfaceName?: string;
  bridgeMapping?: string;
  note?: string;
};

export type NetworkTopologyNodeData =
  | ResourceNodeData
  | LogicalNetworkNodeData
  | WorkerGroupNodeData
  | LogicalLaneNodeData
  | WorkloadNodeData;

export const LOGICAL_LANE_ID = "logical-networks-lane";
export const WORKLOAD_LANE_ID = "workload-attachments-lane";

export function isResourceNodeData(data: unknown): data is ResourceNodeData {
  return Boolean(data && typeof data === "object" && (data as ResourceNodeData).nodeKind === "resource");
}

export function isLogicalNetworkNodeData(data: unknown): data is LogicalNetworkNodeData {
  return Boolean(
    data && typeof data === "object" && (data as LogicalNetworkNodeData).nodeKind === "logical-network"
  );
}

export function isWorkerGroupNodeData(data: unknown): data is WorkerGroupNodeData {
  return Boolean(
    data && typeof data === "object" && (data as WorkerGroupNodeData).nodeKind === "worker-group"
  );
}

export function isWorkloadNodeData(data: unknown): data is WorkloadNodeData {
  return Boolean(data && typeof data === "object" && (data as WorkloadNodeData).nodeKind === "workload");
}

export function isConnectionEdgeData(data: unknown): data is ConnectionEdgeData {
  return Boolean(data && typeof data === "object" && (data as ConnectionEdgeData).edgeKind === "connection");
}
