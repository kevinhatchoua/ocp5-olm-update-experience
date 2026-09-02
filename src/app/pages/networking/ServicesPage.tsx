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
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";

type ServiceFilters = { name: string };

type SortColumn = "name" | "labels" | "podSelector" | "location";

interface Service {
  name: string;
  namespace: string;
  labels: { key: string; value: string }[];
  podSelector: string;
  location: string;
}

const SERVICES: Service[] = [
  {
    name: "kubernetes",
    namespace: "default",
    labels: [
      { key: "component", value: "apiserver" },
      { key: "provider", value: "kubernetes" },
    ],
    podSelector: "All pods within default",
    location: "172.30.0.1:443",
  },
  {
    name: "openshift",
    namespace: "default",
    labels: [],
    podSelector: "All pods within default",
    location: "",
  },
];

function rowMatchesFilters(row: Service, filters: ServiceFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortServices(rows: Service[], column: SortColumn, direction: SortDirection): Service[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "labels":
        return compareStrings(
          a.labels.map((l) => `${l.key}=${l.value}`).join(", "),
          b.labels.map((l) => `${l.key}=${l.value}`).join(", "),
          direction
        );
      case "podSelector":
        return compareStrings(a.podSelector, b.podSelector, direction);
      case "location":
        return compareStrings(a.location, b.location, direction);
      default:
        return 0;
    }
  });
}

export default function ServicesPage() {
  const created = usePrototypeListItems("services");
  const allServices = useMemo(() => {
    const createdRows: Service[] = created.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      labels: [],
      podSelector: item.fields.selector || `app=${item.name}`,
      location: item.fields.port ? `:${item.fields.port}` : "",
    }));
    const seed = SERVICES.filter((svc) => !createdRows.some((row) => row.name === svc.name));
    return [...createdRows, ...seed];
  }, [created]);

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ServiceFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(
    () => allServices.filter((s) => rowMatchesFilters(s, filters)),
    [allServices, filters]
  );
  const sorted = useMemo(
    () => sortServices(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const colSpan = 5;

  return (
    <NetworkingPageShell title="Services" path="/networking" createLabel="Create Service" createTo="/networking/services/create">
      <NetworkingTablePanel>
        <DataView ouiaId="services-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="services-dv-toolbar"
            id="services-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<ServiceFilters>
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
                ouiaId="services-pagination"
                widgetId="services-pagination"
                titles={{ items: "services" }}
                paginationAriaLabel="Services pagination"
              />
            }
          />
          <OcsPrototypeListTable ariaLabel="Services">
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
                <Th dataLabel="Labels">
                  <SortableTableHeader
                    label="Labels"
                    column="labels"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Pod selector">
                  <SortableTableHeader
                    label="Pod selector"
                    column="podSelector"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Location">
                  <SortableTableHeader
                    label="Location"
                    column="location"
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
                      No services match your filters.
                    </Content>
                  </Td>
                </Tr>
              ) : (
                paginated.map((svc) => (
                  <Tr key={`${svc.namespace}/${svc.name}`}>
                    <Td dataLabel="Name">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <Label color="green" isCompact className="ocs-resource-label">
                          S
                        </Label>
                        <PrototypeResourceLink listKey="services" name={svc.name} namespace={svc.namespace} />
                      </Flex>
                    </Td>
                    <Td dataLabel="Labels">
                      {svc.labels.length === 0 ? (
                        <Content component="small">No labels</Content>
                      ) : (
                        <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                          {svc.labels.map((l) => (
                            <Label key={l.key} color="green" isCompact>
                              {l.key}={l.value}
                            </Label>
                          ))}
                        </Flex>
                      )}
                    </Td>
                    <Td dataLabel="Pod selector">
                      <Button variant="link" isInline>
                        {svc.podSelector}
                      </Button>
                    </Td>
                    <Td dataLabel="Location">
                      <Content component="small">{svc.location || "—"}</Content>
                    </Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <Button variant="plain" aria-label={`Actions for ${svc.name}`} icon={<EllipsisVIcon />} />
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
