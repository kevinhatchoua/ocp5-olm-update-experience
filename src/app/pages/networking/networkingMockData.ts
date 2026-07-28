/** Prototype mock data for OpenShift Networking UX (HPUX-1764/1766/1767). */

export const PROTOTYPE_NS = "openshift-controller-manager-operator";

export type NetworkResourceKind = "NAD" | "UDN" | "CUDN";

export interface NetworkResourceRef {
  kind: NetworkResourceKind;
  name: string;
  namespace?: string;
}

export type VmNetworkTarget = NetworkResourceRef | { kind: "pod" };

export type NetworkHealth = "healthy" | "degraded" | "down";

export interface VmNetworkInterface {
  name: string;
  model: string;
  network: VmNetworkTarget;
  state: string;
  type: string;
  macAddress: string;
}

export interface VmNetworkAlert {
  severity: "warning" | "danger";
  message: string;
  network: NetworkResourceRef;
  interfaceName: string;
}

export interface VirtManagedNetworkRow {
  ref: NetworkResourceRef;
  name: string;
  kind: NetworkResourceKind;
  namespace?: string;
  description: string;
  attachedVmCount: number;
  health: NetworkHealth;
}

export interface VmCondition {
  type: string;
  status: string;
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
  conditions?: VmCondition[];
  node?: string;
  ipAddress?: string;
  createdAt?: string;
  deletionProtection?: boolean;
  storageClass?: string;
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

const DEFAULT_ERROR_CONDITIONS: VmCondition[] = [
  { type: "Ready", status: "False" },
  { type: "DataVolumesReady", status: "False" },
  { type: "PodScheduled", status: "False" },
];

function vm(
  name: string,
  interfaces: VmNetworkInterface[],
  overrides: Partial<VirtualMachineRecord> = {}
): VirtualMachineRecord {
  return {
    name,
    namespace: PROTOTYPE_NS,
    status: "ErrorUnschedulable",
    instanceType: "u1.medium",
    preference: "rhel.10",
    hostname: name,
    conditions: DEFAULT_ERROR_CONDITIONS,
    cpu: "2 CPU",
    memory: "4 GiB Memory",
    createdAt: "Nov 14, 2025, 3:42 PM",
    deletionProtection: false,
    storageClass: "ocs-storagecluster-ceph-rbd",
    interfaces,
    ...overrides,
  };
}

function iface(name: string, network: VmNetworkTarget, state = "up"): VmNetworkInterface {
  return {
    name,
    model: "virtio",
    network,
    state,
    type: network.kind === "pod" ? "masquerade" : "bridge",
    macAddress: "52:54:00:12:34:56",
  };
}

const VM_POOL: VirtualMachineRecord[] = [
  vm("amber-fox-01", [
    iface("default", { kind: "pod" }),
    iface("nic-amber-fox-01", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }, "down"),
  ]),
  vm("bronze-elk-06", [
    iface("default", { kind: "pod" }),
    iface("nic-bronze-elk-06", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }, "down"),
  ]),
  vm("copper-bear-07", [
    iface("default", { kind: "pod" }),
    iface("nic-copper-bear-07", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }, "down"),
  ]),
  vm("dart-hawk-02", [
    iface("default", { kind: "pod" }),
    iface("nic-dart-hawk-02", { kind: "NAD", name: "nad-black-landfowl", namespace: PROTOTYPE_NS }, "down"),
  ]),
  vm("emerald-jay-03", [iface("default", { kind: "pod" })]),
  vm("frost-lynx-04", [iface("default", { kind: "pod" })]),
  vm("gold-mole-05", [iface("default", { kind: "pod" })]),
  vm("hazel-owl-08", [iface("default", { kind: "pod" })]),
];

const NETWORK_HEALTH: Record<string, NetworkHealth> = {
  [`NAD/${PROTOTYPE_NS}/nad-black-landfowl`]: "down",
  "CUDN//cluster-udn-lime-giraffe": "degraded",
};

function networkHealthKey(ref: NetworkResourceRef): string {
  return `${ref.kind}/${ref.namespace ?? ""}/${ref.name}`;
}

