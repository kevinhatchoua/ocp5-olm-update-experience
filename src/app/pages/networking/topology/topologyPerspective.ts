import { RESOURCE_KIND_LABELS, type NetResource, type NetResourceKind } from "../networkTopologyData";

/** Topology layout lens — changes which resources and relationships are emphasized. */
export type TopologyPerspective = "host" | "workload" | "cluster";

export const TOPOLOGY_PERSPECTIVES: {
  id: TopologyPerspective;
  label: string;
  description: string;
}[] = [
  {
    id: "host",
    label: "Hosts",
    description: "Node underlay: NICs, bonds, VLANs, bridges, and OVN mappings.",
  },
  {
    id: "workload",
    label: "Workloads",
    description: "Networks with attached Pods and VMs.",
  },
  {
    id: "cluster",
    label: "Cluster",
    description: "Cluster fabric: bonds, OVN/OVS bridges, and connected workloads.",
  },
];

/** Host-oriented role derived from mock labels/kinds (prototype taxonomy). */
export type HostResourceRole =
  | "nic"
  | "bond"
  | "vlan"
  | "ovs-bridge"
  | "linux-bridge"
  | "ovn-bridge"
  | "ovn-mapping"
  | "tunnel"
  | "port"
  | "other";

export const HOST_ROLE_LABELS: Record<HostResourceRole, string> = {
  nic: "NIC",
  bond: "Bond",
  vlan: "VLAN",
  "ovs-bridge": "OVS bridge",
  "linux-bridge": "Linux bridge",
  "ovn-bridge": "OVN bridge",
  "ovn-mapping": "OVN bridge mapping",
  tunnel: "Tunnel",
  port: "Port",
  other: "Network interface",
};

export function hostRoleForResource(resource: Pick<NetResource, "label" | "kind" | "detail">): HostResourceRole {
  const label = resource.label.toLowerCase();
  const detail = (resource.detail ?? "").toLowerCase();

  if (resource.kind === "tunnel" || label.includes("geneve") || label.includes("vxlan")) return "tunnel";
  if (resource.kind === "port") return "port";
  if (label.includes("mapping") || detail.includes("bridge-mapping")) return "ovn-mapping";
  if (/^bond\d+(\.\d+)?$/.test(label) || label.startsWith("bond")) {
    return label.includes(".") ? "vlan" : "bond";
  }
  if (label.includes("vlan") || /\.\d{1,4}$/.test(label)) return "vlan";
  if (label.startsWith("br-ex") || detail.includes("ovn external")) return "ovn-bridge";
  if (label.startsWith("br-int") || label.includes("ovn")) return "ovn-bridge";
  if (label.startsWith("ovs") || detail.includes("ovs")) return "ovs-bridge";
  if (label.startsWith("br-") || resource.kind === "bridge") return "linux-bridge";
  if (resource.kind === "interface" || /^(ens|eth|eno|enp)/.test(label)) return "nic";
  return "other";
}

const HOST_VISIBLE_KINDS: NetResourceKind[] = ["interface", "bridge", "tunnel", "port"];
const WORKLOAD_VISIBLE_KINDS: NetResourceKind[] = ["bridge", "cudn", "udn", "interface"];
const CLUSTER_VISIBLE_KINDS: NetResourceKind[] = ["bridge", "interface", "tunnel", "cudn", "udn"];

export function kindsForPerspective(perspective: TopologyPerspective): NetResourceKind[] | "all" {
  switch (perspective) {
    case "host":
      return HOST_VISIBLE_KINDS;
    case "workload":
      return WORKLOAD_VISIBLE_KINDS;
    case "cluster":
      return CLUSTER_VISIBLE_KINDS;
    default:
      return "all";
  }
}

export type TopologyResourceFilter = "all" | NetResourceKind | HostResourceRole | "pod" | "vm";

export type TopologyFilterOption = { id: TopologyResourceFilter; label: string };

const HOST_ROLE_FILTERS: HostResourceRole[] = [
  "nic",
  "bond",
  "vlan",
  "linux-bridge",
  "ovs-bridge",
  "ovn-bridge",
  "tunnel",
  "port",
];

function isHostResourceRole(value: string): value is HostResourceRole {
  return value in HOST_ROLE_LABELS;
}

