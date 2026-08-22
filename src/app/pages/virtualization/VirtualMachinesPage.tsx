import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Grid,
  GridItem,
  Label,
  MenuToggle,
  Pagination,
  PaginationVariant,
  Progress,
  Tab,
  Tabs,
  TabTitleText,
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
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
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
import { getAllVirtualMachines, vmDetailPath } from "../networking/networkingMockData";
import { getVmsForProject, getVirtOverviewStats } from "./virtualizationMockData";
import {
  VirtualizationEmptyState,
  VirtualizationPageShell,
  VirtualizationProjectLayout,
} from "./virtualizationShared";

type VmFilters = { name: string };
type SortColumn = "name" | "namespace" | "status";

function sortRows(rows: ReturnType<typeof getAllVirtualMachines>, column: SortColumn, direction: SortDirection) {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      default:
        return 0;
    }
  });
}

function OverviewTab() {
  const stats = useMemo(() => getVirtOverviewStats(), []);

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
      <div className="ocs-virt-overview-stats">
        <OperatorSummaryCard
          status={stats.operatorStatus}
          statusColor={stats.operatorStatusColor}
          alerts={stats.operatorAlerts}
        />
        <MetricCard label="Nodes" value={String(stats.nodeCount)} />
        <MetricCard label="Projects" value={String(stats.projectCount)} />
        <MetricCard label="VMs" value={String(stats.vmCount)} />
      </div>
      <Grid hasGutter>
        <GridItem md={6}>
          <Card isCompact isPlain className="app-glass-panel">
            <CardTitle>Cluster averages (Across all nodes)</CardTitle>
            <CardBody>
              <LoadRow label="CPU load" value={stats.clusterLoads.cpu} />
              <LoadRow label="Memory load" value={stats.clusterLoads.memory} />
              <LoadRow label="Storage load" value={stats.clusterLoads.storage} />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <Card isCompact isPlain className="app-glass-panel">
            <CardTitle>Node load distribution</CardTitle>
            <CardBody>
              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                {stats.nodeLoads.map((node) => (
                  <Progress key={node.name} value={node.value} title={node.name} size="sm" />
                ))}
              </Flex>
              <Button variant="link" isInline className="pf-v6-u-mt-sm">
                View all
              </Button>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      <Grid hasGutter>
        <GridItem md={6}>
          <Card isCompact isPlain className="app-glass-panel">
            <CardTitle>Virtual machine alerts</CardTitle>
            <CardBody>
              <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} gap={{ default: "gapLg" }}>
                <AlertCount label="Critical" count={stats.vmAlerts.critical} color="red" />
                <AlertCount label="Warning" count={stats.vmAlerts.warning} color="orange" />
                <AlertCount label="Info" count={stats.vmAlerts.info} color="blue" />
              </Flex>
              <Button variant="link" isInline className="pf-v6-u-mt-sm">
                View all
              </Button>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <Card isCompact isPlain className="app-glass-panel">
            <CardTitle>Virtual machine statuses</CardTitle>
            <CardBody>
              <Flex gap={{ default: "gapLg" }} flexWrap={{ default: "wrap" }}>
                <StatusCount label="Error" count={stats.vmStatuses.error} color="red" />
                <StatusCount label="Running" count={stats.vmStatuses.running} color="green" />
                <StatusCount label="Stopped" count={stats.vmStatuses.stopped} color="grey" />
                <StatusCount label="Other" count={stats.vmStatuses.other} color="blue" />
              </Flex>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Flex>
  );
}

function OperatorSummaryCard({
  status,
  statusColor,
  alerts,
}: {
  status: string;
  statusColor: "green" | "orange" | "red";
  alerts: number;
}) {
  return (
    <Card isCompact isPlain className="app-glass-panel ocs-virt-metric-card">
      <CardBody className="ocs-virt-metric-card__body">
        <Content component="p" className="pf-v6-u-color-200 pf-v6-u-mb-sm">
          OpenShift Virtualization
        </Content>
        <Flex
          direction={{ default: "column" }}
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          className="ocs-virt-metric-card__content"
          gap={{ default: "gapSm" }}
        >
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
            <Content component="span" className="pf-v6-u-color-200">
              Status
            </Content>
            <Label color={statusColor} isCompact>
              {status}
            </Label>
          </Flex>
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
            <Content component="span" className="pf-v6-u-color-200">
              Alerts
            </Content>
            <Title headingLevel="h3" size="2xl">
              {alerts}
            </Title>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

function AlertCount({ label, count, color }: { label: string; count: number; color: "red" | "orange" | "blue" }) {
  return (
    <Flex direction={{ default: "column" }} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapXs" }}>
      <Content component="span" className="pf-v6-u-color-200">
        {label}
      </Content>
      <Label color={color} isCompact>
        {count}
      </Label>
    </Flex>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card isCompact isPlain className="app-glass-panel ocs-virt-metric-card">
      <CardBody className="ocs-virt-metric-card__body">
        <Content component="p" className="pf-v6-u-color-200 pf-v6-u-mb-sm">
          {label}
        </Content>
        <Title headingLevel="h3" size="2xl" className="ocs-virt-metric-card__value">
          {value}
        </Title>
      </CardBody>
    </Card>
  );
}

function LoadRow({ label, value }: { label: string; value: number }) {
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} className="pf-v6-u-mb-md">
      <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
        <Content component="span">{label}</Content>
        <Content component="span" className="pf-v6-u-color-200">
          {value}%
        </Content>
      </Flex>
      <Progress value={value} size="sm" aria-label={`${label} ${value}%`} />
    </Flex>
  );
}

