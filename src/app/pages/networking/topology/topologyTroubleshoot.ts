import {
  logicalNetworkId,
  type NetResource,
  type NetResourceKind,
  type ResourceInstallStatus,
  type StandaloneTopologyResource,
  type TopologyDataScale,
  type WorkerNodeGroup,
  getUdnRecordsForScale,
} from "../networkTopologyData";
import { getUdnRecords, nncpYaml, udnYaml, type UdnRecord } from "../networkingMockData";
import { hostRoleForResource, type WorkloadAttachment } from "./topologyPerspective";

export type BondMemberHealth = {
  id: string;
  label: string;
  mtu: number;
  status: ResourceInstallStatus;
  lacpState: "active" | "slow" | "detached";
};

export type BondHealthModel = {
  bondLabel: string;
  mode: string;
  miimon: number;
  members: BondMemberHealth[];
  aggregateStatus: "healthy" | "degraded" | "down";
};

export type MtuMismatchWarning = {
  networkLabel: string;
  networkMtu: number;
  workerLabel: string;
  interfaceLabel: string;
  interfaceMtu: number;
  resourceId: string;
};

const INTERFACE_MTU: Record<string, number> = {
  "worker-2-ens5": 9001,
  "worker-3-ens5": 1500,
  "worker-1-ens5": 1500,
  "worker-1-ens6": 1500,
};

const NETWORK_MTU_BY_NAME: Record<string, number> = {
  "cluster-udn-lime-giraffe": 1500,
  "cluster-udn-azure-manta": 9000,
  "project-udn-teal-walrus": 9000,
  "project-udn-violet-fox": 1500,
};

const BOND_HEALTH: Record<string, BondHealthModel> = {
  "worker-1": {
    bondLabel: "bond0",
    mode: "802.3ad",
    miimon: 100,
    aggregateStatus: "degraded",
    members: [
      {
        id: "worker-1-ens5",
        label: "ens5",
        mtu: 1500,
        status: "configured",
        lacpState: "active",
      },
      {
        id: "worker-1-ens6",
        label: "ens6",
        mtu: 1500,
        status: "failed",
        lacpState: "detached",
      },
    ],
  },
  "worker-2": {
    bondLabel: "bond0",
    mode: "802.3ad",
    miimon: 100,
    aggregateStatus: "down",
    members: [
      {
        id: "worker-2-ens5",
        label: "ens5",
        mtu: 9001,
        status: "failed",
        lacpState: "detached",
      },
      {
        id: "worker-2-ens6",
        label: "ens6",
        mtu: 9001,
        status: "failed",
        lacpState: "detached",
      },
    ],
  },
  "worker-3": {
    bondLabel: "bond0",
    mode: "active-backup",
    miimon: 100,
    aggregateStatus: "healthy",
    members: [
      {
        id: "worker-3-ens5",
        label: "ens5",
        mtu: 1500,
        status: "configured",
        lacpState: "active",
      },
      {
        id: "worker-3-ens6",
        label: "ens6",
        mtu: 1500,
        status: "configured",
        lacpState: "slow",
      },
    ],
  },
};

export function isUnhealthyInstallStatus(status: ResourceInstallStatus): boolean {
  return status !== "configured";
}

export function isUnhealthyWorkloadStatus(status: WorkloadAttachment["status"]): boolean {
  return status === "Failed" || status === "Pending";
}

export function interfaceMtu(resourceId: string): number {
  return INTERFACE_MTU[resourceId] ?? 1500;
}

export function resolveBondHealth(groupId: string, bondLabel: string): BondHealthModel | null {
  if (!bondLabel.toLowerCase().startsWith("bond")) return null;
  return BOND_HEALTH[groupId] ?? null;
}

export function bondHealthIsUnhealthy(groupId: string, bondLabel: string): boolean {
  const health = resolveBondHealth(groupId, bondLabel);
  return health ? health.aggregateStatus !== "healthy" : false;
}

export function isHostResourceUnhealthy(resource: Pick<NetResource, "id" | "label" | "status" | "kind" | "detail">, groupId: string): boolean {
  if (isUnhealthyInstallStatus(resource.status)) return true;
  const role = hostRoleForResource(resource);
  if (role === "bond" && bondHealthIsUnhealthy(groupId, resource.label)) return true;
  if (isManagementPortResource(resource)) return false;
  return hasInterfaceMtuMismatch(resource.id, resource.label, resource.kind, [], "scale");
}

export function isLogicalNetworkUnhealthy(resource: StandaloneTopologyResource): boolean {
  return isUnhealthyInstallStatus(resource.status);
}