/** Filter-by-resource options for the active Hosts / Workloads / Cluster lens. */
export function filterOptionsForPerspective(perspective: TopologyPerspective): TopologyFilterOption[] {
  if (perspective === "host") {
    return HOST_ROLE_FILTERS.map((role) => ({ id: role, label: HOST_ROLE_LABELS[role] }));
  }
  if (perspective === "workload") {
    return [
      { id: "cudn", label: RESOURCE_KIND_LABELS.cudn },
      { id: "udn", label: RESOURCE_KIND_LABELS.udn },
      { id: "bridge", label: RESOURCE_KIND_LABELS.bridge },
      { id: "pod", label: "Pod" },
      { id: "vm", label: "VirtualMachine" },
    ];
  }
  return [
    { id: "bond", label: HOST_ROLE_LABELS.bond },
    { id: "ovn-bridge", label: HOST_ROLE_LABELS["ovn-bridge"] },
    { id: "ovs-bridge", label: HOST_ROLE_LABELS["ovs-bridge"] },
    { id: "cudn", label: RESOURCE_KIND_LABELS.cudn },
    { id: "udn", label: RESOURCE_KIND_LABELS.udn },
    { id: "pod", label: "Pod" },
    { id: "vm", label: "VirtualMachine" },
  ];
}

export function isFilterValidForPerspective(
  filter: TopologyResourceFilter,
  perspective: TopologyPerspective,
): boolean {
  if (filter === "all") return true;
  return filterOptionsForPerspective(perspective).some((option) => option.id === filter);
}

export function resourceMatchesFilter(
  filter: TopologyResourceFilter,
  perspective: TopologyPerspective,
  resource: { kind: string; hostRole?: HostResourceRole; attachmentKind?: string },
): boolean {
  if (filter === "all") return true;
  if (filter === "pod" || filter === "vm") {
    return resource.attachmentKind === filter;
  }
  if (isHostResourceRole(filter) && (perspective === "host" || perspective === "cluster")) {
    return resource.hostRole === filter || resource.kind === filter;
  }
  return resource.kind === filter;
}

export function resourceVisibleInPerspective(
  resource: Pick<NetResource, "label" | "kind" | "detail">,
  perspective: TopologyPerspective,
): boolean {
  const kinds = kindsForPerspective(perspective);
  if (kinds !== "all" && !kinds.includes(resource.kind)) return false;

  if (perspective === "host") {
    // Host view: underlay only — skip logical CUDN/UDN kinds if they slip through.
    return resource.kind !== "cudn" && resource.kind !== "udn";
  }
  if (perspective === "workload") {
    // Prefer bridges + logical nets; keep physical NIC only when labeled as mapping/bond uplink.
    if (resource.kind === "tunnel" || resource.kind === "port") return false;
    return true;
  }
  if (perspective === "cluster") {
    const role = hostRoleForResource(resource);
    if (resource.kind === "cudn" || resource.kind === "udn") return true;
    return role === "bond" || role === "ovs-bridge" || role === "ovn-bridge" || role === "linux-bridge" || role === "nic";
  }
  return true;
}

export type WorkloadAttachmentKind = "pod" | "vm";

export type WorkloadAttachment = {
  id: string;
  label: string;
  kind: WorkloadAttachmentKind;
  namespace: string;
  networkId: string;
  networkLabel: string;
  workerId?: string;
  status: "Running" | "Pending" | "Failed";
  ip?: string;
};

/** Prototype attachments hung off logical networks / bridges for Workload + Cluster views. */
export const WORKLOAD_ATTACHMENTS: WorkloadAttachment[] = [
  {
    id: "pod-frontend-1",
    label: "frontend-7f8b9c",
    kind: "pod",
    namespace: "demo-apps",
    networkId: "",
    networkLabel: "Default pod network",
    status: "Running",
    ip: "10.128.2.14",
  },
  {
    id: "vm-web-1",
    label: "web-vm-01",
    kind: "vm",
    namespace: "virtualization",
    networkId: "",
    networkLabel: "vm-network",
    status: "Running",
    ip: "192.168.100.21",
  },
  {
    id: "vm-db-1",
    label: "db-vm-02",
    kind: "vm",
    namespace: "virtualization",
    networkId: "",
    networkLabel: "vm-network",
    status: "Pending",
    ip: "192.168.100.44",
  },
  {
    id: "pod-monitor-1",
    label: "node-exporter-xk2",
    kind: "pod",
    namespace: "openshift-monitoring",
    networkId: "",
    networkLabel: "Default pod network",
    status: "Running",
    ip: "10.129.0.8",
  },
];

export function attachmentsForNetwork(networkLabel: string, networkId: string): WorkloadAttachment[] {
  const needle = networkLabel.toLowerCase();
  return WORKLOAD_ATTACHMENTS.filter((a) => {
    const label = a.networkLabel.toLowerCase();
    if (needle.includes("default") && label.includes("default")) return true;
    if (needle.includes("vm") && label.includes("vm")) return true;
    if (a.networkId && a.networkId === networkId) return true;
    return false;
  }).map((a) => ({ ...a, networkId: networkId || a.networkId, networkLabel }));
}
