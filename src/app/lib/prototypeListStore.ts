import { useSyncExternalStore } from "react";

export type PrototypeListKey =
  | "routes"
  | "services"
  | "ingresses"
  | "deployments"
  | "statefulsets"
  | "daemonsets"
  | "jobs"
  | "cronjobs"
  | "pods"
  | "namespaces"
  | "resource-quotas"
  | "limit-ranges"
  | "crds"
  | "builds"
  | "storage"
  | "users"
  | "networkpolicies"
  | "templates"
  | "bootablevolumes"
  | "migrationpolicies";

export type PrototypeListItem = {
  key: string;
  listKey: PrototypeListKey;
  name: string;
  namespace: string;
  kind: string;
  createdAt: string;
  fields: Record<string, string>;
};

export type PrototypeListMeta = {
  listPath: string;
  listTitle: string;
  kind: string;
  kindAbbr?: string;
  section?: { label: string; path: string };
};

export const PROTOTYPE_LIST_META: Record<PrototypeListKey, PrototypeListMeta> = {
  routes: {
    listPath: "/networking/routes",
    listTitle: "Routes",
    kind: "Route",
    kindAbbr: "RT",
    section: { label: "Networking", path: "/networking" },
  },
  services: {
    listPath: "/networking",
    listTitle: "Services",
    kind: "Service",
    kindAbbr: "S",
    section: { label: "Networking", path: "/networking" },
  },
  ingresses: {
    listPath: "/networking/ingresses",
    listTitle: "Ingresses",
    kind: "Ingress",
    kindAbbr: "IN",
    section: { label: "Networking", path: "/networking" },
  },
  deployments: {
    listPath: "/workloads/deployments",
    listTitle: "Deployments",
    kind: "Deployment",
    kindAbbr: "D",
    section: { label: "Workloads", path: "/workloads" },
  },
  statefulsets: {
    listPath: "/workloads/statefulsets",
    listTitle: "StatefulSets",
    kind: "StatefulSet",
    kindAbbr: "SS",
    section: { label: "Workloads", path: "/workloads" },
  },
  daemonsets: {
    listPath: "/workloads/daemonsets",
    listTitle: "DaemonSets",
    kind: "DaemonSet",
    kindAbbr: "DS",
    section: { label: "Workloads", path: "/workloads" },
  },
  jobs: {
    listPath: "/workloads/jobs",
    listTitle: "Jobs",
    kind: "Job",
    kindAbbr: "J",
    section: { label: "Workloads", path: "/workloads" },
  },
  cronjobs: {
    listPath: "/workloads/cronjobs",
    listTitle: "CronJobs",
    kind: "CronJob",
    kindAbbr: "CJ",
    section: { label: "Workloads", path: "/workloads" },
  },
  pods: {
    listPath: "/workloads/pods",
    listTitle: "Pods",
    kind: "Pod",
    kindAbbr: "P",
    section: { label: "Workloads", path: "/workloads" },
  },
  namespaces: {
    listPath: "/administration/namespaces",
    listTitle: "Namespaces",
    kind: "Namespace",
    kindAbbr: "NS",
    section: { label: "Administration", path: "/administration/cluster-settings" },
  },
  "resource-quotas": {
    listPath: "/administration/resource-quotas",
    listTitle: "ResourceQuotas",
    kind: "ResourceQuota",
    kindAbbr: "RQ",
    section: { label: "Administration", path: "/administration/cluster-settings" },
  },
  "limit-ranges": {
    listPath: "/administration/limit-ranges",
    listTitle: "LimitRanges",
    kind: "LimitRange",
    kindAbbr: "LR",
    section: { label: "Administration", path: "/administration/cluster-settings" },
  },
  crds: {
    listPath: "/administration/custom-resource-definitions",
    listTitle: "CustomResourceDefinitions",
    kind: "CustomResourceDefinition",
    kindAbbr: "CRD",
    section: { label: "Administration", path: "/administration/cluster-settings" },
  },
  builds: {
    listPath: "/builds",
    listTitle: "Builds",
    kind: "Build",
    kindAbbr: "B",
  },
  storage: {
    listPath: "/storage",
    listTitle: "Storage",
    kind: "Volume",
    kindAbbr: "V",
  },
  users: {
    listPath: "/user-management",
    listTitle: "User Management",
    kind: "User",
    kindAbbr: "U",
  },
  networkpolicies: {
    listPath: "/networking/networkpolicies",
    listTitle: "NetworkPolicies",
    kind: "NetworkPolicy",
    kindAbbr: "NP",
    section: { label: "Networking", path: "/networking" },
  },
  templates: {
    listPath: "/virtualization/templates",
    listTitle: "Templates",
    kind: "Template",
    section: { label: "Virtualization", path: "/virtualization/virtualmachines" },
  },
  bootablevolumes: {
    listPath: "/virtualization/bootablevolumes",
    listTitle: "Bootable volumes",
    kind: "BootableVolume",
    section: { label: "Virtualization", path: "/virtualization/virtualmachines" },
  },
  migrationpolicies: {
    listPath: "/virtualization/migrationpolicies",
    listTitle: "Migration policies",
    kind: "MigrationPolicy",
    section: { label: "Virtualization", path: "/virtualization/virtualmachines" },
  },
};

