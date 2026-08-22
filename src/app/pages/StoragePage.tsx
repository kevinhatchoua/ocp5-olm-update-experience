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
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../components/Breadcrumbs";
import FavoriteButton from "../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../components/dataView/IoDataViewFiltersWithMidActions";
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
} from "../components/dataView/OcsPrototypeListTable";

interface StorageResource {
  name: string;
  namespace?: string;
  type: "PersistentVolume" | "PersistentVolumeClaim" | "StorageClass";
  status: "Bound" | "Available" | "Released" | "Pending" | "Failed";
  capacity?: string;
  accessMode?: string;
  storageClass?: string;
  volumeMode?: string;
  reclaim?: string;
  provisioner?: string;
  age: string;
}

type StorageFilters = {
  name: string;
  namespace: string;
  type: string[];
};

type SortColumn = "name" | "namespace" | "type" | "status" | "capacity" | "storageClass" | "age";

const RESOURCES: StorageResource[] = [
  { name: "pv-postgres-data-0", type: "PersistentVolume", status: "Bound", capacity: "100Gi", accessMode: "RWO", storageClass: "gp3-encrypted", reclaim: "Retain", age: "89d" },
  { name: "pv-postgres-data-1", type: "PersistentVolume", status: "Bound", capacity: "100Gi", accessMode: "RWO", storageClass: "gp3-encrypted", reclaim: "Retain", age: "89d" },
  { name: "pv-elasticsearch-0", type: "PersistentVolume", status: "Bound", capacity: "500Gi", accessMode: "RWO", storageClass: "gp3-standard", reclaim: "Delete", age: "156d" },
  { name: "pv-elasticsearch-1", type: "PersistentVolume", status: "Bound", capacity: "500Gi", accessMode: "RWO", storageClass: "gp3-standard", reclaim: "Delete", age: "156d" },
  { name: "pv-prometheus-data", type: "PersistentVolume", status: "Bound", capacity: "250Gi", accessMode: "RWO", storageClass: "gp3-standard", reclaim: "Retain", age: "67d" },
  { name: "pv-backup-storage", type: "PersistentVolume", status: "Available", capacity: "1Ti", accessMode: "RWX", storageClass: "efs-standard", reclaim: "Retain", age: "120d" },
  { name: "pv-shared-assets", type: "PersistentVolume", status: "Bound", capacity: "200Gi", accessMode: "RWX", storageClass: "efs-standard", reclaim: "Delete", age: "45d" },
  { name: "pv-redis-data", type: "PersistentVolume", status: "Bound", capacity: "50Gi", accessMode: "RWO", storageClass: "gp3-standard", reclaim: "Delete", age: "45d" },
  { name: "postgres-data-0", namespace: "production", type: "PersistentVolumeClaim", status: "Bound", capacity: "100Gi", accessMode: "RWO", storageClass: "gp3-encrypted", volumeMode: "Filesystem", age: "89d" },
  { name: "postgres-data-1", namespace: "production", type: "PersistentVolumeClaim", status: "Bound", capacity: "100Gi", accessMode: "RWO", storageClass: "gp3-encrypted", volumeMode: "Filesystem", age: "89d" },
  { name: "elasticsearch-data-0", namespace: "logging", type: "PersistentVolumeClaim", status: "Bound", capacity: "500Gi", accessMode: "RWO", storageClass: "gp3-standard", volumeMode: "Filesystem", age: "156d" },
  { name: "elasticsearch-data-1", namespace: "logging", type: "PersistentVolumeClaim", status: "Bound", capacity: "500Gi", accessMode: "RWO", storageClass: "gp3-standard", volumeMode: "Filesystem", age: "156d" },
  { name: "prometheus-data", namespace: "monitoring", type: "PersistentVolumeClaim", status: "Bound", capacity: "250Gi", accessMode: "RWO", storageClass: "gp3-standard", volumeMode: "Filesystem", age: "67d" },
  { name: "shared-assets", namespace: "production", type: "PersistentVolumeClaim", status: "Bound", capacity: "200Gi", accessMode: "RWX", storageClass: "efs-standard", volumeMode: "Filesystem", age: "45d" },
  { name: "redis-data", namespace: "production", type: "PersistentVolumeClaim", status: "Bound", capacity: "50Gi", accessMode: "RWO", storageClass: "gp3-standard", volumeMode: "Filesystem", age: "45d" },
  { name: "temp-storage", namespace: "development", type: "PersistentVolumeClaim", status: "Pending", capacity: "10Gi", accessMode: "RWO", storageClass: "gp3-standard", volumeMode: "Filesystem", age: "5m" },
  { name: "gp3-encrypted", type: "StorageClass", status: "Available", provisioner: "ebs.csi.aws.com", reclaim: "Retain", age: "234d" },
  { name: "gp3-standard", type: "StorageClass", status: "Available", provisioner: "ebs.csi.aws.com", reclaim: "Delete", age: "234d" },
  { name: "efs-standard", type: "StorageClass", status: "Available", provisioner: "efs.csi.aws.com", reclaim: "Delete", age: "234d" },
  { name: "io2-high-performance", type: "StorageClass", status: "Available", provisioner: "ebs.csi.aws.com", reclaim: "Delete", age: "234d" },
];

