import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  AlertGroup,
  AlertActionCloseButton,
  Button,
  Content,
  Flex,
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
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
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
import {
  applyDomainAction,
  effectiveRolloutStatus,
  GITOPS_ROLLOUTS,
  gitopsDetailPath,
  subscribeGitOpsLive,
  type DomainAction,
  type RolloutRecord,
} from "./gitopsData";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import { HealthStatus, ManagedByCell, ResourceName } from "./gitopsShared";
import RolloutActionsKebab from "./RolloutActionsKebab";

type Filters = { name: string; namespace: string };
type SortColumn = "name" | "namespace" | "strategy" | "status" | "age";

function rowMatches(row: RolloutRecord, filters: Filters) {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.ns.toLowerCase().includes(nsQ)) return false;
  return true;
}

export default function GitOpsRolloutsPage() {
  const navigate = useNavigate();
  const { permission } = usePrototypeDemo();
  const [liveTick, setLiveTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<Filters>({
    filters: { name: "", namespace: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  useEffect(() => subscribeGitOpsLive(() => setLiveTick((n) => n + 1)), []);

  const filtered = useMemo(
    () => GITOPS_ROLLOUTS.filter((r) => rowMatches(r, filters)),
    [filters]
  );
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const statusA = effectiveRolloutStatus(a.ns, a.name, a.status);
      const statusB = effectiveRolloutStatus(b.ns, b.name, b.status);
      switch (sortColumn) {
        case "name":
          return compareStrings(a.name, b.name, sortDirection);
        case "namespace":
          return compareStrings(a.ns, b.ns, sortDirection);
        case "strategy":
          return compareStrings(a.strategy, b.strategy, sortDirection);
        case "status":
          return compareStrings(statusA, statusB, sortDirection);
        case "age":
          return compareStrings(a.age, b.age, sortDirection);
        default:
          return 0;
      }
    });
  }, [filtered, sortColumn, sortDirection, liveTick]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 10);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage, setPage]);

  const onAction = (rollout: RolloutRecord, action: DomainAction) => {
    setToast(applyDomainAction(action, rollout.ns, rollout.name, permission));
  };

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/rollouts" },
          { label: "Rollouts", path: "/gitops/rollouts" },
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
                Rollouts
              </Title>
              <FavoriteButton name="Rollouts" path="/gitops/rollouts" />
            </Flex>
            <Button variant="primary" onClick={() => setToast("Create Rollout (prototype stub)")}>
              Create Rollout
            </Button>
          </Flex>

          <DataView ouiaId="gitops-rollouts-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="gitops-rollouts-toolbar"
              id="gitops-rollouts-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<Filters>
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
                  <DataViewTextFilter title="Name" filterId="name" placeholder="Filter by name..." />
                  <DataViewTextFilter title="Namespace" filterId="namespace" placeholder="Filter by namespace..." />
                </IoDataViewFiltersWithMidActions>
              }
              pagination={
                <Pagination
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
                  titles={{ items: "rollouts" }}
                  perPageOptions={[
                    { title: "10", value: 10 },
                    { title: "20", value: 20 },
                    { title: "50", value: 50 },
                  ]}
                />
              }
            />
            <OcsPrototypeListTable ariaLabel="Rollouts">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Namespace">
                    <SortableTableHeader label="Namespace" column="namespace" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Strategy">
                    <SortableTableHeader label="Strategy" column="strategy" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Status">
                    <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                  </Th>
                  <Th dataLabel="Managed by">
                    <PlainTableHeader label="Managed by" />
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
                    <Td colSpan={7}>
                      <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                        No rollouts match your filters.
                      </Content>
                    </Td>
                  </Tr>
                ) : (
                  paginated.map((r) => {
                    const href = gitopsDetailPath("rollouts", r.ns, r.name);
                    const status = effectiveRolloutStatus(r.ns, r.name, r.status);
                    return (
                      <Tr key={`${r.ns}/${r.name}`} onClick={() => navigate(href)}>
                        <Td dataLabel="Name">
                          <ResourceName kind="Rollout" name={r.name} to={href} />
                        </Td>
                        <Td dataLabel="Namespace">
                          <ResourceName kind="Namespace" name={r.ns} />
                        </Td>
                        <Td dataLabel="Strategy">{r.strategy}</Td>
                        <Td dataLabel="Status">
                          <HealthStatus status={status} />
                        </Td>
                        <Td dataLabel="Managed by">
                          <ManagedByCell owner={r.managedBy} />
                        </Td>
                        <Td dataLabel="Age">{r.age}</Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <RolloutActionsKebab ns={r.ns} name={r.name} seedStatus={r.status} onAction={(a) => onAction(r, a)} />
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </DataView>
          <Content component="small" className="pf-v6-u-color-200">
            Open <Button variant="link" isInline component={Link} to={gitopsDetailPath("rollouts", "argocd", "rollout-bluegreen")}>rollout-bluegreen</Button> to review Promote / Abort / Restart placement.
          </Content>
        </Flex>
      </Breadcrumbs>
      {toast ? (
        <AlertGroup isToast isLiveRegion>
          <Alert variant="info" title={toast} timeout={2800} onTimeout={() => setToast(null)} actionClose={<AlertActionCloseButton onClose={() => setToast(null)} />} />
        </AlertGroup>
      ) : null}
    </div>
  );
}
