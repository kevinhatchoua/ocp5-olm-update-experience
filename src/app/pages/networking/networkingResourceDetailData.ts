import { findPrototypeListItem } from "../../lib/prototypeListStore";

export type ServiceDetailModel = {
  name: string;
  namespace: string;
  labels: { key: string; value: string }[];
  podSelector: string;
  sessionAffinity: string;
  hostname: string;
  serviceType: string;
  clusterIp: string;
  ports: { name: string; port: number; protocol: string; targetPort: number }[];
  createdAt: string;
};

export type RouteDetailModel = {
  name: string;
  namespace: string;
  labels: { key: string; value: string }[];
  annotations: number;
  serviceName: string;
  targetPort: string;
  location: string;
  status: string;
  host: string;
  path: string;
  routerCanonicalHostname: string;
  terminationType: string;
  insecureTraffic: string;
  createdAt: string;
};

export type IngressDetailModel = {
  name: string;
  namespace: string;
  labels: string;
  annotations: string;
  tlsCertificate: string;
  host: string;
  path: string;
  pathType: string;
  serviceName: string;
  servicePort: string;
  createdAt: string;
};

export type NetworkPolicyDetailModel = {
  name: string;
  namespace: string;
  labels: { key: string; value: string }[];
  annotations: number;
  createdAt: string;
  ingressRules: {
    targetPods: string;
    fromPodSelector: string;
    fromNsSelector: string;
    toPorts: string;
  }[];
  egressRules: {
    fromPodSelector: string;
    fromNsSelector: string;
    toPodSelector: string;
    toNsSelector: string;
    toPorts: string;
  }[];
};

const KUBERNETES_SERVICE: ServiceDetailModel = {
  name: "kubernetes",
  namespace: "default",
  labels: [
    { key: "component", value: "apiserver" },
    { key: "provider", value: "kubernetes" },
  ],
  podSelector: "No selector",
  sessionAffinity: "None",
  hostname: "kubernetes.default.svc.cluster.local",
  serviceType: "Cluster IP",
  clusterIp: "172.30.0.1",
  ports: [{ name: "https", port: 443, protocol: "TCP", targetPort: 6443 }],
  createdAt: "Sep 2, 2024, 2:09 AM",
};

export function resolveServiceDetail(namespace: string, name: string): ServiceDetailModel {
  if (name === "kubernetes" && namespace === "default") return KUBERNETES_SERVICE;
  const stored = findPrototypeListItem("services", namespace, name);
  return {
    name,
    namespace,
    labels: [],
    podSelector: stored?.fields.selector || `app=${name}`,
    sessionAffinity: "None",
    hostname: `${name}.${namespace}.svc.cluster.local`,
    serviceType: stored?.fields.type || "Cluster IP",
    clusterIp: "172.30.0.0",
    ports: [
      {
        name: name,
        port: Number(stored?.fields.port || 8080),
        protocol: "TCP",
        targetPort: Number(stored?.fields.targetPort || 8080),
      },
    ],
    createdAt: stored?.createdAt ? new Date(stored.createdAt).toLocaleString() : "Just now",
  };
}

export function resolveRouteDetail(namespace: string, name: string): RouteDetailModel {
  const stored = findPrototypeListItem("routes", namespace, name);
  const host =
    stored?.fields.host ||
    `${name}.apps.cluster.example.com`;
  return {
    name,
    namespace,
    labels: stored
      ? [{ key: "app", value: name }]
      : [
          { key: "app", value: "console-chart-v2" },
          { key: "release", value: "console" },
        ],
    annotations: stored ? 0 : 1,
    serviceName: stored?.fields.serviceName || name,
    targetPort: stored?.fields.path ? "downloads" : "8080",
    location: `https://${host}`,
    status: "Accepted",
    host,
    path: stored?.fields.path || "—",
    routerCanonicalHostname: "router-default.apps.cluster.example.com",
    terminationType: stored?.fields.secureRoute === "true" ? "edge" : "passthrough",
    insecureTraffic: "Redirect",
    createdAt: stored?.createdAt ? new Date(stored.createdAt).toLocaleString() : "Sep 2, 2026, 2:59 AM",
  };
}

