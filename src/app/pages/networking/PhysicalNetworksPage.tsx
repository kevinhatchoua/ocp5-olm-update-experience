import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
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
import { useToast } from "../../contexts/ToastContext";
import {
  deletePhysicalNetwork,
  nncpListPath,
  physicalNetworkTopologyPath,
  type PhysicalNetwork,
} from "./networkingMockData";
import { NetworkingEmptyState, NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { useNetworkingResources } from "./useNetworkingResources";

const NNCP_CREATE_PATH = "/networking/nodenetworkconfigurationpolicy?create=1";

type PhysicalFilters = { name: string };

type SortColumn = "name" | "type" | "status";

function statusLabelColor(status: PhysicalNetwork["status"]): "green" | "orange" | "red" {
  switch (status) {
    case "configured":
      return "green";
    case "pending":
      return "orange";
    case "failed":
      return "red";
    default:
      return "orange";
  }
}

function typeLabel(type: PhysicalNetwork["type"]): string {
  switch (type) {
    case "bridge":
      return "Bridge";
    case "bond":
      return "Bond";
    case "vlan":
      return "VLAN";
    case "interface":
      return "Interface";
    default:
      return type;
  }
}

function rowMatchesFilters(row: PhysicalNetwork, filters: PhysicalFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortPhysicalRows(
  rows: PhysicalNetwork[],
  column: SortColumn,
  direction: SortDirection
): PhysicalNetwork[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "type":
        return compareStrings(a.type, b.type, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      default:
        return 0;
    }
  });
}

function PhysicalNetworkActionsMenu({
  network,
  onRequestDelete,
}: {
  network: PhysicalNetwork;
  onRequestDelete: (network: PhysicalNetwork) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      onSelect={() => setOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={`Actions for ${network.name}`}
          onClick={() => setOpen((value) => !value)}
          icon={<EllipsisVIcon />}
        />
      )}
    >
      <DropdownList>
        <DropdownItem
          itemId="edit"
          onClick={() => {
            if (network.nncpName) {
              navigate(nncpListPath(network.nncpName));
            } else {
              navigate(physicalNetworkTopologyPath(network.bridgeName ?? network.name));
            }
          }}
        >
          Edit
        </DropdownItem>
        <DropdownItem
          itemId="view-topology"
          onClick={() => navigate(physicalNetworkTopologyPath(network.bridgeName ?? network.name))}
        >
          View in Topology
        </DropdownItem>
        <DropdownItem itemId="delete" isDanger onClick={() => onRequestDelete(network)}>
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

export default function PhysicalNetworksPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { physicalNetworks } = useNetworkingResources();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<PhysicalFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");
  const [pendingDelete, setPendingDelete] = useState<PhysicalNetwork | null>(null);

  const filtered = useMemo(
    () => physicalNetworks.filter((r) => rowMatchesFilters(r, filters)),
    [physicalNetworks, filters]
  );
  const sorted = useMemo(
    () => sortPhysicalRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  const colSpan = 6;
  const isEmpty = physicalNetworks.length === 0;

  const goCreateViaNncp = () => navigate(NNCP_CREATE_PATH);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const name = pendingDelete.name;
    const deleted = deletePhysicalNetwork(name);
    setPendingDelete(null);
    if (deleted) {
      pushToast({ variant: "success", title: `Physical network ${name} deleted` });
    } else {
      pushToast({ variant: "danger", title: `Could not delete physical network ${name}` });
    }
  };

  return (
    <>
      <NetworkingPageShell
        title="Physical networks"
        path="/networking/physical-networks"
        createLabel="Create via NNCP"
        onCreate={goCreateViaNncp}
      >
        {isEmpty ? (
          <NetworkingEmptyState
            title="No physical networks defined yet"
            description="A physical network establishes a specific network configuration on cluster nodes. Create one by defining a NodeNetworkConfigurationPolicy."
            createLabel="Create via NNCP"
            onCreate={goCreateViaNncp}
          />
        ) : (
          <NetworkingTablePanel>
            <DataView ouiaId="physical-networks-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="physical-networks-dv-toolbar"
                id="physical-networks-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<PhysicalFilters>
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
                    ouiaId="physical-networks-pagination"
                    widgetId="physical-networks-pagination"
                    titles={{ items: "networks" }}
                    paginationAriaLabel="Physical networks pagination"
                  />
                }
              />
              <OcsPrototypeListTable ariaLabel="Physical networks">
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
                    <Th dataLabel="Type">
                      <SortableTableHeader
                        label="Type"
                        column="type"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Worker nodes">
                      <PlainTableHeader label="Worker nodes" />
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
                    <Th dataLabel="NNCP">
                      <PlainTableHeader label="NNCP" />
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
                          No physical networks match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((row) => (
                      <Tr key={row.name}>
                        <Td dataLabel="Name">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Label color="teal" isCompact className="ocs-resource-label">
                              PN
                            </Label>
                            <Link
                              to={physicalNetworkTopologyPath(row.bridgeName ?? row.name)}
                              className="pf-v6-c-button pf-m-link pf-m-inline"
                            >
                              {row.name}
                            </Link>
                          </Flex>
                        </Td>
                        <Td dataLabel="Type">
                          <Content component="small">
                            {typeLabel(row.type)}
                            {row.type === "vlan" && row.vlanId != null ? ` ${row.vlanId}` : null}
                          </Content>
                        </Td>
                        <Td dataLabel="Worker nodes">
                          <Content component="small">
                            {row.workerNodes.length > 0 ? row.workerNodes.join(", ") : "—"}
                          </Content>
                        </Td>
                        <Td dataLabel="Status">
                          <Label color={statusLabelColor(row.status)} isCompact>
                            {row.status}
                          </Label>
                        </Td>
                        <Td dataLabel="NNCP">
                          {row.nncpName ? (
                            <Link
                              to={nncpListPath(row.nncpName)}
                              className="pf-v6-c-button pf-m-link pf-m-inline"
                            >
                              {row.nncpName}
                            </Link>
                          ) : (
                            <Content component="small">—</Content>
                          )}
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <PhysicalNetworkActionsMenu network={row} onRequestDelete={setPendingDelete} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </OcsPrototypeListTable>
            </DataView>
          </NetworkingTablePanel>
        )}
      </NetworkingPageShell>

      <Modal
        variant="small"
        isOpen={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        aria-labelledby="delete-physical-network-title"
      >
        <ModalHeader
          title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete physical network?"}
          labelId="delete-physical-network-title"
        />
        <ModalBody>
          <Content component="p">
            Deleting <strong>{pendingDelete?.name}</strong> removes it from this list. Node configuration applied by
            an NNCP may remain until the policy is updated or deleted.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