export function getNetworkHealth(ref: NetworkResourceRef): NetworkHealth {
  return NETWORK_HEALTH[networkHealthKey(ref)] ?? "healthy";
}

export function getVmNetworkAlerts(vm: VirtualMachineRecord): VmNetworkAlert[] {
  return vm.interfaces.flatMap((iface) => {
    if (iface.network.kind === "pod") return [];
    const health = getNetworkHealth(iface.network);
    if (health === "healthy" && iface.state === "up") return [];
    const severity = health === "down" || iface.state === "down" ? "danger" : "warning";
    const message =
      health === "down"
        ? `Network ${iface.network.name} is unreachable — interface ${iface.name} cannot pass traffic.`
        : `Network ${iface.network.name} is degraded — monitor interface ${iface.name}.`;
    return [{ severity, message, network: iface.network, interfaceName: iface.name }];
  });
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

const INITIAL_UDN_RECORDS: UdnRecord[] = [
  {
    name: "cluster-udn-lime-giraffe",
    kind: "CUDN",
    topology: "Layer2",
    mtu: "Not available",
    condition: "NetworkCreated=False",
    description: "No description",
  },
  {
    name: "project-udn-teal-walrus",
    kind: "UDN",
    namespace: PROTOTYPE_NS,
    topology: "Layer3",
    mtu: "1500",
    condition: "NetworkCreated=True",
    description: "No description",
  },
];

/** @deprecated Use getNadRecords() for live list data. */
export const NAD_RECORDS: NadRecord[] = INITIAL_NAD_RECORDS;

/** @deprecated Use getUdnRecords() for live list data. */
export const UDN_RECORDS: UdnRecord[] = INITIAL_UDN_RECORDS;

export interface NncpRecord {
  name: string;
  status: string;
}

export interface ServicePortMapping {
  name: string;
  port: string;
  protocol: string;
  targetPort: string;
}

export interface ServiceRecord {
  name: string;
  namespace: string;
  labels: { key: string; value: string }[];
  /** Display string for list + pod selector link */
  podSelector: string;
  /** Raw selector key=value pairs (empty when selecting all pods) */
  selectorPairs: string[];
  location: string;
  clusterIP: string;
  type: string;
  sessionAffinity: string;
  annotationCount: number;
  createdAt: string;
  owner: string;
  ports: ServicePortMapping[];
  /** Ready endpoint addresses (Endpoints / EndpointSlice aggregate) — RFE-9483 */
  endpointReady: number;
  /** Total endpoint addresses */
  endpointTotal: number;
  /** When false, list shows Unknown until first health load */
  endpointHealthLoaded?: boolean;
}

/** Route list row with backing Service endpoint health (RFE-9483 / HPUX-1868). */
export interface RouteRecord {
  name: string;
  namespace: string;
  host: string;
  serviceName: string;
  serviceNamespace: string;
  endpointReady: number;
  endpointTotal: number;
  endpointHealthLoaded?: boolean;
  tlsTermination: string;
  location: string;
}

function clusterIpFromName(name: string): string {
  const octet = (name.length * 17) % 250 || 10;
  return `172.30.${octet}.${(octet * 3) % 250 || 1}`;
}

function parsePortMappings(ports: string): ServicePortMapping[] {
  return ports
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const full = line.match(/^(\d+)\s*:\s*(\d+)\s*\/\s*(\w+)$/i);
      if (full) {
        return {
          name: `${full[3].toLowerCase()}-${full[1]}`,
          port: full[1],
          protocol: full[3].toUpperCase(),
          targetPort: full[2],
        };
      }
      const simple = line.match(/^(\d+)\s*\/\s*(\w+)$/i);
      if (simple) {
        return {
          name: `${simple[2].toLowerCase()}-${simple[1]}`,
          port: simple[1],
          protocol: simple[2].toUpperCase(),
          targetPort: simple[1],
        };
      }
      const portOnly = line.match(/^(\d+)$/);
      if (portOnly) {
        return {
          name: `port-${portOnly[1]}`,
          port: portOnly[1],
          protocol: "TCP",
          targetPort: portOnly[1],
        };
      }
      return {
        name: `port-${index + 1}`,
        port: "80",
        protocol: "TCP",
        targetPort: "80",
      };
    });
}

