/** Prototype mock data for OpenShift Networking UX (HPUX-1764/1766/1767). */

export const PROTOTYPE_NS = "openshift-controller-manager-operator";

export type NetworkResourceKind = "NAD" | "UDN" | "CUDN";

export interface NetworkResourceRef {
  kind: NetworkResourceKind;
  name: string;
  namespace?: string;
}

export type VmNetworkTarget = NetworkResourceRef | { kind: "pod" };

export interface VmNetworkInterface {
  name: string;
  model: string;
  network: VmNetworkTarget;
  state: string;
  type: string;
  macAddress: string;
}

export interface VirtualMachineRecord {
  name: string;
  namespace: string;
  status: string;
  instanceType: string;
  preference: string;
  hostname: string;
  architecture?: string;
  description?: string;
  cpu?: string;
  memory?: string;
  interfaces: VmNetworkInterface[];
}

export interface NadRecord {
  name: string;
  namespace: string;
  type: string;
  networkType: string;
  description: string;
}

export interface UdnRecord {
  name: string;
  kind: "UDN" | "CUDN";
  namespace?: string;
  topology: string;
  mtu: string;
  condition: string;
  description: string;
}

export interface AttachedVmRow {
  vmName: string;
  vmNamespace: string;
  status: string;
  interfaceName: string;
}

const VM_POOL: VirtualMachineRecord[] = [
  vm("amber-fox-01", [
    iface("default", { kind: "pod" }),
    iface("nic-amber-fox-01", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }),
  ]),
  vm("bronze-elk-06", [
    iface("default", { kind: "pod" }),
    iface("nic-bronze-elk-06", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }),
  ]),
  vm("copper-bear-07", [
    iface("default", { kind: "pod" }),
    iface("nic-copper-bear-07", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }),
  ]),
  vm("dart-hawk-02", [
    iface("default", { kind: "pod" }),
    iface("nic-dart-hawk-02", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }),
  ]),
  vm("emerald-jay-03", [iface("default", { kind: "pod" })]),
  vm("frost-lynx-04", [iface("default", { kind: "pod" })]),
  vm("gold-mole-05", [iface("default", { kind: "pod" })]),
  vm("hazel-owl-08", [iface("default", { kind: "pod" })]),
];

function vm(name: string, interfaces: VmNetworkInterface[]): VirtualMachineRecord {
  return {
    name,
    namespace: PROTOTYPE_NS,
    status: "ErrorUnschedulable",
    instanceType: "u1.medium",
    preference: "rhel.10",
    hostname: name,
    interfaces,
  };
}

function iface(name: string, network: VmNetworkTarget): VmNetworkInterface {
  return {
    name,
    model: network.kind === "pod" ? "virtio" : "virtio",
    network,
    state: network.kind === "pod" ? "up" : "up",
    type: network.kind === "pod" ? "masquerade" : "bridge",
    macAddress: "52:54:00:12:34:56",
  };
}

const INITIAL_NAD_RECORDS: NadRecord[] = [
  {
    name: "default",
    namespace: "openshift-ovn-kubernetes",
    type: "ovn-k8s-cni-overlay",
    networkType: "overlay",
    description: "No description",
  },
  {
    name: "nad-black-landfowl",
    namespace: PROTOTYPE_NS,
    type: "Linux bridge",
    networkType: "bridge",
    description: "No description",
  },
  {
    name: "nad-with-no-vm-attached",
    namespace: PROTOTYPE_NS,
    type: "Linux bridge",
    networkType: "bridge",
    description: "No description",
  },
];

const INITIAL_UDN_RECORDS: UdnRecord[] = buildScaleUdnRecords();

