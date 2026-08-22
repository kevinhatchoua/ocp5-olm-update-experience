import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
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
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
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
import { COMPUTE_NODES_LIST } from "./compute/nodeDetailData";

type NodeStatus = (typeof COMPUTE_NODES_LIST)[number]["status"];

type NodeFilters = {
  name: string;
  role: string;
};

type SortColumn = "name" | "status" | "role" | "kubelet" | "cpu" | "memory" | "pods" | "age";

function nodeDetailPath(nodeName: string) {
  return `/compute/nodes/${encodeURIComponent(nodeName)}`;
}

function NodeStatusCell({ status }: { status: NodeStatus }) {
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      <Icon status="success" aria-hidden>
        <CheckCircleIcon />
      </Icon>
      <Content component="small">{status}</Content>
    </Flex>
  );
}

function rowMatchesFilters(
  row: (typeof COMPUTE_NODES_LIST)[number],
  filters: NodeFilters
): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const roleQ = (filters.role ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (roleQ && !row.role.toLowerCase().includes(roleQ)) return false;
  return true;
}

function sortNodes(
  rows: typeof COMPUTE_NODES_LIST,
  column: SortColumn,
  direction: SortDirection
): typeof COMPUTE_NODES_LIST {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "role":
        return compareStrings(a.role, b.role, direction);
      case "kubelet":
        return compareStrings(a.kubelet, b.kubelet, direction);
      case "cpu":
        return compareStrings(a.cpu, b.cpu, direction);
      case "memory":
        return compareStrings(a.memory, b.memory, direction);
      case "pods":
        return compareStrings(a.pods, b.pods, direction);
      case "age":
        return compareStrings(a.age, b.age, direction);
      default:
        return 0;
    }
  });
}

export default function ComputePage() {
  const navigate = useNavigate();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NodeFilters>({
    filters: { name: "", role: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredNodes = useMemo(
    () => COMPUTE_NODES_LIST.filter((node) => rowMatchesFilters(node, filters)),
    [filters]
  );
  const sortedNodes = useMemo(
    () => sortNodes(filteredNodes, sortColumn, sortDirection),
    [filteredNodes, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedNodes, [filters], 50);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.role, perPage, setPage]);

  const colSpan = 9;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Compute", path: "/compute" },
          { label: "Nodes", path: "/compute" },
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
                Nodes
              </Title>
              <FavoriteButton name="Nodes" path="/compute" />
            </Flex>
          </Flex>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="nodes-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="nodes-dv-toolbar"
                id="nodes-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<NodeFilters>
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
                      title="Role"
                      filterId="role"
                      placeholder="Filter by role..."
                      style={{ minWidth: "14rem", maxWidth: "100%" }}
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
                    ouiaId="nodes-pagination"
                    widgetId="nodes-pagination"
                    titles={{ items: "nodes" }}
                    paginationAriaLabel="Nodes pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Nodes">
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
                    <Th dataLabel="Status">
                      <SortableTableHeader
                        label="Status"
                        column="status"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Role">
                      <SortableTableHeader
                        label="Role"
                        column="role"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Kubelet version">
                      <SortableTableHeader
                        label="Kubelet version"
                        column="kubelet"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="CPU">
                      <SortableTableHeader
                        label="CPU"
                        column="cpu"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Memory">
                      <SortableTableHeader
                        label="Memory"
                        column="memory"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Pods">
                      <SortableTableHeader
                        label="Pods"
                        column="pods"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Age">
                      <SortableTableHeader
                        label="Age"
                        column="age"
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
                          No nodes match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((node) => (
                      <Tr key={node.name} onClick={() => navigate(nodeDetailPath(node.name))}>
                        <Td dataLabel="Name">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Label color="blue" isCompact className="ocs-resource-label">
                              N
                            </Label>
                            <Button
                              variant="link"
                              isInline
                              component={Link}
                              to={nodeDetailPath(node.name)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {node.name}
                            </Button>
                          </Flex>
                        </Td>
                        <Td dataLabel="Status">
                          <NodeStatusCell status={node.status} />
                        </Td>
                        <Td dataLabel="Role">
                          <Content component="small">{node.role}</Content>
                        </Td>
                        <Td dataLabel="Kubelet version">
                          <Content component="small">{node.kubelet}</Content>
                        </Td>
                        <Td dataLabel="CPU">
                          <Content component="small">{node.cpu}</Content>
                        </Td>
                        <Td dataLabel="Memory">
                          <Content component="small">{node.memory}</Content>
                        </Td>
                        <Td dataLabel="Pods">
                          <Content component="small">{node.pods}</Content>
                        </Td>
                        <Td dataLabel="Age">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <OutlinedClockIcon aria-hidden className="ocs-pods-list__created-icon" />
                            <Content component="small">{node.age}</Content>
                          </Flex>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button
                            variant="plain"
                            aria-label={`Actions for ${node.name}`}
                            icon={<EllipsisVIcon />}
                            onClick={(e) => e.stopPropagation()}
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
