import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  Button,
  Content,
  Flex,
  Icon,
  Label,
  Pagination,
  PaginationVariant,
  Title,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewCheckboxFilter,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import PlayCircleIcon from "@patternfly/react-icons/dist/esm/icons/play-circle-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../components/Breadcrumbs";
import FavoriteButton from "../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../components/dataView/OcsPrototypeListTable";
import { prototypeDetailPath, type PrototypeListKey } from "../lib/prototypeListStore";
import { podDetailPath } from "./workloads/podListData";

interface Workload {
  name: string;
  namespace: string;
  type: "Pod" | "Deployment" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob";
  status: "Running" | "Pending" | "Failed" | "Succeeded" | "Completed";
  ready: string;
  restarts: number;
  age: string;
  image?: string;
}

type WorkloadFilters = {
  name: string;
  namespace: string;
  type: string[];
  status: string[];
};

type SortColumn = "name" | "namespace" | "type" | "status" | "ready" | "restarts" | "age";

const WORKLOAD_TYPE_TO_LIST_KEY: Partial<Record<Workload["type"], PrototypeListKey>> = {
  Deployment: "deployments",
  StatefulSet: "statefulsets",
  DaemonSet: "daemonsets",
  Job: "jobs",
  CronJob: "cronjobs",
};

function workloadDetailPath(workload: Workload): string {
  if (workload.type === "Pod") {
    return podDetailPath(workload.namespace, workload.name);
  }
  const listKey = WORKLOAD_TYPE_TO_LIST_KEY[workload.type];
  return listKey ? prototypeDetailPath(listKey, workload.namespace, workload.name) : "/workloads";
}

