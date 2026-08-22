import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  Alert,
  AlertGroup,
  AlertActionCloseButton,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  Pagination,
  PaginationVariant,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
  useListPagination,
} from "../../components/dataView/OcsPrototypeListTable";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import {
  actionStateFor,
  applyDomainAction,
  findRollout,
  gitopsDetailPath,
  patchRolloutLive,
  subscribeGitOpsLive,
  type DomainAction,
  type GitOpsHealth,
} from "./gitopsData";
import { HealthStatus, InfoLabel, ManagedByCell, ResourceName } from "./gitopsShared";
import RolloutActionsKebab from "./RolloutActionsKebab";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";

type RevisionRow = {
  rev: number;
  rs: string;
  pods: string;
  podCount: number;
  image: string;
  status: string;
  age: string;
  info: { text: string; color: "green" | "blue" | "purple" | "grey" | "red" }[];
  scaling: boolean;
  canRollback: boolean;
  kind: "ReplicaSet" | "Rollout";
};

function buildRevisions(name: string, status: string, promoted: boolean, showScale: boolean, showRolloutRow: boolean): RevisionRow[] {
  const previewInfo = promoted
    ? [
        { text: "Stable", color: "green" as const },
        { text: "Active", color: "blue" as const },
      ]
    : [{ text: "Preview", color: "purple" as const }];
  const stableInfo = promoted
    ? [{ text: "Previous", color: "grey" as const }]
    : [
        { text: "Stable", color: "green" as const },
        { text: "Active", color: "blue" as const },
      ];
  const rows: RevisionRow[] = [];
  if (showRolloutRow) {
    rows.push({
      rev: 0,
      rs: name,
      pods: "",
      podCount: 0,
      image: "",
      status,
      age: "135m",
      info: [],
      scaling: false,
      canRollback: false,
      kind: "Rollout",
    });
  }
  rows.push(
    {
      rev: 8,
      rs: `${name}-97666b787`,
      pods: status === "Degraded" ? "0 Pods" : "2 of 2",
      podCount: status === "Degraded" ? 0 : 2,
      image: "argoproj/rollouts-demo:red",
      status: status === "Progressing" ? "Progressing" : "Healthy",
      age: "120m",
      info: previewInfo,
      scaling: status === "Degraded",
      canRollback: true,
      kind: "ReplicaSet",
    },
    {
      rev: 7,
      rs: `${name}-558dcdc6d`,
      pods: "2 of 2",
      podCount: 2,
      image: "argoproj/rollouts-demo:blue",
      status: "Healthy",
      age: "122m",
      info: stableInfo,
      scaling: false,
      canRollback: false,
      kind: "ReplicaSet",
    },
    {
      rev: 6,
      rs: `${name}-69d6ccd644`,
      pods: "0 Pods",
      podCount: 0,
      image: "argoproj/rollouts-demo:yellow",
      status: showScale ? "Healthy" : "ScaledDown",
      age: "121m",
      info: [],
      scaling: showScale,
      canRollback: true,
      kind: "ReplicaSet",
    }
  );
  const colors = ["green", "purple", "orange", "blue"];
  for (let i = 5; i >= -4; i--) {
    const hash = (Math.abs(i * 1103515245 + 12345) >>> 0).toString(16).slice(0, 9);
    rows.push({
      rev: i,
      rs: `${name}-${hash}`,
      pods: "0 Pods",
      podCount: 0,
      image: `argoproj/rollouts-demo:${colors[Math.abs(i) % colors.length]}`,
      status: "ScaledDown",
      age: `${130 + (5 - i) * 3}m`,
      info: [],
      scaling: false,
      canRollback: true,
      kind: "ReplicaSet",
    });
  }
  return rows;
}