function buildScaleUdnRecords(): UdnRecord[] {
  const cudnNames = [
    "cluster-udn-fuchsia-wombat",
    "cluster-udn-lime-giraffe",
    "cluster-udn-azure-manta",
    "cluster-udn-coral-otter",
    "cluster-udn-indigo-wolf",
    "cluster-udn-jade-lynx",
    "cluster-udn-amber-falcon",
    "cluster-udn-slate-crane",
    "cluster-udn-rose-ibis",
    "cluster-udn-onyx-badger",
    "cluster-udn-pearl-stoat",
    "cluster-udn-cobalt-heron",
    "cluster-udn-rust-condor",
    "cluster-udn-mint-panda",
    "cluster-udn-plum-okapi",
    "cluster-udn-sand-viper",
    "cluster-udn-fern-manatee",
  ];
  const udnNames = [
    "project-udn-teal-walrus",
    "project-udn-violet-fox",
    "project-udn-crimson-hare",
    "project-udn-gold-marten",
    "project-udn-silver-kite",
    "project-udn-bronze-newt",
    "project-udn-copper-owl",
    "project-udn-navy-puffin",
    "project-udn-olive-quail",
    "project-udn-ruby-wren",
    "project-udn-ivory-loon",
    "project-udn-graphite-mole",
  ];
  const topologies = ["Layer2", "Layer3"] as const;
  const mtuValues = ["1500", "9000", "Not available"];

  const cudns: UdnRecord[] = cudnNames.map((name, index) => ({
    name,
    kind: "CUDN",
    topology: topologies[index % topologies.length],
    mtu: mtuValues[index % mtuValues.length],
    condition: index % 9 === 0 ? "NetworkCreated=False" : "NetworkCreated=True",
    description: "Cluster-scoped user-defined network for large-scale topology testing.",
  }));

  const udns: UdnRecord[] = udnNames.map((name, index) => ({
    name,
    kind: "UDN",
    namespace: PROTOTYPE_NS,
    topology: topologies[(index + 1) % topologies.length],
    mtu: mtuValues[(index + 1) % mtuValues.length],
    condition: index % 7 === 0 ? "NetworkCreated=False" : "NetworkCreated=True",
    description: "Project-scoped user-defined network for large-scale topology testing.",
  }));

  return [...cudns, ...udns];
}

/** @deprecated Use getNadRecords() for live list data. */
export const NAD_RECORDS: NadRecord[] = INITIAL_NAD_RECORDS;

/** @deprecated Use getUdnRecords() for live list data. */
export const UDN_RECORDS: UdnRecord[] = INITIAL_UDN_RECORDS;

export interface NncpRecord {
  name: string;
  status: string;
}

export type PhysicalNetwork = {
  name: string;
  type: "bridge" | "bond" | "vlan" | "interface";
  bridgeName?: string;
  vlanId?: number;
  workerNodes: string[];
  status: "configured" | "pending" | "failed";
  nncpName?: string;
  createdAt: string;
};

const INITIAL_PHYSICAL_NETWORKS: PhysicalNetwork[] = [
  {
    name: "br-ex-a",
    type: "bridge",
    bridgeName: "br-ex-a",
    workerNodes: ["worker-0", "worker-1", "worker-2", "worker-3", "worker-4"],
    status: "configured",
    createdAt: "2025-11-12T14:22:00Z",
  },
  {
    name: "br-localnet",
    type: "bridge",
    bridgeName: "br-localnet",
    workerNodes: ["worker-0", "worker-1"],
    status: "pending",
    nncpName: "nncp-br-localnet",
    createdAt: "2026-01-08T09:15:00Z",
  },
  {
    name: "br-int",
    type: "bridge",
    bridgeName: "br-int",
    workerNodes: ["worker-0", "worker-1", "worker-2"],
    status: "configured",
    createdAt: "2025-11-12T14:22:00Z",
  },
  {
    name: "localnet-rzpi1d",
    type: "vlan",
    bridgeName: "br-localnet",
    vlanId: 100,
    workerNodes: ["worker-0", "worker-1"],
    status: "configured",
    nncpName: "nncp-br-localnet",
    createdAt: "2026-02-01T11:00:00Z",
  },
];

let nadRecords: NadRecord[] = [...INITIAL_NAD_RECORDS];
let udnRecords: UdnRecord[] = [...INITIAL_UDN_RECORDS];
let nncpRecords: NncpRecord[] = [{ name: "nncp-br-localnet", status: "Progressing" }];
let physicalNetworkRecords: PhysicalNetwork[] = [...INITIAL_PHYSICAL_NETWORKS];

export type NamespacePropagationTarget = {
  namespace: string;
  namespaceSelector?: string;
  nadName: string;
};

const NAMESPACE_PROPAGATION: Record<string, NamespacePropagationTarget[]> = {
  "CUDN:cluster-udn-lime-giraffe": [
    {
      namespace: PROTOTYPE_NS,
      namespaceSelector: "kubernetes.io/metadata.name",
      nadName: "nad-black-landfowl",
    },
    {
      namespace: "openshift-ovn-kubernetes",
      namespaceSelector: "networking.openshift.io/cudn",
      nadName: "nad-amber-dragonfly",
    },
  ],
  "UDN:project-udn-teal-walrus": [{ namespace: PROTOTYPE_NS, nadName: "nad-black-landfowl" }],
};

export function getNamespacePropagationTargets(
  networkName: string,
  kind: "UDN" | "CUDN"
): NamespacePropagationTarget[] {
  return NAMESPACE_PROPAGATION[`${kind}:${networkName}`] ?? [];
}

const resourceListeners = new Set<() => void>();

