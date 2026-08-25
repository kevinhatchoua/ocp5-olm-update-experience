export type GitOpsHealth = "Healthy" | "Paused" | "Progressing" | "Degraded" | "Aborting";

export type GitOpsOwner = {
  kind: "Application" | "ApplicationSet" | "Rollout" | "ReplicaSet";
  name: string;
  ns?: string;
} | null;

export type RolloutRecord = {
  name: string;
  ns: string;
  strategy: "BlueGreen" | "Canary";
  status: GitOpsHealth;
  age: string;
  image: string;
  managedBy: GitOpsOwner;
};

export type ArgoCdRecord = {
  name: string;
  ns: string;
  server: string;
  status: "Healthy" | "Degraded";
  version: string;
  age: string;
  applications: string;
};

export type ApplicationRecord = {
  name: string;
  ns: string;
  project: string;
  sync: "Synced" | "OutOfSync";
  health: GitOpsHealth;
  age: string;
  repo: string;
  path: string;
  revision: string;
  destination: string;
  managedBy: GitOpsOwner;
};

export type ApplicationSetRecord = {
  name: string;
  ns: string;
  generators: string;
  apps: string;
  age: string;
  repo: string;
  path: string;
  status: "Healthy" | "Degraded";
};

export const GITOPS_ROLLOUTS: RolloutRecord[] = [
  {
    name: "rollout-bluegreen",
    ns: "argocd",
    strategy: "BlueGreen",
    status: "Paused",
    age: "135m",
    image: "argoproj/rollouts-demo:red",
    managedBy: { kind: "Application", name: "rollouts-demo", ns: "argocd" },
  },
  {
    name: "rollout-canary-api",
    ns: "argocd",
    strategy: "Canary",
    status: "Healthy",
    age: "2d",
    image: "quay.io/demo/payments-api:1.4.2",
    managedBy: { kind: "Application", name: "payments-api", ns: "argocd" },
  },
  {
    name: "rollout-frontend",
    ns: "demo-workloads",
    strategy: "Canary",
    status: "Progressing",
    age: "45m",
    image: "argoproj/rollouts-demo:yellow",
    managedBy: { kind: "Application", name: "frontend-canary", ns: "demo-workloads" },
  },
];

const extraNames = [
  "checkout-api",
  "inventory-svc",
  "notifications",
  "search-indexer",
  "auth-gateway",
  "billing-worker",
  "catalog-web",
  "orders-canary",
  "shipping-bluegreen",
];
const extraNs = ["argocd", "demo-workloads", "payments"];
const extraStatus: GitOpsHealth[] = ["Healthy", "Paused", "Progressing", "Degraded", "Healthy"];

extraNames.forEach((n, i) => {
  GITOPS_ROLLOUTS.push({
    name: `rollout-${n}`,
    ns: extraNs[i % extraNs.length],
    strategy: i % 2 === 0 ? "BlueGreen" : "Canary",
    status: extraStatus[i % extraStatus.length],
    age: i % 3 === 0 ? `${i + 1}d` : `${30 + i * 7}m`,
    image: "argoproj/rollouts-demo:blue",
    managedBy: i % 7 === 0 ? null : { kind: "Application", name: n, ns: extraNs[i % extraNs.length] },
  });
});

export const ARGO_INSTANCES: ArgoCdRecord[] = [
  {
    name: "openshift-gitops",
    ns: "openshift-gitops",
    server: "https://openshift-gitops-server.apps.demo.example.com",
    status: "Healthy",
    version: "v2.14.3",
    age: "45d",
    applications: "18",
  },
  {
    name: "gitops-spoke-east",
    ns: "gitops-spoke-east",
    server: "https://argocd.spoke-east.example.com",
    status: "Healthy",
    version: "v2.13.1",
    age: "22d",
    applications: "7",
  },
];

