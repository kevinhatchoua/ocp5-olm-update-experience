import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Badge,
  Button,
  Checkbox,
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
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { IoDataViewFiltersWithMidActions } from "../dataView/IoDataViewFiltersWithMidActions";
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
} from "../dataView/OcsPrototypeListTable";
import {
  attachVmToNetwork,
  detachVmFromNetwork,
  getAllVirtualMachines,
  getAttachedVmsForNetwork,
  getAvailableVmsForNetwork,
  type AttachedVmRow,
  type NetworkResourceRef,
  type VirtualMachineRecord,
  vmDetailPath,
} from "../../pages/networking/networkingMockData";
import { useToast } from "../../contexts/ToastContext";

type VmFilters = { name: string };
type AddVmFilters = { name: string };
type SortColumn = "name" | "namespace" | "status" | "interface";
type AddVmSortColumn = "name" | "namespace" | "status";

function vmKey(vm: { name: string; namespace: string }) {
  return `${vm.namespace}/${vm.name}`;
}

function rowMatches(row: AttachedVmRow, filters: VmFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.vmName.toLowerCase().includes(q);
}

function sortRows(rows: AttachedVmRow[], column: SortColumn, direction: SortDirection): AttachedVmRow[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.vmName, b.vmName, direction);
      case "namespace":
        return compareStrings(a.vmNamespace, b.vmNamespace, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "interface":
        return compareStrings(a.interfaceName, b.interfaceName, direction);
      default:
        return 0;
    }
  });
}

