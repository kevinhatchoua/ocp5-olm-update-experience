import { createBrowserRouter, redirect } from "react-router";
import { collectStubPaths } from "./navigation/consoleNav";
import RootLayout from "./components/RootLayout";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import FavoritesPage from "./pages/FavoritesPage";
import EcosystemPage from "./pages/EcosystemPage";
import WorkloadsPage from "./pages/WorkloadsPage";
import PodsPage from "./pages/workloads/PodsPage";
import PodDetailPage from "./pages/workloads/PodDetailPage";
import DeploymentsPage from "./pages/workloads/DeploymentsPage";
import StatefulSetsPage from "./pages/workloads/StatefulSetsPage";
import DaemonSetsPage from "./pages/workloads/DaemonSetsPage";
import JobsPage from "./pages/workloads/JobsPage";
import CronJobsPage from "./pages/workloads/CronJobsPage";
import TopologyPage from "./pages/workloads/TopologyPage";
import ServicesPage from "./pages/networking/ServicesPage";
import RoutesPage from "./pages/networking/RoutesPage";
import IngressesPage from "./pages/networking/IngressesPage";
import ServiceDetailPage from "./pages/networking/ServiceDetailPage";
import RouteDetailPage from "./pages/networking/RouteDetailPage";
import IngressDetailPage from "./pages/networking/IngressDetailPage";
import NetworkPolicyDetailPage from "./pages/networking/NetworkPolicyDetailPage";
import NetworkPoliciesPage from "./pages/networking/NetworkPoliciesPage";
import NodeNetworkConfigurationPolicyPage from "./pages/networking/NodeNetworkConfigurationPolicyPage";
import NncpDetailPage from "./pages/networking/NncpDetailPage";
import NetworkAttachmentDefinitionsPage from "./pages/networking/NetworkAttachmentDefinitionsPage";
import NadDetailPage from "./pages/networking/NadDetailPage";
import UserDefinedNetworksPage from "./pages/networking/UserDefinedNetworksPage";
import UdnDetailPage from "./pages/networking/UdnDetailPage";
import NodeNetworkConfigurationPage from "./pages/networking/NodeNetworkConfigurationPage";
import NetworkTopologyPage from "./pages/networking/NetworkTopologyPage";
import CreateRoutePage from "./pages/networking/CreateRoutePage";
import CreateServicePage from "./pages/networking/CreateServicePage";
import CreateIngressPage from "./pages/networking/CreateIngressPage";
import PrototypeGenericCreatePage from "./pages/PrototypeGenericCreatePage";
import { createResourceCreatePage } from "./pages/createPageFactory";
import { createPrototypeResourceDetailPage } from "./pages/createDetailPageFactory";
import CreateVirtualMachinePage from "./pages/virtualization/CreateVirtualMachinePage";
import VirtualMachinesPage from "./pages/virtualization/VirtualMachinesPage";
import VirtualMachineDetailPage from "./pages/virtualization/VirtualMachineDetailPage";
import TemplatesPage from "./pages/virtualization/TemplatesPage";
import BootableVolumesPage from "./pages/virtualization/BootableVolumesPage";
import InstanceTypesPage from "./pages/virtualization/InstanceTypesPage";
import VirtualMachineNetworksPage from "./pages/virtualization/VirtualMachineNetworksPage";
import MigrationPoliciesPage from "./pages/virtualization/MigrationPoliciesPage";
import CheckupsPage from "./pages/virtualization/CheckupsPage";
import VirtSettingsPage from "./pages/virtualization/VirtSettingsPage";
import StoragePage from "./pages/StoragePage";
import BuildsPage from "./pages/BuildsPage";
import ObservePage from "./pages/ObservePage";
import ComputePage from "./pages/ComputePage";
import UserManagementPage from "./pages/UserManagementPage";
import UserPreferencesPage from "./pages/UserPreferencesPage";
import AlertsPage from "./pages/AlertsPage";
import ActivityDetailsPage from "./pages/ActivityDetailsPage";
import ClusterInventoryPage from "./pages/ClusterInventoryPage";
import ClusterSettingsPage from "./pages/administration/ClusterSettingsPage";
import ClusterUpdatePage from "./pages/administration/ClusterUpdatePage";
import AgenticRunsPage from "./pages/administration/AgenticRunsPage";
import AgenticRunDetailPage from "./pages/administration/AgenticRunDetailPage";

