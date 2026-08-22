import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  MenuToggle,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewCheckboxFilter,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsNamedResourceDataView,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../../components/dataView/OcsPrototypeListTable";
import { NetworkingTablePanel } from "./networkingShared";
import {
  nodeNetworkStateRowsFromGroups,
  type NodeNetworkInterfaceType,
  type NodeNetworkStateRow,
} from "./nodeNetworkStateMockData";
import type { WorkerNodeGroup } from "./networkTopologyData";
import type { ResourceLifecycleAction, ResourceLifecycleTarget } from "./networkTopologyState";
import TopologyResourceActionsMenu from "./TopologyResourceActionsMenu";

const INTERFACE_TYPE_LABELS: Record<NodeNetworkInterfaceType, string> = {
  ethernet: "ethernet",
  "ovs-bridge": "ovs-bridge",
  "ovs-interface": "ovs-interface",
  tunnel: "tunnel",
  unknown: "unknown",
};

const INTERFACE_TYPE_FILTER_OPTIONS = (
  Object.keys(INTERFACE_TYPE_LABELS) as NodeNetworkInterfaceType[]
).map((value) => ({
  value,
  label: INTERFACE_TYPE_LABELS[value],
}));

type NnsListFilters = {
  name: string;
  interface: string;
  interfaceType: string[];
};

type SortColumn = "name";

export type TableResourceConnection = {
  peerId: string;
  peerLabel: string;
  direction: "in" | "out";
};

