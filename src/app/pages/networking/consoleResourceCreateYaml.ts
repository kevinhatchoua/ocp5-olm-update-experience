import type { ParseYamlResult, YamlSchemaField } from "./networkCreateYaml";

export type RouteFormState = {
  name: string;
  namespace: string;
  host: string;
  path: string;
  serviceName: string;
  weight: string;
  secureRoute: boolean;
};

export type ServiceFormState = {
  name: string;
  namespace: string;
  type: string;
  port: string;
  targetPort: string;
  selector: string;
};

export type IngressFormState = {
  name: string;
  namespace: string;
  host: string;
  path: string;
  serviceName: string;
  port: string;
};

const ADJECTIVES = ["ivory", "amber", "bronze", "teal", "copper", "silver"];
const ANIMALS = ["marmot", "fox", "elk", "hawk", "bear", "wolf"];

export function generateRouteName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `route-${adj}-${animal}`;
}

export function generateServiceName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `service-${adj}-${animal}`;
}

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

function readScalar(block: string, key: string): string | undefined {
  const match = block.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  return match ? stripQuotes(match[1]) : undefined;
}

function readMetadataField(yaml: string, key: string): string | undefined {
  const metadata = yaml.match(/^metadata:\s*\n([\s\S]*?)(?=^\S|\s*$)/m)?.[1] ?? "";
  return readScalar(metadata, key);
}

function readSpecBlock(yaml: string): string {
  return yaml.match(/^spec:\s*\n([\s\S]*?)(?=^\S|\s*$)/m)?.[1] ?? "";
}

function parseResult<T>(yaml: string, partial: Partial<T>, hasUnmappedContent = false): ParseYamlResult<T> {
  const error = yamlStructureError(yaml);
  if (error) return { partial: null, error, hasUnmappedContent: false };
  return { partial, error: null, hasUnmappedContent };
}

export function routeFormToYaml(state: RouteFormState): string {
  const tlsBlock = state.secureRoute
    ? `  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
`
    : "";
  return `apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
spec:
  to:
    kind: Service
    name: ${state.serviceName}
    weight: ${state.weight || "100"}
  host: ${state.host}
  path: ${state.path}
${tlsBlock}`.replace(/\n$/, "\n");
}

export function routeYamlToForm(yaml: string): ParseYamlResult<RouteFormState> {
  const spec = readSpecBlock(yaml);
  const toBlock = spec.match(/to:\s*\n([\s\S]*?)(?=^\s{2}\S|\s*$)/m)?.[1] ?? spec;
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      namespace: readMetadataField(yaml, "namespace") ?? "default",
      host: readScalar(spec, "host") ?? "",
      path: readScalar(spec, "path") ?? "",
      serviceName: readScalar(toBlock, "name") ?? "",
      weight: readScalar(toBlock, "weight") ?? "100",
      secureRoute: /^\s*tls:/m.test(spec),
    },
    /wildcardPolicy:|port:/m.test(spec)
  );
}

export const ROUTE_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "route.openshift.io/v1" },
  { name: "kind", type: "string", description: "Route exposes a Service at a host name." },
  { name: "metadata.name", type: "string", description: "Unique name for the Route in the namespace." },
  { name: "spec.host", type: "string", description: "External host name served by the route." },
  { name: "spec.path", type: "string", description: "Path the router watches for." },
  { name: "spec.to.name", type: "string", description: "Target Service name." },
  { name: "spec.to.weight", type: "integer", description: "Relative weight for traffic splitting (0–255)." },
  { name: "spec.tls", type: "object", description: "TLS termination configuration for secure routes." },
];

export function serviceFormToYaml(state: ServiceFormState): string {
  const selectorKey = state.selector.split("=")[0]?.trim() || "app";
  const selectorValue = state.selector.split("=")[1]?.trim() || state.name;
  return `apiVersion: v1
kind: Service
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
spec:
  type: ${state.type}
  selector:
    ${selectorKey}: ${selectorValue}
  ports:
    - port: ${state.port || "8080"}
      targetPort: ${state.targetPort || state.port || "8080"}
      protocol: TCP`;
}

export function serviceYamlToForm(yaml: string): ParseYamlResult<ServiceFormState> {
  const spec = readSpecBlock(yaml);
  const selectorMatch = spec.match(/selector:\s*\n\s+([^:]+):\s*(.+)/);
  const portMatch = spec.match(/port:\s*(\d+)/);
  const targetPortMatch = spec.match(/targetPort:\s*(\d+)/);
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      namespace: readMetadataField(yaml, "namespace") ?? "default",
      type: readScalar(spec, "type") ?? "ClusterIP",
      port: portMatch?.[1] ?? "8080",
      targetPort: targetPortMatch?.[1] ?? portMatch?.[1] ?? "8080",
      selector: selectorMatch ? `${selectorMatch[1].trim()}=${stripQuotes(selectorMatch[2])}` : "app=",
    },
    /sessionAffinity:|externalName:/m.test(spec)
  );
}

export const SERVICE_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "v1" },
  { name: "kind", type: "string", description: "Service exposes pods on a stable network endpoint." },
  { name: "metadata.name", type: "string", description: "Unique Service name in the namespace." },
  { name: "spec.type", type: "string", description: "ClusterIP, NodePort, or LoadBalancer." },
  { name: "spec.selector", type: "object", description: "Label query over pods targeted by this Service." },
  { name: "spec.ports", type: "array", description: "Port definitions exposed by the Service." },
];

export function ingressFormToYaml(state: IngressFormState): string {
  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
spec:
  rules:
    - host: ${state.host}
      http:
        paths:
          - path: ${state.path || "/"}
            pathType: Prefix
            backend:
              service:
                name: ${state.serviceName}
                port:
                  number: ${state.port || "8080"}`;
}

export function ingressYamlToForm(yaml: string): ParseYamlResult<IngressFormState> {
  const hostMatch = yaml.match(/host:\s*(.+)/);
  const pathMatch = yaml.match(/path:\s*(.+)/);
  const serviceMatch = yaml.match(/name:\s*(.+)/);
  const portMatch = yaml.match(/number:\s*(\d+)/);
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      namespace: readMetadataField(yaml, "namespace") ?? "default",
      host: hostMatch ? stripQuotes(hostMatch[1]) : "",
      path: pathMatch ? stripQuotes(pathMatch[1]) : "/",
      serviceName: serviceMatch ? stripQuotes(serviceMatch[1]) : "",
      port: portMatch?.[1] ?? "8080",
    },
    /tls:|ingressClassName:/m.test(yaml)
  );
}

export const INGRESS_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "networking.k8s.io/v1" },
  { name: "kind", type: "string", description: "Ingress manages external HTTP(S) access to Services." },
  { name: "metadata.name", type: "string", description: "Unique Ingress name in the namespace." },
  { name: "spec.rules", type: "array", description: "Host and path routing rules." },
];
