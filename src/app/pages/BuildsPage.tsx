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

interface BuildResource {
  name: string;
  namespace: string;
  type: "BuildConfig" | "Build" | "ImageStream";
  status: "Complete" | "Running" | "Failed" | "Pending" | "New";
  duration?: string;
  from?: string;
  to?: string;
  strategy?: string;
  tags?: string[];
  age: string;
}

type BuildFilters = {
  name: string;
  namespace: string;
  type: string[];
};

type SortColumn = "name" | "namespace" | "type" | "status" | "details" | "age";

const RESOURCES: BuildResource[] = [
  { name: "api-gateway-bc", namespace: "production", type: "BuildConfig", status: "Complete", strategy: "Source", from: "Git", to: "api-gateway:latest", age: "8d" },
  { name: "auth-service-bc", namespace: "production", type: "BuildConfig", status: "Complete", strategy: "Docker", from: "Git", to: "auth-service:latest", age: "15d" },
  { name: "frontend-app-bc", namespace: "production", type: "BuildConfig", status: "Complete", strategy: "Source", from: "Git", to: "frontend-app:latest", age: "3d" },
  { name: "worker-service-bc", namespace: "production", type: "BuildConfig", status: "Complete", strategy: "Source", from: "Git", to: "worker-service:latest", age: "12d" },
  { name: "api-gateway-1", namespace: "production", type: "Build", status: "Complete", duration: "3m 24s", strategy: "Source", from: "Git@main:a3f2d1", to: "api-gateway:latest", age: "2d" },
  { name: "api-gateway-2", namespace: "production", type: "Build", status: "Running", duration: "1m 15s", strategy: "Source", from: "Git@main:b4e3c2", to: "api-gateway:latest", age: "5m" },
  { name: "auth-service-1", namespace: "production", type: "Build", status: "Complete", duration: "2m 48s", strategy: "Docker", from: "Git@main:c5f4d3", to: "auth-service:latest", age: "1d" },
  { name: "frontend-app-1", namespace: "production", type: "Build", status: "Failed", duration: "45s", strategy: "Source", from: "Git@main:d6g5e4", to: "frontend-app:latest", age: "12h" },
  { name: "frontend-app-2", namespace: "production", type: "Build", status: "Complete", duration: "4m 12s", strategy: "Source", from: "Git@main:e7h6f5", to: "frontend-app:latest", age: "6h" },
  { name: "worker-service-1", namespace: "production", type: "Build", status: "Complete", duration: "3m 56s", strategy: "Source", from: "Git@main:f8i7g6", to: "worker-service:latest", age: "3d" },
  { name: "test-build-1", namespace: "development", type: "Build", status: "Pending", strategy: "Source", from: "Git@dev:g9j8h7", to: "test-app:dev", age: "10m" },
  { name: "api-gateway", namespace: "production", type: "ImageStream", status: "Complete", tags: ["latest", "v2.1.0", "v2.0.5"], age: "8d" },
  { name: "auth-service", namespace: "production", type: "ImageStream", status: "Complete", tags: ["latest", "v1.8.3", "v1.8.2"], age: "15d" },
  { name: "frontend-app", namespace: "production", type: "ImageStream", status: "Complete", tags: ["latest", "v3.2.1", "v3.2.0", "v3.1.9"], age: "3d" },
  { name: "worker-service", namespace: "production", type: "ImageStream", status: "Complete", tags: ["latest", "v1.5.2"], age: "12d" },
  { name: "nginx-base", namespace: "production", type: "ImageStream", status: "Complete", tags: ["1.21", "1.20"], age: "45d" },
  { name: "nodejs-base", namespace: "production", type: "ImageStream", status: "Complete", tags: ["18", "16", "14"], age: "67d" },
];

const TYPE_OPTIONS = [
  { value: "BuildConfig", label: "BuildConfig" },
  { value: "Build", label: "Build" },
  { value: "ImageStream", label: "ImageStream" },
];

function BuildStatusCell({ status }: { status: BuildResource["status"] }) {
  switch (status) {
    case "Complete":
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
    case "Running":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="info" aria-hidden>
            <ClockIcon />
          </Icon>
          <Label color="blue" isCompact>
            {status}
          </Label>
        </Flex>
      );
    case "Pending":
    case "New":
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
    default:
      return <Content component="small">{status}</Content>;
  }
}

function formatDetails(resource: BuildResource): string {
  if (resource.type === "Build" && resource.duration) return `Duration: ${resource.duration}`;
  if (resource.from) return `From: ${resource.from}`;
  if (resource.tags) return resource.tags.join(", ");
  return "—";
}

function rowMatchesFilters(row: BuildResource, filters: BuildFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  if (filters.type.length > 0 && !filters.type.includes(row.type)) return false;
  return true;
}

function sortResources(rows: BuildResource[], column: SortColumn, direction: SortDirection): BuildResource[] {
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
      case "details":
        return compareStrings(formatDetails(a), formatDetails(b), direction);
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function BuildsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<BuildFilters>({
    filters: { name: "", namespace: "", type: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => RESOURCES.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortResources(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, filters.type, perPage, setPage]);

  const colSpan = 7;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Builds", path: "/builds" },
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
                Builds
              </Title>
              <FavoriteButton name="Builds" path="/builds" />
            </Flex>
            <Button variant="primary" icon={<PlayCircleIcon />}>
              Create Build
            </Button>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="builds-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="builds-dv-toolbar"
                id="builds-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<BuildFilters>
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
                    <DataViewCheckboxFilter title="Type" filterId="type" options={TYPE_OPTIONS} />
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
                    ouiaId="builds-pagination"
                    widgetId="builds-pagination"
                    titles={{ items: "builds" }}
                    paginationAriaLabel="Builds pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Builds">
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
                    <Th dataLabel="Details">
                      <SortableTableHeader label="Details" column="details" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No build resources match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((resource) => (
                      <Tr key={`${resource.namespace}/${resource.name}`}>
                        <Td dataLabel="Name">
                          <Button variant="link" isInline>
                            {resource.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{resource.namespace}</Content>
                        </Td>
                        <Td dataLabel="Type">
                          <Content component="small">
                            {resource.type === "BuildConfig" ? "BC" : resource.type === "Build" ? "Build" : "IS"}
                          </Content>
                        </Td>
                        <Td dataLabel="Status">
                          <BuildStatusCell status={resource.status} />
                        </Td>
                        <Td dataLabel="Details">
                          {resource.type === "Build" && resource.duration ? (
                            <Content component="small">Duration: {resource.duration}</Content>
                          ) : resource.from ? (
                            <Content component="small">From: {resource.from}</Content>
                          ) : resource.tags ? (
                            <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                              {resource.tags.map((tag) => (
                                <Label key={tag} color="grey" isCompact>
                                  {tag}
                                </Label>
                              ))}
                            </Flex>
                          ) : (
                            <Content component="small">—</Content>
                          )}
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{resource.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${resource.name}`} icon={<EllipsisVIcon />} />
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