const WORKLOADS: Workload[] = [
  { name: "nginx-deployment-7d8c9f6b-4xk2p", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 0, age: "12d", image: "nginx:1.21" },
  { name: "nginx-deployment-7d8c9f6b-mx8qz", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 2, age: "12d", image: "nginx:1.21" },
  { name: "nginx-deployment-7d8c9f6b-n5p9r", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 0, age: "12d", image: "nginx:1.21" },
  { name: "redis-master-0", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 1, age: "45d", image: "redis:7.0" },
  { name: "postgres-statefulset-0", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 0, age: "89d", image: "postgres:14" },
  { name: "postgres-statefulset-1", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 0, age: "89d", image: "postgres:14" },
  { name: "elasticsearch-data-0", namespace: "logging", type: "Pod", status: "Running", ready: "1/1", restarts: 3, age: "156d", image: "elasticsearch:8.5" },
  { name: "elasticsearch-data-1", namespace: "logging", type: "Pod", status: "Running", ready: "1/1", restarts: 2, age: "156d", image: "elasticsearch:8.5" },
  { name: "fluentd-daemonset-7g8h2", namespace: "logging", type: "Pod", status: "Running", ready: "1/1", restarts: 5, age: "156d", image: "fluentd:v1.14" },
  { name: "fluentd-daemonset-k9m3n", namespace: "logging", type: "Pod", status: "Running", ready: "1/1", restarts: 4, age: "156d", image: "fluentd:v1.14" },
  { name: "fluentd-daemonset-p2r5t", namespace: "logging", type: "Pod", status: "Running", ready: "1/1", restarts: 6, age: "156d", image: "fluentd:v1.14" },
  { name: "prometheus-server-0", namespace: "monitoring", type: "Pod", status: "Running", ready: "1/1", restarts: 1, age: "67d", image: "prometheus:v2.40" },
  { name: "grafana-deployment-6f8d9c-x4k8p", namespace: "monitoring", type: "Pod", status: "Running", ready: "1/1", restarts: 0, age: "23d", image: "grafana:9.3" },
  { name: "alertmanager-0", namespace: "monitoring", type: "Pod", status: "Running", ready: "1/1", restarts: 2, age: "67d", image: "alertmanager:v0.25" },
  { name: "api-gateway-7c9d8f-5n6p7", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 0, age: "8d", image: "api-gateway:v2.1" },
  { name: "api-gateway-7c9d8f-8q9r2", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 1, age: "8d", image: "api-gateway:v2.1" },
  { name: "auth-service-5b6c7d-3m4n5", namespace: "production", type: "Pod", status: "Running", ready: "1/1", restarts: 0, age: "15d", image: "auth-service:v1.8" },
  { name: "backup-job-1710720000", namespace: "production", type: "Pod", status: "Succeeded", ready: "0/1", restarts: 0, age: "2d", image: "backup:latest" },
  { name: "database-migration-job", namespace: "production", type: "Pod", status: "Completed", ready: "0/1", restarts: 0, age: "5d", image: "migration:v1.2" },
  { name: "test-runner-7h8i9j", namespace: "development", type: "Pod", status: "Pending", ready: "0/1", restarts: 0, age: "5m", image: "test-runner:latest" },
  { name: "cache-cleanup-job-failed", namespace: "production", type: "Pod", status: "Failed", ready: "0/1", restarts: 3, age: "1h", image: "cache-cleanup:v1.0" },
  { name: "nginx-deployment", namespace: "production", type: "Deployment", status: "Running", ready: "3/3", restarts: 0, age: "12d" },
  { name: "api-gateway", namespace: "production", type: "Deployment", status: "Running", ready: "2/2", restarts: 0, age: "8d" },
  { name: "auth-service", namespace: "production", type: "Deployment", status: "Running", ready: "1/1", restarts: 0, age: "15d" },
  { name: "grafana-deployment", namespace: "monitoring", type: "Deployment", status: "Running", ready: "1/1", restarts: 0, age: "23d" },
  { name: "postgres-statefulset", namespace: "production", type: "StatefulSet", status: "Running", ready: "2/2", restarts: 0, age: "89d" },
  { name: "elasticsearch-data", namespace: "logging", type: "StatefulSet", status: "Running", ready: "2/2", restarts: 0, age: "156d" },
  { name: "prometheus-server", namespace: "monitoring", type: "StatefulSet", status: "Running", ready: "1/1", restarts: 0, age: "67d" },
  { name: "fluentd-daemonset", namespace: "logging", type: "DaemonSet", status: "Running", ready: "3/3", restarts: 0, age: "156d" },
  { name: "node-exporter", namespace: "monitoring", type: "DaemonSet", status: "Running", ready: "8/8", restarts: 0, age: "89d" },
  { name: "backup-job", namespace: "production", type: "CronJob", status: "Succeeded", ready: "1/1", restarts: 0, age: "45d" },
  { name: "cache-cleanup", namespace: "production", type: "CronJob", status: "Failed", ready: "0/1", restarts: 0, age: "30d" },
];

const TYPE_OPTIONS = [
  { value: "Pod", label: "Pod" },
  { value: "Deployment", label: "Deployment" },
  { value: "StatefulSet", label: "StatefulSet" },
  { value: "DaemonSet", label: "DaemonSet" },
  { value: "Job", label: "Job" },
  { value: "CronJob", label: "CronJob" },
];

const STATUS_OPTIONS = [
  { value: "Running", label: "Running" },
  { value: "Pending", label: "Pending" },
  { value: "Failed", label: "Failed" },
  { value: "Succeeded", label: "Succeeded" },
  { value: "Completed", label: "Completed" },
];

function WorkloadStatusCell({ status }: { status: Workload["status"] }) {
  switch (status) {
    case "Running":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="success" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          <Label color="green" isCompact>
            {status}
          </Label>
        </Flex>
      );
    case "Pending":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="warning" aria-hidden>
            <ClockIcon />
          </Icon>
          <Label color="orange" isCompact>
            {status}
          </Label>
        </Flex>
      );
    case "Failed":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="danger" aria-hidden>
            <TimesCircleIcon />
          </Icon>
          <Label color="red" isCompact>
            {status}
          </Label>
        </Flex>
      );
    case "Succeeded":
    case "Completed":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="info" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          <Label color="blue" isCompact>
            {status}
          </Label>
        </Flex>
      );
    default:
      return <Content component="small">{status}</Content>;
  }
}

