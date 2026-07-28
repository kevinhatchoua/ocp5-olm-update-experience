import { PROTOTYPE_NS } from "./networkingMockData";

export type YamlSchemaField = {
  name: string;
  type: string;
  description: string;
};

export type NadFormState = { name: string; namespace: string; type: string };
export type UdnFormState = { project: string; name: string; cidr: string };
export type CudnFormState = { name: string; cidr: string; matchLabels: string };
export type NncpFormState = { name: string };
export type ServiceKeyValuePair = { key: string; value: string };

export type ServicePortRow = {
  protocol: string;
  port: string;
  targetPort: string;
  name: string;
  /** Empty string means Kubernetes auto-assigns (NodePort / LoadBalancer only). */
  nodePort: string;
};

export type ServiceFormState = {
  name: string;
  namespace: string;
  type: string;
  selector: ServiceKeyValuePair[];
  ports: ServicePortRow[];
  externalName: string;
  externalTrafficPolicy: string;
  loadBalancerIP: string;
  sessionAffinity: string;
  internalTrafficPolicy: string;
  /** One IP per line. */
  externalIPs: string;
  annotations: ServiceKeyValuePair[];
};

export const EMPTY_SERVICE_SELECTOR_PAIR: ServiceKeyValuePair = { key: "", value: "" };

export const EMPTY_SERVICE_PORT_ROW: ServicePortRow = {
  protocol: "TCP",
  port: "",
  targetPort: "",
  name: "",
  nodePort: "",
};

export function createDefaultServiceFormState(): ServiceFormState {
  return {
    name: "example",
    namespace: "default",
    type: "ClusterIP",
    selector: [{ key: "app", value: "MyApp" }],
    ports: [{ protocol: "TCP", port: "80", targetPort: "9376", name: "http", nodePort: "" }],
    externalName: "",
    externalTrafficPolicy: "Cluster",
    loadBalancerIP: "",
    sessionAffinity: "None",
    internalTrafficPolicy: "Cluster",
    externalIPs: "",
    annotations: [],
  };
}

/** Prefill edit form from a list/detail ServiceRecord (HPUX-1721). */
export function serviceRecordToFormState(record: {
  name: string;
  namespace: string;
  type: string;
  selectorPairs: string[];
  ports: { name: string; port: string; protocol: string; targetPort: string }[];
  sessionAffinity: string;
  labels: { key: string; value: string }[];
  location?: string;
}): ServiceFormState {
  const type = record.type || "ClusterIP";
  const isExternalName = type === "ExternalName";
  const selector =
    !isExternalName && record.selectorPairs.length > 0
      ? record.selectorPairs.map((line) => {
          const eq = line.indexOf("=");
          if (eq === -1) return { key: line, value: "" };
          return { key: line.slice(0, eq).trim(), value: line.slice(eq + 1).trim() };
        })
      : [{ ...EMPTY_SERVICE_SELECTOR_PAIR }];
  const ports =
    !isExternalName && record.ports.length > 0
      ? record.ports.map((p) => ({
          protocol: p.protocol || "TCP",
          port: p.port,
          targetPort: p.targetPort || p.port,
          name: p.name || "",
          nodePort: "",
        }))
      : [{ ...EMPTY_SERVICE_PORT_ROW }];

  return {
    name: record.name,
    namespace: record.namespace,
    type,
    selector,
    ports,
    externalName: isExternalName ? record.location || "" : "",
    externalTrafficPolicy: "Cluster",
    loadBalancerIP: "",
    sessionAffinity: record.sessionAffinity || "None",
    internalTrafficPolicy: "Cluster",
    externalIPs: "",
    annotations: record.labels.map((l) => ({ key: l.key, value: l.value })),
  };
}

export function selectorPairsToLines(pairs: ServiceKeyValuePair[]): string {
  return pairs
    .filter((p) => p.key.trim())
    .map((p) => `${p.key.trim()}=${p.value.trim()}`)
    .join("\n");
}

