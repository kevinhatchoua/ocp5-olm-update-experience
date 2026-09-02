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
import { usePrototypeListItems } from "../../lib/prototypeListStore";

interface Deployment {
  name: string;
  namespace: string;
  ready: string;
  upToDate: string;
  available: string;
  age: string;
}

type DeploymentFilters = {
  name: string;
  namespace: string;
};

type SortColumn = "name" | "namespace" | "ready" | "upToDate" | "available" | "age";

const DEPLOYMENTS: Deployment[] = [
  { name: "nginx-deployment", namespace: "production", ready: "3/3", upToDate: "3", available: "3", age: "12d" },
  { name: "api-gateway", namespace: "production", ready: "2/2", upToDate: "2", available: "2", age: "8d" },
  { name: "auth-service", namespace: "production", ready: "1/1", upToDate: "1", available: "1", age: "15d" },
  { name: "grafana-deployment", namespace: "monitoring", ready: "1/1", upToDate: "1", available: "1", age: "23d" },
  { name: "frontend-app", namespace: "production", ready: "4/4", upToDate: "4", available: "4", age: "30d" },
  { name: "backend-api", namespace: "production", ready: "6/6", upToDate: "6", available: "6", age: "45d" },
];

function rowMatchesFilters(row: Deployment, filters: DeploymentFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  return true;
}

function sortDeployments(rows: Deployment[], column: SortColumn, direction: SortDirection): Deployment[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "ready":
        return compareStrings(a.ready, b.ready, direction);
      case "upToDate":
        return compareStrings(a.upToDate, b.upToDate, direction);
      case "available":
        return compareStrings(a.available, b.available, direction);
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function DeploymentsPage() {
  const created = usePrototypeListItems("deployments");
  const allDeployments = useMemo(() => {
    const createdRows: Deployment[] = created.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      ready: "0/0",
      upToDate: "0",
      available: "0",
      age: "Just now",
    }));
    const seed = DEPLOYMENTS.filter(
      (row) => !createdRows.some((createdRow) => createdRow.name === row.name && createdRow.namespace === row.namespace)
    );
    return [...createdRows, ...seed];
  }, [created]);

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<DeploymentFilters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => allDeployments.filter((row) => rowMatchesFilters(row, filters)),
    [allDeployments, filters]
  );
  const sortedRows = useMemo(
    () => sortDeployments(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const colSpan = 7;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "Deployments", path: "/workloads/deployments" },
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
                Deployments
              </Title>
              <FavoriteButton name="Deployments" path="/workloads/deployments" />
            </Flex>
            <PrototypeCreateButton>Create Deployment</PrototypeCreateButton>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="deployments-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="deployments-dv-toolbar"
                id="deployments-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<DeploymentFilters>
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
                    ouiaId="deployments-pagination"
                    widgetId="deployments-pagination"
                    titles={{ items: "deployments" }}
                    paginationAriaLabel="Deployments pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Deployments">
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
                    <Th dataLabel="Up-to-date">
                      <SortableTableHeader
                        label="Up-to-date"
                        column="upToDate"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Available">
                      <SortableTableHeader
                        label="Available"
                        column="available"
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
                          No deployments match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((deployment) => (
                      <Tr key={`${deployment.namespace}/${deployment.name}`}>
                        <Td dataLabel="Name">
                          <PrototypeResourceLink
                            listKey="deployments"
                            name={deployment.name}
                            namespace={deployment.namespace}
                          />
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{deployment.namespace}</Content>
                        </Td>
                        <Td dataLabel="Ready">
                          <Content component="small">{deployment.ready}</Content>
                        </Td>
                        <Td dataLabel="Up-to-date">
                          <Content component="small">{deployment.upToDate}</Content>
                        </Td>
                        <Td dataLabel="Available">
                          <Content component="small">{deployment.available}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{deployment.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button
                            variant="plain"
                            aria-label={`Actions for ${deployment.name}`}
                            icon={<EllipsisVIcon />}
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
    </div>
  );
}
