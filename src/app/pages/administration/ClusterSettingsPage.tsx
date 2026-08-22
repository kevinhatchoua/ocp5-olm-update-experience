import { useState, useEffect, useMemo } from "react";
import {
  Alert,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Icon,
  Label,
  Pagination,
  PaginationVariant,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleUpIcon from "@patternfly/react-icons/dist/esm/icons/angle-up-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import { Link, useSearchParams } from "react-router";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { ClusterSettingsUpdatePanel } from "../../components/cluster-update/ClusterSettingsUpdatePanel";
import { ClusterUpdateInProgressStatus } from "../../components/cluster-update/ClusterUpdateInProgressStatus";
import {
  CLUSTER_ID,
  CLUSTER_SLA_DAYS_REMAINING,
} from "../../constants/clusterVersionDemo";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsNamedResourceDataView,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../../components/dataView/OcsPrototypeListTable";

type SettingsTab = "details" | "cluster-operators" | "configuration";

interface ClusterOperator {
  name: string;
  version: string;
  available: boolean;
  progressing: boolean;
  degraded: boolean;
  message?: string;
  lastTransition: string;
}

const CLUSTER_OPERATORS: ClusterOperator[] = [
  { name: "authentication", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "2h ago" },
  { name: "cloud-controller-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "cloud-credential", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "cluster-autoscaler", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "config-operator", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "console", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "1d ago" },
  { name: "dns", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "etcd", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "45m ago" },
  { name: "image-registry", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "ingress", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "insights", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "kube-apiserver", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "kube-controller-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "kube-scheduler", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "kube-storage-version-migrator", version: "5.0.12", available: true, progressing: true, degraded: false, message: "StorageVersionMigration in progress", lastTransition: "15m ago" },
  { name: "machine-api", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "machine-approver", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "machine-config", version: "5.0.12", available: true, progressing: false, degraded: true, message: "MachineConfigControllerFailed: waitForControllerConfigToBeCompleted", lastTransition: "14m ago" },
  { name: "marketplace", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "monitoring", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "1d ago" },
  { name: "network", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "node-tuning", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "openshift-apiserver", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "openshift-controller-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "openshift-samples", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "operator-lifecycle-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "operator-lifecycle-manager-catalog", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "service-ca", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "storage", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
];

interface ConfigResource {
  name: string;
  apiVersion: string;
  kind: string;
}

const CONFIG_RESOURCES: ConfigResource[] = [
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "APIServer" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Authentication" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Build" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Console" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "DNS" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "FeatureGate" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Image" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Infrastructure" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Ingress" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Network" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Node" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "OAuth" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "OperatorHub" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Project" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Proxy" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Scheduler" },
];

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Label color={ok ? "green" : "red"} icon={ok ? <CheckCircleIcon /> : <TimesCircleIcon />} isCompact>
      {label}
    </Label>
  );
}

type ClusterOperatorFilters = { name: string };
type ClusterOperatorSortColumn = "name" | "version" | "available" | "progressing" | "degraded" | "lastTransition";

function rowMatchesClusterOperatorFilters(row: ClusterOperator, filters: ClusterOperatorFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  return true;
}

function sortClusterOperators(rows: ClusterOperator[], column: ClusterOperatorSortColumn, direction: SortDirection): ClusterOperator[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "version":
        return compareStrings(a.version, b.version, direction);
      case "available":
        return compareStrings(a.available ? "True" : "False", b.available ? "True" : "False", direction);
      case "progressing":
        return compareStrings(a.progressing ? "True" : "False", b.progressing ? "True" : "False", direction);
      case "degraded":
        return compareStrings(a.degraded ? "True" : "False", b.degraded ? "True" : "False", direction);
      case "lastTransition":
        return compareStrings(a.lastTransition, b.lastTransition, direction);
      default:
        return 0;
    }
  });
}