let resourceRevision = 0;

function notifyResourceListeners(): void {
  resourceRevision += 1;
  resourceListeners.forEach((listener) => listener());
}

export function getNetworkingResourceRevision(): number {
  return resourceRevision;
}

export function subscribeNetworkingResources(listener: () => void): () => void {
  resourceListeners.add(listener);
  return () => resourceListeners.delete(listener);
}

export function getNadRecords(): NadRecord[] {
  return nadRecords;
}

export function getUdnRecords(): UdnRecord[] {
  return udnRecords;
}

export function getNncpRecords(): NncpRecord[] {
  return nncpRecords;
}

export function getPhysicalNetworks(): PhysicalNetwork[] {
  return physicalNetworkRecords;
}

export function getPhysicalNetwork(name: string): PhysicalNetwork | undefined {
  return physicalNetworkRecords.find((n) => n.name === name);
}

export interface CreateNadInput {
  name: string;
  namespace: string;
  type: string;
  networkType?: string;
}

export function createNad(input: CreateNadInput): NadRecord {
  const record: NadRecord = {
    name: input.name.trim(),
    namespace: input.namespace.trim(),
    type: input.type,
    networkType: input.networkType ?? (input.type.toLowerCase().includes("bridge") ? "bridge" : "overlay"),
    description: "No description",
  };
  nadRecords = [...nadRecords, record];
  notifyResourceListeners();
  return record;
}

export interface CreateUdnInput {
  name: string;
  namespace: string;
  topology?: string;
  subnetCidr?: string;
}

export function createUdn(input: CreateUdnInput): UdnRecord {
  const record: UdnRecord = {
    name: input.name.trim(),
    kind: "UDN",
    namespace: input.namespace.trim(),
    topology: input.topology ?? "Layer3",
    mtu: "1500",
    condition: "NetworkCreated=True",
    description: input.subnetCidr ? `Subnet: ${input.subnetCidr}` : "No description",
  };
  udnRecords = [...udnRecords, record];
  notifyResourceListeners();
  return record;
}

export interface CreateCudnInput {
  name: string;
  subnetCidr?: string;
}

export function createCudn(input: CreateCudnInput): UdnRecord {
  const record: UdnRecord = {
    name: input.name.trim(),
    kind: "CUDN",
    topology: "Layer2",
    mtu: "Not available",
    condition: "NetworkCreated=False",
    description: input.subnetCidr ? `Subnet: ${input.subnetCidr}` : "No description",
  };
  udnRecords = [...udnRecords, record];
  notifyResourceListeners();
  return record;
}

export interface CreateNncpInput {
  name: string;
}

export function createNncp(input: CreateNncpInput): NncpRecord {
  const record: NncpRecord = {
    name: input.name.trim(),
    status: "Progressing",
  };
  nncpRecords = [...nncpRecords, record];
  notifyResourceListeners();
  return record;
}

export function deleteNad(namespace: string, name: string): boolean {
  const next = nadRecords.filter((n) => !(n.namespace === namespace && n.name === name));
  if (next.length === nadRecords.length) return false;
  nadRecords = next;
  notifyResourceListeners();
  return true;
}

export function deleteUdn(name: string, namespace?: string): boolean {
  const next = udnRecords.filter((u) => {
    if (u.kind === "CUDN") return !(u.name === name && !namespace);
    return !(u.name === name && u.namespace === namespace);
  });
  if (next.length === udnRecords.length) return false;
  udnRecords = next;
  notifyResourceListeners();
  return true;
}

export function deleteNncp(name: string): boolean {
  const next = nncpRecords.filter((n) => n.name !== name);
  if (next.length === nncpRecords.length) return false;
  nncpRecords = next;
  notifyResourceListeners();
  return true;
}

export function getNncp(name: string): NncpRecord | undefined {
  return nncpRecords.find((n) => n.name === name);
}

export interface CreatePhysicalNetworkInput {
  name: string;
  type: PhysicalNetwork["type"];
  bridgeName?: string;
  vlanId?: number;
  workerNodes?: string[];
  nncpName?: string;
  status?: PhysicalNetwork["status"];
}

export function createPhysicalNetwork(input: CreatePhysicalNetworkInput): PhysicalNetwork {
  const record: PhysicalNetwork = {
    name: input.name.trim(),
    type: input.type,
    bridgeName: input.bridgeName,
    vlanId: input.vlanId,
    workerNodes: input.workerNodes ?? [],
    status: input.status ?? "pending",
    nncpName: input.nncpName,
    createdAt: new Date().toISOString(),
  };
  physicalNetworkRecords = [...physicalNetworkRecords, record];
  notifyResourceListeners();
  return record;
}