const TYPE_OPTIONS = [
  { value: "PersistentVolume", label: "PersistentVolume" },
  { value: "PersistentVolumeClaim", label: "PersistentVolumeClaim" },
  { value: "StorageClass", label: "StorageClass" },
];

function StorageStatusCell({ status }: { status: StorageResource["status"] }) {
  switch (status) {
    case "Bound":
    case "Available":
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
    case "Pending":
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
    case "Failed":
    case "Released":
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

function rowMatchesFilters(row: StorageResource, filters: StorageFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && row.namespace && !row.namespace.toLowerCase().includes(nsQ)) return false;
  if (filters.type.length > 0 && !filters.type.includes(row.type)) return false;
  return true;
}

function sortResources(rows: StorageResource[], column: SortColumn, direction: SortDirection): StorageResource[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace ?? "", b.namespace ?? "", direction);
      case "type":
        return compareStrings(a.type, b.type, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "capacity":
        return compareStrings(a.capacity ?? "", b.capacity ?? "", direction);
      case "storageClass":
        return compareStrings(a.storageClass ?? a.provisioner ?? "", b.storageClass ?? b.provisioner ?? "", direction);
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function StoragePage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<StorageFilters>({
    filters: { name: "", namespace: "", type: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(
    () => RESOURCES.filter((row) => rowMatchesFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortResources(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, filters.type, perPage, setPage]);

  const colSpan = 8;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Storage", path: "/storage" },
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
                Storage
              </Title>
              <FavoriteButton name="Storage" path="/storage" />
            </Flex>
            <Button variant="primary" icon={<CubesIcon />}>
              Create Volume
            </Button>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="storage-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="storage-dv-toolbar"
                id="storage-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<StorageFilters>
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
                    <DataViewCheckboxFilter title="Type" filterId="type" options={TYPE_OPTIONS} />
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
                    ouiaId="storage-pagination"
                    widgetId="storage-pagination"
                    titles={{ items: "resources" }}
                    paginationAriaLabel="Storage pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Storage">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Namespace">
                      <SortableTableHeader label="Namespace" column="namespace" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Type">
                      <SortableTableHeader label="Type" column="type" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Status">
                      <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Capacity">
                      <SortableTableHeader label="Capacity" column="capacity" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Storage class">
                      <SortableTableHeader label="Storage class" column="storageClass" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No storage resources match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((resource) => (
                      <Tr key={`${resource.type}/${resource.namespace ?? ""}/${resource.name}`}>
                        <Td dataLabel="Name">
                          <Button variant="link" isInline>
                            {resource.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Content component="small">{resource.namespace ?? "—"}</Content>
                        </Td>
                        <Td dataLabel="Type">
                          <Content component="small">
                            {resource.type === "PersistentVolume"
                              ? "PV"
                              : resource.type === "PersistentVolumeClaim"
                                ? "PVC"
                                : "SC"}
                          </Content>
                        </Td>
                        <Td dataLabel="Status">
                          <StorageStatusCell status={resource.status} />
                        </Td>
                        <Td dataLabel="Capacity">
                          <Content component="small">{resource.capacity ?? "—"}</Content>
                        </Td>
                        <Td dataLabel="Storage class">
                          <Content component="small">{resource.storageClass ?? resource.provisioner ?? "—"}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Content component="small">{resource.age}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${resource.name}`} icon={<EllipsisVIcon />} />
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