function rowMatchesFilters(row: Workload, filters: WorkloadFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  if (filters.type.length > 0 && !filters.type.includes(row.type)) return false;
  if (filters.status.length > 0 && !filters.status.includes(row.status)) return false;
  return true;
}

function sortWorkloads(rows: Workload[], column: SortColumn, direction: SortDirection): Workload[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "type":
        return compareStrings(a.type, b.type, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "ready":
        return compareStrings(a.ready, b.ready, direction);
      case "restarts": {
        const cmp = a.restarts - b.restarts;
        return direction === "asc" ? cmp : -cmp;
      }
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function WorkloadsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<WorkloadFilters>({
    filters: { name: "", namespace: "", type: [], status: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => WORKLOADS.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortWorkloads(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, filters.type, filters.status, perPage, setPage]);

  const colSpan = 8;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                Workloads
              </Title>
              <FavoriteButton name="Workloads" path="/workloads" />
            </Flex>
            <Button variant="primary" icon={<PlayCircleIcon />}>
              Create Workload
            </Button>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="workloads-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="workloads-dv-toolbar"
                id="workloads-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<WorkloadFilters>
                    values={filters}
                    onChange={(_filterId, partial) => onSetFilters(partial)}
                    breakpoint="xl"
                    midContent={
                      <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                        <ToolbarItem>
                          <Button variant="plain" aria-label="List view" isAriaPressed icon={<ListIcon />} />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button variant="plain" aria-label="Refresh" icon={<SyncIcon />} />
                        </ToolbarItem>
                      </ToolbarGroup>
                    }
                  >
                    <DataViewTextFilter
                      title="Name"
                      filterId="name"
                      placeholder="Filter by name..."
                      style={{ minWidth: "16rem", maxWidth: "100%" }}
                    />
                    <DataViewTextFilter
                      title="Namespace"
                      filterId="namespace"
                      placeholder="Filter by namespace..."
                      style={{ minWidth: "14rem", maxWidth: "100%" }}
                    />
                    <DataViewCheckboxFilter
                      title="Type"
                      filterId="type"
                      options={TYPE_OPTIONS}
                    />
                    <DataViewCheckboxFilter
                      title="Status"
                      filterId="status"
                      options={STATUS_OPTIONS}
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
                    ouiaId="workloads-pagination"
                    widgetId="workloads-pagination"
                    titles={{ items: "workloads" }}
                    paginationAriaLabel="Workloads pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Workloads">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Namespace">
                      <SortableTableHeader label="Namespace" column="namespace" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Type">
                      <SortableTableHeader label="Type" column="type" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Status">
                      <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Ready">
                      <SortableTableHeader label="Ready" column="ready" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Restarts">
                      <SortableTableHeader label="Restarts" column="restarts" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Age">
                      <SortableTableHeader label="Age" column="age" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No workloads match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((workload) => (
                      <Tr key={`${workload.namespace}/${workload.name}`}>
                        <Td dataLabel="Name">
                          <Button variant="link" isInline component={Link} to={workloadDetailPath(workload)}>
                            {workload.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{workload.namespace}</Content>
                        </Td>
                        <Td dataLabel="Type">
                          <Content component="small">{workload.type}</Content>
                        </Td>
                        <Td dataLabel="Status">
                          <WorkloadStatusCell status={workload.status} />
                        </Td>
                        <Td dataLabel="Ready">
                          <Content component="small">{workload.ready}</Content>
                        </Td>
                        <Td dataLabel="Restarts">
                          <Content component="small">{workload.restarts}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{workload.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${workload.name}`} icon={<EllipsisVIcon />} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </OcsPrototypeListTable>
            </DataView>
          </div>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