const INITIAL_SERVICE_RECORDS: ServiceRecord[] = [
  {
    name: "kubernetes",
    namespace: "default",
    labels: [
      { key: "component", value: "apiserver" },
      { key: "provider", value: "kubernetes" },
    ],
    podSelector: "All pods within default",
    selectorPairs: [],
    location: "172.30.0.1:443",
    clusterIP: "172.30.0.1",
    type: "ClusterIP",
    sessionAffinity: "None",
    annotationCount: 1,
    createdAt: "Jul 14, 2026, 2:53 AM",
    owner: "No owner",
    ports: [{ name: "https", port: "443", protocol: "TCP", targetPort: "443" }],
    endpointReady: 3,
    endpointTotal: 3,
    endpointHealthLoaded: true,
  },
  {
    name: "openshift",
    namespace: "default",
    labels: [],
    podSelector: "All pods within default",
    selectorPairs: [],
    location: "",
    clusterIP: "",
    type: "ClusterIP",
    sessionAffinity: "None",
    annotationCount: 0,
    createdAt: "Jul 14, 2026, 2:53 AM",
    owner: "No owner",
    ports: [],
    endpointReady: 0,
    endpointTotal: 0,
    endpointHealthLoaded: true,
  },
  {
    name: "frontend",
    namespace: "openshift-console",
    labels: [
      { key: "app", value: "console" },
      { key: "component", value: "ui" },
    ],
    podSelector: "app=console, component=ui",
    selectorPairs: ["app=console", "component=ui"],
    location: "172.30.12.40:443",
    clusterIP: "172.30.12.40",
    type: "ClusterIP",
    sessionAffinity: "None",
    annotationCount: 2,
    createdAt: "Jul 10, 2026, 9:12 AM",
    owner: "Deployment/console",
    ports: [{ name: "https", port: "443", protocol: "TCP", targetPort: "8443" }],
    endpointReady: 2,
    endpointTotal: 3,
    endpointHealthLoaded: true,
  },
  {
    name: "catalog-server",
    namespace: "openshift-marketplace",
    labels: [{ key: "app", value: "catalog" }],
    podSelector: "app=catalog",
    selectorPairs: ["app=catalog"],
    location: "172.30.88.10:50051",
    clusterIP: "172.30.88.10",
    type: "ClusterIP",
    sessionAffinity: "None",
    annotationCount: 0,
    createdAt: "Jul 12, 2026, 4:01 PM",
    owner: "Deployment/catalog-server",
    ports: [{ name: "grpc", port: "50051", protocol: "TCP", targetPort: "50051" }],
    endpointReady: 0,
    endpointTotal: 2,
    endpointHealthLoaded: true,
  },
  {
    name: "metrics",
    namespace: "monitoring",
    labels: [{ key: "app", value: "metrics" }],
    podSelector: "app=metrics",
    selectorPairs: ["app=metrics"],
    location: "172.30.44.7:9090",
    clusterIP: "172.30.44.7",
    type: "ClusterIP",
    sessionAffinity: "None",
    annotationCount: 1,
    createdAt: "Jul 13, 2026, 11:20 AM",
    owner: "No owner",
    ports: [{ name: "http", port: "9090", protocol: "TCP", targetPort: "9090" }],
    endpointReady: 0,
    endpointTotal: 0,
    endpointHealthLoaded: false,
  },
];