type NodeNetworkTableListProps = {
  groups: WorkerNodeGroup[];
  selectedGroupId?: string | null;
  selectedResourceId?: string | null;
  onSelectWorkerGroup: (group: WorkerNodeGroup) => void;
  onSelectResource: (group: WorkerNodeGroup, resourceId: string) => void;
  onSelectPeer: (peerId: string) => void;
  getResourceConnections: (groupId: string, resourceId: string) => TableResourceConnection[];
  onResourceLifecycleAction?: (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => void;
  onNotice?: (notice: { title: string; variant: "success" | "warning" | "info" }) => void;
  onResourceDeleted?: (resourceId: string) => void;
};

function groupInterfaceList(interfaces: NodeNetworkStateRow["interfaces"]) {
  const buckets = new Map<NodeNetworkInterfaceType, NodeNetworkStateRow["interfaces"]>();
  interfaces.forEach((iface) => {
    const list = buckets.get(iface.type) ?? [];
    list.push(iface);
    buckets.set(iface.type, list);
  });
  return buckets;
}

function NodeInterfacesExpandTable({
  hostname,
  interfaces,
  children,
}: {
  hostname: string;
  interfaces: NodeNetworkStateRow["interfaces"];
  children: (rows: NodeNetworkStateRow["interfaces"]) => ReactNode;
}) {
  return (
    <OcsNamedResourceDataView
      ouiaId={`nns-interfaces-${hostname}`}
      ariaLabel={`Interfaces for ${hostname}`}
      itemsLabel="interfaces"
      items={interfaces}
      getName={(iface) => iface.name}
    >
      {children}
    </OcsNamedResourceDataView>
  );
}

function rowMatchesFilters(row: NodeNetworkStateRow, filters: NnsListFilters): boolean {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  if (nameQuery) {
    const nameMatch =
      row.hostname.toLowerCase().includes(nameQuery) || row.shortName.toLowerCase().includes(nameQuery);
    if (!nameMatch) return false;
  }

  const interfaceQuery = (filters.interface ?? "").trim().toLowerCase();
  if (interfaceQuery) {
    const interfaceMatch = row.interfaces.some((iface) => iface.name.toLowerCase().includes(interfaceQuery));
    if (!interfaceMatch) return false;
  }

  const typeFilter = filters.interfaceType ?? [];
  if (typeFilter.length > 0) {
    const typeMatch = row.interfaces.some((iface) => typeFilter.includes(iface.type));
    if (!typeMatch) return false;
  }

  return true;
}

function sortNodeRows(rows: NodeNetworkStateRow[], column: SortColumn, direction: SortDirection) {
  return [...rows].sort((a, b) => {
    if (column === "name") return compareStrings(a.hostname, b.hostname, direction);
    return 0;
  });
}

function groupById(groups: WorkerNodeGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

export default function NodeNetworkTableList({
  groups,
  selectedGroupId,
  selectedResourceId,
  onSelectWorkerGroup,
  onSelectResource,
  onSelectPeer,
  getResourceConnections,
  onResourceLifecycleAction,
  onNotice,
  onResourceDeleted,
}: NodeNetworkTableListProps) {
  const navigate = useNavigate();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NnsListFilters>({
    filters: { name: "", interface: "", interfaceType: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set());
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const allRows = useMemo(() => nodeNetworkStateRowsFromGroups(groups), [groups]);
  const filtered = useMemo(
    () => allRows.filter((row) => rowMatchesFilters(row, filters)),
    [allRows, filters]
  );
  const sorted = useMemo(
    () => sortNodeRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 10);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.interface, filters.interfaceType, perPage, setPage]);

  useEffect(() => {
    if (!selectedResourceId) return;
    const row = allRows.find((entry) => entry.interfaces.some((iface) => iface.id === selectedResourceId));
    if (!row) return;
    setExpandedNodeIds((prev) => {
      if (prev.has(row.id)) return prev;
      const next = new Set(prev);
      next.add(row.id);
      return next;
    });
  }, [selectedResourceId, allRows]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const colSpan = 4;

  return (
    <NetworkingTablePanel>
      <DataView ouiaId="node-network-state-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
        <DataViewToolbar
          ouiaId="node-network-state-dv-toolbar"
          id="node-network-state-dv-toolbar"
          className={OCS_PROTOTYPE_TOOLBAR_CLASS}
          clearAllFilters={clearAllFilters}
          collapseListedFiltersBreakpoint="xl"
          filters={
            <IoDataViewFiltersWithMidActions<NnsListFilters>
              values={filters}
              onChange={(_id, partial) => onSetFilters(partial)}
              breakpoint="xl"
              midContent={null}
            >
              <DataViewTextFilter
                title="Name"
                filterId="name"
                placeholder="Search by name..."
                style={{ minWidth: "16rem", maxWidth: "100%" }}
              />
              <DataViewTextFilter
                title="Network interface"
                filterId="interface"
                placeholder="Search interfaces..."
                style={{ minWidth: "14rem", maxWidth: "100%" }}
              />
              <DataViewCheckboxFilter
                title="Interface type"
                filterId="interfaceType"
                placeholder="Choose interface types"
                showIcon
                showBadge
                options={INTERFACE_TYPE_FILTER_OPTIONS}
              />
            </IoDataViewFiltersWithMidActions>
          }
          pagination={
            <Pagination
              perPageOptions={[
                { title: "5", value: 5 },
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
              ouiaId="node-network-state-pagination"
              widgetId="node-network-state-pagination"
              titles={{ items: "nodes" }}
              paginationAriaLabel="Node network state pagination"
            />
          }
        />
        <OcsPrototypeListTable ariaLabel="NodeNetworkState">
          <Thead>
            <Tr>
              <Th modifier="fitContent" screenReaderText="Expand row" />
              <Th dataLabel="Name">
                <SortableTableHeader
                  label="Name"
                  column="name"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </Th>
              <Th dataLabel="Network interface">
                <PlainTableHeader label="Network interface" />
              </Th>
              <Th modifier="fitContent" screenReaderText="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {paginated.length === 0 ? (
              <Tr>
                <Td colSpan={colSpan} dataLabel="Empty state">
                  <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                    No nodes match your search or filters.
                  </Content>
                </Td>
              </Tr>
            ) : (
              paginated.map((row) => {
                const group = groupById(groups, row.id);
                const isExpanded = expandedNodeIds.has(row.id);
                const isGroupSelected = selectedGroupId === row.id;
                const nodeMenuKey = `node-${row.id}`;
                return (
                  <Fragment key={row.id}>
                    <Tr className={isGroupSelected ? "ocs-node-network-table__row--selected" : undefined}>
                      <Td modifier="fitContent">
                        <Button
                          variant="plain"
                          aria-label={isExpanded ? `Collapse ${row.hostname}` : `Expand ${row.hostname}`}
                          aria-expanded={isExpanded}
                          onClick={() => toggleNode(row.id)}
                          icon={isExpanded ? <AngleDownIcon aria-hidden /> : <AngleRightIcon aria-hidden />}
                        />
                      </Td>
                      <Td dataLabel="Name">
                        <Button
                          variant="link"
                          isInline
                          className="ocs-node-network-table__resource-link"
                          onClick={() => group && onSelectWorkerGroup(group)}
                        >
                          {row.hostname}
                        </Button>
                      </Td>
                      <Td dataLabel="Network interface">
                        Network details {row.interfaceCount} interfaces
                      </Td>
                      <Td isActionCell hasAction modifier="fitContent">
                        <Dropdown
                          isOpen={openMenuKey === nodeMenuKey}
                          onOpenChange={(open) => setOpenMenuKey(open ? nodeMenuKey : null)}
                          onSelect={() => setOpenMenuKey(null)}
                          popperProps={{ position: "right" }}
                          toggle={(toggleRef) => (
                            <MenuToggle
                              ref={toggleRef}
                              variant="plain"
                              aria-label={`Actions for ${row.hostname}`}
                              onClick={() => setOpenMenuKey((cur) => (cur === nodeMenuKey ? null : nodeMenuKey))}
                            >
                              <EllipsisVIcon aria-hidden />
                            </MenuToggle>
                          )}
                        >
                          <DropdownList aria-label={`Actions for ${row.hostname}`}>
                            <DropdownItem
                              itemId="open-panel"
                              onClick={() => group && onSelectWorkerGroup(group)}
                            >
                              View details
                            </DropdownItem>
                            <DropdownItem
                              itemId="view-node"
                              icon={<ExternalLinkAltIcon aria-hidden />}
                              onClick={() =>
                                navigate(`/compute/nodes/${encodeURIComponent(row.hostname)}`)
                              }
                            >
                              View node details
                            </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      </Td>
                    </Tr>
                    {isExpanded ? (
                      <Tr isExpanded>
                        <Td />
                        <Td colSpan={3} className="ocs-node-network-table__details-cell">
                          <NodeInterfacesExpandTable hostname={row.hostname} interfaces={row.interfaces}>
                            {(ifaceRows) => {
                              const groupedIfaces = groupInterfaceList(ifaceRows);
                              return (
                                <>
                            <Thead>
                              <Tr>
                                <Th>Name</Th>
                                <Th>Links</Th>
                                <Th>IP address</Th>
                                <Th>Ports</Th>
                                <Th>MAC address</Th>
                                <Th>LLDP</Th>
                                <Th>MTU</Th>
                                <Th modifier="fitContent" screenReaderText="Actions" />
                              </Tr>
                            </Thead>
                            <Tbody>
                              {[...groupedIfaces.entries()].map(([type, interfaces]) => (
                                <Fragment key={`${row.id}-${type}`}>
                                  <Tr className="ocs-node-network-table__type-row">
                                    <Td colSpan={8}>
                                      {INTERFACE_TYPE_LABELS[type]} ({interfaces.length})
                                    </Td>
                                  </Tr>
                                  {interfaces.map((iface) => {
                                    const connections = getResourceConnections(row.id, iface.id);
                                    const isResourceSelected = selectedResourceId === iface.id;
                                    const resourceMenuKey = `resource-${iface.id}`;
                                    const resource = group?.resources.find((entry) => entry.id === iface.id);
                                    const lifecycleTarget: ResourceLifecycleTarget | null = resource
                                      ? {
                                          resourceId: resource.id,
                                          placement: "group",
                                          groupId: row.id,
                                          label: resource.label,
                                        }
                                      : null;
                                    return (
                                      <Tr
                                        key={iface.id}
                                        className={
                                          isResourceSelected ? "ocs-node-network-table__row--selected" : undefined
                                        }
                                      >
                                        <Td dataLabel="Name">
                                          <Button
                                            variant="link"
                                            isInline
                                            className="ocs-node-network-table__resource-link"
                                            onClick={() => group && onSelectResource(group, iface.id)}
                                          >
                                            {iface.name}
                                          </Button>
                                        </Td>
                                        <Td dataLabel="Links">
                                          {connections.length === 0 ? (
                                            "—"
                                          ) : (
                                            <Flex
                                              gap={{ default: "gapXs" }}
                                              flexWrap={{ default: "wrap" }}
                                              className="ocs-node-network-table__links"
                                            >
                                              {connections.map((connection) => (
                                                <Button
                                                  key={`${iface.id}-${connection.peerId}-${connection.direction}`}
                                                  variant="link"
                                                  isInline
                                                  className="ocs-node-network-table__resource-link"
                                                  onClick={() => onSelectPeer(connection.peerId)}
                                                >
                                                  {connection.direction === "out" ? "→" : "←"} {connection.peerLabel}
                                                </Button>
                                              ))}
                                            </Flex>
                                          )}
                                        </Td>
                                        <Td dataLabel="IP address">{iface.ipAddress}</Td>
                                        <Td dataLabel="Ports">{iface.ports}</Td>
                                        <Td dataLabel="MAC address">{iface.macAddress}</Td>
                                        <Td dataLabel="LLDP">{iface.lldp}</Td>
                                        <Td dataLabel="MTU">{iface.mtu}</Td>
                                        <Td isActionCell hasAction modifier="fitContent">
                                          {lifecycleTarget ? (
                                            <TopologyResourceActionsMenu
                                              label={lifecycleTarget.label}
                                              lifecycleTarget={lifecycleTarget}
                                              onResourceLifecycleAction={onResourceLifecycleAction}
                                              onNotice={onNotice}
                                              onDeleted={() => onResourceDeleted?.(lifecycleTarget.resourceId)}
                                              isOpen={openMenuKey === resourceMenuKey}
                                              onOpenChange={(open) =>
                                                setOpenMenuKey(open ? resourceMenuKey : null)
                                              }
                                            />
                                          ) : null}
                                        </Td>
                                      </Tr>
                                    );
                                  })}
                                </Fragment>
                              ))}
                            </Tbody>
                                </>
                              );
                            }}
                          </NodeInterfacesExpandTable>
                        </Td>
                      </Tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </Tbody>
        </OcsPrototypeListTable>
      </DataView>
    </NetworkingTablePanel>
  );
}