const STORAGE_KEY = "ocs-prototype-list-items";

const listeners = new Set<() => void>();
let revision = 0;

function loadItems(): PrototypeListItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrototypeListItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let items: PrototypeListItem[] = loadItems();

function persist(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* sessionStorage unavailable */
  }
  revision += 1;
  listeners.forEach((listener) => listener());
}

export function subscribePrototypeList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPrototypeListRevision(): number {
  return revision;
}

export function getPrototypeListItems(listKey: PrototypeListKey): PrototypeListItem[] {
  return items.filter((item) => item.listKey === listKey);
}

export function findPrototypeListItem(
  listKey: PrototypeListKey,
  namespace: string,
  name: string
): PrototypeListItem | undefined {
  const key = itemKey(listKey, namespace, name);
  return items.find((item) => item.key === key);
}

function itemKey(listKey: PrototypeListKey, namespace: string, name: string): string {
  return `${listKey}:${namespace}:${name}`;
}

export function prototypeDetailPath(listKey: PrototypeListKey, namespace: string, name: string): string {
  const meta = PROTOTYPE_LIST_META[listKey];
  const ns = encodeURIComponent(namespace);
  const resourceName = encodeURIComponent(name);
  switch (listKey) {
    case "routes":
      return `/networking/routes/${ns}/${resourceName}`;
    case "services":
      return `/networking/services/${ns}/${resourceName}`;
    case "ingresses":
      return `/networking/ingresses/${ns}/${resourceName}`;
    case "deployments":
      return `/workloads/deployments/${ns}/${resourceName}`;
    case "statefulsets":
      return `/workloads/statefulsets/${ns}/${resourceName}`;
    case "daemonsets":
      return `/workloads/daemonsets/${ns}/${resourceName}`;
    case "jobs":
      return `/workloads/jobs/${ns}/${resourceName}`;
    case "cronjobs":
      return `/workloads/cronjobs/${ns}/${resourceName}`;
    case "pods":
      return `/workloads/pods/${ns}/${resourceName}`;
    case "namespaces":
      return `/administration/namespaces/${resourceName}`;
    case "resource-quotas":
      return `/administration/resource-quotas/${ns}/${resourceName}`;
    case "limit-ranges":
      return `/administration/limit-ranges/${ns}/${resourceName}`;
    case "crds":
      return `/administration/custom-resource-definitions/${resourceName}`;
    case "builds":
      return `/builds/${ns}/${resourceName}`;
    case "storage":
      return `/storage/${ns}/${resourceName}`;
    case "users":
      return `/user-management/${resourceName}`;
    case "networkpolicies":
      return `/networking/networkpolicies/${ns}/${resourceName}`;
    case "templates":
      return `/virtualization/templates/${ns}/${resourceName}`;
    case "bootablevolumes":
      return `/virtualization/bootablevolumes/${ns}/${resourceName}`;
    case "migrationpolicies":
      return `/virtualization/migrationpolicies/${resourceName}`;
    default:
      return meta.listPath;
  }
}

export type AddPrototypeListItemInput = {
  name: string;
  namespace?: string;
  kind?: string;
  fields?: Record<string, string>;
};

export function addPrototypeListItem(
  listKey: PrototypeListKey,
  input: AddPrototypeListItemInput
): PrototypeListItem {
  const meta = PROTOTYPE_LIST_META[listKey];
  const namespace = input.namespace ?? (listKey === "namespaces" || listKey === "crds" ? "" : "default");
  const name = input.name.trim();
  const record: PrototypeListItem = {
    key: itemKey(listKey, namespace, name),
    listKey,
    name,
    namespace,
    kind: input.kind ?? meta.kind,
    createdAt: new Date().toISOString(),
    fields: input.fields ?? {},
  };
  items = [record, ...items.filter((item) => item.key !== record.key)];
  persist();
  return record;
}

export function usePrototypeListItems(listKey: PrototypeListKey): PrototypeListItem[] {
  useSyncExternalStore(subscribePrototypeList, getPrototypeListRevision, () => 0);
  return getPrototypeListItems(listKey);
}

export const GENERIC_CREATE_KIND_TO_LIST_KEY: Record<string, PrototypeListKey> = {
  deployment: "deployments",
  pod: "pods",
  job: "jobs",
  cronjob: "cronjobs",
  daemonset: "daemonsets",
  statefulset: "statefulsets",
  namespace: "namespaces",
  crd: "crds",
  customresourcedefinition: "crds",
  resourcequota: "resource-quotas",
  limitrange: "limit-ranges",
  user: "users",
  build: "builds",
  volume: "storage",
  template: "templates",
  bootablevolume: "bootablevolumes",
  migrationpolicy: "migrationpolicies",
  networkpolicy: "networkpolicies",
  multinetworkpolicy: "networkpolicies",
  route: "routes",
  service: "services",
  ingress: "ingresses",
};