export const GITOPS_APPLICATIONS: ApplicationRecord[] = [
  {
    name: "rollouts-demo",
    ns: "argocd",
    project: "default",
    sync: "Synced",
    health: "Healthy",
    age: "12d",
    repo: "https://github.com/argoproj/argocd-example-apps.git",
    path: "guestbook",
    revision: "main",
    destination: "in-cluster / rollouts-demo",
    managedBy: null,
  },
  {
    name: "payments-api",
    ns: "argocd",
    project: "payments",
    sync: "OutOfSync",
    health: "Progressing",
    age: "3d",
    repo: "https://gitlab.example.com/payments/payments-api.git",
    path: "deploy/overlays/prod",
    revision: "release-1.4",
    destination: "in-cluster / payments",
    managedBy: null,
  },
  {
    name: "frontend-canary",
    ns: "demo-workloads",
    project: "default",
    sync: "Synced",
    health: "Healthy",
    age: "8d",
    repo: "https://github.com/demo/frontend.git",
    path: "kustomize/canary",
    revision: "main",
    destination: "in-cluster / demo-workloads",
    managedBy: { kind: "ApplicationSet", name: "tenant-workloads", ns: "argocd" },
  },
];

export const GITOPS_APPLICATION_SETS: ApplicationSetRecord[] = [
  {
    name: "cluster-addons",
    ns: "openshift-gitops",
    generators: "Cluster",
    apps: "6",
    age: "20d",
    repo: "https://github.com/demo/cluster-addons.git",
    path: "sets/addons",
    status: "Healthy",
  },
  {
    name: "tenant-workloads",
    ns: "argocd",
    generators: "Git + List",
    apps: "14",
    age: "5d",
    repo: "https://github.com/demo/tenant-workloads.git",
    path: "applicationsets/tenants",
    status: "Healthy",
  },
];

export type AppProjectRecord = {
  name: string;
  ns: string;
  description: string;
  destinations: string;
  sourceRepos: string;
  age: string;
};

export type ImageUpdaterRecord = {
  name: string;
  ns: string;
  images: string;
  strategy: string;
  status: "Healthy" | "Degraded";
  lastUpdate: string;
  age: string;
};

/** Status/health only — never include jwt/tls/credential fields. */
export type AgentSpokeRecord = {
  name: string;
  cluster: string;
  connection: "Connected" | "Disconnected";
  syncMode: "Managed" | "Autonomous";
  lastHeartbeat: string;
  reconnections: number;
};

export type DashboardMetrics = {
  synced: number;
  outOfSync: number;
  healthy: number;
  degraded: number;
  progressing: number;
  syncSuccessRate: number;
  reconciliations24h: number;
  gitFetchFailures: number;
  sparklineSync: number[];
  sparklineReconcile: number[];
  needsAttention: {
    name: string;
    ns: string;
    reason: string;
    severity: "warning" | "danger" | "info";
  }[];
};

export type PromotionPipelineRecord = {
  name: string;
  ns: string;
  environments: string;
  status: "Running" | "Blocked" | "Succeeded" | "Failed";
  gates: string;
  age: string;
};

export const GITOPS_APP_PROJECTS: AppProjectRecord[] = [
  {
    name: "default",
    ns: "argocd",
    description: "Default project for cluster-scoped demos",
    destinations: "in-cluster / *",
    sourceRepos: "https://github.com/argoproj/*, https://github.com/demo/*",
    age: "45d",
  },
  {
    name: "payments",
    ns: "argocd",
    description: "Payments team workloads and overlays",
    destinations: "in-cluster / payments, spoke-east / payments",
    sourceRepos: "https://gitlab.example.com/payments/*",
    age: "18d",
  },
  {
    name: "platform",
    ns: "openshift-gitops",
    description: "Platform add-ons and cluster services",
    destinations: "in-cluster / openshift-*, in-cluster / gitops-*",
    sourceRepos: "https://github.com/demo/cluster-addons.git",
    age: "30d",
  },
];

export const GITOPS_IMAGE_UPDATERS: ImageUpdaterRecord[] = [
  {
    name: "payments-api-updater",
    ns: "argocd",
    images: "quay.io/demo/payments-api",
    strategy: "semver",
    status: "Healthy",
    lastUpdate: "2h ago",
    age: "12d",
  },
  {
    name: "frontend-canary-updater",
    ns: "demo-workloads",
    images: "argoproj/rollouts-demo",
    strategy: "newest-build",
    status: "Degraded",
    lastUpdate: "1d ago",
    age: "8d",
  },
];