export function selectorLinesToPairs(text: string): ServiceKeyValuePair[] {
  const pairs = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const eq = line.indexOf("=");
      if (eq === -1) return { key: line, value: "" };
      return { key: line.slice(0, eq).trim(), value: line.slice(eq + 1).trim() };
    });
  return pairs.length > 0 ? pairs : [{ ...EMPTY_SERVICE_SELECTOR_PAIR }];
}

export type ParseYamlResult<T> = {
  partial: Partial<T> | null;
  error: string | null;
  hasUnmappedContent: boolean;
};

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "").trim();
}

function yamlStructureError(yaml: string): string | null {
  const text = yaml.trim();
  if (!text) return "YAML cannot be empty.";
  if (!/^apiVersion:/m.test(text)) return "Missing apiVersion field.";
  if (!/^kind:/m.test(text)) return "Missing kind field.";
  return null;
}

function readScalar(yaml: string, key: string): string | undefined {
  const match = yaml.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  return match ? stripQuotes(match[1]) : undefined;
}

function readMetadataField(yaml: string, key: string): string | undefined {
  const metadata = yaml.match(/^metadata:\s*\n([\s\S]*?)(?=^\S|\s*$)/m)?.[1] ?? "";
  return readScalar(metadata, key);
}

function readSpecScalar(yaml: string, key: string): string | undefined {
  const spec = yaml.match(/^spec:\s*\n([\s\S]*?)(?=^\S|\s*$)/m)?.[1] ?? "";
  return readScalar(spec, key);
}

function matchLabelsFromYaml(yaml: string): string | undefined {
  const block =
    yaml.match(/matchLabels:\s*\n((?:\s+.+\n?)+)/)?.[1] ??
    yaml.match(/matchLabels:\s*\{([^}]+)\}/)?.[1];
  if (!block) return undefined;
  const pairs: string[] = [];
  block.split("\n").forEach((line) => {
    const match = line.match(/^\s*([^:]+):\s*(.+)$/);
    if (match) pairs.push(`${match[1].trim()}=${stripQuotes(match[2])}`);
  });
  if (pairs.length === 0 && block.includes("=")) return block.trim();
  return pairs.length > 0 ? pairs.join("\n") : undefined;
}

function matchLabelsToYaml(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "    {}";
  const rows = lines.map((line) => {
    const [key, ...rest] = line.split("=");
    return `      ${key.trim()}: ${rest.join("=").trim()}`;
  });
  return `    matchLabels:\n${rows.join("\n")}`;
}

function parseResult<T>(yaml: string, partial: Partial<T>, hasUnmappedContent = false): ParseYamlResult<T> {
  const error = yamlStructureError(yaml);
  if (error) return { partial: null, error, hasUnmappedContent: false };
  return { partial, error: null, hasUnmappedContent };
}

export function nadFormToYaml(state: NadFormState): string {
  const cniType = (state.type ?? "").toLowerCase().includes("bridge") ? "bridge" : "overlay";
  return `apiVersion: k8s.cni.cncf.io/v1
kind: NetworkAttachmentDefinition
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
spec:
  config: |
    {
      "cniVersion": "0.3.1",
      "type": "${cniType}",
      "bridge": "${state.name}"
    }`;
}

export function nadYamlToForm(yaml: string): ParseYamlResult<NadFormState> {
  const partial: Partial<NadFormState> = {
    name: readMetadataField(yaml, "name"),
    namespace: readMetadataField(yaml, "namespace"),
    type: /"type":\s*"bridge"/.test(yaml) || /linux-bridge/i.test(yaml) ? "Linux bridge" : "Linux bridge",
  };
  return parseResult(yaml, partial, /desiredState:|nodeSelector:/m.test(yaml));
}