export default function GitOpsRolloutDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const ns = decodeURIComponent(namespace);
  const rolloutName = decodeURIComponent(name);
  const seed = findRollout(ns, rolloutName);
  const { permission, gitopsOption: option, gitopsScenario: scenario } = usePrototypeDemo();
  const [, setLiveTick] = useState(0);
  const [activeTab, setActiveTab] = useState("revisions");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 8: true, 7: true });
  const [toast, setToast] = useState<string | null>(null);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<{ name: string }>({
    filters: { name: "" },
  });

  useEffect(() => subscribeGitOpsLive(() => setLiveTick((n) => n + 1)), []);

  useEffect(() => {
    if (!seed) return;
    const map: Record<typeof scenario, GitOpsHealth> = {
      paused: "Paused",
      healthy: "Healthy",
      "scaling-down": "Degraded",
    };
    patchRolloutLive(ns, rolloutName, {
      status: map[scenario],
      busy: false,
      message: scenario === "scaling-down" ? "Aborting — scaling down preview…" : "",
      promoted: false,
    });
  }, [scenario, ns, rolloutName, seed]);

  const st = actionStateFor(ns, rolloutName, seed?.status, permission);
  const statusText = st.status;
  const showScale = st.scalingDown || statusText === "Degraded";
  const useSticky = option === "option-a";
  const showRolloutRow = option === "option-b";

  const revisions = useMemo(
    () => buildRevisions(rolloutName, statusText, st.promoted, showScale, showRolloutRow),
    [rolloutName, statusText, st.promoted, showScale, showRolloutRow]
  );
  const filteredRevisions = useMemo(() => {
    const q = (filters.name ?? "").trim().toLowerCase();
    if (!q) return revisions;
    return revisions.filter((row) => row.rs.toLowerCase().includes(q));
  }, [revisions, filters.name]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(
    filteredRevisions,
    [statusText, option, filters.name],
    10
  );

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  if (!seed) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            { label: "GitOps", path: "/gitops/rollouts" },
            { label: "Rollouts", path: "/gitops/rollouts" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1">Rollout not found</Title>
          <Button variant="link" component={Link} to="/gitops/rollouts">
            Back to Rollouts
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const href = gitopsDetailPath("rollouts", ns, rolloutName);

  const runAction = (action: DomainAction) => {
    setToast(applyDomainAction(action, ns, rolloutName, permission));
  };

  const revisionsFilterToolbar = (
    <DataViewToolbar
      ouiaId="rollout-revisions-toolbar"
      id="rollout-revisions-toolbar"
      className={OCS_PROTOTYPE_TOOLBAR_CLASS}
      clearAllFilters={clearAllFilters}
      collapseListedFiltersBreakpoint="xl"
      filters={
        <IoDataViewFiltersWithMidActions<{ name: string }>
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
          titles={{ items: "revisions" }}
        />
      }
    />
  );

  const revisionsHeader = (
    <Toolbar className="ocs-gitops-revisions-toolbar">
      <ToolbarContent>
        <ToolbarGroup>
          <ToolbarItem>
            <Content component="small">
              <strong>Status:</strong>
            </Content>
          </ToolbarItem>
          <ToolbarItem>
            <HealthStatus status={statusText} />
          </ToolbarItem>
          <ToolbarItem>
            <Content component="small">
              <strong>Strategy:</strong>
            </Content>
          </ToolbarItem>
          <ToolbarItem>
            <Label isCompact>{seed.strategy}</Label>
          </ToolbarItem>
        </ToolbarGroup>
          {useSticky ? (
          <ToolbarGroup align={{ default: "alignEnd" }} variant="action-group" gap={{ default: "gapSm" }}>
            <ToolbarItem>
              <Button variant="primary" isDisabled={!st.promote} onClick={() => runAction("Promote")}>
                Promote
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="primary" isDisabled={!st.fullPromote} onClick={() => runAction("Full Promote")}>
                Full Promote
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="secondary" isDisabled={!st.abort} onClick={() => runAction("Abort")}>
                Abort
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="secondary" isDisabled={!st.retry} onClick={() => runAction("Retry")}>
                Retry
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="secondary" isDisabled={!st.restart} onClick={() => runAction("Restart")}>
                Restart
              </Button>
            </ToolbarItem>
          </ToolbarGroup>
        ) : null}
      </ToolbarContent>
    </Toolbar>
  );

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page ocs-gitops-rollout-detail h-full min-h-0">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/rollouts" },
          { label: "Rollouts", path: "/gitops/rollouts" },
          { label: rolloutName },
        ]}
      >
        <Flex
          direction={{ default: "column" }}
          flexWrap={{ default: "nowrap" }}
          gap={{ default: "gapLg" }}
          className="ocs-gitops-rollout-detail__body"
        >
          <Flex
            className="ocs-gitops-rollout-detail__heading"
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <Label color="orange" isCompact className="ocs-resource-label">
                AR
              </Label>
              <Title headingLevel="h1" size="2xl">
                {rolloutName}
              </Title>
              <Label color="blue" variant="outline" isCompact>
                Tech preview
              </Label>
              <HealthStatus status={statusText} />
              {st.message ? <Content component="small">{st.message}</Content> : null}
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={rolloutName} path={href} />
              <RolloutActionsKebab
                ns={ns}
                name={rolloutName}
                seedStatus={seed.status}
                onAction={runAction}
                variant="secondary"
                ariaLabel="Rollout actions"
              />
            </Flex>
          </Flex>

          <Tabs
            className="ocs-gitops-rollout-detail__tabs"
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Rollout details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="revisions" title={<TabTitleText>Revisions</TabTitleText>} />
            <Tab eventKey="pods" title={<TabTitleText>Pods</TabTitleText>} />
            <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
          </Tabs>

          {activeTab === "revisions" ? (
            <FlexItem grow={{ default: "grow" }} alignSelf={{ default: "stretch" }} className="ocs-gitops-revisions">
              <Title headingLevel="h2" size="lg">
                Rollout Revisions
              </Title>
              <div className="ocs-gitops-revisions-panel">
                <div className="ocs-gitops-revisions-header">{revisionsHeader}</div>
                <div className="ocs-pods-list__panel ocs-gitops-revisions-table-wrap">
                  <DataView ouiaId="rollout-revisions" className={`${OCS_PROTOTYPE_DATAVIEW_CLASS} ocs-gitops-revisions-dataview`}>
                    {revisionsFilterToolbar}
                    <OcsPrototypeListTable ariaLabel="Rollout revisions">
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <PlainTableHeader label="Name" />
                      </Th>
                      <Th dataLabel="Kind">
                        <PlainTableHeader label="Kind" />
                      </Th>
                      <Th dataLabel="Status">
                        <PlainTableHeader label="Status" />
                      </Th>
                      <Th dataLabel="Age">
                        <PlainTableHeader label="Age" />
                      </Th>
                      <Th dataLabel="Info">
                        <PlainTableHeader label="Info" />
                      </Th>
                      <Th dataLabel="Managed by">
                        <PlainTableHeader label="Managed by" />
                      </Th>
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginated.map((rev) => {
                      const isRollout = rev.kind === "Rollout";
                      const open = expanded[rev.rev] !== false;
                      return (
                        <Fragment key={`${rev.kind}-${rev.rev}-${rev.rs}`}>
                          <Tr key={`${rev.kind}-${rev.rev}-${rev.rs}`}>
                            <Td dataLabel="Name">
                              <Flex
                                alignItems={{ default: "alignItemsFlexStart" }}
                                gap={{ default: "gapSm" }}
                                flexWrap={{ default: "nowrap" }}
                              >
                                {rev.podCount > 0 ? (
                                  <Button
                                    variant="plain"
                                    className="ocs-gitops-tree-toggle"
                                    aria-label={`Toggle pods for revision ${rev.rev}`}
                                    aria-expanded={open}
                                    onClick={() => setExpanded((e) => ({ ...e, [rev.rev]: !open }))}
                                    icon={<AngleRightIcon className={open ? "ocs-gitops-chevron--open" : undefined} />}
                                  />
                                ) : (
                                  <span className="ocs-gitops-tree-spacer" aria-hidden />
                                )}
                                <div>
                                  <ResourceName kind={rev.kind} name={rev.rs} />
                                  {!isRollout ? (
                                    <Content component="small" className="pf-v6-u-color-200">
                                      Revision {rev.rev} · Pods: {rev.pods} · <code>{rev.image}</code>
                                    </Content>
                                  ) : null}
                                </div>
                              </Flex>
                            </Td>
                            <Td dataLabel="Kind">{rev.kind}</Td>
                            <Td dataLabel="Status">
                              <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                                <HealthStatus status={rev.status} />
                                {rev.scaling ? <InfoLabel text="Scaling down in: 15s" color="red" /> : null}
                              </Flex>
                            </Td>
                            <Td dataLabel="Age">{rev.age}</Td>
                            <Td dataLabel="Info">
                              <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                                {rev.info.map((i) => (
                                  <InfoLabel key={i.text} text={i.text} color={i.color} />
                                ))}
                              </Flex>
                            </Td>
                            <Td dataLabel="Managed by">
                              <ManagedByCell
                                owner={
                                  isRollout
                                    ? seed.managedBy
                                    : { kind: "Rollout", name: rolloutName, ns }
                                }
                              />
                            </Td>
                            <Td dataLabel="Actions" isActionCell hasAction>
                              {isRollout ? (
                                <RolloutActionsKebab ns={ns} name={rolloutName} seedStatus={seed.status} onAction={runAction} />
                              ) : (
                                <RevisionKebab
                                  rev={rev.rev}
                                  enabled={rev.canRollback}
                                  onRollback={() => setToast("Rollback requested for revision (prototype).")}
                                />
                              )}
                            </Td>
                          </Tr>
                          {open && rev.podCount > 0
                            ? Array.from({ length: rev.podCount }).map((_, p) => {
                                const podName = `${rev.rs}-${String.fromCharCode(97 + (p % 26))}${String.fromCharCode(97 + ((p * 3) % 26))}${10 + p}`;
                                return (
                                  <Tr key={podName} className="ocs-gitops-pod-row">
                                    <Td dataLabel="Name" className="ocs-gitops-pod-name-cell">
                                      <Flex
                                        alignItems={{ default: "alignItemsCenter" }}
                                        gap={{ default: "gapSm" }}
                                        flexWrap={{ default: "nowrap" }}
                                        className="ocs-gitops-pod-name"
                                      >
                                        <ResourceName kind="Pod" name={podName} />
                                      </Flex>
                                    </Td>
                                    <Td dataLabel="Kind">Pod</Td>
                                    <Td dataLabel="Status">
                                      <HealthStatus status={rev.status === "ScaledDown" ? "Healthy" : "Healthy"} />
                                    </Td>
                                    <Td dataLabel="Age">{rev.age}</Td>
                                    <Td dataLabel="Info" />
                                    <Td dataLabel="Managed by">
                                      <ManagedByCell owner={{ kind: "ReplicaSet", name: rev.rs }} />
                                    </Td>
                                    <Td dataLabel="Actions" />
                                  </Tr>
                                );
                              })
                            : null}
                        </Fragment>
                      );
                    })}
                  </Tbody>
                  </OcsPrototypeListTable>
                </DataView>
              </div>
              </div>
            </FlexItem>
          ) : activeTab === "details" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>{rolloutName}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>{ns}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Strategy</DescriptionListTerm>
                <DescriptionListDescription>{seed.strategy}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Image</DescriptionListTerm>
                <DescriptionListDescription>
                  <code>{seed.image}</code>
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Managed by</DescriptionListTerm>
                <DescriptionListDescription>
                  <ManagedByCell owner={seed.managedBy} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : (
            <Content component="p" className="pf-v6-u-color-200">
              {activeTab.charAt(0).toUpperCase()}
              {activeTab.slice(1)} view is a prototype stub.
            </Content>
          )}
        </Flex>
      </Breadcrumbs>
      {toast ? (
        <AlertGroup isToast isLiveRegion>
          <Alert
            variant="info"
            title={toast}
            timeout={2800}
            onTimeout={() => setToast(null)}
            actionClose={<AlertActionCloseButton onClose={() => setToast(null)} />}
          />
        </AlertGroup>
      ) : null}
    </div>
  );
}

function RevisionKebab({
  rev,
  enabled,
  onRollback,
}: {
  rev: number;
  enabled: boolean;
  onRollback: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={`Actions for revision ${rev}`}
          onClick={() => setOpen(!open)}
          isExpanded={open}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem isDisabled={!enabled} onClick={() => enabled && onRollback()}>
          Rollback
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
