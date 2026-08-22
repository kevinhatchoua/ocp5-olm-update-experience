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

interface StatefulSet {
  name: string;
  namespace: string;
  ready: string;
  age: string;
  replicas: number;
}

type StatefulSetFilters = {
  name: string;
  namespace: string;
};

type SortColumn = "name" | "namespace" | "ready" | "replicas" | "age";

const STATEFULSETS: StatefulSet[] = [
  { name: "postgres-statefulset", namespace: "production", ready: "2/2", age: "89d", replicas: 2 },
  { name: "elasticsearch-data", namespace: "logging", ready: "2/2", age: "156d", replicas: 2 },
  { name: "prometheus-server", namespace: "monitoring", ready: "1/1", age: "67d", replicas: 1 },
  { name: "redis-cluster", namespace: "production", ready: "3/3", age: "45d", replicas: 3 },
  { name: "cassandra-ring", namespace: "production", ready: "5/5", age: "120d", replicas: 5 },
  { name: "mongodb-replicaset", namespace: "production", ready: "3/3", age: "78d", replicas: 3 },
];

function rowMatchesFilters(row: StatefulSet, filters: StatefulSetFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  return true;
}

function sortStatefulSets(rows: StatefulSet[], column: SortColumn, direction: SortDirection): StatefulSet[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "ready":
        return compareStrings(a.ready, b.ready, direction);
      case "replicas": {
        const cmp = a.replicas - b.replicas;
        return direction === "asc" ? cmp : -cmp;
      }
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function StatefulSetsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<StatefulSetFilters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => STATEFULSETS.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortStatefulSets(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const colSpan = 6;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "StatefulSets", path: "/workloads/statefulsets" },
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
                StatefulSets
              </Title>
              <FavoriteButton name="StatefulSets" path="/workloads/statefulsets" />
            </Flex>
            <Button variant="primary">Create StatefulSet</Button>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="statefulsets-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="statefulsets-dv-toolbar"
                id="statefulsets-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<StatefulSetFilters>
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
                    ouiaId="statefulsets-pagination"
                    widgetId="statefulsets-pagination"
                    titles={{ items: "stateful sets" }}
                    paginationAriaLabel="StatefulSets pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="StatefulSets">
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
                    <Th dataLabel="Ready">
                      <SortableTableHeader
                        label="Ready"
                        column="ready"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Replicas">
                      <SortableTableHeader
                        label="Replicas"
                        column="replicas"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Age">
                      <SortableTableHeader
                        label="Age"
                        column="age"
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
                          No stateful sets match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((ss) => (
                      <Tr key={`${ss.namespace}/${ss.name}`}>
                        <Td dataLabel="Name">
                          <Button variant="link" isInline>
                            {ss.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{ss.namespace}</Content>
                        </Td>
                        <Td dataLabel="Ready">
                          <Content component="small">{ss.ready}</Content>
                        </Td>
                        <Td dataLabel="Replicas">
                          <Content component="small">{ss.replicas}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{ss.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${ss.name}`} icon={<EllipsisVIcon />} />
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
