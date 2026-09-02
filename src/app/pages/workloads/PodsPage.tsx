import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Button,
  Content,
  Flex,
  Label,
  Pagination,
  PaginationVariant,
  Title,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import PrototypeCreateButton from "../../components/prototype/PrototypeCreateButton";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
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
} from "../../components/dataView/OcsPrototypeListTable";
import DebugPodModal, { type DebugPodTarget } from "./DebugPodModal";
import PodActionsMenu from "./PodActionsMenu";
import PodStatusDisplay from "./PodStatusDisplay";
import { PODS, podDetailPath, type PodRecord } from "./podListData";

type PodFilters = {
  name: string;
  namespace: string;
};

type SortColumn =
  | "name"
  | "namespace"
  | "status"
  | "ready"
  | "restarts"
  | "owner"
  | "memory"
  | "cpu"
  | "created";

function OwnerKindLabel({ kind }: { kind: PodRecord["owner"]["kind"] }) {
  const abbrev =
    kind === "ReplicaSet"
      ? "RS"
      : kind === "StatefulSet"
        ? "SS"
        : kind === "DaemonSet"
          ? "DS"
          : kind === "CronJob"
            ? "CJ"
            : "J";
  return (
    <Label color="blue" isCompact className="ocs-resource-label">
      {abbrev}
    </Label>
  );
}

function rowMatchesFilters(row: PodRecord, filters: PodFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  return true;
}

function sortPods(rows: PodRecord[], column: SortColumn, direction: SortDirection): PodRecord[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "ready":
        return compareStrings(a.ready, b.ready, direction);
      case "restarts": {
        const cmp = a.restarts - b.restarts;
        return direction === "asc" ? cmp : -cmp;
      }
      case "owner":
        return compareStrings(a.owner.name, b.owner.name, direction);
      case "memory":
        return compareStrings(a.memory, b.memory, direction);
      case "cpu":
        return compareStrings(a.cpu, b.cpu, direction);
      case "created":
        return compareStrings(a.created, b.created, direction);
      default:
        return 0;
    }
  });
}

export default function PodsPage() {
  const navigate = useNavigate();
  const [debugTarget, setDebugTarget] = useState<DebugPodTarget | null>(null);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<PodFilters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("status");

  const filteredPods = useMemo(
    () => PODS.filter((pod) => rowMatchesFilters(pod, filters)),
    [filters]
  );
  const sortedPods = useMemo(
    () => sortPods(filteredPods, sortColumn, sortDirection),
    [filteredPods, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedPods, [filters], 50);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const colSpan = 10;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "Pods", path: "/workloads/pods" },
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
                Pods
              </Title>
              <FavoriteButton name="Pods" path="/workloads/pods" />
            </Flex>
            <PrototypeCreateButton>Create Pod</PrototypeCreateButton>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="pods-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="pods-dv-toolbar"
                id="pods-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<PodFilters>
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
                    ouiaId="pods-pagination"
                    widgetId="pods-pagination"
                    titles={{ items: "pods" }}
                    paginationAriaLabel="Pods pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Pods">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader
                        label="Name"
                        column="name"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Namespace">
                      <SortableTableHeader
                        label="Namespace"
                        column="namespace"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Status">
                      <SortableTableHeader
                        label="Status"
                        column="status"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Ready">
                      <SortableTableHeader
                        label="Ready"
                        column="ready"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Restarts">
                      <SortableTableHeader
                        label="Restarts"
                        column="restarts"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Owner">
                      <SortableTableHeader
                        label="Owner"
                        column="owner"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Memory">
                      <SortableTableHeader
                        label="Memory"
                        column="memory"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="CPU">
                      <SortableTableHeader
                        label="CPU"
                        column="cpu"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Created">
                      <SortableTableHeader
                        label="Created"
                        column="created"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
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
                          No pods match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((pod) => (
                      <Tr
                        key={`${pod.namespace}/${pod.name}`}
                        onClick={() => navigate(podDetailPath(pod.namespace, pod.name))}
                      >
                        <Td dataLabel="Name">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Label color="teal" isCompact className="ocs-resource-label">
                              P
                            </Label>
                            <Button
                              variant="link"
                              isInline
                              component={Link}
                              to={podDetailPath(pod.namespace, pod.name)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {pod.name}
                            </Button>
                          </Flex>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Label color="green" isCompact className="ocs-resource-label">
                              NS
                            </Label>
                            <Button variant="link" isInline onClick={(e) => e.stopPropagation()}>
                              {pod.namespace}
                            </Button>
                          </Flex>
                        </Td>
                        <Td dataLabel="Status">
                          <PodStatusDisplay
                            pod={pod}
                            onDebug={() => setDebugTarget({ namespace: pod.namespace, name: pod.name, pod })}
                            onViewLogs={() => navigate(podDetailPath(pod.namespace, pod.name))}
                          />
                        </Td>
                        <Td dataLabel="Ready">
                          <Content component="small">{pod.ready}</Content>
                        </Td>
                        <Td dataLabel="Restarts">
                          <Content component="small">{pod.restarts}</Content>
                        </Td>
                        <Td dataLabel="Owner">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <OwnerKindLabel kind={pod.owner.kind} />
                            <Button variant="link" isInline onClick={(e) => e.stopPropagation()}>
                              {pod.owner.name}
                            </Button>
                          </Flex>
                        </Td>
                        <Td dataLabel="Memory">
                          <Content component="small">{pod.memory}</Content>
                        </Td>
                        <Td dataLabel="CPU">
                          <Content component="small">{pod.cpu}</Content>
                        </Td>
                        <Td dataLabel="Created">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <OutlinedClockIcon aria-hidden className="ocs-pods-list__created-icon" />
                            <Content component="small">{pod.created}</Content>
                          </Flex>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <PodActionsMenu
                            pod={pod}
                            onDebug={(p) => setDebugTarget({ namespace: p.namespace, name: p.name, pod: p })}
                          />
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
      <DebugPodModal
        target={debugTarget}
        isOpen={debugTarget !== null}
        onClose={() => setDebugTarget(null)}
      />
    </div>
  );
}
