import { useEffect, useMemo } from "react";
import {
  Button,
  Content,
  Flex,
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
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
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

interface DaemonSet {
  name: string;
  namespace: string;
  desired: number;
  current: number;
  ready: number;
  upToDate: number;
  available: number;
  age: string;
}

type DaemonSetFilters = {
  name: string;
  namespace: string;
};

type SortColumn =
  | "name"
  | "namespace"
  | "desired"
  | "current"
  | "ready"
  | "upToDate"
  | "available"
  | "age";

const DAEMONSETS: DaemonSet[] = [
  { name: "fluentd-daemonset", namespace: "logging", desired: 3, current: 3, ready: 3, upToDate: 3, available: 3, age: "156d" },
  { name: "node-exporter", namespace: "monitoring", desired: 8, current: 8, ready: 8, upToDate: 8, available: 8, age: "89d" },
  { name: "kube-proxy", namespace: "kube-system", desired: 8, current: 8, ready: 8, upToDate: 8, available: 8, age: "200d" },
  { name: "calico-node", namespace: "kube-system", desired: 8, current: 8, ready: 8, upToDate: 8, available: 8, age: "200d" },
  { name: "filebeat", namespace: "logging", desired: 3, current: 3, ready: 3, upToDate: 3, available: 3, age: "120d" },
];

function rowMatchesFilters(row: DaemonSet, filters: DaemonSetFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  return true;
}

function sortNumber(a: number, b: number, direction: SortDirection): number {
  const cmp = a - b;
  return direction === "asc" ? cmp : -cmp;
}

function sortDaemonSets(rows: DaemonSet[], column: SortColumn, direction: SortDirection): DaemonSet[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "desired":
        return sortNumber(a.desired, b.desired, direction);
      case "current":
        return sortNumber(a.current, b.current, direction);
      case "ready":
        return sortNumber(a.ready, b.ready, direction);
      case "upToDate":
        return sortNumber(a.upToDate, b.upToDate, direction);
      case "available":
        return sortNumber(a.available, b.available, direction);
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function DaemonSetsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<DaemonSetFilters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => DAEMONSETS.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortDaemonSets(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const colSpan = 9;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "DaemonSets", path: "/workloads/daemonsets" },
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
                DaemonSets
              </Title>
              <FavoriteButton name="DaemonSets" path="/workloads/daemonsets" />
            </Flex>
            <Button variant="primary">Create DaemonSet</Button>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="daemonsets-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="daemonsets-dv-toolbar"
                id="daemonsets-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<DaemonSetFilters>
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
                    ouiaId="daemonsets-pagination"
                    widgetId="daemonsets-pagination"
                    titles={{ items: "daemon sets" }}
                    paginationAriaLabel="DaemonSets pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="DaemonSets">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Namespace">
                      <SortableTableHeader label="Namespace" column="namespace" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Desired">
                      <SortableTableHeader label="Desired" column="desired" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Current">
                      <SortableTableHeader label="Current" column="current" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Ready">
                      <SortableTableHeader label="Ready" column="ready" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Up-to-date">
                      <SortableTableHeader label="Up-to-date" column="upToDate" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Available">
                      <SortableTableHeader label="Available" column="available" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No daemon sets match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((ds) => (
                      <Tr key={`${ds.namespace}/${ds.name}`}>
                        <Td dataLabel="Name">
                          <Button variant="link" isInline>
                            {ds.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{ds.namespace}</Content>
                        </Td>
                        <Td dataLabel="Desired">
                          <Content component="small">{ds.desired}</Content>
                        </Td>
                        <Td dataLabel="Current">
                          <Content component="small">{ds.current}</Content>
                        </Td>
                        <Td dataLabel="Ready">
                          <Content component="small">{ds.ready}</Content>
                        </Td>
                        <Td dataLabel="Up-to-date">
                          <Content component="small">{ds.upToDate}</Content>
                        </Td>
                        <Td dataLabel="Available">
                          <Content component="small">{ds.available}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{ds.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${ds.name}`} icon={<EllipsisVIcon />} />
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