function ClusterOperatorsTab() {
  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ClusterOperatorFilters>({
    initialFilters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<ClusterOperatorSortColumn>("name");

  const filteredRows = useMemo(
    () => CLUSTER_OPERATORS.filter((row) => rowMatchesClusterOperatorFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortClusterOperators(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const colSpan = 6;

  return (
      <DataView ouiaId="cluster-operators-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
        <DataViewToolbar
          ouiaId="cluster-operators-dv-toolbar"
          id="cluster-operators-dv-toolbar"
          className={OCS_PROTOTYPE_TOOLBAR_CLASS}
          clearAllFilters={clearAllFilters}
          collapseListedFiltersBreakpoint="xl"
          filters={
            <IoDataViewFiltersWithMidActions<ClusterOperatorFilters>
              values={filters}
              onChange={
                ((_filterId: string, partial: Partial<Record<"name", unknown>>) =>
                  onSetFilters(partial as Partial<ClusterOperatorFilters>)) as never
              }
              breakpoint="xl"
              midContent={null}
            >
              <DataViewTextFilter
                title="Name"
                filterId="name"
                placeholder="Filter by name..."
                style={{ minWidth: "16rem", maxWidth: "100%" }}
              />
            </IoDataViewFiltersWithMidActions>
          }
          pagination={
            <Pagination
              perPageOptions={[
                { title: "10", value: 10 },
                { title: "20", value: 20 },
                { title: "50", value: 50 },
              ]}
              itemCount={itemCount}
              page={page}
              perPage={perPage}
              onSetPage={(_e, p) => setPage(p)}
              onPerPageSelect={(_e, pp) => {
                setPerPage(pp);
                setPage(1);
              }}
              variant={PaginationVariant.top}
              isCompact
              ouiaId="cluster-operators-pagination"
              widgetId="cluster-operators-pagination"
              titles={{ items: "cluster operators" }}
              paginationAriaLabel="Cluster operators pagination"
            />
          }
        />

        <OcsPrototypeListTable ariaLabel="Cluster operators">
          <Thead>
            <Tr>
              <Th dataLabel="Name">
                <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Version">
                <SortableTableHeader label="Version" column="version" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Available">
                <SortableTableHeader label="Available" column="available" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Progressing">
                <SortableTableHeader label="Progressing" column="progressing" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Degraded">
                <SortableTableHeader label="Degraded" column="degraded" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Last Transition">
                <SortableTableHeader label="Last Transition" column="lastTransition" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginated.length === 0 ? (
              <Tr>
                <Td colSpan={colSpan} dataLabel="Empty state">
                  <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                    No cluster operators match your filters.
                  </Content>
                </Td>
              </Tr>
            ) : (
              paginated.flatMap((op) => {
                const rows = [
                  <Tr
                    key={op.name}
                    onClick={() => setExpandedOp(expandedOp === op.name ? null : op.name)}
                    className={op.degraded ? "ocs-cluster-operator-row--degraded" : undefined}
                    style={{ cursor: "pointer" }}
                  >
                    <Td dataLabel="Name">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        {expandedOp === op.name ? <AngleUpIcon /> : <AngleDownIcon />}
                        <Content component="small">{op.name}</Content>
                      </Flex>
                    </Td>
                    <Td dataLabel="Version">
                      <Content component="small">{op.version}</Content>
                    </Td>
                    <Td dataLabel="Available">
                      <StatusBadge ok={op.available} label={op.available ? "True" : "False"} />
                    </Td>
                    <Td dataLabel="Progressing">
                      {op.progressing ? (
                        <Label color="blue" icon={<ClockIcon />} isCompact>
                          True
                        </Label>
                      ) : (
                        <Content component="small">False</Content>
                      )}
                    </Td>
                    <Td dataLabel="Degraded">
                      <StatusBadge ok={!op.degraded} label={op.degraded ? "True" : "False"} />
                    </Td>
                    <Td dataLabel="Last Transition">
                      <Content component="small">{op.lastTransition}</Content>
                    </Td>
                  </Tr>,
                ];
                if (expandedOp === op.name) {
                  rows.push(
                    <Tr key={`${op.name}-detail`}>
                      <Td colSpan={colSpan} dataLabel="Details">
                        <DescriptionList isCompact columnModifier={{ default: "2Col" }}>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Operator</DescriptionListTerm>
                            <DescriptionListDescription>{op.name}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Version</DescriptionListTerm>
                            <DescriptionListDescription>{op.version}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Message</DescriptionListTerm>
                            <DescriptionListDescription>{op.message || "All is well"}</DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </Td>
                    </Tr>
                  );
                }
                return rows;
              })
            )}
          </Tbody>
        </OcsPrototypeListTable>
      </DataView>
  );
}
type ConfigResourceFilters = { name: string; kind: string };
type ConfigResourceSortColumn = "name" | "kind" | "apiVersion";

function rowMatchesConfigResourceFilters(row: ConfigResource, filters: ConfigResourceFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const kindQ = (filters.kind ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (kindQ && !row.kind.toLowerCase().includes(kindQ)) return false;
  return true;
}

function sortConfigResources(rows: ConfigResource[], column: ConfigResourceSortColumn, direction: SortDirection): ConfigResource[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "kind":
        return compareStrings(a.kind, b.kind, direction);
      case "apiVersion":
        return compareStrings(a.apiVersion, b.apiVersion, direction);
      default:
        return 0;
    }
  });
}

function ConfigurationTab() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ConfigResourceFilters>({
    initialFilters: { name: "", kind: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<ConfigResourceSortColumn>("kind");

  const filteredRows = useMemo(
    () => CONFIG_RESOURCES.filter((row) => rowMatchesConfigResourceFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortConfigResources(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.kind, perPage, setPage]);

  const colSpan = 4;

  return (
      <DataView ouiaId="configuration-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
        <DataViewToolbar
          ouiaId="configuration-dv-toolbar"
          id="configuration-dv-toolbar"
          className={OCS_PROTOTYPE_TOOLBAR_CLASS}
          clearAllFilters={clearAllFilters}
          collapseListedFiltersBreakpoint="xl"
          filters={
            <IoDataViewFiltersWithMidActions<ConfigResourceFilters>
              values={filters}
              onChange={
                ((_filterId: string, partial: Partial<Record<keyof ConfigResourceFilters, unknown>>) =>
                  onSetFilters(partial as Partial<ConfigResourceFilters>)) as never
              }
              breakpoint="xl"
              midContent={null}
            >
              <DataViewTextFilter
                title="Name"
                filterId="name"
                placeholder="Filter by name..."
                style={{ minWidth: "14rem", maxWidth: "100%" }}
              />
              <DataViewTextFilter
                title="Kind"
                filterId="kind"
                placeholder="Filter by kind..."
                style={{ minWidth: "14rem", maxWidth: "100%" }}
              />
            </IoDataViewFiltersWithMidActions>
          }
          pagination={
            <Pagination
              perPageOptions={[
                { title: "10", value: 10 },
                { title: "20", value: 20 },
                { title: "50", value: 50 },
              ]}
              itemCount={itemCount}
              page={page}
              perPage={perPage}
              onSetPage={(_e, p) => setPage(p)}
              onPerPageSelect={(_e, pp) => {
                setPerPage(pp);
                setPage(1);
              }}
              variant={PaginationVariant.top}
              isCompact
              ouiaId="configuration-pagination"
              widgetId="configuration-pagination"
              titles={{ items: "configuration resources" }}
              paginationAriaLabel="Configuration resources pagination"
            />
          }
        />

        <OcsPrototypeListTable ariaLabel="Configuration resources">
          <Thead>
            <Tr>
              <Th dataLabel="Name">
                <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Kind">
                <SortableTableHeader label="Kind" column="kind" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="API Version">
                <SortableTableHeader label="API Version" column="apiVersion" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th modifier="fitContent" dataLabel="Actions">
                <PlainTableHeader label="Actions" />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginated.length === 0 ? (
              <Tr>
                <Td colSpan={colSpan} dataLabel="Empty state">
                  <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                    No configuration resources match your filters.
                  </Content>
                </Td>
              </Tr>
            ) : (
              paginated.map((r) => (
                <Tr key={`${r.kind}-${r.name}`}>
                  <Td dataLabel="Name">
                    <Content component="small">{r.name}</Content>
                  </Td>
                  <Td dataLabel="Kind">
                    <Content component="small">{r.kind}</Content>
                  </Td>
                  <Td dataLabel="API Version">
                    <Content component="small">{r.apiVersion}</Content>
                  </Td>
                  <Td dataLabel="Actions">
                    <Button
                      component="a"
                      variant="link"
                      isInline
                      href={`https://docs.openshift.com/container-platform/latest/rest_api/config_apis/${r.kind.toLowerCase()}-${r.apiVersion.split("/")[0]}-${r.apiVersion.split("/")[1]}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<ExternalLinkAltIcon />}
                    >
                      API Reference
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </OcsPrototypeListTable>
      </DataView>
  );
}

const DESIRED_RELEASE_IMAGE =
  "registry.ci.openshift.org/ocp/release@sha256:6dbbd6b0fa89c1c0223ae79b32fb3ff1a4fc2f3a96b352bf7fd487cd2023cd0c3ae499bfdd6b6c74297bf93f9bc2ea6b8c5b6dfda8e74297bf93";
const UPSTREAM_GRAPH_URL = "https://apenshift-release.apps.ci.ci24.p1.openshiftapps.com/graph";

const UPDATE_HISTORY_ROWS = [
  {
    version: "5.0.0-ec.6",
    started: "Aug 18, 2026, 4:12:08 PM",
    completed: "Aug 18, 2026, 4:41:22 PM",
  },
  {
    version: "5.0.0-ec.6",
    started: "Aug 18, 2026, 2:03:41 PM",
    completed: "Aug 18, 2026, 2:31:19 PM",
  },
  {
    version: "5.0.0-ec.6",
    started: "Aug 18, 2026, 11:18:05 AM",
    completed: "Aug 18, 2026, 11:46:57 AM",
  },
];

function ClusterDetailsList() {
  return (
    <DescriptionList aria-label="Cluster details">
      <DescriptionListGroup>
        <DescriptionListTerm>Subscription</DescriptionListTerm>
        <DescriptionListDescription>
          <Button
            variant="link"
            isInline
            component="a"
            href="https://console.redhat.com/openshift"
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLinkAltIcon />}
            iconPosition="end"
          >
            OpenShift Cluster Manager
          </Button>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Service Level Agreement (SLA)</DescriptionListTerm>
        <DescriptionListDescription>
          <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
            <Content component="p">Self-support, 60 day trial</Content>
            <Flex gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsCenter" }}>
              <Icon status="warning">
                <ExclamationTriangleIcon />
              </Icon>
              <Content component="p">{CLUSTER_SLA_DAYS_REMAINING} days remaining</Content>
            </Flex>
            <Button
              variant="link"
              isInline
              component="a"
              href="https://console.redhat.com/openshift/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Manage subscription settings
            </Button>
          </Flex>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Cluster ID</DescriptionListTerm>
        <DescriptionListDescription>
          <code>{CLUSTER_ID}</code>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Desired release image</DescriptionListTerm>
        <DescriptionListDescription>
          <code style={{ overflowWrap: "anywhere" }}>{DESIRED_RELEASE_IMAGE}</code>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Cluster version configuration</DescriptionListTerm>
        <DescriptionListDescription>
          <Button variant="link" isInline>
            CV version
          </Button>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Upstream configuration</DescriptionListTerm>
        <DescriptionListDescription>
          <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
            <Button
              variant="link"
              isInline
              component="a"
              href={UPSTREAM_GRAPH_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {UPSTREAM_GRAPH_URL}
            </Button>
            <Button variant="plain" aria-label="Edit upstream configuration" icon={<PencilAltIcon />} />
          </Flex>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Cluster autoscaler</DescriptionListTerm>
        <DescriptionListDescription>
          <Button
            variant="link"
            isInline
            component="a"
            href="https://docs.openshift.com/container-platform/latest/machine_management/applying-autoscaling.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            + Create autoscaler
          </Button>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
}

function historyVersion(row: (typeof UPDATE_HISTORY_ROWS)[number]) {
  return row.version;
}

function ClusterUpdateHistory() {
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
      <Title headingLevel="h2" size="xl">
        Update history
      </Title>
      <Content component="p">
        There is a threshold for rendering update data which may cause gaps in the information below.
      </Content>
      <OcsNamedResourceDataView
        ouiaId="cluster-settings-history-data-view"
        ariaLabel="Update history"
        itemsLabel="updates"
        items={UPDATE_HISTORY_ROWS}
        getName={historyVersion}
      >
        {(rows) => (
          <>
            <Thead>
              <Tr>
                <Th dataLabel="Version">
                  <PlainTableHeader label="Version" />
                </Th>
                <Th dataLabel="State">
                  <PlainTableHeader label="State" />
                </Th>
                <Th dataLabel="Started">
                  <PlainTableHeader label="Started" />
                </Th>
                <Th dataLabel="Completed">
                  <PlainTableHeader label="Completed" />
                </Th>
                <Th dataLabel="Release notes">
                  <PlainTableHeader label="Release notes" />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={`${row.version}-${row.started}`}>
                  <Td dataLabel="Version">{row.version}</Td>
                  <Td dataLabel="State">Completed</Td>
                  <Td dataLabel="Started">{row.started}</Td>
                  <Td dataLabel="Completed">{row.completed}</Td>
                  <Td dataLabel="Release notes">
                    <Button
                      variant="link"
                      isInline
                      component="a"
                      href={`https://docs.openshift.com/container-platform/5.0/release_notes/ocp-${row.version}-release-notes.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<ExternalLinkAltIcon />}
                      iconPosition="end"
                    >
                      View release notes
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </>
        )}
      </OcsNamedResourceDataView>
    </Flex>
  );
}

export default function ClusterSettingsPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    initialTab === "cluster-operators" || initialTab === "configuration" ? initialTab : "details",
  );
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("5.1.10");

  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem("clusterUpdateInProgress");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setIsUpdateInProgress(true);
          setUpdateVersion(data.version || "5.1.10");
        } catch {
          setIsUpdateInProgress(false);
        }
      } else {
        setIsUpdateInProgress(false);
      }
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ocs-app-page-outer ocs-app-page-outer--end-3xl">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Cluster Settings" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Title headingLevel="h1" size="2xl" id="main-title">
              Cluster Settings
            </Title>
            <FavoriteButton name="Cluster Settings" path="/administration/cluster-settings" />
          </Flex>

          <Tabs
            id="cluster-settings-tabs"
            aria-label="Cluster settings"
            activeKey={activeTab}
            onSelect={(_event, eventKey) => {
              if (eventKey === "details" || eventKey === "cluster-operators" || eventKey === "configuration") {
                setActiveTab(eventKey);
              }
            }}
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
              <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="pf-v6-u-pt-lg">
                {isUpdateInProgress ? (
                  <ClusterUpdateInProgressStatus targetVersion={updateVersion} />
                ) : (
                  <ClusterSettingsUpdatePanel
                    onViewClusterOperators={() => setActiveTab("cluster-operators")}
                    showAiAssessment
                    navigateOnPrecheck="/administration/cluster-update"
                  />
                )}
                <ClusterDetailsList />
                <ClusterUpdateHistory />
              </Flex>
            </Tab>
            <Tab eventKey="cluster-operators" title={<TabTitleText>ClusterOperators</TabTitleText>}>
              <div className="pf-v6-u-pt-lg">
                <ClusterOperatorsTab />
              </div>
            </Tab>
            <Tab eventKey="configuration" title={<TabTitleText>Configuration</TabTitleText>}>
              <div className="pf-v6-u-pt-lg">
                <ConfigurationTab />
              </div>
            </Tab>
          </Tabs>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
