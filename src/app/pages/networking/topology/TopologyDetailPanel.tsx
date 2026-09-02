import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Button,
  Checkbox,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  DrawerActions,
  DrawerCloseButton,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Flex,
  FlexItem,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Popover,
  Tab,
  TabTitleText,
  Tabs,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import UnlinkIcon from "@patternfly/react-icons/dist/esm/icons/unlink-icon";
import {
  isLogicalNetworkStandalone,
  RESOURCE_INSTALL_STATUS_LABELS,
  RESOURCE_KIND_LABELS,
  TOPOLOGY_WORKER_CATALOG,
  topologyWorkerCatalogFromGroups,
  type NetResource,
  type NetworkNodeAssignments,
  type ResourceInstallStatus,
  type StandaloneTopologyResource,
  type TopologyDataScale,
  type WorkerNodeGroup,
} from "../networkTopologyData";
import TopologyResourceActionsMenu from "../TopologyResourceActionsMenu";
import type { ResourceLifecycleAction, ResourceLifecycleTarget } from "../networkTopologyState";
import { nncpDetailPath, vmDetailPath } from "../networkingMockData";
import { resolveNncpLineageForBridge } from "../topologyNncpLineage";
import { KIND_BADGE, LANE_BADGE, WORKER_BADGE } from "./topologyBadges";
import {
  isConnectionEdgeData,
  isLogicalLaneNodeData,
  isLogicalNetworkNodeData,
  isResourceNodeData,
  isWorkerGroupNodeData,
  isWorkloadNodeData,
  WORKLOAD_LANE_ID,
  type ConnectionEdgeData,
  type NetworkTopologyNodeData,
} from "./topologyNodeData";
import { attachmentsForNetwork, HOST_ROLE_LABELS } from "./topologyPerspective";
import OvnNetworkPath from "./OvnNetworkPath";
import ViewYamlModal from "./ViewYamlModal";
import { TopologyLightSpeedAction } from "./TopologyLightSpeedAction";
import { topologyLightspeedContext } from "./topologyLightspeed";
import { useTopologyLightspeed } from "./useTopologyLightspeed";
import { LightspeedAiAccuracyInline } from "../../../components/lightspeed/LightspeedLegalCopy";
import { resolveOvnNetworkPath } from "./topologyOvnPath";
import {
  findMtuMismatchesForInterface,
  findMtuMismatchesForNetwork,
  resolveBondHealth,
  yamlForHostResource,
  yamlForLogicalNetwork,
  yamlForWorkload,
  type BondHealthModel,
  type MtuMismatchWarning,
} from "./topologyTroubleshoot";

const NNCP_LIST_PATH = "/networking/nodenetworkconfigurationpolicy";

function configurationPolicyLinkLabel(policyName?: string): string {
  return policyName ? `Review policy: ${policyName}` : "Review configuration policy";
}

function ResourceStatusField({
  status,
  connectivity,
}: {
  status: ResourceInstallStatus;
  connectivity: ConnectivitySummary;
}) {
  return (
    <Tooltip content={connectivity.reason}>
      <span className="ocs-pf-topo-sidepanel__status-value">
        <Label isCompact color={connectivity.color}>
          {RESOURCE_INSTALL_STATUS_LABELS[status]}
        </Label>
        <Content component="small" className="ocs-pf-topo-sidepanel__muted pf-v6-u-display-block">
          {connectivity.label}
        </Content>
      </span>
    </Tooltip>
  );
}
const NAMESPACES_PATH = "/administration/namespaces";

const EDGE_LINK_TYPE_LABEL: Record<ConnectionEdgeData["linkType"], string> = {
  underlay: "Underlay",
  "logical-attachment": "Logical attachment",
  "workload-attachment": "Workload attachment",
};

export type TopologyDetailSelection = {
  id: string;
  data?: NetworkTopologyNodeData;
  edgeData?: ConnectionEdgeData;
  edgeSourceId?: string;
  edgeTargetId?: string;
};