export const NAD_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "API version for NetworkAttachmentDefinition resources." },
  { name: "kind", type: "string", description: "Must be NetworkAttachmentDefinition." },
  { name: "metadata.name", type: "string", description: "Unique name of the NAD within the namespace." },
  { name: "metadata.namespace", type: "string", description: "Target namespace for the attachment definition." },
  { name: "spec.config", type: "string", description: "CNI plugin JSON configuration (bridge, macvlan, etc.)." },
];

export function udnFormToYaml(state: UdnFormState): string {
  return `apiVersion: k8s.ovn.org/v1
kind: UserDefinedNetwork
metadata:
  name: ${state.name}
  namespace: ${state.project}
spec:
  topology: Layer3
  subnet: ${state.cidr}`;
}

export function udnYamlToForm(yaml: string): ParseYamlResult<UdnFormState> {
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      project: readMetadataField(yaml, "namespace") ?? PROTOTYPE_NS,
      cidr: readSpecScalar(yaml, "subnet") ?? readSpecScalar(yaml, "cidr") ?? "10.128.0.0/24",
    },
    /joinSubnet:|role:/m.test(yaml)
  );
}

export const UDN_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "metadata.name", type: "string", description: "UserDefinedNetwork resource name." },
  { name: "metadata.namespace", type: "string", description: "Project namespace for the network." },
  { name: "spec.subnet", type: "string", description: "IPv4/IPv6 CIDR for the network (e.g. 10.128.0.0/24)." },
  { name: "spec.topology", type: "string", description: "Layer2 or Layer3 network topology." },
];

export function cudnFormToYaml(state: CudnFormState): string {
  return `apiVersion: k8s.ovn.org/v1
kind: ClusterUserDefinedNetwork
metadata:
  name: ${state.name}
spec:
  topology: Layer2
  subnet: ${state.cidr}
  namespaceSelector:
${matchLabelsToYaml(state.matchLabels)}`;
}

export function cudnYamlToForm(yaml: string): ParseYamlResult<CudnFormState> {
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      cidr: readSpecScalar(yaml, "subnet") ?? "10.132.0.0/16",
      matchLabels: matchLabelsFromYaml(yaml) ?? "app=frontend",
    },
    /physicalNetworkName:/m.test(yaml)
  );
}

export const CUDN_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "metadata.name", type: "string", description: "Cluster-scoped network name." },
  { name: "spec.subnet", type: "string", description: "Cluster subnet CIDR." },
  { name: "spec.namespaceSelector.matchLabels", type: "object", description: "Namespaces that receive this network." },
];

export function nncpFormToYaml(state: NncpFormState): string {
  return `apiVersion: nmstate.io/v1
kind: NodeNetworkConfigurationPolicy
metadata:
  name: ${state.name}
spec:
  nodeSelector:
    node-role.kubernetes.io/worker: ""
  desiredState:
    interfaces:
      - name: br-localnet
        type: linux-bridge
        state: up`;
}

export function nncpYamlToForm(yaml: string): ParseYamlResult<NncpFormState> {
  return parseResult(
    yaml,
    { name: readMetadataField(yaml, "name") },
    /capture:/m.test(yaml) || /routes:/m.test(yaml)
  );
}

export const NNCP_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "metadata.name", type: "string", description: "Policy name applied to selected nodes." },
  { name: "spec.nodeSelector", type: "object", description: "Label query matching target nodes." },
  { name: "spec.desiredState", type: "object", description: "Nmstate interfaces and routes to enforce." },
];

function annotationsFromYaml(yaml: string): ServiceKeyValuePair[] | undefined {
  const metadata = yaml.match(/^metadata:\s*\n([\s\S]*?)(?=^\S|\s*$)/m)?.[1] ?? "";
  const block =
    metadata.match(/^\s*annotations:\s*\n((?:\s+.+\n?)+)/m)?.[1] ??
    metadata.match(/^\s*annotations:\s*\{([^}]+)\}/m)?.[1];
  if (!block) return undefined;
  const pairs: ServiceKeyValuePair[] = [];
  block.split("\n").forEach((line) => {
    const match = line.match(/^\s*([^:{}]+):\s*(.*)$/);
    if (match) pairs.push({ key: match[1].trim(), value: stripQuotes(match[2]) });
  });
  return pairs;
}