function StatusCount({ label, count, color }: { label: string; count: number; color: "red" | "green" | "grey" | "blue" }) {
  return (
    <Flex direction={{ default: "column" }} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapXs" }}>
      <Label color={color} isCompact>
        {label}
      </Label>
      <Content component="span" className="pf-v6-u-font-size-xl pf-v6-u-font-weight-bold">
        {count}
      </Content>
    </Flex>
  );
}

function VirtualMachinesListTab({ projectFilter }: { projectFilter: string }) {
  const allRows = getAllVirtualMachines();
  const rows = projectFilter ? getVmsForProject(projectFilter) : allRows;
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<VmFilters>({ filters: { name: "" } });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(() => {
    const q = (filters.name ?? "").trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
  }, [rows, filters]);
  const sorted = useMemo(() => sortRows(filtered, sortColumn, sortDirection), [filtered, sortColumn, sortDirection]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  if (rows.length === 0) {
    const createTo = `/virtualization/virtualmachines/create${projectFilter ? `?project=${encodeURIComponent(projectFilter)}` : ""}`;
    return (
      <VirtualizationEmptyState
        title="No virtual machines yet"
        description={
          <>
            Click <strong>Create VirtualMachine</strong> to get started, or right-click a project in the left navigation
            tree. Don&apos;t have a project yet? Right-click a cluster in the navigation tree to create your first one.
          </>
        }
        actionLabel="Create VirtualMachine"
        actionTo={createTo}
      />
    );
  }

  return (
    <div className="ocs-pods-list__panel">
      <DataView ouiaId="vms-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
        <DataViewToolbar
          ouiaId="vms-dv-toolbar"
          id="vms-dv-toolbar"
          className={OCS_PROTOTYPE_TOOLBAR_CLASS}
          clearAllFilters={clearAllFilters}
          collapseListedFiltersBreakpoint="xl"
          filters={
            <IoDataViewFiltersWithMidActions<VmFilters>
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
              ouiaId="vms-pagination"
              widgetId="vms-pagination"
              titles={{ items: "virtual machines" }}
              paginationAriaLabel="VirtualMachines pagination"
            />
          }
        />
        <OcsPrototypeListTable ariaLabel="VirtualMachines">
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
              <Th dataLabel="Status">
                <SortableTableHeader
                  label="Status"
                  column="status"
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
            {paginated.map((row) => (
              <Tr key={`${row.namespace}/${row.name}`}>
                <Td dataLabel="Name">
                  <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                    <Label color="blue" isCompact className="ocs-resource-label">
                      VM
                    </Label>
                    <Button variant="link" isInline component={Link} to={vmDetailPath(row.namespace, row.name)}>
                      {row.name}
                    </Button>
                  </Flex>
                </Td>
                <Td dataLabel="Namespace">{row.namespace}</Td>
                <Td dataLabel="Status">
                  <Label color="orange" isCompact>
                    {row.status}
                  </Label>
                </Td>
                <Td dataLabel="Actions" isActionCell hasAction />
              </Tr>
            ))}
          </Tbody>
        </OcsPrototypeListTable>
      </DataView>
    </div>
  );
}

export default function VirtualMachinesPage() {
  const [searchParams] = useSearchParams();
  const project = searchParams.get("project") ?? "";
  const [activeTab, setActiveTab] = useState("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const createTo = `/virtualization/virtualmachines/create${project ? `?project=${encodeURIComponent(project)}` : ""}`;

  return (
    <VirtualizationPageShell
      title="VirtualMachines"
      path="/virtualization/virtualmachines"
      createMenu={
        <Dropdown
          isOpen={createOpen}
          onOpenChange={setCreateOpen}
          onSelect={() => setCreateOpen(false)}
          popperProps={{ position: "right" }}
          toggle={(toggleRef) => (
            <MenuToggle ref={toggleRef} onClick={() => setCreateOpen((o) => !o)} variant="primary">
              Create
            </MenuToggle>
          )}
        >
          <DropdownList>
            <DropdownItem itemId="vm" component={Link} to={createTo}>
              Create VirtualMachine
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      }
    >
      <VirtualizationProjectLayout selectedProject={project || undefined}>
        <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(String(key))} aria-label="VirtualMachines">
          <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>} />
          <Tab eventKey="virtualmachines" title={<TabTitleText>Virtual machines</TabTitleText>} />
        </Tabs>
        {activeTab === "overview" ? <OverviewTab /> : <VirtualMachinesListTab projectFilter={project} />}
      </VirtualizationProjectLayout>
    </VirtualizationPageShell>
  );
}
