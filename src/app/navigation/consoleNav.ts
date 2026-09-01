/**
 * OpenShift console–style navigation data for the prototype shell.
 * Sub-items mirror common console resource names; non-prototype routes resolve to {@link ConsoleStubPage}.
 */

export type SubNavEntry = { path: string; label: string } | "separator";

export const HOME_SUB: SubNavEntry[] = [
  { path: "/", label: "Overview" },
  { path: "/home/projects", label: "Projects" },
  { path: "/home/search", label: "Search" },
  { path: "/home/api-explorer", label: "API Explorer" },
  { path: "/home/events", label: "Events" },
];

export const ECOSYSTEM_SUB: SubNavEntry[] = [
  { path: "/ecosystem/software-catalog", label: "Software Catalog" },
  { path: "/ecosystem/installed-operators", label: "Installed Operators" },
  { path: "/ecosystem/helm", label: "Helm" },
];

export const WORKLOADS_SUB: SubNavEntry[] = [
  { path: "/workloads/pods", label: "Pods" },
  { path: "/workloads/topology", label: "Topology" },
  { path: "/workloads/deployments", label: "Deployments" },
  { path: "/workloads/deploymentconfigs", label: "DeploymentConfigs" },
  { path: "/workloads/statefulsets", label: "StatefulSets" },
  { path: "/workloads/secrets", label: "Secrets" },
  { path: "/workloads/configmaps", label: "ConfigMaps" },
  "separator",
  { path: "/workloads/cronjobs", label: "CronJobs" },
  { path: "/workloads/jobs", label: "Jobs" },
  { path: "/workloads/daemonsets", label: "DaemonSets" },
  { path: "/workloads/replicasets", label: "ReplicaSets" },
  { path: "/workloads/replicationcontrollers", label: "ReplicationControllers" },
  { path: "/workloads/horizontalpodautoscalers", label: "HorizontalPodAutoscalers" },
  { path: "/workloads/poddisruptionbudgets", label: "PodDisruptionBudgets" },
];

export const NETWORKING_SUB: SubNavEntry[] = [
  { path: "/networking/topology", label: "Topology" },
  { path: "/networking", label: "Services" },
  { path: "/networking/routes", label: "Routes" },
  { path: "/networking/ingresses", label: "Ingresses" },
  { path: "/networking/physical-networks", label: "Physical networks" },
  { path: "/networking/networkpolicies", label: "NetworkPolicies" },
  { path: "/networking/nodenetworkconfigurationpolicy", label: "NodeNetworkConfigurationPolicy" },
  { path: "/networking/networkattachmentdefinitions", label: "NetworkAttachmentDefinitions" },
  { path: "/networking/userdefinednetworks", label: "UserDefinedNetworks" },
  { path: "/networking/node-network-configuration", label: "Node network configuration" },
];

export const STORAGE_SUB: SubNavEntry[] = [
  { path: "/storage", label: "PersistentVolumes" },
  { path: "/storage/persistentvolumeclaims", label: "PersistentVolumeClaims" },
  { path: "/storage/storageclasses", label: "StorageClasses" },
  { path: "/storage/volumeattributesclasses", label: "VolumeAttributesClasses" },
  { path: "/storage/volumesnapshots", label: "VolumeSnapshots" },
  { path: "/storage/volumesnapshotclasses", label: "VolumeSnapshotClasses" },
  { path: "/storage/volumesnapshotcontents", label: "VolumeSnapshotContents" },
];

export const BUILDS_SUB: SubNavEntry[] = [
  { path: "/builds", label: "BuildConfigs" },
  { path: "/builds/builds", label: "Builds" },
  { path: "/builds/imagestreams", label: "ImageStreams" },
];

export const OBSERVE_SUB: SubNavEntry[] = [
  { path: "/observe", label: "Alerting" },
  { path: "/observe/metrics", label: "Metrics" },
  { path: "/observe/dashboards", label: "Dashboards" },
  { path: "/observe/targets", label: "Targets" },
];

export const VIRTUALIZATION_SUB: SubNavEntry[] = [
  { path: "/virtualization/virtualmachines", label: "VirtualMachines" },
  { path: "/virtualization/templates", label: "Templates" },
  { path: "/virtualization/bootablevolumes", label: "Bootable volumes" },
  "separator",
  { path: "/virtualization/instancetypes", label: "InstanceTypes" },
  { path: "/virtualization/virtualmachinenetworks", label: "Virtual machine networks" },
  "separator",
  { path: "/virtualization/migrationpolicies", label: "MigrationPolicies" },
  { path: "/virtualization/checkups", label: "Checkups" },
  "separator",
  { path: "/virtualization/settings", label: "Settings" },
];