function annotationsToYaml(pairs: ServiceKeyValuePair[]): string {
  const rows = pairs
    .filter((p) => p.key.trim())
    .map((p) => `    ${p.key.trim()}: ${JSON.stringify(p.value)}`);
  if (rows.length === 0) return "";
  return `  annotations:\n${rows.join("\n")}\n`;
}

function selectorFromYaml(yaml: string): ServiceKeyValuePair[] | undefined {
  const block =
    yaml.match(/^\s*selector:\s*\n((?:\s+.+\n?)+)/m)?.[1] ??
    yaml.match(/^\s*selector:\s*\{([^}]+)\}/m)?.[1];
  if (!block) return undefined;
  const pairs: ServiceKeyValuePair[] = [];
  block.split("\n").forEach((line) => {
    const match = line.match(/^\s*([^:{}]+):\s*(.+)$/);
    if (match) pairs.push({ key: match[1].trim(), value: stripQuotes(match[2]) });
  });
  if (pairs.length === 0 && block.includes("=")) return selectorLinesToPairs(block.trim());
  return pairs.length > 0 ? pairs : undefined;
}

function selectorToYaml(pairs: ServiceKeyValuePair[]): string {
  const rows = pairs
    .filter((p) => p.key.trim())
    .map((p) => `    ${p.key.trim()}: ${p.value.trim()}`);
  if (rows.length === 0) return "    {}";
  return rows.join("\n");
}

