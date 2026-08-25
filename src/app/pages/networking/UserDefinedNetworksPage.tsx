import { useEffect, useMemo, useState } from "react";
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
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { CreateClusterUdnModal, CreateUdnModal } from "./networkingCreateModals";
import {
  deleteUdn,
  topologyHighlightPath,
  type UdnRecord,
  udnDetailPath,
  udnTopologyHighlightId,
} from "./networkingMockData";
import { useNetworkingResources } from "./useNetworkingResources";

type UdnFilters = { name: string };

type SortColumn = "name" | "namespace" | "topology" | "mtu" | "condition";

interface UdnRow {
  name: string;
  kind: "CUDN" | "UDN";
  namespace: string;
  topology: string;
  mtu: string;
  condition: string;
  record: UdnRecord;
}

function rowMatchesFilters(row: UdnRow, filters: UdnFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortUdnRows(rows: UdnRow[], column: SortColumn, direction: SortDirection): UdnRow[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "topology":
        return compareStrings(a.topology, b.topology, direction);
      case "mtu":
        return compareStrings(a.mtu, b.mtu, direction);
      case "condition":
        return compareStrings(a.condition, b.condition, direction);
      default:
        return 0;
    }
  });
}

function UdnActionsMenu({
  row,
  onRequestDelete,
}: {
  row: UdnRow;
  onRequestDelete: (row: UdnRow) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const detailPath = udnDetailPath(row.record);
  const topologyPath = topologyHighlightPath(udnTopologyHighlightId(row.record));

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
          aria-label={`Actions for ${row.name}`}
          onClick={() => setOpen((v) => !v)}
          icon={<EllipsisVIcon />}
        />
      )}
    >
      <DropdownList>
        <DropdownItem itemId="edit" onClick={() => navigate(detailPath)}>
          Edit
        </DropdownItem>
        <DropdownItem itemId="edit-yaml" onClick={() => navigate(`${detailPath}?tab=yaml`)}>
          Edit YAML
        </DropdownItem>
        <DropdownItem itemId="view-topology" onClick={() => navigate(topologyPath)}>
          View in Topology
        </DropdownItem>
        <DropdownItem itemId="delete" isDanger onClick={() => onRequestDelete(row)}>
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

export default function UserDefinedNetworksPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { udnRecords } = useNetworkingResources();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UdnFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");
  const [createOpen, setCreateOpen] = useState(false);
  const [udnModalOpen, setUdnModalOpen] = useState(false);
  const [cudnModalOpen, setCudnModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UdnRow | null>(null);

  const udnRows = useMemo(
    () =>
      udnRecords.map((u) => ({
        name: u.name,
        kind: u.kind,
        namespace: u.namespace ?? "—",
        topology: u.topology,
        mtu: u.mtu,
        condition: u.condition,
        record: u,
      })),
    [udnRecords]
  );

  const filtered = useMemo(
    () => udnRows.filter((r) => rowMatchesFilters(r, filters)),
    [udnRows, filters]
  );
  const sorted = useMemo(
    () => sortUdnRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { name, record } = pendingDelete;
    const deleted = deleteUdn(name, record.kind === "CUDN" ? undefined : record.namespace);
    setPendingDelete(null);
    if (deleted) {
      pushToast({ variant: "success", title: `${record.kind} ${name} deleted` });
    } else {
      pushToast({ variant: "danger", title: `Could not delete ${record.kind} ${name}` });
    }
  };

  const colSpan = 6;

  return (
    <>
      <NetworkingPageShell
        title="UserDefinedNetworks"
        path="/networking/userdefinednetworks"
        createButton={
          <Dropdown
            isOpen={createOpen}
            onOpenChange={(open) => setCreateOpen(open)}
            toggle={(toggleRef) => (
              <MenuToggle ref={toggleRef} onClick={() => setCreateOpen((o) => !o)} variant="primary">
                Create
              </MenuToggle>
            )}
            popperProps={{ position: "right" }}
          >
            <DropdownList>
              <DropdownItem
                itemId="cudn"
                onClick={() => {
                  setCreateOpen(false);
                  setCudnModalOpen(true);
                }}
              >
                ClusterUserDefinedNetwork
              </DropdownItem>
              <DropdownItem
                itemId="udn"
                onClick={() => {
                  setCreateOpen(false);
                  setUdnModalOpen(true);
                }}
              >
                UserDefinedNetwork
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        }
      >
        <NetworkingTablePanel>
          <DataView ouiaId="udn-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="udn-dv-toolbar"
              id="udn-dv-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<UdnFilters>
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
                  ouiaId="udn-pagination"
                  widgetId="udn-pagination"
                  titles={{ items: "networks" }}
                  paginationAriaLabel="UserDefinedNetworks pagination"
                />
              }
            />
            <OcsPrototypeListTable ariaLabel="UserDefinedNetworks">
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
                  <Th dataLabel="Topology">
                    <SortableTableHeader
                      label="Topology"
                      column="topology"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={toggleSort}
                    />
                  </Th>
                  <Th dataLabel="MTU">
                    <SortableTableHeader
                      label="MTU"
                      column="mtu"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={toggleSort}
                    />
                  </Th>
                  <Th dataLabel="Conditions">
                    <SortableTableHeader
                      label="Conditions"
                      column="condition"
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
                        No user-defined networks match your filters.
                      </Content>
                    </Td>
                  </Tr>
                ) : (
                  paginated.map((row) => (
                    <Tr key={row.name}>
                      <Td dataLabel="Name">
                        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                          <Label color="grey" isCompact className="ocs-resource-label">
                            {row.kind}
                          </Label>
                          <Button variant="link" isInline component={Link} to={udnDetailPath(row.record)}>
                            {row.name}
                          </Button>
                        </Flex>
                      </Td>
                      <Td dataLabel="Namespace">
                        <Content component="small">{row.namespace}</Content>
                      </Td>
                      <Td dataLabel="Topology">
                        <Content component="small">{row.topology}</Content>
                      </Td>
                      <Td dataLabel="MTU">
                        <Content component="small">{row.mtu}</Content>
                      </Td>
                      <Td dataLabel="Conditions">
                        <Label color="grey" isCompact>
                          {row.condition}
                        </Label>
                      </Td>
                      <Td dataLabel="Actions" isActionCell hasAction>
                        <UdnActionsMenu row={row} onRequestDelete={setPendingDelete} />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </DataView>
        </NetworkingTablePanel>

        <CreateUdnModal
          isOpen={udnModalOpen}
          onClose={() => setUdnModalOpen(false)}
          onCreated={(record) => navigate(udnDetailPath(record))}
        />
        <CreateClusterUdnModal
          isOpen={cudnModalOpen}
          onClose={() => setCudnModalOpen(false)}
          onCreated={(record) => navigate(udnDetailPath(record))}
        />
      </NetworkingPageShell>

      <Modal
        variant="small"
        isOpen={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        aria-labelledby="delete-udn-title"
      >
        <ModalHeader
          title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete UserDefinedNetwork?"}
          labelId="delete-udn-title"
        />
        <ModalBody>
          <Content component="p">
            Are you sure you want to delete {pendingDelete?.kind} <strong>{pendingDelete?.name}</strong>? This action
            cannot be undone.
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