function parseMtu(value: string | undefined): number | null {
  if (!value || value === "Not available") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function workerIdFromResourceId(resourceId: string): string | null {
  const match = resourceId.match(/^(worker-\d+)-/);
  return match?.[1] ?? null;
}

function interfaceLabelFromResourceId(resourceId: string, workerId: string): string {
  return resourceId.slice(workerId.length + 1);
}

function workerLabelForId(workerId: string, groups: WorkerNodeGroup[]): string {
  return groups.find((group) => group.id === workerId)?.shortName ?? workerId;
}

export function hasInterfaceMtuMismatch(
  resourceId: string,
  resourceLabel: string,
  resourceKind: NetResourceKind,
  groups: WorkerNodeGroup[],
  dataScale: TopologyDataScale = "scale"
): boolean {
  return (
    findMtuMismatchesForInterface(resourceId, resourceLabel, resourceKind, groups, dataScale).length > 0
  );
}

export function findMtuMismatchesForNetwork(
  networkLabel: string,
  assignedWorkerIds: string[],
  groups: WorkerNodeGroup[],
  dataScale: TopologyDataScale = "scale"
): MtuMismatchWarning[] {
  const record = getUdnRecordsForScale(dataScale).find((r) => r.name === networkLabel);
  const networkMtu = NETWORK_MTU_BY_NAME[networkLabel] ?? parseMtu(record?.mtu);
  if (networkMtu === null) return [];

  const warnings: MtuMismatchWarning[] = [];
  assignedWorkerIds.forEach((workerId) => {
    const group = groups.find((g) => g.id === workerId);
    if (!group) return;
    const iface = group.resources.find(
      (r) => !isManagementPortResource(r) && (r.label === "ens5" || r.label.startsWith("bond"))
    );
    if (!iface) return;
    const ifaceMtu = interfaceMtu(iface.id);
    if (ifaceMtu !== networkMtu) {
      warnings.push({
        networkLabel,
        networkMtu,
        workerLabel: group.shortName,
        interfaceLabel: iface.label,
        interfaceMtu: ifaceMtu,
        resourceId: iface.id,
      });
    }
  });
  return warnings;
}

export function findMtuMismatchesForInterface(
  resourceId: string,
  resourceLabel: string,
  resourceKind: NetResourceKind,
  groups: WorkerNodeGroup[],
  dataScale: TopologyDataScale = "scale"
): MtuMismatchWarning[] {
  if (isManagementPortResource({ label: resourceLabel, kind: resourceKind })) {
    return [];
  }

  const workerId = workerIdFromResourceId(resourceId);
  if (!workerId) return [];

  const groupIndex = Number.parseInt(workerId.replace("worker-", ""), 10);
  if (!Number.isFinite(groupIndex)) return [];

  const ifaceMtu = interfaceMtu(resourceId);
  const workerLabel = workerLabelForId(workerId, groups);
  const interfaceLabel = interfaceLabelFromResourceId(resourceId, workerId);
  const warnings: MtuMismatchWarning[] = [];

  getUdnRecordsForScale(dataScale).forEach((record) => {
    const networkMtu = NETWORK_MTU_BY_NAME[record.name] ?? parseMtu(record.mtu);
    if (networkMtu === null || networkMtu === ifaceMtu) return;
    const stride = record.kind === "CUDN" ? 2 : 3 + (groupIndex % 2);
    const assigned = record.kind === "CUDN" ? groupIndex % 2 === 0 : groupIndex % stride === 0;
    if (!assigned) return;
    warnings.push({
      networkLabel: record.name,
      networkMtu,
      workerLabel,
      interfaceLabel,
      interfaceMtu: ifaceMtu,
      resourceId,
    });
  });

  return warnings;
}

export function findUdnRecordForLogicalNetwork(resource: StandaloneTopologyResource): UdnRecord | undefined {
  const kind = resource.kind === "cudn" ? "CUDN" : "UDN";
  return getUdnRecords().find((record) => logicalNetworkId(record.name, record.kind) === resource.id && record.kind === kind);
}

export function yamlForLogicalNetwork(resource: StandaloneTopologyResource): string {
  const record = findUdnRecordForLogicalNetwork(resource);
  if (record) return udnYaml(record);
  return `apiVersion: k8s.ovn.org/v1\nkind: UserDefinedNetwork\nmetadata:\n  name: ${resource.label}\n`;
}

export function yamlForHostResource(resource: NetResource, groupHostname: string): string {
  return nncpYaml({ name: `nncp-${resource.label}-${groupHostname.split(".")[0]}` });
}

export function yamlForWorkload(label: string, namespace: string, kind: "pod" | "vm"): string {
  if (kind === "vm") {
    return `apiVersion: kubevirt.io/v1\nkind: VirtualMachine\nmetadata:\n  name: ${label}\n  namespace: ${namespace}\nspec:\n  template:\n    spec:\n      domain:\n        devices:\n          interfaces:\n            - name: default\n              bridge: {}\n`;
  }
  return `apiVersion: v1\nkind: Pod\nmetadata:\n  name: ${label}\n  namespace: ${namespace}\nspec:\n  containers:\n    - name: app\n      image: registry.example/app:latest\n`;
}

export const MANAGEMENT_PORT_LABELS = new Set(["ovn-k8s-mp0", "geneve", "gene_"]);

export function isManagementPortResource(resource: Pick<NetResource, "label" | "kind">): boolean {
  if (resource.kind === "tunnel" || resource.kind === "port") return true;
  const label = resource.label.toLowerCase();
  if (label.startsWith("gene") || label.includes("geneve")) return true;
  if (label === "ovn-k8s-mp0") return true;
  return [...MANAGEMENT_PORT_LABELS].some((needle) => label.startsWith(needle));
}
