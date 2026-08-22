import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Icon,
  Label,
  MenuToggle,
  Pagination,
  PaginationVariant,
  Title,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewCheckboxFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
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

interface UpdateRecord {
  id: string;
  fromVersion: string;
  toVersion: string;
  status: "completed" | "failed" | "in-progress";
  startedAt: string;
  completedAt?: string;
  duration?: string;
  updatedBy: string;
  notes?: string;
  preCheckData?: {
    clusterHealth: string;
    apiChanges: number;
    operatorReadiness: string;
  };
}

type HistoryFilters = { status: string[] };

type SortColumn = "status" | "fromVersion" | "toVersion" | "startedAt" | "duration" | "updatedBy";

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "in-progress", label: "In Progress" },
];

const INITIAL_RECORDS: UpdateRecord[] = [
  {
    id: "update-001",
    fromVersion: "4.20.0",
    toVersion: "4.21.0",
    status: "completed",
    startedAt: "2024-03-10 14:30:00",
    completedAt: "2024-03-10 16:42:15",
    duration: "2h 12min",
    updatedBy: "admin@redhat.com",
    notes: "Successful update with AI guidance. No issues encountered.",
    preCheckData: { clusterHealth: "Passed", apiChanges: 3, operatorReadiness: "All compatible" },
  },
  {
    id: "update-002",
    fromVersion: "4.19.2",
    toVersion: "4.20.0",
    status: "completed",
    startedAt: "2024-02-15 09:15:00",
    completedAt: "2024-02-15 11:08:30",
    duration: "1h 53min",
    updatedBy: "admin@redhat.com",
    notes: "Standard update. Operator updates included.",
    preCheckData: { clusterHealth: "Passed", apiChanges: 2, operatorReadiness: "All compatible" },
  },
  {
    id: "update-003",
    fromVersion: "4.19.0",
    toVersion: "4.19.2",
    status: "completed",
    startedAt: "2024-01-20 22:00:00",
    completedAt: "2024-01-20 23:25:45",
    duration: "1h 25min",
    updatedBy: "admin@redhat.com",
    notes: "Security patch update. Completed during maintenance window.",
    preCheckData: { clusterHealth: "Passed", apiChanges: 0, operatorReadiness: "All compatible" },
  },
  {
    id: "update-004",
    fromVersion: "4.18.5",
    toVersion: "4.19.0",
    status: "failed",
    startedAt: "2024-01-05 10:30:00",
    completedAt: "2024-01-05 12:15:20",
    duration: "1h 45min (failed)",
    updatedBy: "admin@redhat.com",
    notes: "Update failed due to etcd health check. Rolled back successfully.",
    preCheckData: {
      clusterHealth: "Failed - etcd issues",
      apiChanges: 5,
      operatorReadiness: "Incompatible operator detected",
    },
  },
  {
    id: "update-005",
    fromVersion: "4.18.0",
    toVersion: "4.18.5",
    status: "completed",
    startedAt: "2023-12-12 18:00:00",
    completedAt: "2023-12-12 19:18:30",
    duration: "1h 18min",
    updatedBy: "system",
    notes: "Automated security update.",
    preCheckData: { clusterHealth: "Passed", apiChanges: 0, operatorReadiness: "All compatible" },
  },
];

function UpdateStatusCell({ status }: { status: UpdateRecord["status"] }) {
  switch (status) {
    case "completed":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="success" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          <Label color="green" isCompact>
            Completed
          </Label>
        </Flex>
      );
    case "failed":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="danger" aria-hidden>
            <TimesCircleIcon />
          </Icon>
          <Label color="red" isCompact>
            Failed
          </Label>
        </Flex>
      );
    case "in-progress":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="info" aria-hidden>
            <ClockIcon />
          </Icon>
          <Label color="blue" isCompact>
            In Progress
          </Label>
        </Flex>
      );
    default:
      return <Content component="small">{status}</Content>;
  }
}

function rowMatchesFilters(row: UpdateRecord, filters: HistoryFilters): boolean {
  if (filters.status.length > 0 && !filters.status.includes(row.status)) return false;
  return true;
}

function sortRecords(rows: UpdateRecord[], column: SortColumn, direction: SortDirection): UpdateRecord[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "fromVersion":
        return compareStrings(a.fromVersion, b.fromVersion, direction);
      case "toVersion":
        return compareStrings(a.toVersion, b.toVersion, direction);
      case "startedAt":
        return compareStrings(a.startedAt, b.startedAt, direction);
      case "duration":
        return compareStrings(a.duration ?? "", b.duration ?? "", direction);
      case "updatedBy":
        return compareStrings(a.updatedBy, b.updatedBy, direction);
      default:
        return 0;
    }
  });
}

