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
import PrototypeCreateButton from "../../components/prototype/PrototypeCreateButton";
import PrototypeResourceLink from "../../components/prototype/PrototypeResourceLink";
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

interface LimitRange {
  name: string;
  namespace: string;
  type: string;
  maxCpu: string;
  maxMemory: string;
  defaultCpu: string;
  defaultMemory: string;
}

type LimitRangeFilters = { name: string; namespace: string };
type LimitRangeSortColumn = "name" | "namespace" | "type" | "maxCpu" | "maxMemory" | "defaultCpu" | "defaultMemory";

const LIMIT_RANGES: LimitRange[] = [
  {
    name: "core-resource-limits",
    namespace: "default",
    type: "Container",
    maxCpu: "2 cores",
    maxMemory: "4Gi",
    defaultCpu: "500m",
    defaultMemory: "512Mi",
  },
  {
    name: "pod-limits",
    namespace: "my-application",
    type: "Pod",
    maxCpu: "4 cores",
    maxMemory: "8Gi",
    defaultCpu: "1 core",
    defaultMemory: "1Gi",
  },
];

function rowMatchesFilters(row: LimitRange, filters: LimitRangeFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  return true;
}

function sortLimitRanges(rows: LimitRange[], column: LimitRangeSortColumn, direction: SortDirection): LimitRange[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "type":
        return compareStrings(a.type, b.type, direction);
      case "maxCpu":
        return compareStrings(a.maxCpu, b.maxCpu, direction);
      case "maxMemory":
        return compareStrings(a.maxMemory, b.maxMemory, direction);
      case "defaultCpu":
        return compareStrings(a.defaultCpu, b.defaultCpu, direction);
      case "defaultMemory":
        return compareStrings(a.defaultMemory, b.defaultMemory, direction);
      default:
        return 0;
    }
  });
}

export default function LimitRangesPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<LimitRangeFilters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<LimitRangeSortColumn>("name");

  const filteredRows = useMemo(
    () => LIMIT_RANGES.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortLimitRanges(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const colSpan = 8;

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
              LimitRanges
            </Title>
            <FavoriteButton name="LimitRanges" path="/administration/limit-ranges" />
          </Flex>
          <PrototypeCreateButton>Create LimitRange</PrototypeCreateButton>
        </Flex>

        <Content component="p">
          LimitRanges define minimum, maximum, and default values for compute resources in a namespace.
        </Content>

        <div className="ocs-pods-list__panel">
          <DataView ouiaId="limit-ranges-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="limit-ranges-dv-toolbar"
              id="limit-ranges-dv-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<LimitRangeFilters>
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
                  ouiaId="limit-ranges-pagination"
                  widgetId="limit-ranges-pagination"
                  titles={{ items: "limit ranges" }}
                  paginationAriaLabel="Limit ranges pagination"
                />
              }
            />

            <OcsPrototypeListTable ariaLabel="Limit ranges">
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
                  <Th dataLabel="Max CPU">
                    <SortableTableHeader label="Max CPU" column="maxCpu" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Max Memory">
                    <SortableTableHeader label="Max Memory" column="maxMemory" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Default CPU">
                    <SortableTableHeader label="Default CPU" column="defaultCpu" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Default Memory">
                    <SortableTableHeader label="Default Memory" column="defaultMemory" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                        No limit ranges match your filters.
                      </Content>
                    </Td>
                  </Tr>
                ) : (
                  paginated.map((limitRange) => (
                    <Tr key={limitRange.name}>
                      <Td dataLabel="Name">
                        <PrototypeResourceLink
                          listKey="limit-ranges"
                          name={limitRange.name}
                          namespace={limitRange.namespace}
                        />
                      </Td>
                      <Td dataLabel="Namespace">
                        <Content component="small">{limitRange.namespace}</Content>
                      </Td>
                      <Td dataLabel="Type">
                        <Content component="small">{limitRange.type}</Content>
                      </Td>
                      <Td dataLabel="Max CPU">
                        <Content component="small">{limitRange.maxCpu}</Content>
                      </Td>
                      <Td dataLabel="Max Memory">
                        <Content component="small">{limitRange.maxMemory}</Content>
                      </Td>
                      <Td dataLabel="Default CPU">
                        <Content component="small">{limitRange.defaultCpu}</Content>
                      </Td>
                      <Td dataLabel="Default Memory">
                        <Content component="small">{limitRange.defaultMemory}</Content>
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
