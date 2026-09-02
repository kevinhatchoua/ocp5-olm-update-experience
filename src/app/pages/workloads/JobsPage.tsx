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
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import PlayCircleIcon from "@patternfly/react-icons/dist/esm/icons/play-circle-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
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

interface Job {
  name: string;
  namespace: string;
  completions: string;
  duration: string;
  age: string;
  status: "Complete" | "Running" | "Failed";
}

type JobFilters = {
  name: string;
  namespace: string;
  status: string[];
};

type SortColumn = "name" | "namespace" | "completions" | "duration" | "status" | "age";

const JOBS: Job[] = [
  { name: "backup-job-1710720000", namespace: "production", completions: "1/1", duration: "45s", age: "2d", status: "Complete" },
  { name: "database-migration-job", namespace: "production", completions: "1/1", duration: "2m30s", age: "5d", status: "Complete" },
  { name: "data-export-1710800000", namespace: "production", completions: "1/1", duration: "1m15s", age: "1d", status: "Complete" },
  { name: "cleanup-job-1710850000", namespace: "production", completions: "0/1", duration: "15s", age: "12h", status: "Failed" },
  { name: "batch-processing-1710900000", namespace: "production", completions: "0/1", duration: "30s", age: "6h", status: "Running" },
  { name: "report-generation-1710920000", namespace: "production", completions: "1/1", duration: "3m45s", age: "4h", status: "Complete" },
  { name: "index-rebuild-1710930000", namespace: "production", completions: "0/1", duration: "1m", age: "2h", status: "Running" },
];

const STATUS_OPTIONS = [
  { value: "Complete", label: "Complete" },
  { value: "Running", label: "Running" },
  { value: "Failed", label: "Failed" },
];

const STATUS_SORT_ORDER: Record<Job["status"], number> = {
  Complete: 0,
  Running: 1,
  Failed: 2,
};

function JobStatusCell({ status }: { status: Job["status"] }) {
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
            <PlayCircleIcon />
          </Icon>
          <Label color="blue" isCompact>
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

function rowMatchesFilters(row: Job, filters: JobFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.namespace.toLowerCase().includes(nsQ)) return false;
  if (filters.status.length > 0 && !filters.status.includes(row.status)) return false;
  return true;
}

function sortJobs(rows: Job[], column: SortColumn, direction: SortDirection): Job[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "completions":
        return compareStrings(a.completions, b.completions, direction);
      case "duration":
        return compareStrings(a.duration, b.duration, direction);
      case "status": {
        const cmp = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
        return direction === "asc" ? cmp : -cmp;
      }
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function JobsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<JobFilters>({
    filters: { name: "", namespace: "", status: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(() => JOBS.filter((row) => rowMatchesFilters(row, filters)), [filters]);
  const sortedRows = useMemo(
    () => sortJobs(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, filters.status, perPage, setPage]);

  const colSpan = 7;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "Jobs", path: "/workloads/jobs" },
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
                Jobs
              </Title>
              <FavoriteButton name="Jobs" path="/workloads/jobs" />
            </Flex>
            <PrototypeCreateButton>Create Job</PrototypeCreateButton>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="jobs-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="jobs-dv-toolbar"
                id="jobs-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<JobFilters>
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
                    ouiaId="jobs-pagination"
                    widgetId="jobs-pagination"
                    titles={{ items: "jobs" }}
                    paginationAriaLabel="Jobs pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Jobs">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Namespace">
                      <SortableTableHeader label="Namespace" column="namespace" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Completions">
                      <SortableTableHeader label="Completions" column="completions" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Duration">
                      <SortableTableHeader label="Duration" column="duration" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Status">
                      <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No jobs match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((job) => (
                      <Tr key={`${job.namespace}/${job.name}`}>
                        <Td dataLabel="Name">
                          <PrototypeResourceLink listKey="jobs" name={job.name} namespace={job.namespace} />
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{job.namespace}</Content>
                        </Td>
                        <Td dataLabel="Completions">
                          <Content component="small">{job.completions}</Content>
                        </Td>
                        <Td dataLabel="Duration">
                          <Content component="small">{job.duration}</Content>
                        </Td>
                        <Td dataLabel="Status">
                          <JobStatusCell status={job.status} />
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{job.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${job.name}`} icon={<EllipsisVIcon />} />
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