export function NetworkVirtualMachinesTab({
  networkRef,
  networkName,
  onAttachmentsChange,
}: {
  networkRef: NetworkResourceRef;
  networkName: string;
  onAttachmentsChange?: () => void;
}) {
  const { pushToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AttachedVmRow | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const attached = useMemo(
    () => getAttachedVmsForNetwork(networkRef),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [networkRef, refreshKey]
  );

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<VmFilters>({ filters: { name: "" } });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(() => attached.filter((r) => rowMatches(r, filters)), [attached, filters]);
  const sorted = useMemo(() => sortRows(filtered, sortColumn, sortDirection), [filtered, sortColumn, sortDirection]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  const available = useMemo(
    () => getAvailableVmsForNetwork(networkRef),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [networkRef, refreshKey]
  );

  const bump = () => {
    setRefreshKey((k) => k + 1);
    onAttachmentsChange?.();
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    const { vmName, vmNamespace } = removeTarget;
    detachVmFromNetwork(networkRef, vmName, vmNamespace);
    setRemoveTarget(null);
    bump();
    pushToast({
      variant: "success",
      title: `Removed ${vmName} from ${networkName}`,
    });
  };

  const confirmAdd = () => {
    const added: string[] = [];
    selectedToAdd.forEach((key) => {
      const vm = getAllVirtualMachines().find((v) => vmKey(v) === key);
      if (vm) {
        attachVmToNetwork(networkRef, vm.name, vm.namespace);
        added.push(vm.name);
      }
    });
    setSelectedToAdd(new Set());
    setAddOpen(false);
    bump();
    if (added.length > 0) {
      pushToast({
        variant: "success",
        title:
          added.length === 1
            ? `Attached ${added[0]} to ${networkName}`
            : `Attached ${added.length} virtual machines to ${networkName}`,
      });
    }
  };

  if (attached.length === 0) {
    return (
      <>
        <div className="ocs-nodes-list__table-wrap ocs-networking-empty">
          <Flex
            direction={{ default: "column" }}
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentCenter" }}
            gap={{ default: "gapMd" }}
            className="pf-v6-u-py-3xl"
          >
            <PlusCircleIcon aria-hidden className="ocs-networking-empty__icon" />
            <Content component="h2" className="pf-v6-u-font-weight-bold pf-v6-u-text-align-center">
              No VMs connected
            </Content>
            <Content component="p" className="pf-v6-u-text-align-center ocs-networking-empty__desc">
              Click <strong>Add virtual machines</strong> to connect a virtual machine to this network.
            </Content>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              Add virtual machines
            </Button>
          </Flex>
        </div>
        <AddVirtualMachinesModal
          isOpen={addOpen}
          onClose={() => {
            setAddOpen(false);
            setSelectedToAdd(new Set());
          }}
          vms={available}
          selected={selectedToAdd}
          onToggle={(key) => {
            setSelectedToAdd((prev) => {
              const next = new Set(prev);
              if (next.has(key)) next.delete(key);
              else next.add(key);
              return next;
            });
          }}
          onAdd={confirmAdd}
        />
      </>
    );
  }

  return (
    <>
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
        <div>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            Add virtual machines
          </Button>
        </div>
        <div className="ocs-pods-list__panel">
          <DataView ouiaId="net-vms-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="net-vms-dv-toolbar"
              id="net-vms-dv-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<VmFilters>
                  values={filters}
                  onChange={(_id, partial) => onSetFilters(partial)}
                  breakpoint="xl"
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
                  ouiaId="net-vms-pagination"
                  widgetId="net-vms-pagination"
                  titles={{ items: "virtual machines" }}
                  paginationAriaLabel="Attached virtual machines pagination"
                />
              }
            />
            <OcsPrototypeListTable ariaLabel="Attached virtual machines">
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
                  <Th dataLabel="Interface">
                    <SortableTableHeader
                      label="Interface"
                      column="interface"
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
                  <Tr key={`${row.vmNamespace}/${row.vmName}`}>
                    <Td dataLabel="Name">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <Label color="blue" isCompact className="ocs-resource-label">
                          VM
                        </Label>
                        <Link
                          to={vmDetailPath(row.vmNamespace, row.vmName)}
                          className="pf-v6-c-button pf-m-link pf-m-inline"
                        >
                          {row.vmName}
                        </Link>
                      </Flex>
                    </Td>
                    <Td dataLabel="Namespace">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <Label color="green" isCompact className="ocs-resource-label">
                          NS
                        </Label>
                        <Link to="/administration/namespaces" className="pf-v6-c-button pf-m-link pf-m-inline">
                          {row.vmNamespace}
                        </Link>
                      </Flex>
                    </Td>
                    <Td dataLabel="Status">
                      <Label color="orange" isCompact>
                        {row.status}
                      </Label>
                    </Td>
                    <Td dataLabel="Interface">{row.interfaceName}</Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <Dropdown
                        isOpen={menuOpenFor === row.vmName}
                        onOpenChange={(open) => setMenuOpenFor(open ? row.vmName : null)}
                        onSelect={() => {
                          setMenuOpenFor(null);
                          setRemoveTarget(row);
                        }}
                        popperProps={{ position: "right" }}
                        toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            aria-label={`Actions for ${row.vmName}`}
                            onClick={() => setMenuOpenFor((cur) => (cur === row.vmName ? null : row.vmName))}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                      >
                        <DropdownList>
                          <DropdownItem itemId="remove">Remove from network</DropdownItem>
                        </DropdownList>
                      </Dropdown>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          </DataView>
        </div>
      </Flex>

      <Modal
        variant="small"
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        aria-labelledby="remove-vm-net-title"
      >
        <ModalHeader
          title={
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <ExclamationTriangleIcon className="ocs-net-remove-modal__warn" aria-hidden />
              Remove virtual machine from network?
            </Flex>
          }
          labelId="remove-vm-net-title"
        />
        <ModalBody>
          {removeTarget ? (
            <Content component="p">
              Are you sure you want to remove{" "}
              <Flex
                display={{ default: "inlineFlex" }}
                alignItems={{ default: "alignItemsCenter" }}
                gap={{ default: "gapSm" }}
              >
                <Label color="blue" isCompact className="ocs-resource-label">
                  VM
                </Label>
                <Link
                  to={vmDetailPath(removeTarget.vmNamespace, removeTarget.vmName)}
                  className="pf-v6-c-button pf-m-link pf-m-inline"
                >
                  {removeTarget.vmName}
                </Link>
              </Flex>{" "}
              from <strong>{networkName}</strong>?
            </Content>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={confirmRemove}>
            Remove
          </Button>
          <Button variant="link" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <AddVirtualMachinesModal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setSelectedToAdd(new Set());
        }}
        vms={available}
        selected={selectedToAdd}
        onToggle={(key) => {
          setSelectedToAdd((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
        onAdd={confirmAdd}
      />
    </>
  );
}

function sortAddVmRows(
  rows: VirtualMachineRecord[],
  column: AddVmSortColumn,
  direction: SortDirection
): VirtualMachineRecord[] {
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

function AddVirtualMachinesModal({
  isOpen,
  onClose,
  vms,
  selected,
  onToggle,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  vms: VirtualMachineRecord[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onAdd: () => void;
}) {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<AddVmFilters>({ filters: { name: "" } });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<AddVmSortColumn>("name");

  const filtered = useMemo(() => {
    const q = (filters.name ?? "").trim().toLowerCase();
    return q
      ? vms.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.namespace.toLowerCase().includes(q) ||
            v.status.toLowerCase().includes(q)
        )
      : vms;
  }, [vms, filters]);

  const sorted = useMemo(
    () => sortAddVmRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 10);

  const pageKeys = paginated.map((vm) => vmKey(vm));
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const somePageSelected = pageKeys.some((k) => selected.has(k));

  const togglePage = (checked: boolean) => {
    pageKeys.forEach((key) => {
      if (checked && !selected.has(key)) onToggle(key);
      if (!checked && selected.has(key)) onToggle(key);
    });
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="add-vms-title">
      <ModalHeader
        title="Add virtual machines"
        description="Select virtual machines to connect to this network."
        labelId="add-vms-title"
      />
      <ModalBody className="ocs-add-vms-modal__body">
        <DataView ouiaId="add-vms-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="add-vms-dv-toolbar"
            id="add-vms-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<AddVmFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
                breakpoint="xl"
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
                ouiaId="add-vms-pagination"
                widgetId="add-vms-pagination"
                titles={{ items: "virtual machines" }}
                paginationAriaLabel="Available virtual machines pagination"
              />
            }
          />
          <OcsPrototypeListTable ariaLabel="Available virtual machines">
                <Thead>
                  <Tr>
                    <Th modifier="fitContent" dataLabel="Select">
                      <Checkbox
                        id="add-vms-select-page"
                        aria-label="Select all virtual machines on this page"
                        isChecked={allPageSelected ? true : somePageSelected ? null : false}
                        onChange={(_e, checked) => togglePage(Boolean(checked))}
                      />
                    </Th>
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
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.length === 0 ? (
                    <Tr>
                      <Td colSpan={4} dataLabel="Empty state">
                        <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-md">
                          No virtual machines match your search.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((vm) => {
                      const key = vmKey(vm);
                      return (
                        <Tr key={key}>
                          <Td dataLabel="Select">
                            <Checkbox
                              id={`add-vm-${key}`}
                              aria-label={`Select ${vm.name}`}
                              isChecked={selected.has(key)}
                              onChange={() => onToggle(key)}
                            />
                          </Td>
                          <Td dataLabel="Name">
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Label color="blue" isCompact className="ocs-resource-label">
                                VM
                              </Label>
                              <Link
                                to={vmDetailPath(vm.namespace, vm.name)}
                                className="pf-v6-c-button pf-m-link pf-m-inline"
                              >
                                {vm.name}
                              </Link>
                            </Flex>
                          </Td>
                          <Td dataLabel="Namespace">
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Label color="green" isCompact className="ocs-resource-label">
                                NS
                              </Label>
                              {vm.namespace}
                            </Flex>
                          </Td>
                          <Td dataLabel="Status">
                            <Label color="orange" isCompact>
                              {vm.status}
                            </Label>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </OcsPrototypeListTable>
        </DataView>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={selected.size === 0} onClick={onAdd}>
          Add
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function NetworkVmTabBadge({ count }: { count: number }) {
  return (
    <Badge isRead className="ocs-net-vm-tab-badge">
      {count}
    </Badge>
  );
}
