import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
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
  Switch,
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
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
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

interface Operator {
  name: string;
  version: string;
  supportStatus: string;
  lifecycleStage: string;
  remainingTime: string;
  fullSupportEnd: string;
  maintenanceEnd: string;
  eusEnd: string;
  platformCompatibility: string;
  updatePolicy: string;
  channel: string;
}

type OperatorFilters = { name: string };

type SortColumn =
  | "name"
  | "version"
  | "supportStatus"
  | "lifecycleStage"
  | "remainingTime"
  | "eusEnd"
  | "platformCompatibility"
  | "updatePolicy";

const OPERATORS: Operator[] = [
  {
    name: "Abot Operator",
    version: "v3.0.0",
    supportStatus: "Full support",
    lifecycleStage: "Active",
    remainingTime: "18 months",
    fullSupportEnd: "Sep 2027",
    maintenanceEnd: "Sep 2028",
    eusEnd: "N/A",
    platformCompatibility: "4.20-4.24",
    updatePolicy: "Semi-automatic",
    channel: "stable-v3",
  },
  {
    name: "Airflow Helm Operator",
    version: "v2.1.0",
    supportStatus: "Full support",
    lifecycleStage: "Active",
    remainingTime: "24 months",
    fullSupportEnd: "Mar 2028",
    maintenanceEnd: "Mar 2029",
    eusEnd: "N/A",
    platformCompatibility: "4.18-4.23",
    updatePolicy: "Manual",
    channel: "stable-v2",
  },
  {
    name: "Ansible Automation Platform",
    version: "v3.1.0",
    supportStatus: "Maintenance support",
    lifecycleStage: "Maintenance",
    remainingTime: "6 months",
    fullSupportEnd: "Sep 2025",
    maintenanceEnd: "Mar 2027",
    eusEnd: "N/A",
    platformCompatibility: "4.16-4.22",
    updatePolicy: "Fully automatic",
    channel: "stable-v3",
  },
  {
    name: "OpenShift GitOps",
    version: "v1.8.5",
    supportStatus: "End of life",
    lifecycleStage: "EOL",
    remainingTime: "Expired",
    fullSupportEnd: "Dec 2025",
    maintenanceEnd: "Jun 2026",
    eusEnd: "N/A",
    platformCompatibility: "4.12-4.20",
    updatePolicy: "Manual",
    channel: "stable-v1.8",
  },
  {
    name: "Red Hat OpenShift Service Mesh",
    version: "v2.4.0",
    supportStatus: "Full support",
    lifecycleStage: "Active",
    remainingTime: "30 months",
    fullSupportEnd: "Sep 2028",
    maintenanceEnd: "Sep 2029",
    eusEnd: "Sep 2030",
    platformCompatibility: "4.21-4.25",
    updatePolicy: "Semi-automatic",
    channel: "stable-v2.4",
  },
];

function SupportStatusCell({ status }: { status: string }) {
  if (status === "End of life") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="danger" aria-hidden>
          <ExclamationCircleIcon />
        </Icon>
        <Label color="red" isCompact>
          {status}
        </Label>
      </Flex>
    );
  }
  if (status === "Maintenance support") {
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
  }
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
}

function rowMatchesFilters(row: Operator, filters: OperatorFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortOperators(rows: Operator[], column: SortColumn, direction: SortDirection): Operator[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "version":
        return compareStrings(a.version, b.version, direction);
      case "supportStatus":
        return compareStrings(a.supportStatus, b.supportStatus, direction);
      case "lifecycleStage":
        return compareStrings(a.lifecycleStage, b.lifecycleStage, direction);
      case "remainingTime":
        return compareStrings(a.remainingTime, b.remainingTime, direction);
      case "eusEnd":
        return compareStrings(a.eusEnd, b.eusEnd, direction);
      case "platformCompatibility":
        return compareStrings(a.platformCompatibility, b.platformCompatibility, direction);
      case "updatePolicy":
        return compareStrings(a.updatePolicy, b.updatePolicy, direction);
      default:
        return 0;
    }
  });
}