export function resolveIngressDetail(namespace: string, name: string): IngressDetailModel {
  const stored = findPrototypeListItem("ingresses", namespace, name);
  return {
    name,
    namespace,
    labels: "No labels",
    annotations: "0 annotations",
    tlsCertificate: "Not configured",
    host: stored?.fields.host || `${name}.example.com`,
    path: stored?.fields.path || "/testpath",
    pathType: "Prefix",
    serviceName: stored?.fields.serviceName || "test",
    servicePort: stored?.fields.port || "80",
    createdAt: stored?.createdAt ? new Date(stored.createdAt).toLocaleString() : "Just now",
  };
}

export function resolveNetworkPolicyDetail(namespace: string, name: string): NetworkPolicyDetailModel {
  const stored = findPrototypeListItem("networkpolicies", namespace, name);
  const isAcm = name.includes("acm-cli-downloads");
  return {
    name,
    namespace,
    labels: isAcm
      ? [
          { key: "app", value: "acm-cli-downloads" },
          { key: "chart", value: "acm-cli-downloads-2.12.0" },
          { key: "subcomponent", value: "acm-cli-downloads" },
        ]
      : stored
        ? [{ key: "app", value: name }]
        : [],
    annotations: isAcm ? 0 : 0,
    createdAt: isAcm ? "Sep 2, 2024, 7:57 AM" : stored?.createdAt ? new Date(stored.createdAt).toLocaleString() : "Just now",
    ingressRules: [
      {
        targetPods: isAcm ? "app=acm-cli-downloads" : `app=${name}`,
        fromPodSelector: isAcm ? "subcomponent=acm-cli-downloads" : `app=${name}`,
        fromNsSelector: isAcm ? "kubernetes.io/metadata.name=open-cluster-management" : `kubernetes.io/metadata.name=${namespace}`,
        toPorts: "TCP/8080",
      },
    ],
    egressRules: [
      {
        fromPodSelector: isAcm ? "subcomponent=acm-cli-downloads" : `app=${name}`,
        fromNsSelector: isAcm ? "kubernetes.io/metadata.name=open-cluster-management" : `kubernetes.io/metadata.name=${namespace}`,
        toPodSelector: "—",
        toNsSelector: "—",
        toPorts: "—",
      },
    ],
  };
}

export function serviceYaml(model: ServiceDetailModel): string {
  return `apiVersion: v1
kind: Service
metadata:
  name: ${model.name}
  namespace: ${model.namespace}
spec:
  clusterIP: ${model.clusterIp}
  ports:
    - name: ${model.ports[0]?.name ?? "http"}
      port: ${model.ports[0]?.port ?? 80}
      protocol: ${model.ports[0]?.protocol ?? "TCP"}
      targetPort: ${model.ports[0]?.targetPort ?? 80}
  type: ClusterIP`;
}

export function routeYaml(model: RouteDetailModel): string {
  return `apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${model.name}
  namespace: ${model.namespace}
spec:
  host: ${model.host}
  path: ${model.path === "—" ? "/" : model.path}
  to:
    kind: Service
    name: ${model.serviceName}
  tls:
    termination: ${model.terminationType}
    insecureEdgeTerminationPolicy: ${model.insecureTraffic}`;
}

export function ingressYaml(model: IngressDetailModel): string {
  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${model.name}
  namespace: ${model.namespace}
spec:
  rules:
    - host: ${model.host}
      http:
        paths:
          - path: ${model.path}
            pathType: ${model.pathType}
            backend:
              service:
                name: ${model.serviceName}
                port:
                  number: ${model.servicePort}`;
}

export function networkPolicyYaml(model: NetworkPolicyDetailModel): string {
  return `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${model.name}
  namespace: ${model.namespace}
spec:
  podSelector:
    matchLabels:
      app: ${model.name.replace(/-network-policy$/, "")}
  policyTypes:
    - Ingress
    - Egress`;
}