export const GITOPS_AGENT_SPOKES: AgentSpokeRecord[] = [
  {
    name: "spoke-east-agent",
    cluster: "spoke-east",
    connection: "Connected",
    syncMode: "Managed",
    lastHeartbeat: "12s ago",
    reconnections: 2,
  },
  {
    name: "spoke-west-agent",
    cluster: "spoke-west",
    connection: "Connected",
    syncMode: "Autonomous",
    lastHeartbeat: "45s ago",
    reconnections: 0,
  },
  {
    name: "edge-lab-agent",
    cluster: "edge-lab",
    connection: "Disconnected",
    syncMode: "Managed",
    lastHeartbeat: "3h ago",
    reconnections: 11,
  },
];

export const GITOPS_PROMOTION_PIPELINES: PromotionPipelineRecord[] = [
  {
    name: "payments-promote",
    ns: "argocd",
    environments: "dev → staging → prod",
    status: "Running",
    gates: "manual (staging→prod)",
    age: "4h",
  },
  {
    name: "frontend-canary-promote",
    ns: "demo-workloads",
    environments: "canary → stable",
    status: "Blocked",
    gates: "analysis + approval",
    age: "1d",
  },
];

function buildDashboardMetrics(): DashboardMetrics {
  const synced = GITOPS_APPLICATIONS.filter((a) => a.sync === "Synced").length;
  const outOfSync = GITOPS_APPLICATIONS.filter((a) => a.sync === "OutOfSync").length;
  const healthy = GITOPS_APPLICATIONS.filter((a) => a.health === "Healthy").length;
  const degraded = GITOPS_APPLICATIONS.filter((a) => a.health === "Degraded").length;
  const progressing = GITOPS_APPLICATIONS.filter((a) => a.health === "Progressing").length;
  const total = GITOPS_APPLICATIONS.length || 1;
  const needsAttention = GITOPS_APPLICATIONS.filter(
    (a) => a.sync === "OutOfSync" || a.health === "Degraded" || a.health === "Progressing"
  ).map((a) => ({
    name: a.name,
    ns: a.ns,
    reason:
      a.health === "Degraded"
        ? "Health degraded"
        : a.sync === "OutOfSync"
          ? "Out of sync with desired revision"
          : "Sync in progress",
    severity: (a.health === "Degraded" ? "danger" : a.sync === "OutOfSync" ? "warning" : "info") as
      | "warning"
      | "danger"
      | "info",
  }));
  return {
    synced,
    outOfSync,
    healthy,
    degraded,
    progressing,
    syncSuccessRate: Math.round((synced / total) * 100),
    reconciliations24h: 128 + synced * 12,
    gitFetchFailures: outOfSync > 0 ? 2 : 0,
    sparklineSync: [72, 78, 81, 75, 88, 90, Math.round((synced / total) * 100)],
    sparklineReconcile: [40, 52, 48, 61, 55, 70, 64],
    needsAttention,
  };
}

export const GITOPS_DASHBOARD_METRICS: DashboardMetrics = buildDashboardMetrics();

export const ARGO_INSTANCE_OPTIONS = ARGO_INSTANCES.map((inst) => ({
  value: `${inst.ns}/${inst.name}`,
  label: `${inst.name} (${inst.ns})`,
}));

export const gitopsDetailPath = (
  kind:
    | "rollouts"
    | "applications"
    | "applicationsets"
    | "argocd"
    | "appprojects"
    | "imageupdaters"
    | "agents"
    | "promotions",
  ns: string,
  name: string
) => `/gitops/ns/${encodeURIComponent(ns)}/${kind}/${encodeURIComponent(name)}`;

export function findRollout(ns: string, name: string) {
  return GITOPS_ROLLOUTS.find((r) => r.ns === ns && r.name === name);
}

export function findApplication(ns: string, name: string) {
  return GITOPS_APPLICATIONS.find((a) => a.ns === ns && a.name === name);
}

/** Applications whose destination targets the given namespace. */
export function applicationsForNamespace(ns: string) {
  const suffix = ` / ${ns}`;
  return GITOPS_APPLICATIONS.filter(
    (a) => a.destination.includes(ns) || a.destination.endsWith(suffix)
  );
}

export function findApplicationSet(ns: string, name: string) {
  return GITOPS_APPLICATION_SETS.find((a) => a.ns === ns && a.name === name);
}

export function findArgoCd(ns: string, name: string) {
  return ARGO_INSTANCES.find((a) => a.ns === ns && a.name === name);
}

export function findAppProject(ns: string, name: string) {
  return GITOPS_APP_PROJECTS.find((p) => p.ns === ns && p.name === name);
}