function RecordActionsMenu({
  record,
  onReview,
  onDownload,
  onDelete,
}: {
  record: UpdateRecord;
  onReview: (record: UpdateRecord) => void;
  onDownload: (record: UpdateRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={(isOpen) => setOpen(isOpen)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={`Actions for update ${record.id}`}
          variant="plain"
          onClick={() => setOpen((v) => !v)}
          isExpanded={open}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem icon={<EyeIcon />} onClick={() => { onReview(record); setOpen(false); }}>
          Review
        </DropdownItem>
        <DropdownItem icon={<DownloadIcon />} onClick={() => { onDownload(record); setOpen(false); }}>
          Download
        </DropdownItem>
        <DropdownItem icon={<TrashIcon />} onClick={() => { onDelete(record.id); setOpen(false); }}>
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

export default function ClusterUpdateHistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<UpdateRecord[]>(INITIAL_RECORDS);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<HistoryFilters>({
    filters: { status: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("startedAt", "desc");

  const filteredRows = useMemo(
    () => records.filter((row) => rowMatchesFilters(row, filters)),
    [records, filters]
  );
  const sortedRows = useMemo(
    () => sortRecords(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters, records], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.status, perPage, records.length, setPage]);

  const handleReview = (record: UpdateRecord) => {
    navigate(`/administration/cluster-update/history/${record.id}/review`);
  };

  const handleDownload = (record: UpdateRecord) => {
    const yamlContent = `---
apiVersion: openshift.io/v1
kind: ClusterUpdateReport
metadata:
  name: ${record.id}
  createdAt: "${new Date().toISOString()}"
spec:
  updateID: ${record.id}
  status: ${record.status}
  fromVersion: ${record.fromVersion}
  toVersion: ${record.toVersion}
  timeline:
    started: "${record.startedAt}"
    ${record.completedAt ? `completed: "${record.completedAt}"` : 'status: "In Progress"'}
    duration: "${record.duration || "N/A"}"
  updatedBy: ${record.updatedBy}
  preChecks:
    clusterHealth: "${record.preCheckData?.clusterHealth || "N/A"}"
    apiChanges: ${record.preCheckData?.apiChanges || 0}
    operatorReadiness: "${record.preCheckData?.operatorReadiness || "N/A"}"
  notes: |
    ${record.notes || "No notes available"}
  reportGenerated: "${new Date().toISOString()}"
`;
    const blob = new Blob([yamlContent], { type: "application/x-yaml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cluster-update-${record.id}-${record.fromVersion}-to-${record.toVersion}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (recordId: string) => {
    if (confirm("Are you sure you want to delete this update record? This action cannot be undone.")) {
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    }
  };

  const colSpan = 7;

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Cluster Settings", path: "/administration/cluster-settings" },
          { label: "Update History" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <div>
            <Title headingLevel="h1" size="2xl" className="pf-v6-u-mb-md">
              Cluster Update
            </Title>
            <div className="flex gap-[24px] text-[14px] border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <button
                type="button"
                className="pb-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
                onClick={() => navigate("/administration/cluster-settings")}
              >
                Update plan
              </button>
              <button
                type="button"
                className="pb-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
                onClick={() => navigate("/administration/cluster-update/operators")}
              >
                Cluster operators
              </button>
              <button
                type="button"
                className="pb-[12px] border-b-2 border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white -mb-[1px]"
              >
                Update history
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[16px]">
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[12px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <Content component="small">Total Updates</Content>
              <Title headingLevel="h2" size="3xl" className="pf-v6-u-mt-sm">
                {records.length}
              </Title>
            </div>
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[12px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <Content component="small">Successful Updates</Content>
              <Title headingLevel="h2" size="3xl" className="pf-v6-u-mt-sm pf-v6-u-color-200">
                {records.filter((r) => r.status === "completed").length}
              </Title>
            </div>
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[12px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <Content component="small">Failed Updates</Content>
              <Title headingLevel="h2" size="3xl" className="pf-v6-u-mt-sm pf-v6-u-color-danger">
                {records.filter((r) => r.status === "failed").length}
              </Title>
            </div>
          </div>

          <div className="ocs-pods-list__panel">
            <Title headingLevel="h2" size="lg" className="pf-v6-u-p-lg pf-v6-u-pb-0">
              Update Records
            </Title>
            <DataView ouiaId="update-history-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="update-history-dv-toolbar"
                id="update-history-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<HistoryFilters>
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
                    <DataViewCheckboxFilter title="Status" filterId="status" options={STATUS_OPTIONS} />
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
                    ouiaId="update-history-pagination"
                    widgetId="update-history-pagination"
                    titles={{ items: "records" }}
                    paginationAriaLabel="Update history pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Update history">
                <Thead>
                  <Tr>
                    <Th dataLabel="Status">
                      <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="From Version">
                      <SortableTableHeader label="From Version" column="fromVersion" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="To Version">
                      <SortableTableHeader label="To Version" column="toVersion" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Started">
                      <SortableTableHeader label="Started" column="startedAt" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Duration">
                      <SortableTableHeader label="Duration" column="duration" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Updated By">
                      <SortableTableHeader label="Updated By" column="updatedBy" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No update records found.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((record) => (
                      <Tr key={record.id}>
                        <Td dataLabel="Status">
                          <UpdateStatusCell status={record.status} />
                        </Td>
                        <Td dataLabel="From Version">
                          <Content component="small">{record.fromVersion}</Content>
                        </Td>
                        <Td dataLabel="To Version">
                          <Content component="small">{record.toVersion}</Content>
                        </Td>
                        <Td dataLabel="Started">
                          <Content component="small">{record.startedAt}</Content>
                        </Td>
                        <Td dataLabel="Duration">
                          <Content component="small">{record.duration || "N/A"}</Content>
                        </Td>
                        <Td dataLabel="Updated By">
                          <Content component="small">{record.updatedBy}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <RecordActionsMenu
                            record={record}
                            onReview={handleReview}
                            onDownload={handleDownload}
                            onDelete={handleDelete}
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