function OperatorActionsMenu({ op, navigate }: { op: Operator; navigate: ReturnType<typeof useNavigate> }) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={(isOpen) => setOpen(isOpen)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={`Actions for ${op.name}`}
          variant="plain"
          onClick={() => setOpen((v) => !v)}
          isExpanded={open}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem onClick={() => { navigate(`/ecosystem/installed-operators/${op.name}`); setOpen(false); }}>
          View details
        </DropdownItem>
        <DropdownItem onClick={() => { navigate(`/ecosystem/installed-operators/${op.name}/update`); setOpen(false); }}>
          Update operator
        </DropdownItem>
        <DropdownItem onClick={() => { navigate(`/ecosystem/installed-operators/${op.name}/yaml`); setOpen(false); }}>
          View YAML
        </DropdownItem>
        <DropdownItem onClick={() => { navigate(`/ecosystem/installed-operators/${op.name}/logs`); setOpen(false); }}>
          View logs
        </DropdownItem>
        <DropdownItem onClick={() => { navigate(`/ecosystem/installed-operators/${op.name}/events`); setOpen(false); }}>
          View events
        </DropdownItem>
        <DropdownItem onClick={() => { navigate(`/ecosystem/installed-operators/${op.name}/subscription`); setOpen(false); }}>
          Edit subscription
        </DropdownItem>
        <DropdownItem onClick={() => setOpen(false)}>
          {op.updatePolicy.includes("automatic") ? "Pause automatic updates" : "Enable automatic updates"}
        </DropdownItem>
        <DropdownItem
          onClick={() => {
            window.open(`https://docs.openshift.com/container-platform/operators/${op.name}`, "_blank");
            setOpen(false);
          }}
        >
          View documentation
        </DropdownItem>
        <DropdownItem onClick={() => setOpen(false)}>Uninstall</DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

export default function OperatorsLifecyclePage() {
  const navigate = useNavigate();
  const [showElcMilestones, setShowElcMilestones] = useState(false);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<OperatorFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => OPERATORS.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortOperators(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const summary = {
    totalOperators: OPERATORS.length,
    fullSupport: OPERATORS.filter((o) => o.supportStatus === "Full support").length,
    maintenance: OPERATORS.filter((o) => o.supportStatus === "Maintenance support").length,
    endOfLife: OPERATORS.filter((o) => o.supportStatus === "End of life").length,
  };

  const colSpan = showElcMilestones ? 9 : 8;

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Cluster Settings", path: "/administration/cluster-settings" },
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
                className="pb-[12px] border-b-2 border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white -mb-[1px]"
              >
                Cluster operators
              </button>
              <button
                type="button"
                className="pb-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
                onClick={() => navigate("/administration/cluster-update/history")}
              >
                Update history
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-[16px]">
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <Content component="small">Total Operators</Content>
              <Title headingLevel="h2" size="3xl" className="pf-v6-u-mt-sm">
                {summary.totalOperators}
              </Title>
            </div>
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <Content component="small">Full support</Content>
              <Title headingLevel="h2" size="3xl" className="pf-v6-u-mt-sm pf-v6-u-color-200">
                {summary.fullSupport}
              </Title>
            </div>
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <Content component="small">Maintenance support</Content>
              <Title headingLevel="h2" size="3xl" className="pf-v6-u-mt-sm">
                {summary.maintenance}
              </Title>
            </div>
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <Content component="small">End of life</Content>
              <Title headingLevel="h2" size="3xl" className="pf-v6-u-mt-sm pf-v6-u-color-danger">
                {summary.endOfLife}
              </Title>
            </div>
          </div>

          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[20px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
            <Switch
              id="cluster-operators-elc-opt-in"
              label="Include extended life cycle (ELC) milestones"
              isChecked={showElcMilestones}
              onChange={(_event, checked) => setShowElcMilestones(checked)}
            />
            <Content component="p" className="pf-v6-u-font-size-sm pf-v6-u-mt-sm pf-v6-u-mb-0 max-w-3xl">
              Opt in to show published ELC / EUS-related dates in this view. EUS alignment is indicated by{" "}
              <strong>PLCC</strong> as the source of truth; not all operators are EUS-aligned. Fuller behavior is
              expected to depend on sub-cluster entitlement checking.
            </Content>
          </div>

          {summary.endOfLife > 0 ? (
            <Alert variant="danger" title="Critical update required" isInline>
              {summary.endOfLife} operator{summary.endOfLife > 1 ? "s have" : " has"} reached end of life and require
              immediate attention.
            </Alert>
          ) : null}

          <div className="ocs-pods-list__panel">
            <Flex
              alignItems={{ default: "alignItemsCenter" }}
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              flexWrap={{ default: "wrap" }}
              gap={{ default: "gapMd" }}
              className="pf-v6-u-p-lg pf-v6-u-pb-0"
            >
              <Title headingLevel="h2" size="lg">
                Installed Extensions Lifecycle Status
              </Title>
              <Flex gap={{ default: "gapSm" }}>
                <Button variant="secondary">Export Report</Button>
                <Button variant="primary">Plan Maintenance Window</Button>
              </Flex>
            </Flex>

            <DataView ouiaId="operators-lifecycle-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="operators-lifecycle-dv-toolbar"
                id="operators-lifecycle-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<OperatorFilters>
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
                      placeholder="Filter by operator name..."
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
                    ouiaId="operators-lifecycle-pagination"
                    widgetId="operators-lifecycle-pagination"
                    titles={{ items: "operators" }}
                    paginationAriaLabel="Operators lifecycle pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Installed Extensions Lifecycle Status">
                <Thead>
                  <Tr>
                    <Th dataLabel="Operator Name">
                      <SortableTableHeader label="Operator Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Version">
                      <SortableTableHeader label="Version" column="version" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Support Status">
                      <SortableTableHeader label="Support Status" column="supportStatus" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Lifecycle Stage">
                      <SortableTableHeader label="Lifecycle Stage" column="lifecycleStage" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Time Remaining">
                      <SortableTableHeader label="Time Remaining" column="remainingTime" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    {showElcMilestones ? (
                      <Th dataLabel="EUS / ELC">
                        <SortableTableHeader label="EUS / ELC" column="eusEnd" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                    ) : null}
                    <Th dataLabel="Platform Compatibility">
                      <SortableTableHeader label="Platform Compatibility" column="platformCompatibility" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Update Policy">
                      <SortableTableHeader label="Update Policy" column="updatePolicy" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No operators match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((op) => (
                      <Tr key={op.name}>
                        <Td dataLabel="Operator Name">
                          <Content component="p" className="pf-v6-u-mb-xs">
                            {op.name}
                          </Content>
                          <Content component="small">Channel: {op.channel}</Content>
                        </Td>
                        <Td dataLabel="Version">
                          <Content component="small">{op.version}</Content>
                        </Td>
                        <Td dataLabel="Support Status">
                          <SupportStatusCell status={op.supportStatus} />
                        </Td>
                        <Td dataLabel="Lifecycle Stage">
                          <Content component="small">{op.lifecycleStage}</Content>
                        </Td>
                        <Td dataLabel="Time Remaining">
                          <Content component="small">{op.remainingTime}</Content>
                          <Content component="small">Full: {op.fullSupportEnd}</Content>
                        </Td>
                        {showElcMilestones ? (
                          <Td dataLabel="EUS / ELC">
                            <Content component="small">{op.eusEnd}</Content>
                            <Content component="small">Maint.: {op.maintenanceEnd}</Content>
                          </Td>
                        ) : null}
                        <Td dataLabel="Platform Compatibility">
                          <Content component="small">{op.platformCompatibility}</Content>
                        </Td>
                        <Td dataLabel="Update Policy">
                          <Label color="grey" isCompact>
                            {op.updatePolicy}
                          </Label>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <OperatorActionsMenu op={op} navigate={navigate} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </OcsPrototypeListTable>
            </DataView>

            <Flex gap={{ default: "gapMd" }} className="pf-v6-u-p-lg pf-v6-u-pt-xl pf-v6-u-border-top">
              <Icon status="info" aria-hidden>
                <InfoCircleIcon />
              </Icon>
              <div>
                <Content component="p" className="pf-v6-u-font-weight-bold pf-v6-u-mb-sm">
                  Lifecycle Stages Explained
                </Content>
                <div className="grid grid-cols-3 gap-[16px]">
                  <div>
                    <Content component="p" className="pf-v6-u-color-200 pf-v6-u-font-weight-bold">
                      Full support
                    </Content>
                    <Content component="small">
                      Receives bug fixes, security updates, and new features
                    </Content>
                  </div>
                  <div>
                    <Content component="p" className="pf-v6-u-font-weight-bold">
                      Maintenance support
                    </Content>
                    <Content component="small">Receives critical security fixes only</Content>
                  </div>
                  <div>
                    <Content component="p" className="pf-v6-u-color-danger pf-v6-u-font-weight-bold">
                      End of life (EOL)
                    </Content>
                    <Content component="small">No longer receives any updates or support</Content>
                  </div>
                </div>
              </div>
            </Flex>
          </div>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