function portsFromYaml(yaml: string): ServicePortRow[] | undefined {
  const portsBlock = yaml.match(/^\s*ports:\s*\n((?:\s+-.+\n?(?:\s+[^\n-].+\n?)*)+)/m)?.[1];
  if (!portsBlock) return undefined;
  const entries = portsBlock.split(/^\s*-\s+/m).map((e) => e.trim()).filter(Boolean);
  const rows = entries.map((entry) => {
    const port = entry.match(/^\s*port:\s*(\d+)/m)?.[1] ?? entry.match(/port:\s*(\d+)/)?.[1] ?? "";
    const target = entry.match(/targetPort:\s*(\S+)/)?.[1]?.replace(/['"]/g, "") ?? port;
    const protocol = (entry.match(/protocol:\s*(\w+)/)?.[1] ?? "TCP").toUpperCase();
    const name = stripQuotes(entry.match(/^\s*name:\s*(.+)$/m)?.[1] ?? "");
    const nodePort = entry.match(/nodePort:\s*(\d+)/)?.[1] ?? "";
    return { protocol, port, targetPort: target, name, nodePort };
  });
  return rows.length > 0 ? rows : undefined;
}

function externalIPsFromYaml(yaml: string): string | undefined {
  const block = yaml.match(/^\s*externalIPs:\s*\n((?:\s+-\s+.+\n?)+)/m)?.[1];
  if (!block) return undefined;
  const ips = [...block.matchAll(/^\s*-\s*(.+)$/gm)].map((m) => stripQuotes(m[1]));
  return ips.length > 0 ? ips.join("\n") : undefined;
}

function externalIPsToYaml(text: string): string {
  const ips = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (ips.length === 0) return "";
  return `  externalIPs:\n${ips.map((ip) => `    - ${ip}`).join("\n")}\n`;
}

function portsToYaml(rows: ServicePortRow[], includeNodePort: boolean): string {
  const usable = rows.filter((r) => r.port.trim());
  const list =
    usable.length > 0
      ? usable
      : [{ ...EMPTY_SERVICE_PORT_ROW, protocol: "TCP", port: "80", targetPort: "80" }];
  return list
    .map((row) => {
      const fields: string[] = [];
      if (row.name.trim()) fields.push(`name: ${row.name.trim()}`);
      fields.push(`protocol: ${(row.protocol || "TCP").toUpperCase()}`);
      fields.push(`port: ${row.port.trim() || "80"}`);
      fields.push(`targetPort: ${row.targetPort.trim() || row.port.trim() || "80"}`);
      if (includeNodePort && row.nodePort.trim()) {
        fields.push(`nodePort: ${row.nodePort.trim()}`);
      }
      return `  - ${fields[0]}\n${fields
        .slice(1)
        .map((f) => `    ${f}`)
        .join("\n")}`;
    })
    .join("\n");
}

export function serviceFormToYaml(state: ServiceFormState): string {
  const type = (state.type || "ClusterIP").trim() || "ClusterIP";
  const typeLine = type === "ClusterIP" ? "" : `  type: ${type}\n`;
  const annotationsBlock = annotationsToYaml(state.annotations ?? []);
  const sessionAffinity = (state.sessionAffinity || "None").trim();
  const sessionLine =
    sessionAffinity && sessionAffinity !== "None" ? `  sessionAffinity: ${sessionAffinity}\n` : "";
  const internalPolicy = (state.internalTrafficPolicy || "Cluster").trim();
  const internalLine =
    internalPolicy && internalPolicy !== "Cluster" ? `  internalTrafficPolicy: ${internalPolicy}\n` : "";
  const externalIPsBlock = externalIPsToYaml(state.externalIPs ?? "");

  if (type === "ExternalName") {
    const externalName = (state.externalName || "").trim() || "my.database.example.com";
    return `apiVersion: v1
kind: Service
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
${annotationsBlock}spec:
${typeLine}  externalName: ${externalName}
${sessionLine}${internalLine}${externalIPsBlock}`.replace(/\n{3,}/g, "\n\n");
  }

  const includeNodePort = type === "NodePort" || type === "LoadBalancer";
  const trafficPolicy = (state.externalTrafficPolicy || "Cluster").trim();
  const trafficLine =
    includeNodePort && trafficPolicy !== "Cluster" ? `  externalTrafficPolicy: ${trafficPolicy}\n` : "";
  const lbIp = (state.loadBalancerIP || "").trim();
  const lbLine = type === "LoadBalancer" && lbIp ? `  loadBalancerIP: ${lbIp}\n` : "";

  return `apiVersion: v1
kind: Service
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
${annotationsBlock}spec:
${typeLine}  selector:
${selectorToYaml(state.selector ?? [])}
  ports:
${portsToYaml(state.ports ?? [], includeNodePort)}
${trafficLine}${lbLine}${sessionLine}${internalLine}${externalIPsBlock}`.replace(/\n{3,}/g, "\n\n");
}

export function serviceYamlToForm(yaml: string): ParseYamlResult<ServiceFormState> {
  const type = readSpecScalar(yaml, "type") ?? "ClusterIP";
  const defaults = createDefaultServiceFormState();
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      namespace: readMetadataField(yaml, "namespace") ?? "default",
      type,
      selector: selectorFromYaml(yaml) ?? defaults.selector,
      ports: portsFromYaml(yaml) ?? defaults.ports,
      externalName: readSpecScalar(yaml, "externalName") ?? "",
      externalTrafficPolicy: readSpecScalar(yaml, "externalTrafficPolicy") ?? "Cluster",
      loadBalancerIP: readSpecScalar(yaml, "loadBalancerIP") ?? "",
      sessionAffinity: readSpecScalar(yaml, "sessionAffinity") ?? "None",
      internalTrafficPolicy: readSpecScalar(yaml, "internalTrafficPolicy") ?? "Cluster",
      externalIPs: externalIPsFromYaml(yaml) ?? "",
      annotations: annotationsFromYaml(yaml) ?? [],
    },
    /ipFamilyPolicy:|ipFamilies:|publishNotReadyAddresses:/m.test(yaml)
  );
}