type TopologyDetailPanelProps = {
  selection: TopologyDetailSelection | null;
  networkNodeAssignments: NetworkNodeAssignments;
  standaloneResources: StandaloneTopologyResource[];
  groups?: WorkerNodeGroup[];
  onWorkerAssignmentChange?: (logicalId: string, workerId: string, assigned: boolean) => void;
  onResourceLifecycleAction?: (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => void;
  onNotice?: (notice: { title: string; variant: "success" | "warning" | "info" }) => void;
  onRequestRemoveWorkerGroup?: (worker: { id: string; shortName: string; hostname: string }) => void;
  onConfigureResource?: (selection: TopologyDetailSelection) => void;
  onSelectNode?: (id: string) => void;
  onAssignInterface?: (resourceId: string, interfaceId: string) => void;
  onUnassignInterface?: (resourceId: string, interfaceId: string) => void;
  onTracePath?: (selection: TopologyDetailSelection) => void;
  onAttachWorkload?: (selection: TopologyDetailSelection) => void;
  onClose: () => void;
  dataScale?: TopologyDataScale;
  /** When true, show a drawer close control in the panel header (list-mode Drawer). */
  showCloseButton?: boolean;
};

type InspectorTab = "details" | "network-path" | "resources" | "observe";

type ConnectivitySummary = {
  label: "Healthy" | "Degraded" | "Unreachable";
  color: "green" | "orange" | "red";
  reason: string;
};

function connectivityFromStatus(status: ResourceInstallStatus, objectLabel: string): ConnectivitySummary {
  if (status === "configured") {
    return { label: "Healthy", color: "green", reason: `${objectLabel} is configured and reachable.` };
  }
  if (status === "failed") {
    return { label: "Unreachable", color: "red", reason: `${objectLabel} reports a failed configuration.` };
  }
  return {
    label: "Degraded",
    color: "orange",
    reason: `${objectLabel} is ${RESOURCE_INSTALL_STATUS_LABELS[status].toLowerCase()}.`,
  };
}

function InspectorClose({ onClose }: { onClose: () => void }) {
  return (
    <Button variant="plain" icon={<TimesIcon />} onClick={onClose} aria-label="Close inspector" />
  );
}

function KindBadgeChip({ kind }: { kind: keyof typeof KIND_BADGE }) {
  return (
    <span className="ocs-pf-topo-sidepanel__kind-badge" aria-hidden>
      {KIND_BADGE[kind]}
    </span>
  );
}

function LaneBadgeChip({ label }: { label: string }) {
  return (
    <span className="ocs-pf-topo-sidepanel__kind-badge" aria-hidden>
      {label}
    </span>
  );
}

function PanelHeader({
  badge,
  title,
  titleHref,
  actions,
  closeControl,
}: {
  badge: React.ReactNode;
  title: string;
  titleHref?: string;
  actions: React.ReactNode;
  closeControl: React.ReactNode;
}) {
  return (
    <div className="ocs-pf-topo-sidepanel__header">
      <div className="ocs-pf-topo-sidepanel__title-row">
        {badge}
        {titleHref ? (
          <Link to={titleHref} className="ocs-pf-topo-sidepanel__title-link">
            {title}
          </Link>
        ) : (
          <Title headingLevel="h2" size="lg" className="ocs-pf-topo-sidepanel__title" title={title}>
            {title}
          </Title>
        )}
      </div>
      <div className="ocs-pf-topo-sidepanel__header-actions">
        {actions}
        {closeControl}
      </div>
    </div>
  );
}

function ObserveMetrics({
  objectLabel,
  connectivity,
  lightspeedContextKey,
}: {
  objectLabel: string;
  connectivity?: ConnectivitySummary;
  lightspeedContextKey?: string;
}) {
  return (
    <div className="ocs-pf-topo-sidepanel__observe">
      {connectivity ? (
        <div className="ocs-pf-topo-sidepanel__connectivity">
          <Label isCompact color={connectivity.color}>
            {connectivity.label}
          </Label>
          <Content component="p" className="ocs-pf-topo-sidepanel__muted">
            {connectivity.reason}
          </Content>
        </div>
      ) : null}
      {lightspeedContextKey ? (
        <div className="ocs-pf-topo-sidepanel__lightspeed-observe">
          <TopologyLightSpeedAction
            contextKey={lightspeedContextKey}
            intent="analyze"
            variant="secondary"
          >
            Analyze metrics with LightSpeed
          </TopologyLightSpeedAction>
          <LightspeedAiAccuracyInline className="ocs-pf-topo-sidepanel__lightspeed-disclaimer" />
        </div>
      ) : null}
      <Content component="p" className="ocs-pf-topo-sidepanel__muted">
        Prototype telemetry for <strong>{objectLabel}</strong> (Network Observability / Prometheus). Values are
        illustrative.
      </Content>
      <Title headingLevel="h3" size="md" className="ocs-pf-topo-sidepanel__section-title">
        Metrics
      </Title>
      <div className="ocs-pf-topo-sidepanel__metric-panel">
        <Content component="small">CPU usage</Content>
        <Content component="p" className="ocs-pf-topo-sidepanel__metric-empty">
          No datapoints found.
        </Content>
      </div>
      <div className="ocs-pf-topo-sidepanel__metric-panel">
        <Content component="small">Memory usage</Content>
        <Content component="p" className="ocs-pf-topo-sidepanel__metric-empty">
          No datapoints found.
        </Content>
      </div>
      <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl ocs-pf-topo-sidepanel__dl--muted">
        <DescriptionListGroup>
          <DescriptionListTerm>RX rate</DescriptionListTerm>
          <DescriptionListDescription>182 Mbps · p95 210 Mbps</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>TX rate</DescriptionListTerm>
          <DescriptionListDescription>96 Mbps · p95 128 Mbps</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Packet drops</DescriptionListTerm>
          <DescriptionListDescription>0.02% (last 15m)</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Last scrape</DescriptionListTerm>
          <DescriptionListDescription>12s ago · scrape OK</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
}

function QuickActions({
  items,
}: {
  items: { label: string; onClick?: () => void; isDisabled?: boolean; variant?: "secondary" | "link" }[];
}) {
  const actionable = items.filter((item) => !item.isDisabled && item.onClick);
  if (actionable.length === 0) return null;

  return (
    <div className="ocs-pf-topo-sidepanel__quick-actions">
      <Title headingLevel="h3" size="md">
        Quick actions
      </Title>
      <Flex spaceItems={{ default: "spaceItemsSm" }} flexWrap={{ default: "wrap" }}>
        {actionable.map((item) => (
          <FlexItem key={item.label}>
            <Button variant={item.variant ?? "link"} isInline onClick={item.onClick}>
              {item.label}
            </Button>
          </FlexItem>
        ))}
      </Flex>
    </div>
  );
}

function StatusHealthBanner({
  status,
  label,
  policyPath,
  policyName,
  troubleshootContextKey,
}: {
  status: ResourceInstallStatus;
  label: string;
  policyPath?: string;
  policyName?: string;
  troubleshootContextKey?: string;
}) {
  if (status === "configured") return null;
  const isFailed = status === "failed";
  return (
    <Alert
      isInline
      variant={isFailed ? "danger" : "warning"}
      title={isFailed ? "Configuration failed" : "Configuration pending"}
      className="ocs-pf-topo-sidepanel__health"
    >
      {isFailed
        ? `${label} reports a failed configuration state.`
        : `${label} is not fully configured yet (${RESOURCE_INSTALL_STATUS_LABELS[status]}).`}
      <Flex spaceItems={{ default: "spaceItemsSm" }} className="pf-v6-u-mt-sm" flexWrap={{ default: "wrap" }}>
        {policyPath ? (
          <FlexItem>
            <Link to={policyPath} className="pf-v6-c-button pf-m-link pf-m-inline">
              {configurationPolicyLinkLabel(policyName)}
            </Link>
          </FlexItem>
        ) : null}
        {troubleshootContextKey ? (
          <FlexItem>
            <TopologyLightSpeedAction
              contextKey={troubleshootContextKey}
              intent="troubleshoot"
              variant="link"
              isInline
            >
              Troubleshoot with LightSpeed
            </TopologyLightSpeedAction>
          </FlexItem>
        ) : null}
      </Flex>
    </Alert>
  );
}

function MtuMismatchAlerts({
  warnings,
  diagnoseContextKey,
}: {
  warnings: MtuMismatchWarning[];
  diagnoseContextKey?: string;
}) {
  if (warnings.length === 0) return null;
  const title =
    warnings.length === 1
      ? "MTU mismatch (1 network)"
      : `MTU mismatch (${warnings.length} networks)`;
  return (
    <Alert
      isInline
      isExpandable
      variant="warning"
      title={title}
      toggleAriaLabel={`${title} details`}
      className="ocs-pf-topo-sidepanel__health"
    >
      <ul className="ocs-pf-topo-sidepanel__alert-list">
        {warnings.map((warning) => (
          <li key={`${warning.resourceId}-${warning.networkLabel}`}>
            {warning.interfaceLabel} on {warning.workerLabel} is MTU {warning.interfaceMtu}, but{" "}
            <strong>{warning.networkLabel}</strong> expects MTU {warning.networkMtu}.
          </li>
        ))}
      </ul>
      {diagnoseContextKey ? (
        <div className="ocs-pf-topo-sidepanel__lightspeed-inline pf-v6-u-mt-sm">
          <TopologyLightSpeedAction contextKey={diagnoseContextKey} intent="troubleshoot" variant="link" isInline>
            Troubleshoot with LightSpeed
          </TopologyLightSpeedAction>
        </div>
      ) : null}
    </Alert>
  );
}

function BondHealthPanel({ model }: { model: BondHealthModel }) {
  const aggregateColor =
    model.aggregateStatus === "healthy" ? "green" : model.aggregateStatus === "degraded" ? "orange" : "red";
  return (
    <div className="ocs-pf-topo-sidepanel__bond-health">
      <Title headingLevel="h3" size="md">
        Bond health
      </Title>
      <div className="ocs-pf-topo-sidepanel__bond-summary">
        <Label isCompact color={aggregateColor}>
          {model.aggregateStatus === "healthy" ? "Healthy" : model.aggregateStatus === "degraded" ? "Degraded" : "Down"}
        </Label>
        <Content component="small" className="ocs-pf-topo-sidepanel__muted">
          {model.bondLabel} · {model.mode} · miimon {model.miimon}
        </Content>
      </div>
      <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
        {model.members.map((member) => (
          <DescriptionListGroup key={member.id}>
            <DescriptionListTerm>{member.label}</DescriptionListTerm>
            <DescriptionListDescription>
              <Label isCompact color={member.status === "configured" ? "green" : member.status === "failed" ? "red" : "orange"}>
                {RESOURCE_INSTALL_STATUS_LABELS[member.status]}
              </Label>
              {" · "}MTU {member.mtu} · LACP {member.lacpState}
            </DescriptionListDescription>
          </DescriptionListGroup>
        ))}
      </DescriptionList>
    </div>
  );
}


function ConnectedInterfacesList({
  related,
  peerResources,
  onSelectNode,
  onUnassign,
}: {
  related: string[];
  peerResources: NetResource[];
  onSelectNode?: (id: string) => void;
  onUnassign?: (interfaceId: string) => void;
}) {
  const [pendingRemove, setPendingRemove] = useState<{ id: string; label: string } | null>(null);

  if (related.length === 0) {
    return (
      <Content component="p" className="ocs-pf-topo-sidepanel__muted">
        No connected interfaces yet.
      </Content>
    );
  }

  return (
    <>
      <ul className="ocs-pf-topo-sidepanel__list ocs-pf-topo-sidepanel__connected-list">
        {related.map((name) => {
          const peer = peerResources.find((r) => r.id === name || r.label === name);
          const interfaceId = peer?.id ?? name;
          const label = peer?.label ?? name;
          return (
            <li key={name} className="ocs-pf-topo-sidepanel__connected-item">
              <span className="ocs-pf-topo-sidepanel__connected-label">
                {onSelectNode ? (
                  <Button variant="link" isInline onClick={() => onSelectNode(interfaceId)}>
                    {label}
                  </Button>
                ) : (
                  label
                )}
              </span>
              {onUnassign ? (
                <Button
                  variant="plain"
                  icon={<UnlinkIcon aria-hidden />}
                  aria-label={`Remove ${label}`}
                  onClick={() => setPendingRemove({ id: interfaceId, label })}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      {pendingRemove ? (
        <Modal
          variant="small"
          isOpen
          onClose={() => setPendingRemove(null)}
          aria-labelledby="remove-connected-interface-title"
        >
          <ModalHeader
            title={`Remove ${pendingRemove.label}?`}
            labelId="remove-connected-interface-title"
          />
          <ModalBody>
            <Content component="p">
              Removing <strong>{pendingRemove.label}</strong> disconnects this interface from the resource. The
              interface remains on the worker.
            </Content>
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onUnassign?.(pendingRemove.id);
                setPendingRemove(null);
              }}
            >
              Remove
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </>
  );
}

function AssignInterfaceControl({
  available,
  onAssign,
}: {
  available: NetResource[];
  onAssign: (interfaceId: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const body =
    available.length === 0 ? (
      <Content component="p" className="ocs-pf-topo-sidepanel__muted">
        No unassigned interfaces remain on this worker.
      </Content>
    ) : (
      <ul className="ocs-pf-topo-sidepanel__list">
        {available.map((iface) => (
          <li key={iface.id}>
            <Button
              variant="link"
              isInline
              onClick={() => {
                onAssign(iface.id);
                setModalOpen(false);
              }}
            >
              {iface.label} ({RESOURCE_KIND_LABELS[iface.kind]})
            </Button>
          </li>
        ))}
      </ul>
    );

  if (available.length <= 4) {
    return (
      <Popover headerContent="Assign interface" bodyContent={body} triggerAction="click">
        <Button variant="link" icon={<PlusCircleIcon />}>
          Assign interface
        </Button>
      </Popover>
    );
  }

  return (
    <>
      <Button variant="link" icon={<PlusCircleIcon />} onClick={() => setModalOpen(true)}>
        Assign interface
      </Button>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} variant="small">
        <ModalHeader title="Assign interface" />
        <ModalBody>{body}</ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function NoInterfacesEmpty({
  available,
  onAssign,
}: {
  available: NetResource[];
  onAssign?: (interfaceId: string) => void;
}) {
  return (
    <EmptyState
      variant={EmptyStateVariant.sm}
      titleText="No interfaces assigned"
      headingLevel="h3"
      icon={PlusCircleIcon}
    >
      <EmptyStateBody>
        Assign a network interface to this resource to connect it to the physical network.
      </EmptyStateBody>
      {onAssign ? (
        <EmptyStateFooter>
          <AssignInterfaceControl available={available} onAssign={onAssign} />
        </EmptyStateFooter>
      ) : null}
    </EmptyState>
  );
}

function NoWorkloadsEmpty({ onAttach }: { onAttach?: () => void }) {
  return (
    <EmptyState
      variant={EmptyStateVariant.sm}
      titleText="No workloads attached"
      headingLevel="h3"
      icon={PlusCircleIcon}
    >
      <EmptyStateBody>Attach a virtual machine or pod to this network.</EmptyStateBody>
      {onAttach ? (
        <EmptyStateFooter>
          <Button variant="link" icon={<PlusCircleIcon />} onClick={onAttach}>
            Attach workload
          </Button>
        </EmptyStateFooter>
      ) : null}
    </EmptyState>
  );
}

function availableInterfacesForResource(
  groups: WorkerNodeGroup[],
  groupId: string,
  resource: NetResource
): NetResource[] {
  const group = groups.find((g) => g.id === groupId);
  if (!group) return [];
  const related = new Set(resource.related ?? []);
  const linked = new Set<string>();
  group.edges.forEach((edge) => {
    if (edge.from === resource.id) linked.add(edge.to);
    if (edge.to === resource.id) linked.add(edge.from);
  });
  return group.resources.filter(
    (r) =>
      r.id !== resource.id &&
      (r.kind === "interface" || r.kind === "port") &&
      !related.has(r.id) &&
      !related.has(r.label) &&
      !linked.has(r.id)
  );
}

export default function TopologyDetailPanel({
  selection,
  networkNodeAssignments,
  standaloneResources,
  groups = [],
  onWorkerAssignmentChange,
  onResourceLifecycleAction,
  onNotice,
  onRequestRemoveWorkerGroup,
  onConfigureResource,
  onSelectNode,
  onAssignInterface,
  onUnassignInterface,
  onTracePath,
  onAttachWorkload,
  onClose,
  showCloseButton = false,
  dataScale = "scale",
}: TopologyDetailPanelProps) {
  const navigate = useNavigate();
  const { openTopologyLightspeed } = useTopologyLightspeed();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>("details");
  const [yamlModal, setYamlModal] = useState<{
    label: string;
    yaml: string;
    reviewContext?: string;
  } | null>(null);

  useEffect(() => {
    setYamlModal(null);
  }, [selection?.id]);
  const workerCatalog = useMemo(
    () => (groups.length > 0 ? topologyWorkerCatalogFromGroups(groups) : TOPOLOGY_WORKER_CATALOG),
    [groups]
  );

  const closeControl = showCloseButton ? (
    <DrawerActions>
      <DrawerCloseButton onClick={onClose} />
    </DrawerActions>
  ) : (
    <InspectorClose onClose={onClose} />
  );

  const renderTabs = (body: {
    details: React.ReactNode;
    resources: React.ReactNode;
    observe: React.ReactNode;
    networkPath?: React.ReactNode;
    health?: React.ReactNode;
  }) => (
    <div className="ocs-pf-topo-sidepanel__body">
      {body.health ? <div className="ocs-pf-topo-sidepanel__alerts">{body.health}</div> : null}
      <Tabs
        className="ocs-pf-topo-sidepanel__tabs"
        activeKey={activeTab}
        onSelect={(_e, key) => setActiveTab(key as InspectorTab)}
        aria-label="Topology resource inspector"
      >
        <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
          <div className="ocs-pf-topo-sidepanel__tab">{body.details}</div>
        </Tab>
        {body.networkPath ? (
          <Tab eventKey="network-path" title={<TabTitleText>Network path</TabTitleText>}>
            <div className="ocs-pf-topo-sidepanel__tab">{body.networkPath}</div>
          </Tab>
        ) : null}
        <Tab eventKey="resources" title={<TabTitleText>Resources</TabTitleText>}>
          <div className="ocs-pf-topo-sidepanel__tab">{body.resources}</div>
        </Tab>
        <Tab eventKey="observe" title={<TabTitleText>Observe</TabTitleText>}>
          <div className="ocs-pf-topo-sidepanel__tab">{body.observe}</div>
        </Tab>
      </Tabs>
    </div>
  );

  const ovnPathModel = useMemo(
    () =>
      selection
        ? resolveOvnNetworkPath({
            selection,
            groups,
            standaloneResources,
            networkNodeAssignments,
          })
        : null,
    [selection, groups, standaloneResources, networkNodeAssignments]
  );

  const networkPathTab = ovnPathModel ? (
    <OvnNetworkPath
      model={ovnPathModel}
      onSelectNode={onSelectNode}
      onTracePath={onTracePath && selection ? () => onTracePath(selection) : undefined}
    />
  ) : undefined;

  useEffect(() => {
    if (activeTab === "network-path" && !ovnPathModel) {
      setActiveTab("details");
    }
  }, [activeTab, ovnPathModel]);

  const traceAction = useMemo(
    () =>
      onTracePath && selection
        ? { label: "Trace path", onClick: () => onTracePath(selection) }
        : { label: "Trace path", isDisabled: true as const },
    [onTracePath, selection]
  );

  if (!selection || (!selection.data && !selection.edgeData)) {
    return (
      <div className="ocs-pf-topo-sidepanel">
        <div className="ocs-pf-topo-sidepanel__header">
          <Content component="p">Select a node or connection to view details and manage the resource.</Content>
          {closeControl}
        </div>
      </div>
    );
  }

  if (selection.edgeData && isConnectionEdgeData(selection.edgeData)) {
    const edge = selection.edgeData;
    const fromNode = selection.edgeSourceId;
    const toNode = selection.edgeTargetId;
    return (
      <div className="ocs-pf-topo-sidepanel">
        <PanelHeader
          badge={
            <Label isCompact color="grey">
              LINK
            </Label>
          }
          title="Connection"
          actions={
            <TopologyResourceActionsMenu
              label="Connection"
              onConfigure={onConfigureResource ? () => onConfigureResource(selection) : undefined}
              configureLabel="Configure link"
              isOpen={actionsOpen}
              onOpenChange={setActionsOpen}
              showActionsLabel
            />
          }
          closeControl={closeControl}
        />
        {renderTabs({
          networkPath: networkPathTab,
          details: (
            <>
              <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
                <DescriptionListGroup>
                  <DescriptionListTerm>Type</DescriptionListTerm>
                  <DescriptionListDescription>{EDGE_LINK_TYPE_LABEL[edge.linkType]}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>From</DescriptionListTerm>
                  <DescriptionListDescription>
                    {fromNode && onSelectNode ? (
                      <Button variant="link" isInline onClick={() => onSelectNode(fromNode)}>
                        {edge.sourceLabel}
                      </Button>
                    ) : (
                      edge.sourceLabel
                    )}
                    {edge.sourceKind ? ` (${edge.sourceKind})` : ""}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>To</DescriptionListTerm>
                  <DescriptionListDescription>
                    {toNode && onSelectNode ? (
                      <Button variant="link" isInline onClick={() => onSelectNode(toNode)}>
                        {edge.targetLabel}
                      </Button>
                    ) : (
                      edge.targetLabel
                    )}
                    {edge.targetKind ? ` (${edge.targetKind})` : ""}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {edge.vlan ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>VLAN</DescriptionListTerm>
                    <DescriptionListDescription>{edge.vlan}</DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                {edge.interfaceName ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Interface</DescriptionListTerm>
                    <DescriptionListDescription>{edge.interfaceName}</DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                {edge.bridgeMapping ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Bridge mapping</DescriptionListTerm>
                    <DescriptionListDescription>{edge.bridgeMapping}</DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                {edge.note ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Notes</DescriptionListTerm>
                    <DescriptionListDescription>{edge.note}</DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                <DescriptionListGroup>
                  <DescriptionListTerm>Managed by</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link to={NNCP_LIST_PATH} className="pf-v6-c-button pf-m-link pf-m-inline">
                      NNCP / nmstate
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <QuickActions items={[traceAction]} />
            </>
          ),
          resources: (
            <>
              <Title headingLevel="h3" size="md">
                Path mapping
              </Title>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Source endpoint</DescriptionListTerm>
                  <DescriptionListDescription>
                    {fromNode && onSelectNode ? (
                      <Button variant="link" isInline onClick={() => onSelectNode(fromNode)}>
                        {edge.sourceLabel}
                      </Button>
                    ) : (
                      edge.sourceLabel
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Target endpoint</DescriptionListTerm>
                  <DescriptionListDescription>
                    {toNode && onSelectNode ? (
                      <Button variant="link" isInline onClick={() => onSelectNode(toNode)}>
                        {edge.targetLabel}
                      </Button>
                    ) : (
                      edge.targetLabel
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Policy / NNCP</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link to={NNCP_LIST_PATH} className="pf-v6-c-button pf-m-link pf-m-inline">
                      Review configuration policy
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Reconcile</DescriptionListTerm>
                  <DescriptionListDescription>Applied via NNCP / OVN Kubernetes (prototype).</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </>
          ),
          observe: <ObserveMetrics objectLabel={`${edge.sourceLabel} → ${edge.targetLabel}`} />,
        })}
      </div>
    );
  }

  const { data } = selection;
  if (!data) {
    return (
      <div className="ocs-pf-topo-sidepanel">
        <div className="ocs-pf-topo-sidepanel__header">
          <Content component="p">Select a node or connection to view details and manage the resource.</Content>
          {closeControl}
        </div>
      </div>
    );
  }

  if (isResourceNodeData(data)) {
    const lifecycleTarget: ResourceLifecycleTarget = {
      resourceId: data.resource.id,
      placement: "group",
      groupId: data.groupId,
      label: data.resource.label,
    };
    const needsHealth = data.status === "pending" || data.status === "failed" || data.status === "creating";
    const related = data.resource.related ?? [];
    const peerResources =
      groups.find((g) => g.id === data.groupId)?.resources.filter((r) => r.id !== data.resource.id) ?? [];
    const isHostWithInterfaces =
      data.kind === "bridge" || data.kind === "tunnel" || data.kind === "port";
    const availableIfaces = availableInterfacesForResource(groups, data.groupId, data.resource);
    const handleAssign = onAssignInterface
      ? (interfaceId: string) => onAssignInterface(data.resource.id, interfaceId)
      : undefined;
    const handleUnassign = onUnassignInterface
      ? (interfaceId: string) => onUnassignInterface(data.resource.id, interfaceId)
      : undefined;
    const hostYaml = yamlForHostResource(data.resource, data.groupHostname);
    const connectivity = connectivityFromStatus(data.status, data.resource.label);
    const nncpLineage = resolveNncpLineageForBridge(data.resource);
    const bondHealth = data.hostRole === "bond" ? resolveBondHealth(data.groupId, data.resource.label) : null;
    const mtuWarnings = findMtuMismatchesForInterface(
      data.resource.id,
      data.resource.label,
      data.resource.kind,
      groups,
      dataScale
    );
    const bondUnhealthy = bondHealth ? bondHealth.aggregateStatus !== "healthy" : false;
    const configFailedContext = topologyLightspeedContext(
      "config-failed",
      data.resource.label,
      data.status
    );
    const mtuDiagnoseContext = topologyLightspeedContext(
      "mtu",
      data.resource.id,
      data.resource.label,
      data.groupShortName,
      String(mtuWarnings.length)
    );
    const bondDiagnoseContext = bondHealth
      ? topologyLightspeedContext("bond", bondHealth.bondLabel, data.groupShortName)
      : undefined;
    const observeContext = topologyLightspeedContext("observe", data.resource.label);
    const yamlReviewContext = topologyLightspeedContext("yaml-review", data.resource.label);
    const relatedPeers =
      groups
        .find((g) => g.id === data.groupId)
        ?.resources.filter(
          (r) =>
            related.includes(r.id) ||
            related.includes(r.label) ||
            (data.resource.related ?? []).some((rel) => rel === r.id || rel === r.label)
        ) ?? [];

    return (
      <div className="ocs-pf-topo-sidepanel">
        <PanelHeader
          badge={<KindBadgeChip kind={data.kind} />}
          title={data.resource.label}
          titleHref={`/compute/nodes/${encodeURIComponent(data.groupHostname)}`}
          actions={
            <TopologyResourceActionsMenu
              label={data.resource.label}
              lifecycleTarget={lifecycleTarget}
              onResourceLifecycleAction={onResourceLifecycleAction}
              onConfigure={onConfigureResource ? () => onConfigureResource(selection) : undefined}
              onViewYaml={() =>
                setYamlModal({
                  label: data.resource.label,
                  yaml: hostYaml,
                  reviewContext: yamlReviewContext,
                })
              }
              onAssessDeleteImpact={() =>
                openTopologyLightspeed(
                  topologyLightspeedContext("delete-impact", data.resource.label, data.kind)
                )
              }
              onNotice={onNotice}
              onDeleted={onClose}
              isOpen={actionsOpen}
              onOpenChange={setActionsOpen}
              showActionsLabel
            />
          }
          closeControl={closeControl}
        />
        {renderTabs({
          networkPath: networkPathTab,
          health: (
            <>
              {needsHealth ? (
                <StatusHealthBanner
                  status={data.status}
                  label={data.resource.label}
                  policyPath={nncpLineage?.nncpPath ?? NNCP_LIST_PATH}
                  policyName={nncpLineage?.nncpName}
                  troubleshootContextKey={configFailedContext}
                />
              ) : null}
              {bondUnhealthy && bondHealth ? (
                <Alert
                  isInline
                  variant={bondHealth.aggregateStatus === "down" ? "danger" : "warning"}
                  title="Bond degraded"
                  className="ocs-pf-topo-sidepanel__health"
                >
                  {bondHealth.bondLabel} has {bondHealth.members.filter((m) => m.status !== "configured").length} unhealthy
                  member{bondHealth.members.filter((m) => m.status !== "configured").length === 1 ? "" : "s"}.
                  {bondDiagnoseContext ? (
                    <div className="ocs-pf-topo-sidepanel__lightspeed-inline pf-v6-u-mt-sm">
                      <TopologyLightSpeedAction
                        contextKey={bondDiagnoseContext}
                        intent="troubleshoot"
                        variant="link"
                        isInline
                      >
                        Troubleshoot with LightSpeed
                      </TopologyLightSpeedAction>
                    </div>
                  ) : null}
                </Alert>
              ) : null}
              <MtuMismatchAlerts warnings={mtuWarnings} diagnoseContextKey={mtuDiagnoseContext} />
            </>
          ),
          details: (
            <>
              {bondHealth ? <BondHealthPanel model={bondHealth} /> : null}
              <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
                <DescriptionListGroup>
                  <DescriptionListTerm>Kind</DescriptionListTerm>
                  <DescriptionListDescription>{RESOURCE_KIND_LABELS[data.kind]}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ResourceStatusField status={data.status} connectivity={connectivity} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Host role</DescriptionListTerm>
                  <DescriptionListDescription>{HOST_ROLE_LABELS[data.hostRole]}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Worker node</DescriptionListTerm>
                  <DescriptionListDescription>
                    {onSelectNode ? (
                      <Button variant="link" isInline onClick={() => onSelectNode(data.groupId)}>
                        {data.groupShortName}
                      </Button>
                    ) : (
                      data.groupShortName
                    )}{" "}
                    (
                    <Link
                      to={`/compute/nodes/${data.groupHostname}`}
                      className="pf-v6-c-button pf-m-link pf-m-inline"
                    >
                      {data.groupHostname}
                    </Link>
                    )
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Description</DescriptionListTerm>
                  <DescriptionListDescription>{data.resource.detail}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Managed by</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to={nncpLineage?.nncpPath ?? NNCP_LIST_PATH}
                      className="pf-v6-c-button pf-m-link pf-m-inline"
                    >
                      {nncpLineage ? nncpLineage.nncpName : "NNCP / nmstate"}
                    </Link>
                    {" · OVN Kubernetes"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {relatedPeers.length > 0 ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Related resources</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ul className="ocs-pf-topo-sidepanel__list">
                        {relatedPeers.map((peer) => (
                          <li key={peer.id}>
                            {peer.kind === "bridge" && onSelectNode ? (
                              <Button variant="link" isInline onClick={() => onSelectNode(peer.id)}>
                                {peer.label}
                              </Button>
                            ) : onSelectNode ? (
                              <Button variant="link" isInline onClick={() => onSelectNode(peer.id)}>
                                {peer.label}
                              </Button>
                            ) : (
                              peer.label
                            )}
                          </li>
                        ))}
                      </ul>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
              </DescriptionList>
              <QuickActions
                items={[
                  ...(needsHealth
                    ? [
                        {
                          label: configurationPolicyLinkLabel(nncpLineage?.nncpName),
                          onClick: () => navigate(nncpLineage?.nncpPath ?? NNCP_LIST_PATH),
                        },
                      ]
                    : []),
                  traceAction,
                ]}
              />
            </>
          ),
          resources: (
            <>
              <Title headingLevel="h3" size="md">
                Connected interfaces
              </Title>
              {isHostWithInterfaces && related.length === 0 ? (
                <NoInterfacesEmpty available={availableIfaces} onAssign={handleAssign} />
              ) : (
                <ConnectedInterfacesList
                  related={related}
                  peerResources={peerResources}
                  onSelectNode={onSelectNode}
                  onUnassign={isHostWithInterfaces ? handleUnassign : undefined}
                />
              )}
              {isHostWithInterfaces && handleAssign && related.length > 0 ? (
                <AssignInterfaceControl available={availableIfaces} onAssign={handleAssign} />
              ) : null}
              <Title headingLevel="h3" size="md">
                Worker mapping
              </Title>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Parent worker</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to={`/compute/nodes/${data.groupHostname}`}
                      className="pf-v6-c-button pf-m-link pf-m-inline"
                    >
                      {data.groupHostname}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Peers on this node</DescriptionListTerm>
                  <DescriptionListDescription>
                    {peerResources.length > 0
                      ? peerResources.map((r, idx) => (
                          <span key={r.id}>
                            {idx > 0 ? ", " : null}
                            {onSelectNode ? (
                              <Button variant="link" isInline onClick={() => onSelectNode(r.id)}>
                                {r.label}
                              </Button>
                            ) : (
                              r.label
                            )}
                          </span>
                        ))
                      : "No other resources on this worker"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Bridge / NAD mapping</DescriptionListTerm>
                  <DescriptionListDescription>
                    {data.kind === "bridge"
                      ? `ovn-bridge-mappings · ${data.resource.label}`
                      : "Inherited from parent bridge / NNCP"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>NNCP</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to={nncpLineage?.nncpPath ?? nncpDetailPath("nncp-br-localnet")}
                      className="pf-v6-c-button pf-m-link pf-m-inline"
                    >
                      {nncpLineage?.nncpName
                        ? configurationPolicyLinkLabel(nncpLineage.nncpName)
                        : "Review configuration policy"}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </>
          ),
          observe: (
            <ObserveMetrics
              objectLabel={data.resource.label}
              connectivity={connectivity}
              lightspeedContextKey={observeContext}
            />
          ),
        })}
        {yamlModal ? (
          <ViewYamlModal
            isOpen
            resourceLabel={yamlModal.label}
            yaml={yamlModal.yaml}
            reviewContextKey={yamlModal.reviewContext}
            onClose={() => setYamlModal(null)}
            onSave={() =>
              onNotice?.({
                variant: "success",
                title: `Saved YAML for ${yamlModal.label} (prototype).`,
              })
            }
          />
        ) : null}
      </div>
    );
  }

  if (isLogicalNetworkNodeData(data)) {
    const resource = data.resource;
    const isLogical = isLogicalNetworkStandalone(resource);
    const assigned = networkNodeAssignments[resource.id] ?? [];
    const lifecycleTarget: ResourceLifecycleTarget = {
      resourceId: resource.id,
      placement: "standalone",
      label: resource.label,
    };
    const needsHealth = data.status !== "configured";
    const assignedWorkers = workerCatalog.filter((w) => assigned.includes(w.id));
    const workloads = attachmentsForNetwork(resource.label, resource.id, dataScale);
    const connectivity = connectivityFromStatus(data.status, resource.label);
    const mtuWarnings = findMtuMismatchesForNetwork(resource.label, assigned, groups, dataScale);
    const networkYaml = yamlForLogicalNetwork(resource);
    const deleteImpactContext = topologyLightspeedContext("delete-impact", resource.label, data.kind);
    const networkMtuContext = topologyLightspeedContext(
      "mtu",
      resource.id,
      resource.label,
      "assigned-workers",
      String(mtuWarnings.length)
    );
    const networkObserveContext = topologyLightspeedContext("observe", resource.label);
    const networkYamlReviewContext = topologyLightspeedContext("yaml-review", resource.label);
    const handleAttach =
      onAttachWorkload
        ? () => onAttachWorkload(selection)
        : data.detailPath
          ? () => navigate(`${data.detailPath}?tab=virtualization`)
          : undefined;

    return (
      <div className="ocs-pf-topo-sidepanel">
        <PanelHeader
          badge={<KindBadgeChip kind={data.kind} />}
          title={resource.label}
          actions={
            <TopologyResourceActionsMenu
              label={resource.label}
              lifecycleTarget={lifecycleTarget}
              onResourceLifecycleAction={onResourceLifecycleAction}
              onConfigure={onConfigureResource ? () => onConfigureResource(selection) : undefined}
              configureLabel="Configure network"
              onViewYaml={() =>
                setYamlModal({
                  label: resource.label,
                  yaml: networkYaml,
                  reviewContext: networkYamlReviewContext,
                })
              }
              onAssessDeleteImpact={() => openTopologyLightspeed(deleteImpactContext)}
              onNotice={onNotice}
              onDeleted={onClose}
              isOpen={actionsOpen}
              onOpenChange={setActionsOpen}
              showActionsLabel
            />
          }
          closeControl={closeControl}
        />
        {renderTabs({
          networkPath: networkPathTab,
          health: (
            <>
              {needsHealth ? (
                <Alert
                  isInline
                  isExpandable
                  variant="warning"
                  title="Network readiness"
                  toggleAriaLabel="Network readiness details"
                  className="ocs-pf-topo-sidepanel__health"
                >
                  {resource.label} is {RESOURCE_INSTALL_STATUS_LABELS[data.status].toLowerCase()}. Assign workers and
                  verify bridges before production use.
                  <div className="ocs-pf-topo-sidepanel__lightspeed-inline pf-v6-u-mt-sm">
                    <TopologyLightSpeedAction
                      contextKey={topologyLightspeedContext("config-failed", resource.label, data.status)}
                      intent="troubleshoot"
                      variant="link"
                      isInline
                    >
                      Troubleshoot with LightSpeed
                    </TopologyLightSpeedAction>
                  </div>
                </Alert>
              ) : null}
              <MtuMismatchAlerts warnings={mtuWarnings} diagnoseContextKey={networkMtuContext} />
            </>
          ),
          details: (
            <>
              <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
                <DescriptionListGroup>
                  <DescriptionListTerm>Kind</DescriptionListTerm>
                  <DescriptionListDescription>{RESOURCE_KIND_LABELS[data.kind]}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ResourceStatusField status={data.status} connectivity={connectivity} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {data.topologyMode ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Topology mode</DescriptionListTerm>
                    <DescriptionListDescription>{data.topologyMode}</DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                <DescriptionListGroup>
                  <DescriptionListTerm>Scope</DescriptionListTerm>
                  <DescriptionListDescription>{resource.targetNodeLabel}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Assigned workers</DescriptionListTerm>
                  <DescriptionListDescription>
                    {assignedWorkers.length > 0
                      ? assignedWorkers.map((w, idx) => (
                          <span key={w.id}>
                            {idx > 0 ? ", " : null}
                            {onSelectNode ? (
                              <Button variant="link" isInline onClick={() => onSelectNode(w.id)}>
                                {w.shortName}
                              </Button>
                            ) : (
                              <Link
                                to={`/compute/nodes/${w.hostname}`}
                                className="pf-v6-c-button pf-m-link pf-m-inline"
                              >
                                {w.shortName}
                              </Link>
                            )}
                          </span>
                        ))
                      : "None yet — use Resources tab or drag onto a bridge"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Description</DescriptionListTerm>
                  <DescriptionListDescription>{resource.detail}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              {data.detailPath ? (
                <Link to={data.detailPath} className="pf-v6-c-button pf-m-link pf-m-inline">
                  Open resource details <ExternalLinkAltIcon />
                </Link>
              ) : null}
              <QuickActions items={[traceAction]} />
            </>
          ),
          resources: (
            <div>
              {isLogical && onWorkerAssignmentChange ? (
                <>
                  <Title headingLevel="h3" size="md">
                    Worker node assignment
                  </Title>
                  <Content component="p" className="ocs-pf-topo-sidepanel__muted">
                    Map this network onto worker bridges. You can also drag from the network node onto a bridge.
                  </Content>
                  {workerCatalog.map((worker) => (
                    <Checkbox
                      key={worker.id}
                      id={`assign-${resource.id}-${worker.id}`}
                      className="ocs-pf-topo-sidepanel__check"
                      label={`${worker.shortName} (${worker.hostname})`}
                      isChecked={assigned.includes(worker.id)}
                      onChange={(_e, checked) => onWorkerAssignmentChange(resource.id, worker.id, checked)}
                    />
                  ))}
                  <Title headingLevel="h3" size="md">
                    Attachment summary
                  </Title>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Mapped workers</DescriptionListTerm>
                      <DescriptionListDescription>
                        {assigned.length} of {workerCatalog.length}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Expected bridge</DescriptionListTerm>
                      <DescriptionListDescription>br-int / OVN integration bridge</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </>
              ) : null}
              <Title headingLevel="h3" size="md">
                Workloads
              </Title>
              {workloads.length === 0 ? (
                <NoWorkloadsEmpty onAttach={handleAttach} />
              ) : (
                <DescriptionList isCompact>
                  {workloads.map((wl) => (
                    <DescriptionListGroup key={wl.id}>
                      <DescriptionListTerm>
                        {wl.kind === "vm" ? "VM" : "Pod"} ·{" "}
                        {wl.kind === "vm" ? (
                          <Link
                            to={vmDetailPath(wl.namespace, wl.label)}
                            className="pf-v6-c-button pf-m-link pf-m-inline"
                          >
                            {wl.label}
                          </Link>
                        ) : (
                          wl.label
                        )}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        <Link to={NAMESPACES_PATH} className="pf-v6-c-button pf-m-link pf-m-inline">
                          {wl.namespace}
                        </Link>
                        {" · "}
                        {wl.status}
                        {wl.ip ? ` · ${wl.ip}` : ""}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              )}
            </div>
          ),
          observe: (
            <ObserveMetrics
              objectLabel={resource.label}
              connectivity={connectivity}
              lightspeedContextKey={networkObserveContext}
            />
          ),
        })}
        {yamlModal ? (
          <ViewYamlModal
            isOpen
            resourceLabel={yamlModal.label}
            yaml={yamlModal.yaml}
            reviewContextKey={yamlModal.reviewContext}
            onClose={() => setYamlModal(null)}
            onSave={() =>
              onNotice?.({
                variant: "success",
                title: `Saved YAML for ${yamlModal.label} (prototype).`,
              })
            }
          />
        ) : null}
      </div>
    );
  }

  if (isWorkloadNodeData(data)) {
    const { attachment } = data;
    const workloadYaml = yamlForWorkload(attachment.label, attachment.namespace, attachment.kind);
    const workloadObserveContext = topologyLightspeedContext("observe", attachment.label);
    const workloadYamlReviewContext = topologyLightspeedContext("yaml-review", attachment.label);
    const connectivity: ConnectivitySummary =
      attachment.status === "Running"
        ? { label: "Healthy", color: "green", reason: `${attachment.label} is running.` }
        : attachment.status === "Failed"
          ? { label: "Unreachable", color: "red", reason: `${attachment.label} failed.` }
          : { label: "Degraded", color: "orange", reason: `${attachment.label} is pending.` };

    return (
      <div className="ocs-pf-topo-sidepanel">
        <PanelHeader
          badge={
            <Label isCompact color="blue">
              {attachment.kind === "vm" ? "VM" : "POD"}
            </Label>
          }
          title={attachment.label}
          actions={
            <TopologyResourceActionsMenu
              label={attachment.label}
              onConfigure={onConfigureResource ? () => onConfigureResource(selection) : undefined}
              configureLabel="Edit network attachment"
              onViewYaml={() =>
                setYamlModal({
                  label: attachment.label,
                  yaml: workloadYaml,
                  reviewContext: workloadYamlReviewContext,
                })
              }
              isOpen={actionsOpen}
              onOpenChange={setActionsOpen}
              showActionsLabel
            />
          }
          closeControl={closeControl}
        />
        {renderTabs({
          networkPath: networkPathTab,
          health:
            attachment.status !== "Running" ? (
              <Alert
                isInline
                variant={attachment.status === "Failed" ? "danger" : "warning"}
                title={attachment.status === "Failed" ? "Workload failed" : "Workload pending"}
                className="ocs-pf-topo-sidepanel__health"
              >
                {attachment.label} is {attachment.status.toLowerCase()} on {attachment.networkLabel}.
                <div className="ocs-pf-topo-sidepanel__lightspeed-inline pf-v6-u-mt-sm">
                  <TopologyLightSpeedAction
                    contextKey={topologyLightspeedContext("config-failed", attachment.label, attachment.status)}
                    intent="troubleshoot"
                    variant="link"
                    isInline
                  >
                    Troubleshoot with LightSpeed
                  </TopologyLightSpeedAction>
                </div>
              </Alert>
            ) : null,
          details: (
            <>
              <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
                <DescriptionListGroup>
                  <DescriptionListTerm>Kind</DescriptionListTerm>
                  <DescriptionListDescription>
                    {attachment.kind === "vm" ? "VirtualMachine" : "Pod"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>
                    {attachment.kind === "vm" ? (
                      <Link
                        to={vmDetailPath(attachment.namespace, attachment.label)}
                        className="pf-v6-c-button pf-m-link pf-m-inline"
                      >
                        {attachment.label}
                      </Link>
                    ) : (
                      attachment.label
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Namespace</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link to={NAMESPACES_PATH} className="pf-v6-c-button pf-m-link pf-m-inline">
                      {attachment.namespace}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Tooltip content={connectivity.reason}>
                      <span className="ocs-pf-topo-sidepanel__status-value">
                        <Label
                          isCompact
                          color={
                            attachment.status === "Running"
                              ? "green"
                              : attachment.status === "Failed"
                                ? "red"
                                : "orange"
                          }
                        >
                          {attachment.status}
                        </Label>
                        <Content component="small" className="ocs-pf-topo-sidepanel__muted pf-v6-u-display-block">
                          {connectivity.label}
                        </Content>
                      </span>
                    </Tooltip>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Network</DescriptionListTerm>
                  <DescriptionListDescription>
                    {attachment.networkId && onSelectNode ? (
                      <Button variant="link" isInline onClick={() => onSelectNode(attachment.networkId)}>
                        {attachment.networkLabel}
                      </Button>
                    ) : (
                      attachment.networkLabel
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {attachment.workerId ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Worker</DescriptionListTerm>
                    <DescriptionListDescription>
                      {onSelectNode ? (
                        <Button variant="link" isInline onClick={() => onSelectNode(attachment.workerId!)}>
                          {attachment.workerId}
                        </Button>
                      ) : (
                        attachment.workerId
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                {attachment.ip ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>IP address</DescriptionListTerm>
                    <DescriptionListDescription>{attachment.ip}</DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
              </DescriptionList>
              <QuickActions items={[traceAction]} />
            </>
          ),
          resources: (
            <>
              <Title headingLevel="h3" size="md">
                Network attachment
              </Title>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Primary network</DescriptionListTerm>
                  <DescriptionListDescription>
                    {attachment.networkId && onSelectNode ? (
                      <Button variant="link" isInline onClick={() => onSelectNode(attachment.networkId)}>
                        {attachment.networkLabel}
                      </Button>
                    ) : (
                      attachment.networkLabel
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Multus / NAD</DescriptionListTerm>
                  <DescriptionListDescription>default / ovn-kubernetes (prototype)</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Interface</DescriptionListTerm>
                  <DescriptionListDescription>eth0 · macvlan / OVN</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <Content component="p" className="ocs-pf-topo-sidepanel__muted">
                Drag this workload onto a network or bridge to request a new attachment (prototype).
              </Content>
            </>
          ),
          observe: (
            <ObserveMetrics
              objectLabel={attachment.label}
              connectivity={connectivity}
              lightspeedContextKey={workloadObserveContext}
            />
          ),
        })}
        {yamlModal ? (
          <ViewYamlModal
            isOpen
            resourceLabel={yamlModal.label}
            yaml={yamlModal.yaml}
            reviewContextKey={yamlModal.reviewContext}
            onClose={() => setYamlModal(null)}
            onSave={() =>
              onNotice?.({
                variant: "success",
                title: `Saved YAML for ${yamlModal.label} (prototype).`,
              })
            }
          />
        ) : null}
      </div>
    );
  }

  if (isWorkerGroupNodeData(data)) {
    const group = data.group;
    return (
      <div className="ocs-pf-topo-sidepanel">
        <PanelHeader
          badge={<LaneBadgeChip label={WORKER_BADGE} />}
          title={group.shortName}
          titleHref={`/compute/nodes/${encodeURIComponent(group.hostname)}`}
          actions={null}
          closeControl={closeControl}
        />
        {renderTabs({
          networkPath: networkPathTab,
          details: (
            <>
              <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
                <DescriptionListGroup>
                  <DescriptionListTerm>Hostname</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to={`/compute/nodes/${group.hostname}`}
                      className="pf-v6-c-button pf-m-link pf-m-inline"
                    >
                      {group.hostname}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Resources on node</DescriptionListTerm>
                  <DescriptionListDescription>{group.resources.length}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Underlay edges</DescriptionListTerm>
                  <DescriptionListDescription>{group.edges.length}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <Link to={`/compute/nodes/${group.hostname}`} className="pf-v6-c-button pf-m-link pf-m-inline">
                View node details
              </Link>
              <QuickActions items={[traceAction]} />
            </>
          ),
          resources: (
            <>
              <Link to={`/compute/nodes/${group.hostname}`} className="pf-v6-c-button pf-m-link pf-m-inline">
                Open compute node
              </Link>
              {onRequestRemoveWorkerGroup ? (
                <div>
                  <Button
                    variant="danger"
                    onClick={() =>
                      onRequestRemoveWorkerGroup({
                        id: group.id,
                        shortName: group.shortName,
                        hostname: group.hostname,
                      })
                    }
                  >
                    Remove from topology
                  </Button>
                </div>
              ) : null}
              <Title headingLevel="h3" size="md">
                Host resources
              </Title>
              {group.resources.length === 0 ? (
                <Content component="p" className="ocs-pf-topo-sidepanel__muted">
                  No host resources on this worker.
                </Content>
              ) : (
                <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
                  {group.resources.map((resource) => (
                    <DescriptionListGroup key={resource.id}>
                      <DescriptionListTerm>
                        {onSelectNode ? (
                          <Button variant="link" isInline onClick={() => onSelectNode(resource.id)}>
                            {resource.label}
                          </Button>
                        ) : (
                          resource.label
                        )}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {RESOURCE_KIND_LABELS[resource.kind]} · {RESOURCE_INSTALL_STATUS_LABELS[resource.status]}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              )}
              <Title headingLevel="h3" size="md">
                Networks on this node
              </Title>
              <ul className="ocs-pf-topo-sidepanel__list">
                {standaloneResources.filter(isLogicalNetworkStandalone).map((logical) => {
                  const isAssigned = (networkNodeAssignments[logical.id] ?? []).includes(group.id);
                  return (
                    <li key={logical.id}>
                      <Checkbox
                        id={`group-assign-${group.id}-${logical.id}`}
                        label={logical.label}
                        isChecked={isAssigned}
                        isDisabled={!onWorkerAssignmentChange}
                        onChange={(_e, checked) => onWorkerAssignmentChange?.(logical.id, group.id, checked)}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          ),
          observe: <ObserveMetrics objectLabel={group.shortName} />,
        })}
      </div>
    );
  }

  if (isLogicalLaneNodeData(data)) {
    const isWorkloadLane = selection.id === WORKLOAD_LANE_ID;
    const logicalNetworks = standaloneResources.filter(isLogicalNetworkStandalone);
    const cudnCount = logicalNetworks.filter((resource) => resource.kind === "cudn").length;
    const udnCount = logicalNetworks.filter((resource) => resource.kind === "udn").length;
    const assignedWorkerCount = new Set(
      Object.values(networkNodeAssignments).flatMap((workerIds) => workerIds)
    ).size;

    const workloadAttachments = isWorkloadLane
      ? logicalNetworks.flatMap((network) =>
          attachmentsForNetwork(network.label, network.id, dataScale).map((attachment) => ({
            ...attachment,
            networkId: network.id,
            selectId: `${attachment.id}__${network.id}`,
          }))
        )
      : [];

    const laneTitle = isWorkloadLane ? "Pods & VMs" : "Logical networks";
    const laneBadge = isWorkloadLane ? "WL" : LANE_BADGE;

    return (
      <div className="ocs-pf-topo-sidepanel">
        <PanelHeader
          badge={<LaneBadgeChip label={laneBadge} />}
          title={laneTitle}
          actions={null}
          closeControl={closeControl}
        />
        {renderTabs({
          networkPath: networkPathTab,
          details: (
            <>
              <Content component="p" className="ocs-pf-topo-sidepanel__muted">
                {isWorkloadLane
                  ? "Workload attachments grouped by logical network. Select an item below to inspect a Pod or VM."
                  : "Cluster-scoped and project-scoped user-defined networks. Select a network below to open its inspector."}
              </Content>
              <DescriptionList isCompact className="ocs-pf-topo-sidepanel__dl">
                {isWorkloadLane ? (
                  <>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Attached workloads</DescriptionListTerm>
                      <DescriptionListDescription>{workloadAttachments.length}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Parent networks</DescriptionListTerm>
                      <DescriptionListDescription>{logicalNetworks.length}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </>
                ) : (
                  <>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Total networks</DescriptionListTerm>
                      <DescriptionListDescription>{logicalNetworks.length}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>ClusterUserDefinedNetworks</DescriptionListTerm>
                      <DescriptionListDescription>{cudnCount}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>UserDefinedNetworks</DescriptionListTerm>
                      <DescriptionListDescription>{udnCount}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Workers with assignments</DescriptionListTerm>
                      <DescriptionListDescription>{assignedWorkerCount}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </>
                )}
              </DescriptionList>
            </>
          ),
          resources: (
            <>
              <Title headingLevel="h3" size="md">
                {isWorkloadLane ? "Attached workloads" : "Networks in this lane"}
              </Title>
              {isWorkloadLane ? (
                workloadAttachments.length > 0 ? (
                  <ul className="ocs-pf-topo-sidepanel__list">
                    {workloadAttachments.map((attachment) => (
                      <li key={attachment.selectId}>
                        {onSelectNode ? (
                          <Button variant="link" isInline onClick={() => onSelectNode(attachment.selectId)}>
                            {attachment.label}
                          </Button>
                        ) : (
                          attachment.label
                        )}
                        <Content component="small" className="ocs-pf-topo-sidepanel__muted">
                          {attachment.kind === "vm" ? "VirtualMachine" : "Pod"} · {attachment.namespace} ·{" "}
                          {attachment.networkLabel}
                        </Content>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Content component="p" className="ocs-pf-topo-sidepanel__muted">
                    No workload attachments in this view.
                  </Content>
                )
              ) : logicalNetworks.length > 0 ? (
                <ul className="ocs-pf-topo-sidepanel__list">
                  {logicalNetworks.map((network) => (
                    <li key={network.id}>
                      {onSelectNode ? (
                        <Button variant="link" isInline onClick={() => onSelectNode(network.id)}>
                          {network.label}
                        </Button>
                      ) : (
                        network.label
                      )}
                      <Content component="small" className="ocs-pf-topo-sidepanel__muted">
                        {RESOURCE_KIND_LABELS[network.kind]}
                        {network.topologyMode ? ` · ${network.topologyMode}` : ""}
                      </Content>
                    </li>
                  ))}
                </ul>
              ) : (
                <Content component="p" className="ocs-pf-topo-sidepanel__muted">
                  No logical networks in this cluster.
                </Content>
              )}
            </>
          ),
          observe: <ObserveMetrics objectLabel={laneTitle} />,
        })}
      </div>
    );
  }

  return (
    <div className="ocs-pf-topo-sidepanel">
      <PanelHeader
        badge={<LaneBadgeChip label="?" />}
        title="Selection"
        actions={null}
        closeControl={closeControl}
      />
      <Content component="p" className="ocs-pf-topo-sidepanel__muted">
        Select a resource, worker, or network on the graph to view details.
      </Content>
      <Button variant="link" onClick={onClose}>
        Close inspector
      </Button>
    </div>
  );
}