export function deletePhysicalNetwork(name: string): boolean {
  const next = physicalNetworkRecords.filter((n) => n.name !== name);
  if (next.length === physicalNetworkRecords.length) return false;
  physicalNetworkRecords = next;
  notifyResourceListeners();
  return true;
}

export function physicalNetworkTopologyPath(name: string): string {
  return `/networking/topology?highlight=${encodeURIComponent(name)}`;
}

export function nncpListPath(nncpName?: string): string {
  if (nncpName) {
    return nncpDetailPath(nncpName);
  }
  return "/networking/nodenetworkconfigurationpolicy";
}

export function generateNadName(): string {
  const colors = ["black", "blue", "bronze", "copper", "gold", "silver", "teal"];
  const animals = ["landfowl", "narwhal", "otter", "penguin", "quail", "raven", "salmon"];
  return `nad-${colors[Math.floor(Math.random() * colors.length)]}-${animals[Math.floor(Math.random() * animals.length)]}`;
}

export function generateUdnName(): string {
  const colors = ["amber", "coral", "indigo", "jade", "magenta", "teal", "violet"];
  const animals = ["badger", "crane", "dolphin", "falcon", "gecko", "heron", "ibis"];
  return `project-udn-${colors[Math.floor(Math.random() * colors.length)]}-${animals[Math.floor(Math.random() * animals.length)]}`;
}

export function generateCudnName(): string {
  const colors = ["black", "crimson", "emerald", "lime", "orange", "purple", "ruby"];
  const animals = ["dragon", "giraffe", "koala", "lynx", "moose", "narwhal", "orca"];
  return `cluster-udn-${colors[Math.floor(Math.random() * colors.length)]}-${animals[Math.floor(Math.random() * animals.length)]}`;
}

export function generateNncpName(): string {
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `nncp-br-localnet-${suffix}`;
}

/** Mutable VM store for add/remove flows on network detail pages. */
let vmStore: VirtualMachineRecord[] = VM_POOL.map((v) => ({
  ...v,
  interfaces: v.interfaces.map((i) => ({ ...i, network: i.network })),
}));

export function getAllVirtualMachines(): VirtualMachineRecord[] {
  return vmStore;
}

export function getVirtualMachine(namespace: string, name: string): VirtualMachineRecord | undefined {
  return vmStore.find((v) => v.namespace === namespace && v.name === name);
}

export function getNad(namespace: string, name: string): NadRecord | undefined {
  return nadRecords.find((n) => n.namespace === namespace && n.name === name);
}

export function getUdn(name: string, namespace?: string): UdnRecord | undefined {
  return udnRecords.find((u) => {
    if (u.kind === "CUDN") return u.name === name && !namespace;
    return u.name === name && u.namespace === namespace;
  });
}

export function getAttachedVmsForNetwork(ref: NetworkResourceRef): AttachedVmRow[] {
  return vmStore.flatMap((vm) =>
    vm.interfaces
      .filter((i) => networkRefMatches(i.network, ref))
      .map((i) => ({
        vmName: vm.name,
        vmNamespace: vm.namespace,
        status: vm.status,
        interfaceName: i.name,
      }))
  );
}

export function getAvailableVmsForNetwork(ref: NetworkResourceRef): VirtualMachineRecord[] {
  const attached = new Set(getAttachedVmsForNetwork(ref).map((r) => `${r.vmNamespace}/${r.vmName}`));
  return vmStore.filter((v) => !attached.has(`${v.namespace}/${v.name}`));
}

export function attachVmToNetwork(
  ref: NetworkResourceRef,
  vmName: string,
  vmNamespace: string
): void {
  const vm = getVirtualMachine(vmNamespace, vmName);
  if (!vm || getAttachedVmsForNetwork(ref).some((r) => r.vmName === vmName)) return;
  const interfaceName = `nic-${vmName}`;
  vmStore = vmStore.map((v) =>
    v.name === vmName && v.namespace === vmNamespace
      ? {
          ...v,
          interfaces: [
            ...v.interfaces,
            iface(interfaceName, ref),
          ],
        }
      : v
  );
}

export function detachVmFromNetwork(ref: NetworkResourceRef, vmName: string, vmNamespace: string): void {
  vmStore = vmStore.map((v) =>
    v.name === vmName && v.namespace === vmNamespace
      ? {
          ...v,
          interfaces: v.interfaces.filter((i) => !networkRefMatches(i.network, ref)),
        }
      : v
  );
}

function networkRefMatches(target: VmNetworkTarget, ref: NetworkResourceRef): boolean {
  if (target.kind === "pod") return false;
  return target.kind === ref.kind && target.name === ref.name && target.namespace === ref.namespace;
}