import OperatorsLifecyclePage from "./pages/administration/OperatorsLifecyclePage";
import UpdateCompletePage from "./pages/administration/UpdateCompletePage";
import UpdateFailedPage from "./pages/administration/UpdateFailedPage";
import VersionDetailPage from "./pages/administration/VersionDetailPage";
import AgentModePage from "./pages/administration/AgentModePage";
import ClusterUpdateHistoryPage from "./pages/administration/ClusterUpdateHistoryPage";
import ResourceQuotasPage from "./pages/administration/ResourceQuotasPage";
import LimitRangesPage from "./pages/administration/LimitRangesPage";
import CustomResourceDefinitionsPage from "./pages/administration/CustomResourceDefinitionsPage";
import DynamicPluginsPage from "./pages/administration/DynamicPluginsPage";
import SoftwareCatalogPage from "./pages/ecosystem/SoftwareCatalogPage";
import InstalledOperatorsPage from "./pages/ecosystem/InstalledOperatorsPage";
import HelmPage from "./pages/ecosystem/HelmPage";
import OperatorDetailPage from "./pages/ecosystem/OperatorDetailPage";
import OperatorUpdatePage from "./pages/ecosystem/OperatorUpdatePage";
import OperatorInstallingPage from "./pages/ecosystem/OperatorInstallingPage";
import OperatorInstalledPage from "./pages/ecosystem/OperatorInstalledPage";
import NodeDetailPage from "./pages/compute/NodeDetailPage";
import ConsoleStubPage from "./pages/ConsoleStubPage";
import GitOpsRolloutsPage from "./pages/gitops/GitOpsRolloutsPage";
import GitOpsRolloutDetailPage from "./pages/gitops/GitOpsRolloutDetailPage";
import GitOpsArgoCdPage, { GitOpsArgoCdDetailPage } from "./pages/gitops/GitOpsArgoCdPage";
import GitOpsApplicationsPage, { GitOpsApplicationDetailPage } from "./pages/gitops/GitOpsApplicationsPage";
import GitOpsApplicationSetsPage, { GitOpsApplicationSetDetailPage } from "./pages/gitops/GitOpsApplicationSetsPage";
import GitOpsDashboardPage from "./pages/gitops/GitOpsDashboardPage";
import GitOpsAppProjectsPage, { GitOpsAppProjectDetailPage } from "./pages/gitops/GitOpsAppProjectsPage";
import GitOpsImageUpdaterPage, { GitOpsImageUpdaterDetailPage } from "./pages/gitops/GitOpsImageUpdaterPage";
import GitOpsAgentSpokesPage from "./pages/gitops/GitOpsAgentSpokesPage";
import GitOpsPromotionsPage, { GitOpsPromotionDetailPage } from "./pages/gitops/GitOpsPromotionsPage";
import GitOpsSettingsPage from "./pages/gitops/GitOpsSettingsPage";
import GitOpsCreateWizardPage from "./pages/gitops/GitOpsCreateWizardPage";
import NamespaceDetailPage from "./pages/administration/NamespaceDetailPage";
import NamespacesPage from "./pages/administration/NamespacesPage";