export const COMPUTE_SUB: SubNavEntry[] = [
  { path: "/compute", label: "Nodes" },
  { path: "/compute/machines", label: "Machines" },
  { path: "/compute/machineautoscalers", label: "MachineAutoscalers" },
  { path: "/compute/machinehealthchecks", label: "MachineHealthChecks" },
  "separator",
  { path: "/compute/controlplanemachinesets", label: "ControlPlaneMachineSets" },
  { path: "/compute/machinesets", label: "MachineSets" },
  "separator",
  { path: "/compute/machineconfigs", label: "MachineConfigs" },
  { path: "/compute/machineconfigpools", label: "MachineConfigPools" },
];

export const AGENTIC_RUNS_SUB: SubNavEntry[] = [
  { path: "/agentic-runs", label: "Agentic runs" },
];

export const USER_MANAGEMENT_SUB: SubNavEntry[] = [
  { path: "/user-management", label: "Users" },
  { path: "/user-management/groups", label: "Groups" },
  { path: "/user-management/serviceaccounts", label: "ServiceAccounts" },
  { path: "/user-management/roles", label: "Roles" },
  { path: "/user-management/rolebindings", label: "RoleBindings" },
];

export const ADMINISTRATION_SUB: SubNavEntry[] = [
  { path: "/administration/cluster-update", label: "Cluster Update" },
  { path: "/administration/cluster-settings", label: "Cluster Settings" },
  { path: "/administration/namespaces", label: "Namespaces" },
  { path: "/administration/resource-quotas", label: "ResourceQuotas" },
  { path: "/administration/limit-ranges", label: "LimitRanges" },
  { path: "/administration/custom-resource-definitions", label: "CustomResourceDefinitions" },
  { path: "/administration/dynamic-plugins", label: "Dynamic Plugins" },
];

/** GitOps surfaces (HPUX-1943 / HPUX-2073 / GITOPS-10917). */
export const GITOPS_SUB: SubNavEntry[] = [
  { path: "/gitops/overview", label: "Dashboard" },
  { path: "/gitops/argocd", label: "ArgoCD Instances" },
  { path: "/gitops/applications", label: "Applications" },
  { path: "/gitops/applicationsets", label: "ApplicationSets" },
  { path: "/gitops/promotions", label: "Promotion Pipelines" },
  { path: "/gitops/rollouts", label: "Rollouts" },
  { path: "/gitops/appprojects", label: "AppProjects" },
  { path: "/gitops/settings", label: "Settings" },
  { path: "/gitops/imageupdaters", label: "Image Updater" },
  { path: "/gitops/agents", label: "Connected Agents" },
];

/** Paths that should render {@link ConsoleStubPage} (plus any ad-hoc additions in routes). */
export function collectStubPaths(): string[] {
  const all: SubNavEntry[][] = [
    HOME_SUB,
    ECOSYSTEM_SUB,
    WORKLOADS_SUB,
    GITOPS_SUB,
    NETWORKING_SUB,
    STORAGE_SUB,
    BUILDS_SUB,
    OBSERVE_SUB,
    VIRTUALIZATION_SUB,
    COMPUTE_SUB,
    AGENTIC_RUNS_SUB,
    USER_MANAGEMENT_SUB,
    ADMINISTRATION_SUB,
  ];
  const paths = new Set<string>();
  const realPages = new Set<string>([
    "/",
    "/ecosystem/software-catalog",
    "/ecosystem/installed-operators",
    "/ecosystem/helm",
    "/workloads/topology",
    "/workloads/pods",
    "/workloads/deployments",
    "/workloads/statefulsets",
    "/workloads/daemonsets",
    "/workloads/jobs",
    "/workloads/cronjobs",
    "/gitops",
    "/gitops/overview",
    "/gitops/rollouts",
    "/gitops/argocd",
    "/gitops/applications",
    "/gitops/applicationsets",
    "/gitops/appprojects",
    "/gitops/imageupdaters",
    "/gitops/agents",
    "/gitops/promotions",
    "/gitops/settings",
    "/gitops/create",
    "/networking",
    "/networking/topology",
    "/networking/routes",
    "/networking/ingresses",
    "/networking/physical-networks",
    "/networking/networkpolicies",
    "/networking/nodenetworkconfigurationpolicy",
    "/networking/networkattachmentdefinitions",
    "/networking/userdefinednetworks",
    "/networking/node-network-configuration",
    "/virtualization/virtualmachines",
    "/virtualization/templates",
    "/virtualization/bootablevolumes",
    "/virtualization/instancetypes",
    "/virtualization/virtualmachinenetworks",
    "/virtualization/migrationpolicies",
    "/virtualization/checkups",
    "/virtualization/settings",
    "/storage",
    "/builds",
    "/observe",
    "/compute",
    "/agentic-runs",
    "/user-management",
    "/administration/cluster-update",
    "/administration/cluster-settings",
    "/administration/namespaces",
    "/administration/resource-quotas",
    "/administration/limit-ranges",
    "/administration/custom-resource-definitions",
    "/administration/dynamic-plugins",
  ]);
  for (const group of all) {
    for (const entry of group) {
      if (entry === "separator") continue;
      if (!realPages.has(entry.path)) paths.add(entry.path);
    }
  }
  return [...paths].sort();
}