export function networkDisplayName(network: VmNetworkTarget): string {
  if (network.kind === "pod") return "Pod networking";
  return network.name;
}

export function nadDetailPath(namespace: string, name: string): string {
  return `/networking/networkattachmentdefinitions/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
}

export function udnDetailPath(record: UdnRecord): string {
  if (record.kind === "CUDN") {
    return `/networking/userdefinednetworks/cluster/${encodeURIComponent(record.name)}`;
  }
  return `/networking/userdefinednetworks/${encodeURIComponent(record.namespace!)}/${encodeURIComponent(record.name)}`;
}

export function nncpDetailPath(name: string): string {
  return `/networking/nodenetworkconfigurationpolicy/${encodeURIComponent(name)}`;
}

/** Deep-link id for `/networking/topology?highlight=` — NAD (not yet a canvas node; includes-match ready). */
export function nadTopologyHighlightId(namespace: string, name: string): string {
  return `nad-${namespace}-${name}`;
}

/** Matches `logicalNetworkId()` in networkTopologyData (`logical-udn-*` / `logical-cudn-*`). */
export function udnTopologyHighlightId(record: Pick<UdnRecord, "name" | "kind">): string {
  return `logical-${record.kind === "CUDN" ? "cudn" : "udn"}-${record.name}`;
}

/** Matches NNCP / bridge-config standalone ids (`nncp-br-localnet`). */
export function nncpTopologyHighlightId(name: string): string {
  return name.startsWith("nncp-") ? name : `nncp-${name}`;
}

export function topologyHighlightPath(highlightId: string): string {
  return `/networking/topology?highlight=${encodeURIComponent(highlightId)}`;
}

export function networkResourcePath(ref: NetworkResourceRef): string {
  switch (ref.kind) {
    case "NAD":
      return nadDetailPath(ref.namespace ?? PROTOTYPE_NS, ref.name);
    case "UDN":
      return `/networking/userdefinednetworks/${encodeURIComponent(ref.namespace ?? PROTOTYPE_NS)}/${encodeURIComponent(ref.name)}`;
    case "CUDN":
      return `/networking/userdefinednetworks/cluster/${encodeURIComponent(ref.name)}`;
    default:
      return "#";
  }
}

export function vmDetailPath(namespace: string, name: string): string {
  return `/virtualization/virtualmachines/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
}

export interface CreateVirtualMachineInput {
  name: string;
  namespace: string;
  instanceType: string;
  preference: string;
  description?: string;
  cpu?: string;
  memory?: string;
}

export function createVirtualMachine(input: CreateVirtualMachineInput): VirtualMachineRecord {
  const record: VirtualMachineRecord = {
    name: input.name,
    namespace: input.namespace,
    status: "ErrorUnschedulable",
    instanceType: input.instanceType,
    preference: input.preference,
    hostname: "Guest agent is required",
    architecture: "amd64",
    description: input.description,
    cpu: input.cpu ?? "1 CPU",
    memory: input.memory ?? "4 GiB Memory",
    interfaces: [iface("default", { kind: "pod" })],
  };
  vmStore = [...vmStore, record];
  return record;
}

export function generateVirtualMachineName(): string {
  const adjectives = ["rose", "amber", "bronze", "copper", "dart", "emerald", "frost", "gold"];
  const animals = ["bovid", "fox", "elk", "bear", "hawk", "jay", "lynx", "mole", "owl", "walrus"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}-${animal}-${num}`;
}

export function nadYaml(record: NadRecord): string {
  return `apiVersion: k8s.cni.cncf.io/v1
kind: NetworkAttachmentDefinition
metadata:
  name: ${record.name}
  namespace: ${record.namespace}
spec:
  config: '{ "cniVersion": "0.3.1", "type": "${record.networkType}", "bridge": "${record.name}" }'`;
}

export function udnYaml(record: UdnRecord): string {
  const kind = record.kind === "CUDN" ? "ClusterUserDefinedNetwork" : "UserDefinedNetwork";
  const ns = record.namespace ? `\n  namespace: ${record.namespace}` : "";
  return `apiVersion: k8s.ovn.org/v1
kind: ${kind}
metadata:
  name: ${record.name}${ns}
spec:
  topology: ${record.topology}`;
}

export function nncpYaml(record: NncpRecord): string {
  return `apiVersion: nmstate.io/v1
kind: NodeNetworkConfigurationPolicy
metadata:
  name: ${record.name}
spec:
  desiredState:
    interfaces:
      - name: br-localnet
        type: ovs-bridge
        state: up`;
}
