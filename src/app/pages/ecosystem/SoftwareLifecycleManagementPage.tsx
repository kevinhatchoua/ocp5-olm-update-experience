import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Content,
  Label,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { AlertTriangle, CheckCircle } from "@/lib/pfIcons";
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

export default function SoftwareLifecycleManagementPage() {
  const [selectedTab, setSelectedTab] = useState<"operators" | "cluster">("operators");

  const operatorUpdates = [
    {
      id: "abot-operator",
      name: "Abot Operator",
      currentVersion: "3.0.0",
      targetVersion: "3.1.0",
      status: "update-available",
      updatePlan: "Manual",
      clusterCompatibility: "Compatible",
      requiredByClusterUpdate: true,
    },
    {
      id: "airflow-helm",
      name: "Airflow Helm Operator",
      currentVersion: "5.7.2",
      targetVersion: "5.7.3",
      status: "update-available",
      updatePlan: "Manual",
      clusterCompatibility: "Compatible",
      requiredByClusterUpdate: true,
    },
    {
      id: "ansible-automation",
      name: "Ansible Automation Platform",
      currentVersion: "1.5.0",
      targetVersion: "1.6.0",
      status: "update-available",
      updatePlan: "Automatic",
      clusterCompatibility: "Compatible",
      requiredByClusterUpdate: false,
    },
    {
      id: "bare-metal-event",
      name: "Bare Metal Event Relay",
      currentVersion: "1.1.1",
      targetVersion: "1.2.0",
      status: "update-available",
      updatePlan: "Automatic",
      clusterCompatibility: "Compatible",
      requiredByClusterUpdate: false,
    },
  ];

  const clusterUpdate = {
    currentVersion: "4.21.0",
    targetVersion: "4.22.0",
    channel: "candidate-4.22",
    status: "available",
    blockedByOperators: ["Abot Operator", "Airflow Helm Operator"],
  };

  type OperatorUpdateFilters = { name: string };
  type OperatorUpdateSortColumn = "name" | "currentVersion" | "targetVersion" | "updatePlan" | "compatibility";

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<OperatorUpdateFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<OperatorUpdateSortColumn>("name");

  const filteredOperatorUpdates = useMemo(() => {
    const nameQ = (filters.name ?? "").trim().toLowerCase();
    return operatorUpdates.filter((op) => !nameQ || op.name.toLowerCase().includes(nameQ));
  }, [filters.name]);

  const sortedOperatorUpdates = useMemo(() => {
    return [...filteredOperatorUpdates].sort((a, b) => {
      switch (sortColumn) {
        case "name":
          return compareStrings(a.name, b.name, sortDirection);
        case "currentVersion":
          return compareStrings(a.currentVersion, b.currentVersion, sortDirection);
        case "targetVersion":
          return compareStrings(a.targetVersion, b.targetVersion, sortDirection);
        case "updatePlan":
          return compareStrings(a.updatePlan, b.updatePlan, sortDirection);
        case "compatibility":
          return compareStrings(a.clusterCompatibility, b.clusterCompatibility, sortDirection);
        default:
          return 0;
      }
    });
  }, [filteredOperatorUpdates, sortColumn, sortDirection]);

  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(
    sortedOperatorUpdates,
    [filters],
    20
  );

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const operatorColSpan = 6;

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Ecosystem", path: "/ecosystem" },
            { label: "Software Lifecycle Management" },
          ]}
        >

        <div className="mb-[24px]">
          <h1 className="font-['Red_Hat_Display_VF:Medium',sans-serif] font-medium leading-[36.4px] text-[#151515] dark:text-white text-[28px] mb-[8px]">
            Software Lifecycle Management
          </h1>
          <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
            Coordinate operator and cluster updates to maintain system stability and compatibility.
          </p>
        </div>

        {/* Alert about cluster update being blocked */}
        {clusterUpdate.blockedByOperators.length > 0 && (
          <div className="mb-[24px] bg-[#fef6e6] dark:bg-[rgba(240,171,0,0.15)] border-l-4 border-[#f0ab00] dark:border-[#f4c145] rounded-[8px] p-[16px]">
            <div className="flex items-start gap-[12px]">
              <AlertTriangle className="size-[20px] text-[#f0ab00] dark:text-[#f4c145] shrink-0 mt-[2px]" />
              <div className="flex-1">
                <p className="text-[14px] text-[#151515] dark:text-white font-semibold mb-[4px]">
                  Cluster update requires operator updates
                </p>
                <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">
                  The following operators must be updated before the cluster can update to OpenShift {clusterUpdate.targetVersion}:
                </p>
                <ul className="list-disc list-inside text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[12px]">
                  {clusterUpdate.blockedByOperators.map((op) => (
                    <li key={op}>{op}</li>
                  ))}
                </ul>
                <div className="flex gap-[12px]">
                  <button
                    onClick={() => setSelectedTab("operators")}
                    className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold"
                  >
                    Update operators now
                  </button>
                  <Link
                    to="/administration/cluster-settings"
                    className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold"
                  >
                    View cluster settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] mb-[24px]">
          <div className="flex gap-[24px]">
            <button
              onClick={() => setSelectedTab("operators")}
              className={`pb-[12px] border-b-2 transition-colors ${
                selectedTab === "operators"
                  ? "border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white"
                  : "border-transparent text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
              } text-[14px] -mb-[1px]`}
            >
              Operator Updates
            </button>
            <button
              onClick={() => setSelectedTab("cluster")}
              className={`pb-[12px] border-b-2 transition-colors ${
                selectedTab === "cluster"
                  ? "border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white"
                  : "border-transparent text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
              } text-[14px] -mb-[1px]`}
            >
              Cluster Update
            </button>
          </div>
        </div>

        {/* Operator Updates Tab */}
        {selectedTab === "operators" && (
          <>
            <div className="mb-[24px]">
              <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[20px] text-[#151515] dark:text-white mb-[12px]">
                Pending Operator Updates
              </h2>
              <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                {operatorUpdates.length} operators have updates available
              </p>
            </div>

            <div className="ocs-pods-list__panel">
              <DataView ouiaId="operator-updates-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
                <DataViewToolbar
                  ouiaId="operator-updates-dv-toolbar"
                  id="operator-updates-dv-toolbar"
                  className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                  clearAllFilters={clearAllFilters}
                  collapseListedFiltersBreakpoint="xl"
                  filters={
                    <IoDataViewFiltersWithMidActions<OperatorUpdateFilters>
                      values={filters}
                      onChange={(_filterId, partial) => onSetFilters(partial)}
                      breakpoint="xl"
                    >
                      <DataViewTextFilter
                        title="Name"
                        filterId="name"
                        placeholder="Filter by name..."
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
                      ouiaId="operator-updates-pagination"
                      widgetId="operator-updates-pagination"
                      titles={{ items: "operator updates" }}
                      paginationAriaLabel="Operator updates pagination"
                    />
                  }
                />

                <OcsPrototypeListTable ariaLabel="Pending operator updates">
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th dataLabel="Current Version">
                        <SortableTableHeader label="Current Version" column="currentVersion" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th dataLabel="Target Version">
                        <SortableTableHeader label="Target Version" column="targetVersion" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th dataLabel="Update Plan">
                        <SortableTableHeader label="Update Plan" column="updatePlan" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th dataLabel="Compatibility">
                        <SortableTableHeader label="Compatibility" column="compatibility" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginated.length === 0 ? (
                      <Tr>
                        <Td colSpan={operatorColSpan} dataLabel="Empty state">
                          <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                            No operator updates match your filters.
                          </Content>
                        </Td>
                      </Tr>
                    ) : (
                      paginated.map((op) => (
                        <Tr key={op.id}>
                          <Td dataLabel="Name">
                            <div className="flex items-center gap-[8px]">
                              <Button
                                component={Link}
                                variant="link"
                                isInline
                                to={`/ecosystem/installed-operators/${op.id}`}
                              >
                                {op.name}
                              </Button>
                              {op.requiredByClusterUpdate && (
                                <Label color="orange" isCompact>
                                  Required
                                </Label>
                              )}
                            </div>
                          </Td>
                          <Td dataLabel="Current Version">
                            <Content component="small">{op.currentVersion}</Content>
                          </Td>
                          <Td dataLabel="Target Version">
                            <Content component="small">{op.targetVersion}</Content>
                          </Td>
                          <Td dataLabel="Update Plan">
                            <Content component="small">{op.updatePlan}</Content>
                          </Td>
                          <Td dataLabel="Compatibility">
                            <span className="flex items-center gap-[6px] text-[13px] text-[#3e8635] dark:text-[#5ba352]">
                              <CheckCircle className="size-[14px]" />
                              {op.clusterCompatibility}
                            </span>
                          </Td>
                          <Td dataLabel="Actions">
                            <Button component={Link} variant="primary" size="sm" to={`/ecosystem/installed-operators/${op.id}/update`}>
                              Update
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </OcsPrototypeListTable>
              </DataView>
            </div>
          </>
        )}

        {/* Cluster Update Tab */}
        {selectedTab === "cluster" && (
          <>
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px] mb-[24px]">
              <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[20px] text-[#151515] dark:text-white mb-[16px]">
                Cluster Update Status
              </h2>
              <div className="grid grid-cols-2 gap-[24px] mb-[24px]">
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[4px]">Current Version</p>
                  <p className="text-[20px] font-semibold text-[#151515] dark:text-white">
                    {clusterUpdate.currentVersion}
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[4px]">Target Version</p>
                  <p className="text-[20px] font-semibold text-[#0066cc] dark:text-[#4dabf7]">
                    {clusterUpdate.targetVersion}
                  </p>
                </div>
              </div>

              <div className="mb-[24px]">
                <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[4px]">Update Channel</p>
                <p className="text-[14px] text-[#151515] dark:text-white">{clusterUpdate.channel}</p>
              </div>

              {clusterUpdate.blockedByOperators.length > 0 ? (
                <div className="bg-[#fef6e6] dark:bg-[rgba(240,171,0,0.15)] border-l-4 border-[#f0ab00] dark:border-[#f4c145] rounded-[8px] p-[16px] mb-[24px]">
                  <div className="flex items-start gap-[12px]">
                    <AlertTriangle className="size-[20px] text-[#f0ab00] dark:text-[#f4c145] shrink-0 mt-[2px]" />
                    <div>
                      <p className="text-[14px] text-[#151515] dark:text-white font-semibold mb-[4px]">
                        Cluster update blocked
                      </p>
                      <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                        {clusterUpdate.blockedByOperators.length} operator(s) must be updated first
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f3faf2] dark:bg-[rgba(62,134,53,0.15)] border-l-4 border-[#3e8635] dark:border-[#5ba352] rounded-[8px] p-[16px] mb-[24px]">
                  <div className="flex items-start gap-[12px]">
                    <CheckCircle className="size-[20px] text-[#3e8635] dark:text-[#5ba352] shrink-0 mt-[2px]" />
                    <div>
                      <p className="text-[14px] text-[#151515] dark:text-white font-semibold mb-[4px]">
                        Ready to update
                      </p>
                      <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                        All operator dependencies are satisfied
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-[12px]">
                <Link
                  to="/administration/cluster-settings"
                  className="px-[16px] py-[10px] bg-[#0066cc] hover:bg-[#004080] dark:bg-[#4dabf7] dark:hover:bg-[#339af0] text-white rounded-[8px] font-semibold text-[14px] transition-colors"
                >
                  View cluster settings
                </Link>
                {clusterUpdate.blockedByOperators.length > 0 && (
                  <button
                    onClick={() => setSelectedTab("operators")}
                    className="px-[16px] py-[10px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#151515] dark:text-white rounded-[8px] font-semibold text-[14px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                  >
                    Update required operators
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        </Breadcrumbs>
    </div>
  );
}