export const SERVICE_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "API version for core Service resources (v1)." },
  { name: "kind", type: "string", description: "Must be Service." },
  { name: "metadata.name", type: "string", description: "Unique name of the Service within the namespace." },
  { name: "metadata.namespace", type: "string", description: "Target project/namespace for the Service." },
  { name: "metadata.annotations", type: "object", description: "Arbitrary metadata attached to the Service." },
  {
    name: "spec.type",
    type: "string",
    description: "How the Service is exposed. Allowed values: ClusterIP, NodePort, LoadBalancer, ExternalName.",
  },
  {
    name: "spec.selector",
    type: "object",
    description: "Label selector matching the pods that back this Service.",
  },
  {
    name: "spec.ports",
    type: "array",
    description: "List of ports exposed by this Service (name, port, targetPort, protocol, nodePort).",
  },
  {
    name: "spec.externalName",
    type: "string",
    description: "External DNS name when type is ExternalName.",
  },
  {
    name: "spec.externalTrafficPolicy",
    type: "string",
    description: "Cluster or Local. Applies to NodePort and LoadBalancer Services.",
  },
  {
    name: "spec.loadBalancerIP",
    type: "string",
    description: "Optional requested load balancer IP when type is LoadBalancer.",
  },
  {
    name: "spec.sessionAffinity",
    type: "string",
    description: "None or ClientIP.",
  },
  {
    name: "spec.internalTrafficPolicy",
    type: "string",
    description: "Cluster or Local.",
  },
  {
    name: "spec.externalIPs",
    type: "array",
    description: "Additional external IP addresses for the Service.",
  },
];

export type RouteFormState = {
  name: string;
  namespace: string;
  hostname: string;
  serviceName: string;
  tlsTermination: string;
};

function readRouteToServiceName(yaml: string): string | undefined {
  const toBlock = yaml.match(/to:\s*\n((?:\s+.+\n?)+)/)?.[1] ?? "";
  return readScalar(toBlock, "name");
}

function readTlsTermination(yaml: string): string | undefined {
  const tls = yaml.match(/tls:\s*\n((?:\s+.+\n?)+)/)?.[1] ?? "";
  return readScalar(tls, "termination") ?? "None";
}

export function routeFormToYaml(state: RouteFormState): string {
  const termination = (state.tlsTermination || "edge").trim();
  const host = (state.hostname || "").trim();
  const hostLine = host ? `  host: ${host}\n` : "";
  const tlsBlock =
    termination === "None"
      ? ""
      : `  tls:
    termination: ${termination}
    insecureEdgeTerminationPolicy: Redirect
`;
  return `apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
spec:
${hostLine}  to:
    kind: Service
    name: ${state.serviceName}
    weight: 100
  port:
    targetPort: http
${tlsBlock}`;
}

export function routeYamlToForm(yaml: string): ParseYamlResult<RouteFormState> {
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      namespace: readMetadataField(yaml, "namespace") ?? "default",
      hostname: readSpecScalar(yaml, "host") ?? "",
      serviceName: readRouteToServiceName(yaml) ?? "frontend",
      tlsTermination: readTlsTermination(yaml) ?? "edge",
    },
    /alternateBackends:|wildcardPolicy:|certificate:/m.test(yaml)
  );
}

export const ROUTE_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "API version for OpenShift Route (route.openshift.io/v1)." },
  { name: "kind", type: "string", description: "Must be Route." },
  { name: "metadata.name", type: "string", description: "Unique name of the Route within the namespace." },
  { name: "metadata.namespace", type: "string", description: "Target project/namespace for the Route." },
  { name: "spec.host", type: "string", description: "Optional public hostname for the Route." },
  { name: "spec.to", type: "object", description: "Backing Service reference (kind Service + name)." },
  { name: "spec.tls.termination", type: "string", description: "TLS termination mode: edge, passthrough, reencrypt, or None." },
];
