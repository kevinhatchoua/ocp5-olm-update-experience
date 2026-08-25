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
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { CreateNadModal } from "./networkingCreateModals";
import {
  deleteNad,
  nadDetailPath,
  nadTopologyHighlightId,
  topologyHighlightPath,
} from "./networkingMockData";
import { useNetworkingResources } from "./useNetworkingResources";

type NadFilters = { name: string };

type SortColumn = "name" | "namespace" | "type";

interface NadRow {
  name: string;
  namespace: string;
  type: string;
}

function rowMatchesFilters(row: NadRow, filters: NadFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortNadRows(rows: NadRow[], column: SortColumn, direction: SortDirection): NadRow[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "type":
        return compareStrings(a.type, b.type, direction);
      default:
        return 0;
    }
  });
}

function NadActionsMenu({
  row,
  onRequestDelete,
}: {
  row: NadRow;
  onRequestDelete: (row: NadRow) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const detailPath = nadDetailPath(row.namespace, row.name);
  const topologyPath = topologyHighlightPath(nadTopologyHighlightId(row.namespace, row.name));

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

export default function NetworkAttachmentDefinitionsPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { nadRecords } = useNetworkingResources();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<NadRow | null>(null);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NadFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const nadRows = useMemo(
    () =>
      nadRecords.map((n) => ({
        name: n.name,
        namespace: n.namespace,
        type: n.type,
      })),
    [nadRecords]
  );

  const filtered = useMemo(
    () => nadRows.filter((r) => rowMatchesFilters(r, filters)),
    [nadRows, filters]
  );
  const sorted = useMemo(
    () => sortNadRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { name, namespace } = pendingDelete;
    const deleted = deleteNad(namespace, name);
    setPendingDelete(null);
    if (deleted) {
      pushToast({ variant: "success", title: `NetworkAttachmentDefinition ${name} deleted` });
    } else {
      pushToast({ variant: "danger", title: `Could not delete NetworkAttachmentDefinition ${name}` });
    }
  };

  const colSpan = 4;

  return (
    <>
      <NetworkingPageShell
        title="NetworkAttachmentDefinitions"
        path="/networking/networkattachmentdefinitions"
        createLabel="Create NetworkAttachmentDefinition"
        onCreate={() => setCreateOpen(true)}
      >
        <NetworkingTablePanel>
          <DataView ouiaId="nad-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="nad-dv-toolbar"
              id="nad-dv-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<NadFilters>
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
                  ouiaId="nad-pagination"
                  widgetId="nad-pagination"
                  titles={{ items: "definitions" }}
                  paginationAriaLabel="NetworkAttachmentDefinitions pagination"
                />
              }
            />
            <OcsPrototypeListTable ariaLabel="NetworkAttachmentDefinitions">
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
                  <Th dataLabel="Type">
                    <SortableTableHeader
                      label="Type"
                      column="type"
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
                        No network attachment definitions match your filters.
                      </Content>
                    </Td>
                  </Tr>
                ) : (
                  paginated.map((row) => (
                    <Tr key={`${row.namespace}/${row.name}`}>
                      <Td dataLabel="Name">
                        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                          <Label color="blue" isCompact className="ocs-resource-label">
                            NAD
                          </Label>
                          <Button variant="link" isInline component={Link} to={nadDetailPath(row.namespace, row.name)}>
                            {row.name}
                          </Button>
                        </Flex>
                      </Td>
                      <Td dataLabel="Namespace">
                        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                          <Label color="green" isCompact className="ocs-resource-label">
                            NS
                          </Label>
                          <Button variant="link" isInline>
                            {row.namespace}
                          </Button>
                        </Flex>
                      </Td>
                      <Td dataLabel="Type">
                        <Content component="small">{row.type}</Content>
                      </Td>
                      <Td dataLabel="Actions" isActionCell hasAction>
                        <NadActionsMenu row={row} onRequestDelete={setPendingDelete} />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </DataView>
        </NetworkingTablePanel>
      </NetworkingPageShell>
      <CreateNadModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(record) => navigate(nadDetailPath(record.namespace, record.name))}
      />
      <Modal
        variant="small"
        isOpen={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        aria-labelledby="delete-nad-title"
      >
        <ModalHeader
          title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete NetworkAttachmentDefinition?"}
          labelId="delete-nad-title"
        />
        <ModalBody>
          <Content component="p">
            Are you sure you want to delete NetworkAttachmentDefinition <strong>{pendingDelete?.name}</strong> in{" "}
            <strong>{pendingDelete?.namespace}</strong>? This action cannot be undone.
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
