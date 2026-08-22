import { useEffect, useMemo } from "react";
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

interface CronJob {
  name: string;
  namespace: string;
  schedule: string;
  suspend: boolean;
  active: number;
  lastSchedule: string;
  age: string;
}

type CronJobFilters = {
  name: string;
  namespace: string;
};

type SortColumn = "name" | "namespace" | "schedule" | "suspend" | "active" | "lastSchedule" | "age";

const CRONJOBS: CronJob[] = [
  { name: "backup-job", namespace: "production", schedule: "0 2 * * *", suspend: false, active: 0, lastSchedule: "12h", age: "45d" },
  { name: "cache-cleanup", namespace: "production", schedule: "*/15 * * * *", suspend: false, active: 0, lastSchedule: "5m", age: "30d" },
  { name: "report-generator", namespace: "production", schedule: "0 8 * * 1", suspend: false, active: 0, lastSchedule: "2d", age: "60d" },
  { name: "log-rotation", namespace: "logging", schedule: "0 0 * * *", suspend: false, active: 0, lastSchedule: "18h", age: "90d" },
  { name: "metrics-aggregation", namespace: "monitoring", schedule: "*/5 * * * *", suspend: false, active: 1, lastSchedule: "2m", age: "75d" },
  { name: "database-cleanup", namespace: "production", schedule: "0 3 * * 0", suspend: true, active: 0, lastSchedule: "7d", age: "120d" },
];

function rowMatchesFilters(row: CronJob, filters: CronJobFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  return true;
}

function sortCronJobs(rows: CronJob[], column: SortColumn, direction: SortDirection): CronJob[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "schedule":
        return compareStrings(a.schedule, b.schedule, direction);
      case "suspend": {
        const cmp = Number(a.suspend) - Number(b.suspend);
        return direction === "asc" ? cmp : -cmp;
      }
      case "active": {
        const cmp = a.active - b.active;
        return direction === "asc" ? cmp : -cmp;
      }
      case "lastSchedule":
        return compareStrings(a.lastSchedule, b.lastSchedule, direction);
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function CronJobsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<CronJobFilters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => CRONJOBS.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortCronJobs(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const colSpan = 8;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "CronJobs", path: "/workloads/cronjobs" },
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
                CronJobs
              </Title>
              <FavoriteButton name="CronJobs" path="/workloads/cronjobs" />
            </Flex>
            <Button variant="primary">Create CronJob</Button>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="cronjobs-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="cronjobs-dv-toolbar"
                id="cronjobs-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<CronJobFilters>
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
                    ouiaId="cronjobs-pagination"
                    widgetId="cronjobs-pagination"
                    titles={{ items: "cron jobs" }}
                    paginationAriaLabel="CronJobs pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="CronJobs">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Namespace">
                      <SortableTableHeader label="Namespace" column="namespace" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Schedule">
                      <SortableTableHeader label="Schedule" column="schedule" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Suspend">
                      <SortableTableHeader label="Suspend" column="suspend" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Active">
                      <SortableTableHeader label="Active" column="active" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Last schedule">
                      <SortableTableHeader label="Last schedule" column="lastSchedule" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No cron jobs match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((cj) => (
                      <Tr key={`${cj.namespace}/${cj.name}`}>
                        <Td dataLabel="Name">
                          <Button variant="link" isInline>
                            {cj.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{cj.namespace}</Content>
                        </Td>
                        <Td dataLabel="Schedule">
                          <Content component="small">{cj.schedule}</Content>
                        </Td>
                        <Td dataLabel="Suspend">
                          <Label color={cj.suspend ? "orange" : "green"} isCompact>
                            {cj.suspend ? "Yes" : "No"}
                          </Label>
                        </Td>
                        <Td dataLabel="Active">
                          <Content component="small">{cj.active}</Content>
                        </Td>
                        <Td dataLabel="Last schedule">
                          <Content component="small">{cj.lastSchedule}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{cj.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${cj.name}`} icon={<EllipsisVIcon />} />
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
