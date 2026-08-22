import { useEffect, useMemo } from "react";
import {
  Button,
  Content,
  Flex,
  Pagination,
  PaginationVariant,
  Title,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
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

interface ResourceQuota {
  name: string;
  namespace: string;
  cpu: string;
  memory: string;
  pods: string;
}

type ResourceQuotaFilters = { name: string; namespace: string };
type ResourceQuotaSortColumn = "name" | "namespace" | "cpu" | "memory" | "pods";

const QUOTAS: ResourceQuota[] = [
  { name: "compute-quota", namespace: "default", cpu: "10 cores", memory: "20Gi", pods: "50" },
  { name: "storage-quota", namespace: "my-application", cpu: "5 cores", memory: "10Gi", pods: "25" },
  { name: "dev-quota", namespace: "development", cpu: "8 cores", memory: "16Gi", pods: "40" },
];

function rowMatchesFilters(row: ResourceQuota, filters: ResourceQuotaFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  return true;
}

function sortQuotas(rows: ResourceQuota[], column: ResourceQuotaSortColumn, direction: SortDirection): ResourceQuota[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "cpu":
        return compareStrings(a.cpu, b.cpu, direction);
      case "memory":
        return compareStrings(a.memory, b.memory, direction);
      case "pods":
        return compareStrings(a.pods, b.pods, direction);
      default:
        return 0;
    }
  });
}

export default function ResourceQuotasPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ResourceQuotaFilters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<ResourceQuotaSortColumn>("name");

  const filteredRows = useMemo(
    () => QUOTAS.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortQuotas(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const colSpan = 6;

  return (
    <div className="ocs-app-page-outer w-full">
      <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          flexWrap={{ default: "wrap" }}
          gap={{ default: "gapMd" }}
        >
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <Title headingLevel="h1" size="2xl">
              ResourceQuotas
            </Title>
            <FavoriteButton name="ResourceQuotas" path="/administration/resource-quotas" />
          </Flex>
          <Button variant="primary">Create ResourceQuota</Button>
        </Flex>

        <Content component="p">
          ResourceQuotas provide constraints that limit aggregate resource consumption per namespace.
        </Content>

        <div className="ocs-pods-list__panel">
          <DataView ouiaId="resource-quotas-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="resource-quotas-dv-toolbar"
              id="resource-quotas-dv-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<ResourceQuotaFilters>
                  values={filters}
                  onChange={(_filterId, partial) => onSetFilters(partial)}
                  breakpoint="xl"
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
                  ouiaId="resource-quotas-pagination"
                  widgetId="resource-quotas-pagination"
                  titles={{ items: "resource quotas" }}
                  paginationAriaLabel="Resource quotas pagination"
                />
              }
            />

            <OcsPrototypeListTable ariaLabel="Resource quotas">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Namespace">
                    <SortableTableHeader label="Namespace" column="namespace" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="CPU Limit">
                    <SortableTableHeader label="CPU Limit" column="cpu" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Memory Limit">
                    <SortableTableHeader label="Memory Limit" column="memory" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Max Pods">
                    <SortableTableHeader label="Max Pods" column="pods" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                        No resource quotas match your filters.
                      </Content>
                    </Td>
                  </Tr>
                ) : (
                  paginated.map((quota) => (
                    <Tr key={quota.name}>
                      <Td dataLabel="Name">
                        <Button variant="link" isInline>
                          {quota.name}
                        </Button>
                      </Td>
                      <Td dataLabel="Namespace">
                        <Content component="small">{quota.namespace}</Content>
                      </Td>
                      <Td dataLabel="CPU Limit">
                        <Content component="small">{quota.cpu}</Content>
                      </Td>
                      <Td dataLabel="Memory Limit">
                        <Content component="small">{quota.memory}</Content>
                      </Td>
                      <Td dataLabel="Max Pods">
                        <Content component="small">{quota.pods}</Content>
                      </Td>
                      <Td dataLabel="Actions">
                        <Button variant="link" isInline>
                          Edit
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </DataView>
        </div>
      </Flex>
    </div>
  );
}