const INITIAL_ROUTE_RECORDS: RouteRecord[] = [
  {
    name: "console",
    namespace: "openshift-console",
    host: "console-openshift-console.apps.cluster.example.com",
    serviceName: "frontend",
    serviceNamespace: "openshift-console",
    endpointReady: 2,
    endpointTotal: 3,
    endpointHealthLoaded: true,
    tlsTermination: "reencrypt",
    location: "HTTPS",
  },
  {
    name: "oauth-openshift",
    namespace: "openshift-authentication",
    host: "oauth-openshift.apps.cluster.example.com",
    serviceName: "oauth-openshift",
    serviceNamespace: "openshift-authentication",
    endpointReady: 2,
    endpointTotal: 2,
    endpointHealthLoaded: true,
    tlsTermination: "edge",
    location: "HTTPS",
  },
  {
    name: "downloads",
    namespace: "openshift-console",
    host: "downloads-openshift-console.apps.cluster.example.com",
    serviceName: "downloads",
    serviceNamespace: "openshift-console",
    endpointReady: 0,
    endpointTotal: 1,
    endpointHealthLoaded: true,
    tlsTermination: "edge",
    location: "HTTPS",
  },
  {
    name: "alertmanager-main",
    namespace: "openshift-monitoring",
    host: "alertmanager-main-openshift-monitoring.apps.cluster.example.com",
    serviceName: "alertmanager-main",
    serviceNamespace: "openshift-monitoring",
    endpointReady: 0,
    endpointTotal: 0,
    endpointHealthLoaded: false,
    tlsTermination: "reencrypt",
    location: "HTTPS",
  },
];

let nadRecords: NadRecord[] = [...INITIAL_NAD_RECORDS];
let udnRecords: UdnRecord[] = [...INITIAL_UDN_RECORDS];
let nncpRecords: NncpRecord[] = [{ name: "nncp-br-localnet", status: "Progressing" }];
let serviceRecords: ServiceRecord[] = [...INITIAL_SERVICE_RECORDS];
let routeRecords: RouteRecord[] = [...INITIAL_ROUTE_RECORDS];

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

export function getServiceRecords(): ServiceRecord[] {
  return serviceRecords;
}

export function getRouteRecords(): RouteRecord[] {
  return routeRecords;
}

export function getRoute(namespace: string, name: string): RouteRecord | undefined {
  return routeRecords.find((r) => r.namespace === namespace && r.name === name);
}

export interface CreateRouteInput {
  name: string;
  namespace: string;
  hostname: string;
  serviceName: string;
  tlsTermination: string;
}

export function createRoute(input: CreateRouteInput): RouteRecord {
  const name = input.name.trim();
  const namespace = input.namespace.trim() || "default";
  const serviceName = input.serviceName.trim();
  const service = getService(namespace, serviceName);
  const host =
    input.hostname.trim() ||
    `${name}-${namespace}.apps.cluster.example.com`;
  const termination = (input.tlsTermination || "edge").trim();
  const record: RouteRecord = {
    name,
    namespace,
    host,
    serviceName,
    serviceNamespace: namespace,
    endpointReady: service?.endpointReady ?? 1,
    endpointTotal: service?.endpointTotal ?? 1,
    endpointHealthLoaded: service?.endpointHealthLoaded ?? true,
    tlsTermination: termination === "None" ? "None" : termination,
    location: termination === "None" ? "HTTP" : "HTTPS",
  };
  const existing = routeRecords.findIndex(
    (r) => r.name === record.name && r.namespace === record.namespace
  );
  routeRecords =
    existing >= 0
      ? routeRecords.map((r, i) => (i === existing ? record : r))
      : [...routeRecords, record];
  notifyResourceListeners();
  return record;
}