const consoleStubRoutes = collectStubPaths().map((fullPath) => ({
  path: fullPath.replace(/^\//, ""),
  Component: ConsoleStubPage,
}));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        /** Pathless layout: matches `/` and all child paths (avoids empty-string segment issues). */
        Component: Layout,
        children: [
          { index: true, Component: HomePage },
          { path: "favorites", Component: FavoritesPage },
          { path: "ecosystem", Component: EcosystemPage },
          { path: "ecosystem/software-catalog", Component: SoftwareCatalogPage },
          { path: "ecosystem/software-catalog/:operatorId", Component: OperatorDetailPage },
          { path: "ecosystem/software-catalog/:operatorId/update", Component: OperatorUpdatePage },
          { path: "ecosystem/software-catalog/:operatorId/install", Component: OperatorInstallingPage },
          { path: "ecosystem/software-catalog/:operatorId/installing", Component: OperatorInstallingPage },
          { path: "ecosystem/software-catalog/:operatorId/installed", Component: OperatorInstalledPage },

          { path: "ecosystem/installed-operators", Component: InstalledOperatorsPage },
          { path: "ecosystem/installed-operators/:operatorName", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/update", Component: OperatorUpdatePage },
          { path: "ecosystem/installed-operators/:operatorName/installing", Component: OperatorInstallingPage },
          { path: "ecosystem/installed-operators/:operatorName/installed", Component: OperatorInstalledPage },
          { path: "ecosystem/installed-operators/:operatorName/subscription", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/yaml", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/logs", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/events", Component: OperatorDetailPage },
          { path: "ecosystem/helm", Component: HelmPage },
          { path: "workloads", Component: WorkloadsPage },
          { path: "workloads/pods", Component: PodsPage },
          { path: "workloads/pods/create", Component: createResourceCreatePage("Pod") },
          { path: "workloads/pods/:namespace/:podName", Component: PodDetailPage },
          { path: "workloads/deployments", Component: DeploymentsPage },
          { path: "workloads/deployments/create", Component: createResourceCreatePage("Deployment") },
          { path: "workloads/deployments/:namespace/:name", Component: createPrototypeResourceDetailPage("deployments") },
          { path: "workloads/statefulsets", Component: StatefulSetsPage },
          { path: "workloads/statefulsets/create", Component: createResourceCreatePage("StatefulSet") },
          { path: "workloads/statefulsets/:namespace/:name", Component: createPrototypeResourceDetailPage("statefulsets") },
          { path: "workloads/daemonsets", Component: DaemonSetsPage },
          { path: "workloads/daemonsets/create", Component: createResourceCreatePage("DaemonSet") },
          { path: "workloads/daemonsets/:namespace/:name", Component: createPrototypeResourceDetailPage("daemonsets") },
          { path: "workloads/jobs", Component: JobsPage },
          { path: "workloads/jobs/create", Component: createResourceCreatePage("Job") },
          { path: "workloads/jobs/:namespace/:name", Component: createPrototypeResourceDetailPage("jobs") },
          { path: "workloads/cronjobs", Component: CronJobsPage },
          { path: "workloads/cronjobs/create", Component: createResourceCreatePage("CronJob") },
          { path: "workloads/cronjobs/:namespace/:name", Component: createPrototypeResourceDetailPage("cronjobs") },
          { path: "workloads/topology", Component: TopologyPage },
          { path: "gitops", loader: () => redirect("/gitops/overview") },
          { path: "gitops/overview", Component: GitOpsDashboardPage },
          { path: "gitops/rollouts", Component: GitOpsRolloutsPage },
          { path: "gitops/argocd", Component: GitOpsArgoCdPage },
          { path: "gitops/applications", Component: GitOpsApplicationsPage },
          { path: "gitops/applicationsets", Component: GitOpsApplicationSetsPage },
          { path: "gitops/appprojects", Component: GitOpsAppProjectsPage },
          { path: "gitops/imageupdaters", Component: GitOpsImageUpdaterPage },
          { path: "gitops/agents", Component: GitOpsAgentSpokesPage },
          { path: "gitops/promotions", Component: GitOpsPromotionsPage },
          { path: "gitops/settings", Component: GitOpsSettingsPage },
          { path: "gitops/create", Component: GitOpsCreateWizardPage },
          { path: "gitops/ns/:namespace/rollouts/:name", Component: GitOpsRolloutDetailPage },
          { path: "gitops/ns/:namespace/argocd/:name", Component: GitOpsArgoCdDetailPage },
          { path: "gitops/ns/:namespace/applications/:name", Component: GitOpsApplicationDetailPage },
          { path: "gitops/ns/:namespace/applicationsets/:name", Component: GitOpsApplicationSetDetailPage },
          { path: "gitops/ns/:namespace/appprojects/:name", Component: GitOpsAppProjectDetailPage },
          { path: "gitops/ns/:namespace/imageupdaters/:name", Component: GitOpsImageUpdaterDetailPage },
          { path: "gitops/ns/:namespace/promotions/:name", Component: GitOpsPromotionDetailPage },
          { path: "networking", Component: ServicesPage },
          { path: "networking/services/create", Component: CreateServicePage },
          { path: "networking/services/:namespace/:name", Component: ServiceDetailPage },
          { path: "networking/topology", Component: NetworkTopologyPage },
          { path: "networking/routes", Component: RoutesPage },
          { path: "networking/routes/create", Component: CreateRoutePage },
          { path: "networking/routes/:namespace/:name", Component: RouteDetailPage },
          { path: "networking/ingresses", Component: IngressesPage },
          { path: "networking/ingresses/create", Component: CreateIngressPage },
          { path: "networking/ingresses/:namespace/:name", Component: IngressDetailPage },
          { path: "networking/networkpolicies", Component: NetworkPoliciesPage },
          { path: "networking/networkpolicies/create", Component: createResourceCreatePage("NetworkPolicy") },
          { path: "networking/networkpolicies/:namespace/:name", Component: NetworkPolicyDetailPage },
          { path: "networking/nodenetworkconfigurationpolicy", Component: NodeNetworkConfigurationPolicyPage },
          {
            path: "networking/nodenetworkconfigurationpolicy/:name",
            Component: NncpDetailPage,
          },
          { path: "networking/networkattachmentdefinitions", Component: NetworkAttachmentDefinitionsPage },
          {
            path: "networking/networkattachmentdefinitions/:namespace/:name",
            Component: NadDetailPage,
          },
          { path: "networking/userdefinednetworks", Component: UserDefinedNetworksPage },
          { path: "networking/userdefinednetworks/cluster/:name", Component: UdnDetailPage },
          { path: "networking/userdefinednetworks/:namespace/:name", Component: UdnDetailPage },
          { path: "networking/node-network-configuration", Component: NodeNetworkConfigurationPage },
          { path: "virtualization/virtualmachines", Component: VirtualMachinesPage },
          { path: "virtualization/virtualmachines/create", Component: CreateVirtualMachinePage },
          { path: "virtualization/virtualmachines/:namespace/:name", Component: VirtualMachineDetailPage },
          { path: "virtualization/templates", Component: TemplatesPage },
          { path: "virtualization/templates/create", Component: createResourceCreatePage("Template") },
          { path: "virtualization/templates/:namespace/:name", Component: createPrototypeResourceDetailPage("templates") },
          { path: "virtualization/bootablevolumes", Component: BootableVolumesPage },
          { path: "virtualization/bootablevolumes/create", Component: createResourceCreatePage("BootableVolume") },
          { path: "virtualization/bootablevolumes/:namespace/:name", Component: createPrototypeResourceDetailPage("bootablevolumes") },
          { path: "virtualization/instancetypes", Component: InstanceTypesPage },
          { path: "virtualization/virtualmachinenetworks", Component: VirtualMachineNetworksPage },
          { path: "virtualization/migrationpolicies", Component: MigrationPoliciesPage },
          { path: "virtualization/migrationpolicies/create", Component: createResourceCreatePage("MigrationPolicy") },
          { path: "virtualization/migrationpolicies/:name", Component: createPrototypeResourceDetailPage("migrationpolicies") },
          { path: "virtualization/checkups", Component: CheckupsPage },
          { path: "virtualization/settings", Component: VirtSettingsPage },
          { path: "storage", Component: StoragePage },
          { path: "storage/create", Component: createResourceCreatePage("Volume") },
          { path: "storage/:namespace/:name", Component: createPrototypeResourceDetailPage("storage") },
          { path: "builds", Component: BuildsPage },
          { path: "builds/create", Component: createResourceCreatePage("Build") },
          { path: "builds/:namespace/:name", Component: createPrototypeResourceDetailPage("builds") },
          { path: "observe", Component: ObservePage },
          { path: "compute", Component: ComputePage },
          { path: "compute/nodes/:nodeName", Component: NodeDetailPage },
          { path: "user-management", Component: UserManagementPage },
          { path: "user-management/create", Component: createResourceCreatePage("User") },
          { path: "user-management/:name", Component: createPrototypeResourceDetailPage("users") },
          { path: "agentic-runs", Component: AgenticRunsPage },
          { path: "agentic-runs/:runId", Component: AgenticRunDetailPage },
          { path: "administration/cluster-update", Component: ClusterUpdatePage },
          { path: "administration/cluster-update/version/:version", Component: VersionDetailPage },
          {
            path: "administration/cluster-update/in-progress",
            loader: () => redirect("/administration/cluster-update"),
          },
          { path: "administration/cluster-update/operators", Component: OperatorsLifecyclePage },
          { path: "administration/cluster-update/history", Component: ClusterUpdateHistoryPage },
          { path: "administration/cluster-update/complete", Component: UpdateCompletePage },
          { path: "administration/cluster-update/failed", Component: UpdateFailedPage },
          { path: "administration/cluster-update/agent-mode", Component: AgentModePage },
          { path: "administration/cluster-settings", Component: ClusterSettingsPage },
          { path: "administration/namespaces", Component: NamespacesPage },
          { path: "administration/namespaces/create", Component: createResourceCreatePage("Namespace") },
          { path: "administration/namespaces/:name", Component: NamespaceDetailPage },
          { path: "administration/resource-quotas", Component: ResourceQuotasPage },
          { path: "administration/resource-quotas/create", Component: createResourceCreatePage("ResourceQuota") },
          { path: "administration/resource-quotas/:namespace/:name", Component: createPrototypeResourceDetailPage("resource-quotas") },
          { path: "administration/limit-ranges", Component: LimitRangesPage },
          { path: "administration/limit-ranges/create", Component: createResourceCreatePage("LimitRange") },
          { path: "administration/limit-ranges/:namespace/:name", Component: createPrototypeResourceDetailPage("limit-ranges") },
          { path: "administration/custom-resource-definitions", Component: CustomResourceDefinitionsPage },
          {
            path: "administration/custom-resource-definitions/create",
            Component: createResourceCreatePage("CRD"),
          },
          {
            path: "administration/custom-resource-definitions/:name",
            Component: createPrototypeResourceDetailPage("crds"),
          },
          { path: "administration/dynamic-plugins", Component: DynamicPluginsPage },
          { path: "user-preferences", Component: UserPreferencesPage },
          { path: "settings", loader: () => redirect("/administration/cluster-settings") },
          { path: "alerts", Component: AlertsPage },
          { path: "activity/:id", Component: ActivityDetailsPage },
          { path: "inventory", Component: ClusterInventoryPage },
          { path: "create/:kind", Component: PrototypeGenericCreatePage },
          ...consoleStubRoutes,
        ],
      },
    ],
  },
]);