export function findImageUpdater(ns: string, name: string) {
  return GITOPS_IMAGE_UPDATERS.find((u) => u.ns === ns && u.name === name);
}

export function findPromotionPipeline(ns: string, name: string) {
  return GITOPS_PROMOTION_PIPELINES.find((p) => p.ns === ns && p.name === name);
}

export type DomainAction = "Promote" | "Full Promote" | "Abort" | "Retry" | "Restart";

type LivePatch = {
  status?: GitOpsHealth;
  message?: string;
  busy?: boolean;
  promoted?: boolean;
};

const liveByKey = new Map<string, LivePatch>();
const listeners = new Set<() => void>();

const keyOf = (ns: string, name: string) => `${ns}/${name}`;

export function subscribeGitOpsLive(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitLive() {
  listeners.forEach((fn) => fn());
}

export function getRolloutLive(ns: string, name: string): LivePatch {
  return liveByKey.get(keyOf(ns, name)) ?? {};
}

export function patchRolloutLive(ns: string, name: string, patch: LivePatch) {
  const prev = liveByKey.get(keyOf(ns, name)) ?? {};
  liveByKey.set(keyOf(ns, name), { ...prev, ...patch });
  const seed = findRollout(ns, name);
  if (seed && patch.status) seed.status = patch.status;
  emitLive();
}

export function effectiveRolloutStatus(ns: string, name: string, seed?: GitOpsHealth): GitOpsHealth {
  return getRolloutLive(ns, name).status ?? seed ?? findRollout(ns, name)?.status ?? "Healthy";
}

export function actionStateFor(
  ns: string,
  name: string,
  seed?: GitOpsHealth,
  permission: "edit" | "view" | "no-access" = "edit"
) {
  const live = getRolloutLive(ns, name);
  const status = effectiveRolloutStatus(ns, name, seed);
  const busy = !!live.busy;
  const canEdit = permission === "edit";
  const paused = status === "Paused";
  const scalingDown = status === "Degraded" || status === "Aborting";
  const healthy = status === "Healthy";
  const progressing = status === "Progressing";
  return {
    status,
    message: live.message ?? "",
    busy,
    promoted: !!live.promoted,
    scalingDown,
    promote: canEdit && !busy && paused,
    fullPromote: canEdit && !busy && paused,
    abort: canEdit && !busy && (paused || progressing),
    retry: canEdit && !busy && scalingDown,
    restart: canEdit && !busy && healthy,
  };
}

export function applyDomainAction(
  action: DomainAction,
  ns: string,
  name: string,
  permission: "edit" | "view" | "no-access" = "edit"
) {
  if (permission === "view") return "View-only: action blocked.";
  if (permission === "no-access") return "Access denied.";
  if (action === "Promote" || action === "Full Promote") {
    patchRolloutLive(ns, name, {
      busy: true,
      promoted: true,
      status: "Progressing",
      message: action === "Full Promote" ? "Full promote in progress…" : "Promoting preview to stable…",
    });
    window.setTimeout(() => {
      patchRolloutLive(ns, name, {
        busy: false,
        status: "Healthy",
        message: `${action} completed — Rollout is Healthy`,
      });
    }, 1600);
    return `${action} started`;
  }
  if (action === "Abort") {
    patchRolloutLive(ns, name, {
      busy: true,
      status: "Degraded",
      message: "Aborting — scaling down preview…",
    });
    window.setTimeout(() => {
      patchRolloutLive(ns, name, {
        busy: false,
        status: "Healthy",
        promoted: false,
        message: "Abort complete — stable revision remains active",
      });
    }, 1600);
    return "Abort started";
  }
  if (action === "Restart") {
    patchRolloutLive(ns, name, { busy: true, status: "Progressing", message: "Restarting rollout…" });
    window.setTimeout(() => {
      patchRolloutLive(ns, name, {
        busy: false,
        status: "Paused",
        message: "Restart complete — awaiting promote",
      });
    }, 1600);
    return "Restart started";
  }
  patchRolloutLive(ns, name, { busy: true, status: "Progressing", message: "Retrying rollout step…" });
  window.setTimeout(() => {
    patchRolloutLive(ns, name, {
      busy: false,
      status: "Paused",
      message: "Retry complete — paused for promote",
    });
  }, 1600);
  return "Retry started";
}