export function routeDetailPath(namespace: string, name: string): string {
  return `/networking/routes/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
}

export function routeYaml(record: RouteRecord): string {
  const tlsBlock =
    record.tlsTermination === "None"
      ? ""
      : `  tls:
    termination: ${record.tlsTermination}
    insecureEdgeTerminationPolicy: Redirect
`;
  return `apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${record.name}
  namespace: ${record.namespace}
spec:
  host: ${record.host}
  to:
    kind: Service
    name: ${record.serviceName}
    weight: 100
  port:
    targetPort: http
${tlsBlock}`;
}

/**
 * Prototype-only: nudge endpoint readiness when Auto-refresh is on (HPUX-1868).
 * Production uses watch/poll against Endpoints / EndpointSlice aggregates.
 */
export function simulateEndpointHealthTick(): void {
  serviceRecords = serviceRecords.map((s) => {
    if (!s.endpointHealthLoaded || s.endpointTotal <= 0) return s;
    // Keep kubernetes healthy; vary frontend between degraded and healthy for demo
    if (s.name === "frontend" && s.namespace === "openshift-console") {
      const ready = s.endpointReady === s.endpointTotal ? s.endpointTotal - 1 : s.endpointTotal;
      return { ...s, endpointReady: ready };
    }
    return s;
  });
  routeRecords = routeRecords.map((r) => {
    if (r.name === "console" && r.namespace === "openshift-console") {
      const ready = r.endpointReady === r.endpointTotal ? r.endpointTotal - 1 : r.endpointTotal;
      return { ...r, endpointReady: ready };
    }
    return r;
  });
  notifyResourceListeners();
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

export interface CreateServiceInput {
  name: string;
  namespace: string;
  type: string;
  selector: string;
  /** Legacy free-text ports (`80:9376/TCP`); ignored when `portMappings` is set. */
  ports?: string;
  portMappings?: ServicePortMapping[];
  sessionAffinity?: string;
  annotationCount?: number;
}

/** Prototype pod labels for live selector match feedback on Create Service. */
const MOCK_PODS_FOR_SELECTOR: { namespace: string; labels: Record<string, string> }[] = [
  { namespace: "default", labels: { app: "MyApp" } },
  { namespace: "default", labels: { app: "MyApp" } },
  { namespace: "default", labels: { app: "MyApp", component: "frontend" } },
  { namespace: "default", labels: { app: "catalog" } },
  { namespace: "openshift-marketplace", labels: { app: "catalog" } },
  { namespace: "openshift-marketplace", labels: { app: "catalog" } },
  { namespace: "production", labels: { app: "nginx" } },
  { namespace: "production", labels: { app: "nginx" } },
  { namespace: "production", labels: { app: "nginx" } },
];

export function countPodsMatchingSelector(
  namespace: string,
  pairs: { key: string; value: string }[]
): number {
  const complete = pairs.filter((p) => p.key.trim());
  if (complete.length === 0) return 0;
  const ns = namespace.trim() || "default";
  return MOCK_PODS_FOR_SELECTOR.filter((pod) => {
    if (pod.namespace !== ns) return false;
    return complete.every((p) => pod.labels[p.key.trim()] === p.value.trim());
  }).length;
}

function parseServiceSelector(selector: string, namespace: string): { display: string; pairs: string[] } {
  const pairs = selector
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (pairs.length === 0) return { display: `All pods within ${namespace}`, pairs: [] };
  return { display: pairs.join(", "), pairs };
}

function parseServiceLocation(type: string, ports: ServicePortMapping[], clusterIP: string): string {
  if (type === "ExternalName" || !clusterIP) return "";
  const firstPort = ports[0]?.port;
  return firstPort ? `${clusterIP}:${firstPort}` : clusterIP;
}

export function createService(input: CreateServiceInput): ServiceRecord {
  const name = input.name.trim();
  const namespace = input.namespace.trim() || "default";
  const type = input.type.trim() || "ClusterIP";
  const { display, pairs } = parseServiceSelector(input.selector, namespace);
  const portMappings =
    input.portMappings && input.portMappings.length > 0
      ? input.portMappings
      : parsePortMappings(input.ports ?? "");
  const clusterIP = type === "ExternalName" ? "" : clusterIpFromName(name);
  const hasSelector = pairs.length > 0;
  const record: ServiceRecord = {
    name,
    namespace,
    labels: [],
    podSelector: display,
    selectorPairs: pairs,
    location: parseServiceLocation(type, portMappings, clusterIP),
    clusterIP,
    type,
    sessionAffinity: input.sessionAffinity?.trim() || "None",
    annotationCount: input.annotationCount ?? 0,
    createdAt: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    owner: "No owner",
    ports: portMappings,
    // New services: healthy snapshot until auto-refresh / API loads real Endpoints
    endpointReady: hasSelector ? 1 : 0,
    endpointTotal: hasSelector ? 1 : 0,
    endpointHealthLoaded: true,
  };
  const existing = serviceRecords.findIndex(
    (s) => s.name === record.name && s.namespace === record.namespace
  );
  serviceRecords =
    existing >= 0
      ? serviceRecords.map((s, i) => (i === existing ? record : s))
      : [...serviceRecords, record];
  notifyResourceListeners();
  return record;
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

export function getService(namespace: string, name: string): ServiceRecord | undefined {
  return serviceRecords.find((s) => s.namespace === namespace && s.name === name);
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

export function serviceDetailPath(namespace: string, name: string): string {
  return `/networking/services/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
}

