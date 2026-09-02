import { useEffect, useMemo } from "react";
import {
  Button,
  Content,
  Flex,
  Label,
  Pagination,
  PaginationVariant,
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
import { usePrototypeListItems } from "../../lib/prototypeListStore";
import { NetworkingEmptyState, NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";

type RouteFilters = { name: string };

type SortColumn = "name" | "namespace" | "host" | "service";

type RouteRow = {
  name: string;
  namespace: string;
  host: string;
  service: string;
};

function rowMatchesFilters(row: RouteRow, filters: RouteFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q) || row.host.toLowerCase().includes(q);
}

function sortRows(rows: RouteRow[], column: SortColumn, direction: SortDirection): RouteRow[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "host":
        return compareStrings(a.host, b.host, direction);
      case "service":
        return compareStrings(a.service, b.service, direction);
      default:
        return 0;
    }
  });
}

export default function RoutesPage() {
  const created = usePrototypeListItems("routes");
  const rows = useMemo<RouteRow[]>(
    () =>
      created.map((item) => ({
        name: item.name,
        namespace: item.namespace,
        host: item.fields.host || "—",
        service: item.fields.serviceName || "—",
      })),
    [created]
  );

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RouteFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");
  const filtered = useMemo(() => rows.filter((r) => rowMatchesFilters(r, filters)), [rows, filters]);
  const sorted = useMemo(() => sortRows(filtered, sortColumn, sortDirection), [filtered, sortColumn, sortDirection]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  if (rows.length === 0) {
    return (
      <NetworkingPageShell
        title="Routes"
        path="/networking/routes"
        createLabel="Create Route"
        createTo="/networking/routes/create"
      >
        <NetworkingEmptyState
          title="No Route found"
          description="Click Create Route to create your first Route"
          createLabel="Create Route"
          learnMoreHref="https://docs.openshift.com/container-platform/latest/networking/routes/route-configuration.html"
          learnMoreLabel="Learn more about Route"
        />
      </NetworkingPageShell>
    );
  }

  const colSpan = 5;

  return (
    <NetworkingPageShell
      title="Routes"
      path="/networking/routes"
      createLabel="Create Route"
      createTo="/networking/routes/create"
    >
      <NetworkingTablePanel>
        <DataView ouiaId="routes-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="routes-dv-toolbar"
            id="routes-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<RouteFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
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
                  placeholder="Search by name..."
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
                ouiaId="routes-pagination"
                widgetId="routes-pagination"
                titles={{ items: "routes" }}
                paginationAriaLabel="Routes pagination"
              />
            }
          />
          <OcsPrototypeListTable ariaLabel="Routes">
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
                <Th dataLabel="Host">
                  <SortableTableHeader
                    label="Host"
                    column="host"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Service">
                  <SortableTableHeader
                    label="Service"
                    column="service"
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
                      No routes match your filters.
                    </Content>
                  </Td>
                </Tr>
              ) : (
                paginated.map((route) => (
                  <Tr key={`${route.namespace}/${route.name}`}>
                    <Td dataLabel="Name">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <Label color="blue" isCompact className="ocs-resource-label">
                          RT
                        </Label>
                        <PrototypeResourceLink listKey="routes" name={route.name} namespace={route.namespace} />
                      </Flex>
                    </Td>
                    <Td dataLabel="Namespace">
                      <Content component="small">{route.namespace}</Content>
                    </Td>
                    <Td dataLabel="Host">
                      <Content component="small">{route.host}</Content>
                    </Td>
                    <Td dataLabel="Service">
                      <Content component="small">{route.service}</Content>
                    </Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <Button variant="plain" aria-label={`Actions for ${route.name}`} icon={<EllipsisVIcon />} />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </OcsPrototypeListTable>
        </DataView>
      </NetworkingTablePanel>
    </NetworkingPageShell>
  );
}
