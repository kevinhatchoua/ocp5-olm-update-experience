import { useEffect, useMemo } from "react";
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

interface Namespace {
  name: string;
  status: string;
  pods: number;
  age: string;
}

type NamespaceFilters = {
  name: string;
  status: string[];
};

type SortColumn = "name" | "status" | "pods" | "age";

const NAMESPACES: Namespace[] = [
  { name: "default", status: "Active", pods: 12, age: "45d" },
  { name: "kube-system", status: "Active", pods: 28, age: "45d" },
  { name: "kube-public", status: "Active", pods: 2, age: "45d" },
  { name: "openshift-console", status: "Active", pods: 6, age: "45d" },
  { name: "openshift-monitoring", status: "Active", pods: 15, age: "45d" },
  { name: "my-application", status: "Active", pods: 8, age: "12d" },
];

const STATUS_OPTIONS = [{ value: "Active", label: "Active" }];

function rowMatchesFilters(row: Namespace, filters: NamespaceFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  const statusFilters = filters.status ?? [];
  if (statusFilters.length > 0 && !statusFilters.includes(row.status)) return false;
  return true;
}

function sortNamespaces(rows: Namespace[], column: SortColumn, direction: SortDirection): Namespace[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "pods": {
        const cmp = a.pods - b.pods;
        return direction === "asc" ? cmp : -cmp;
      }
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function NamespacesPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NamespaceFilters>({
    filters: { name: "", status: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => NAMESPACES.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortNamespaces(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.status, perPage, setPage]);

  const colSpan = 5;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Administration", path: "/administration" },
          { label: "Namespaces", path: "/administration/namespaces" },
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
                Namespaces
              </Title>
              <FavoriteButton name="Namespaces" path="/administration/namespaces" />
            </Flex>
            <Button variant="primary">Create Namespace</Button>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="namespaces-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="namespaces-dv-toolbar"
                id="namespaces-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<NamespaceFilters>
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
                    <DataViewCheckboxFilter
                      title="Status"
                      filterId="status"
                      placeholder="Choose statuses"
                      showIcon
                      showBadge
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
                    ouiaId="namespaces-pagination"
                    widgetId="namespaces-pagination"
                    titles={{ items: "namespaces" }}
                    paginationAriaLabel="Namespaces pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Namespaces">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Status">
                      <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Pods">
                      <SortableTableHeader label="Pods" column="pods" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No namespaces match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((ns) => (
                      <Tr key={ns.name}>
                        <Td dataLabel="Name">
                          <Button variant="link" isInline>
                            {ns.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Status">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success" aria-hidden>
                              <CheckCircleIcon />
                            </Icon>
                            <Label color="green" isCompact>
                              {ns.status}
                            </Label>
                          </Flex>
                        </Td>
                        <Td dataLabel="Pods">
                          <Content component="small">{ns.pods}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{ns.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
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
      </Breadcrumbs>
    </div>
  );
}