export function serviceEditPath(namespace: string, name: string): string {
  return `/networking/services/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/edit`;
}

export function udnDetailPath(record: UdnRecord): string {
  if (record.kind === "CUDN") {
    return `/networking/userdefinednetworks/cluster/${encodeURIComponent(record.name)}`;
  }
  return `/networking/userdefinednetworks/${encodeURIComponent(record.namespace!)}/${encodeURIComponent(record.name)}`;
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

export function virtVmNetworkDetailPath(ref: NetworkResourceRef): string {
  switch (ref.kind) {
    case "NAD":
      return `/virtualization/virtualmachinenetworks/nad/${encodeURIComponent(ref.namespace ?? PROTOTYPE_NS)}/${encodeURIComponent(ref.name)}`;
    case "UDN":
      return `/virtualization/virtualmachinenetworks/udn/${encodeURIComponent(ref.namespace ?? PROTOTYPE_NS)}/${encodeURIComponent(ref.name)}`;
    case "CUDN":
      return `/virtualization/virtualmachinenetworks/cudn/${encodeURIComponent(ref.name)}`;
    default:
      return "/virtualization/virtualmachinenetworks";
  }
}

export function listVirtManagedNetworks(): VirtManagedNetworkRow[] {
  const nadRows: VirtManagedNetworkRow[] = nadRecords
    .filter((nad) => nad.namespace === PROTOTYPE_NS || nad.name.startsWith("nad-"))
    .map((nad) => {
      const ref: NetworkResourceRef = { kind: "NAD", name: nad.name, namespace: nad.namespace };
      return {
        ref,
        name: nad.name,
        kind: "NAD",
        namespace: nad.namespace,
        description: nad.description,
        attachedVmCount: getAttachedVmsForNetwork(ref).length,
        health: getNetworkHealth(ref),
      };
    });

  const udnRows: VirtManagedNetworkRow[] = udnRecords.map((udn) => {
    const ref: NetworkResourceRef =
      udn.kind === "CUDN"
        ? { kind: "CUDN", name: udn.name }
        : { kind: "UDN", name: udn.name, namespace: udn.namespace };
    return {
      ref,
      name: udn.name,
      kind: udn.kind,
      namespace: udn.namespace,
      description: udn.description,
      attachedVmCount: getAttachedVmsForNetwork(ref).length,
      health: getNetworkHealth(ref),
    };
  });

  return [...nadRows, ...udnRows];
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
    conditions: DEFAULT_ERROR_CONDITIONS,
    createdAt: "Just now",
    deletionProtection: false,
    storageClass: "ocs-storagecluster-ceph-rbd",
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

export function serviceYaml(record: ServiceRecord): string {
  const labelLines =
    record.labels.length > 0
      ? `\n  labels:\n${record.labels.map((l) => `    ${l.key}: ${l.value}`).join("\n")}`
      : "";
  const selectorLines =
    record.selectorPairs.length > 0
      ? record.selectorPairs
          .map((pair) => {
            const [key, ...rest] = pair.split("=");
            return `    ${key}: ${rest.join("=") || '""'}`;
          })
          .join("\n")
      : "    {}";
  const portLines =
    record.ports.length > 0
      ? record.ports
          .map(
            (p) => `  - name: ${p.name}
    port: ${p.port}
    protocol: ${p.protocol}
    targetPort: ${p.targetPort}`
          )
          .join("\n")
      : "  []";
  const typeLine = record.type === "ClusterIP" ? "" : `  type: ${record.type}\n`;
  const clusterIpLine = record.clusterIP ? `  clusterIP: ${record.clusterIP}\n` : "";
  return `apiVersion: v1
kind: Service
metadata:
  name: ${record.name}
  namespace: ${record.namespace}${labelLines}
spec:
${typeLine}${clusterIpLine}  sessionAffinity: ${record.sessionAffinity}
  selector:
${selectorLines}
  ports:
${portLines}`;
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
