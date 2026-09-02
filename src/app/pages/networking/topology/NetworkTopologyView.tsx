import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Card,
  CardBody,
  CardTitle,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
} from "@patternfly/react-core";
import {
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  GRAPH_LAYOUT_END_EVENT,
  Point,
  SELECTION_EVENT,
  TopologyControlBar,
  TopologySideBar,
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
} from "@patternfly/react-topology";
import "@patternfly/react-topology/dist/esm/css/topology-view.css";
import "@patternfly/react-topology/dist/esm/css/topology-controlbar.css";
import "@patternfly/react-topology/dist/esm/css/topology-side-bar.css";
import "@patternfly/react-topology/dist/esm/css/topology-components.css";
import { useToast } from "../../../contexts/ToastContext";
import {
  NNC_PROFILE_OPTIONS,
  WORKER_NODE_GROUPS,
  type NetworkNodeAssignments,
  type NncProfile,
  type StandaloneTopologyResource,
  type TopologyCrossEdge,
  type TopologyDataScale,
  type WorkerNodeGroup,
} from "../networkTopologyData";
import type { TopologyStep } from "../networkTopologyTypes";
import NetworkTopologyCreatePanel, {
  type NetworkTopologyNncWizardProps,
} from "../NetworkTopologyCreatePanel";
import NodeNetworkTableList from "../NodeNetworkTableList";
import TopologyResizableSplit from "../TopologyResizableSplit";
import TopologyViewToggle from "../TopologyViewToggle";
import type { NetworkCreateResource } from "../networkingCreateModals";
import type { NadRecord, NncpRecord, UdnRecord } from "../networkingMockData";
import type { NodeNetworkViewMode } from "../nodeNetworkViewMode";
import type { ResourceLifecycleAction, ResourceLifecycleTarget } from "../networkTopologyState";
import { networkTopologyComponentFactory } from "./componentFactory";
import { networkTopologyLayoutFactory } from "./layoutFactory";
import {
  clearPathHighlightIds,
  setPathHighlightIds,
  setTopologyActionHandlers,
} from "./topologyActionHandlers";
import TopologyDetailPanel, { type TopologyDetailSelection } from "./TopologyDetailPanel";
import {
  isConnectionEdgeData,
  isLogicalNetworkNodeData,
  isResourceNodeData,
  isWorkerGroupNodeData,
  isWorkloadNodeData,
  type ConnectionEdgeData,
  type NetworkTopologyNodeData,
} from "./topologyNodeData";
import { TopologyUnifiedToolbar } from "./TopologyToolbars";
import { resolveConfigurePath } from "./topologyConfigureNavigate";
import { useNetworkTopologyModel } from "./useNetworkTopologyModel";
import { type TopologyPerspective, type TopologyResourceFilter, computeFilterCounts } from "./topologyPerspective";
import { DEFAULT_TOPOLOGY_LAYOUT, type TopologyLayoutId } from "./topologyLayouts";
import { clearGraphEdgeBendpoints } from "./topologyGroupLayout";
import { focusTopologySelection } from "./topologyFocus";
import TopologyMinimap from "./TopologyMinimap";
import { TopologyLightSpeedAction } from "./TopologyLightSpeedAction";
import { topologyLightspeedContext } from "./topologyLightspeed";
import { TopologyKindIcon } from "./topologyKindIcons";
import {
  hasActivePath,
  resolveTopologyPathHighlight,
  type TopologyPathHighlight,
} from "../topologyPathHighlight";
import {
  resolveTableResourceConnections,
  resolveTopologyDetailSelection,
} from "./topologyTableSupport";
import "./topologyStyles.css";

function flattenPathHighlightIds(highlight: TopologyPathHighlight, modelNodeIds: string[]): Set<string> {
  const ids = new Set<string>();
  highlight.resourceIds.forEach((id) => ids.add(id));
  highlight.groupIds.forEach((id) => ids.add(id));
  highlight.edgeKeys.forEach((id) => ids.add(id));
  highlight.crossEdgeIds.forEach((id) => ids.add(id));
  // Workload nodes use `${attachmentId}__${networkId}`; match by attachment id prefix.
  highlight.workloadKeys.forEach((key) => {
    const suffix = key.includes("/") ? key.split("/").pop() : key.replace(/^vm:/, "");
    modelNodeIds.forEach((nodeId) => {
      if (suffix && (nodeId.includes(suffix) || nodeId.startsWith(key))) {
        ids.add(nodeId);
      }
    });
  });
  return ids;
}

export type NetworkTopologyPanelProps = {
  groups?: WorkerNodeGroup[];
  standaloneResources?: StandaloneTopologyResource[];
  crossEdges?: TopologyCrossEdge[];
  networkNodeAssignments?: NetworkNodeAssignments;
  revealedGroupIds?: string[];
  onStandaloneResourcesChange?: (resources: StandaloneTopologyResource[]) => void;
  onCrossEdgesChange?: (edges: TopologyCrossEdge[] | ((prev: TopologyCrossEdge[]) => TopologyCrossEdge[])) => void;
  onWorkerAssignmentChange?: (logicalId: string, workerId: string, assigned: boolean) => void;
  onGroupsChange?: (groups: WorkerNodeGroup[]) => void;
  onResourceLifecycleAction?: (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => void;
  onAttachStandaloneToGroup?: (resourceId: string, groupId: string, connectToResourceId?: string) => void;
  onCreateResource?: (resource: NetworkCreateResource) => void;
  onOpenWorkerNodeModal?: () => void;
  onRequestRemoveWorkerGroup?: (worker: { id: string; shortName: string; hostname: string }) => void;
  onNadCreated?: (record: NadRecord) => void;
  onUdnCreated?: (record: UdnRecord) => void;
  onCudnCreated?: (record: UdnRecord) => void;
  onNncpCreated?: (record: NncpRecord) => void;
  nncWizard?: NetworkTopologyNncWizardProps;
  activeStep?: TopologyStep;
  physicalNetworkName?: string;
  provisionGeneration?: number;
  nncProfiles?: NncProfile[];
  onPhysicalNetworkChange?: (physicalNetworkName: string) => void;
  fitContentToken?: number;
  highlightResourceSuffix?: string;
  viewMode?: NodeNetworkViewMode;
  onViewModeChange?: (mode: NodeNetworkViewMode) => void;
  /** Hide Create in the canvas toolbar when it is shown next to the page title. */
  hideToolbarCreateActions?: boolean;
  activeCreateResource?: NetworkCreateResource | null;
  onActiveCreateResourceChange?: (resource: NetworkCreateResource | null) => void;
  topologyScale?: TopologyDataScale;
  onTopologyScaleChange?: (scale: TopologyDataScale) => void;
};

type ResourceFilterValue = TopologyResourceFilter;

const LEGEND_RESOURCES: { kind: string; title: string; blurb: string }[] = [
  { kind: "interface", title: "NIC", blurb: "Physical or virtual host interface (ens, eth, eno)." },
  { kind: "bridge", title: "Bridge", blurb: "Linux or OVS bridge (br-int, br-ex) for NICs, bonds, and VLANs." },
  { kind: "tunnel", title: "Tunnel", blurb: "Geneve or VXLAN overlay used by OVN." },
  { kind: "port", title: "Port", blurb: "Patch or OVS port connecting bridges and overlays." },
  { kind: "cudn", title: "Logical network", blurb: "UserDefinedNetwork or ClusterUserDefinedNetwork." },
  { kind: "vm", title: "VM", blurb: "Virtual machine attached to a network." },
  { kind: "pod", title: "Pod", blurb: "Workload pod attached to a network." },
];

function TopologyLegend() {
  return (
    <Card className="ocs-pf-topo-legend" isCompact role="note" aria-label="Network resource types">
      <CardTitle>Network resources</CardTitle>
      <CardBody>
        {LEGEND_RESOURCES.map((item) => (
          <div key={item.title} className="ocs-pf-topo-legend__row">
            <span className="ocs-pf-topo-legend__icon" aria-hidden>
              <TopologyKindIcon kind={item.kind} size={16} />
            </span>
            <div className="ocs-pf-topo-legend__copy">
              <strong>{item.title}</strong>
              <span>{item.blurb}</span>
            </div>
          </div>
        ))}
        <p className="ocs-pf-topo-legend__hint">Dashed edges connect a logical network to a bridge. Click a node for details.</p>
      </CardBody>
    </Card>
  );
}

export default function NetworkTopologyView({
  groups = WORKER_NODE_GROUPS,
  standaloneResources = [],
  crossEdges = [],
  networkNodeAssignments = {},
  revealedGroupIds = [],
  onWorkerAssignmentChange,
  onGroupsChange,
  onResourceLifecycleAction,
  onAttachStandaloneToGroup,
  onOpenWorkerNodeModal,
  onRequestRemoveWorkerGroup,
  onNadCreated,
  onUdnCreated,
  onCudnCreated,
  onNncpCreated,
  nncWizard,
  physicalNetworkName,
  provisionGeneration = 0,
  nncProfiles = NNC_PROFILE_OPTIONS,
  onPhysicalNetworkChange,
  fitContentToken = 0,
  viewMode = "topology",
  onViewModeChange,
  hideToolbarCreateActions = false,
  activeCreateResource: activeCreateResourceProp,
  onActiveCreateResourceChange,
  topologyScale = "scale",
  onTopologyScaleChange,
}: NetworkTopologyPanelProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterKind, setFilterKind] = useState<ResourceFilterValue>("all");
  const [showLegend, setShowLegend] = useState(false);
  const [layoutId, setLayoutId] = useState<TopologyLayoutId>(DEFAULT_TOPOLOGY_LAYOUT);
  const [displayLabels, setDisplayLabels] = useState(true);
  const [hideManagementPorts, setHideManagementPorts] = useState(false);
  const [perspective, setPerspective] = useState<TopologyPerspective>("host");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [pathTraceActive, setPathTraceActive] = useState(false);
  const [internalCreateResource, setInternalCreateResource] = useState<NetworkCreateResource | null>(null);
  const activeCreateResource = activeCreateResourceProp !== undefined ? activeCreateResourceProp : internalCreateResource;
  const setActiveCreateResource = useCallback(
    (resource: NetworkCreateResource | null) => {
      if (onActiveCreateResourceChange) {
        onActiveCreateResourceChange(resource);
        return;
      }
      setInternalCreateResource(resource);
      if (resource) nncWizard?.onOpen?.();
    },
    [onActiveCreateResourceChange, nncWizard]
  );
  const { pushToast } = useToast();

  const notify = useCallback(
    (notice: { title: string; variant: "success" | "warning" | "info" }) => {
      pushToast({ title: notice.title, variant: notice.variant });
    },
    [pushToast]
  );

  const layoutName = layoutId;

  const filterCounts = useMemo(
    () =>
      computeFilterCounts({
        perspective,
        groups,
        standaloneResources,
        networkNodeAssignments,
        revealedGroupIds,
        dataScale: topologyScale,
      }),
    [perspective, groups, standaloneResources, networkNodeAssignments, revealedGroupIds, topologyScale]
  );

  const model = useNetworkTopologyModel({
    groups,
    standaloneResources,
    crossEdges,
    networkNodeAssignments,
    revealedGroupIds,
    searchTerm: debouncedSearchTerm,
    filterKind,
    layoutName,
    perspective,
    dataScale: topologyScale,
    hideManagementPorts,
  });

  const controllerRef = useRef<Visualization | null>(null);
  const fitAfterLayoutRef = useRef(true);
  const layoutScopeRef = useRef("");
  const prevModelStructureKeyRef = useRef("");

  const modelStructureKey = useMemo(() => {
    const nodeKey =
      model.nodes
        ?.map((node) => {
          const grouped = node.group ? "g" : "n";
          const childCount = node.children?.length ?? 0;
          return `${node.id}:${node.type ?? ""}:${grouped}:${childCount}`;
        })
        .sort()
        .join("|") ?? "";
    const edgeKey =
      model.edges?.map((edge) => `${edge.id}:${edge.source}->${edge.target}`).sort().join("|") ?? "";
    return `${nodeKey}::${edgeKey}`;
  }, [model]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 200);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);


  const controller = useMemo(() => {
    const visualization = new Visualization();
    visualization.registerLayoutFactory(networkTopologyLayoutFactory);
    visualization.registerComponentFactory(networkTopologyComponentFactory);
    visualization.addEventListener(SELECTION_EVENT, (ids: string[]) => {
      setSelectedIds(Array.isArray(ids) ? ids : []);
    });
    visualization.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
      try {
        clearGraphEdgeBendpoints(visualization.getGraph());
      } catch {
        /* graph may not be ready yet */
      }
      if (!fitAfterLayoutRef.current) return;
      fitAfterLayoutRef.current = false;
      try {
        visualization.getGraph().fit(120);
      } catch {
        /* graph may not be ready yet */
      }
    });
    visualization.fromModel(model, false);
    controllerRef.current = visualization;
    return visualization;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const layoutScope = `${layoutName}-${perspective}`;
    const shouldFit = layoutScopeRef.current !== layoutScope;
    const structureChanged = prevModelStructureKeyRef.current !== modelStructureKey;

    controller.fromModel(model, true);
    if (!structureChanged && !shouldFit) {
      return;
    }

    layoutScopeRef.current = layoutScope;
    prevModelStructureKeyRef.current = modelStructureKey;

    try {
      action(() => {
        const graph = controller.getGraph();
        const savedScale = graph.getScale();
        const savedPosition = new Point(graph.getPosition().x, graph.getPosition().y);
        const type = graph.getLayout() ?? layoutName;
        // setLayout can emit GRAPH_LAYOUT_END; do not consume the fit flag there.
        fitAfterLayoutRef.current = false;
        graph.setLayout(undefined);
        graph.setLayout(type);
        fitAfterLayoutRef.current = shouldFit;
        graph.layout();
        clearGraphEdgeBendpoints(graph);
        if (shouldFit) {
          try {
            graph.fit(120);
          } catch {
            /* graph may not be ready yet */
          }
        } else {
          graph.setScale(savedScale);
          graph.setPosition(savedPosition);
        }
      })();
    } catch {
      /* graph may not be ready yet */
    }
  }, [controller, model, modelStructureKey, layoutName, perspective]);

  useEffect(() => {
    const state = controller.getState() as { selectedIds?: string[] };
    state.selectedIds = selectedIds;
  }, [controller, selectedIds]);

  useEffect(() => {
    if (!fitContentToken) return;
    try {
      controller.getGraph().fit(120);
    } catch {
      /* ignore */
    }
  }, [controller, fitContentToken]);

  // Deep-link: /networking/topology?highlight=<nodeId>
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (!highlight) return;
    const match =
      model.nodes?.find((n) => {
        if (n.id === highlight) return true;
        if (n.id.includes(highlight)) return true;
        const data = n.data as NetworkTopologyNodeData | undefined;
        if (!data) return false;
        if ("resource" in data && data.resource) {
          const r = data.resource;
          if (r.id === highlight || r.label === highlight || r.id.endsWith(highlight)) return true;
        }
        if ("group" in data && data.group && (data.group.id === highlight || data.group.hostname === highlight)) {
          return true;
        }
        if ("attachment" in data && data.attachment && data.attachment.id === highlight) return true;
        return false;
      }) ?? null;
    if (match) {
      setSelectedIds([match.id]);
      requestAnimationFrame(() => {
        try {
          controller.getGraph().fit(120);
        } catch {
          /* ignore */
        }
      });
      const next = new URLSearchParams(searchParams);
      next.delete("highlight");
      setSearchParams(next, { replace: true });
    }
  }, [controller, model.nodes, searchParams, setSearchParams]);

  useEffect(() => {
    requestAnimationFrame(() => {
      focusTopologySelection(controller, selectedIds[0] ?? null);
    });
  }, [controller, selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedId = selectedIds[0] ?? null;
  const selectedData = useMemo((): TopologyDetailSelection | null => {
    if (!selectedId) return null;
    return resolveTopologyDetailSelection(selectedId, model, groups, standaloneResources);
  }, [model, selectedId, groups, standaloneResources]);

  const getTableResourceConnections = useCallback(
    (groupId: string, resourceId: string) =>
      resolveTableResourceConnections(groupId, resourceId, groups, standaloneResources, crossEdges),
    [groups, standaloneResources, crossEdges]
  );

  const handleConfigureResource = useCallback(
    (selection: TopologyDetailSelection) => {
      if (selection.edgeData) {
        notify({
          title: "Configure this connection via the associated NNCP or network resource",
          variant: "info",
        });
        return;
      }
      const path = resolveConfigurePath(selection);
      if (path) {
        navigate(path, { state: { fromTopology: true } });
      }
    },
    [navigate, notify]
  );

  const clearPathTrace = useCallback(() => {
    setPathTraceActive(false);
    clearPathHighlightIds();
  }, []);

  const prevScaleRef = useRef<TopologyDataScale>(topologyScale);

  useEffect(() => {
    if (prevScaleRef.current === topologyScale) return;
    prevScaleRef.current = topologyScale;
    setSelectedIds([]);
    setFilterKind("all");
    clearPathTrace();
    fitAfterLayoutRef.current = true;
  }, [topologyScale, clearPathTrace]);

  const handleTracePath = useCallback(
    (selection: TopologyDetailSelection) => {
      let anchorResourceId: string | null = null;
      let anchorGroupId: string | null = null;

      if (selection.edgeData) {
        const edge = model.edges?.find((e) => e.id === selection.id);
        anchorResourceId = edge?.source ?? null;
      } else if (selection.data) {
        if (isResourceNodeData(selection.data) || isLogicalNetworkNodeData(selection.data)) {
          anchorResourceId = selection.data.resource.id;
        } else if (isWorkerGroupNodeData(selection.data)) {
          anchorGroupId = selection.data.group.id;
        } else if (isWorkloadNodeData(selection.data)) {
          anchorResourceId = selection.data.attachment.networkId || null;
        }
      }

      const edgesByGroup: Record<string, (typeof groups)[0]["edges"]> = {};
      groups.forEach((group) => {
        edgesByGroup[group.id] = group.edges;
      });

      const highlight = resolveTopologyPathHighlight({
        anchorResourceId,
        anchorGroupId,
        groups,
        standaloneResources,
        crossEdges,
        edgesByGroup,
        networkNodeAssignments,
      });

      const modelNodeIds = (model.nodes ?? []).map((n) => n.id);
      const ids = flattenPathHighlightIds(highlight, modelNodeIds);
      if (selection.id) ids.add(selection.id);
      // Include topology edges whose endpoints are on the path.
      (model.edges ?? []).forEach((edge) => {
        if (ids.has(edge.source ?? "") && ids.has(edge.target ?? "")) {
          ids.add(edge.id);
        }
      });

      setPathHighlightIds(ids);
      setPathTraceActive(hasActivePath(highlight) || ids.size > 0);
      notify({
        title: `Path trace: ${ids.size} topology element${ids.size === 1 ? "" : "s"} highlighted`,
        variant: "info",
      });
    },
    [
      model.edges,
      model.nodes,
      groups,
      standaloneResources,
      crossEdges,
      networkNodeAssignments,
      notify,
    ]
  );

  const handleTracePathFromElementId = useCallback(
    (elementId: string) => {
      const node = model.nodes?.find((n) => n.id === elementId);
      if (node?.data) {
        handleTracePath({ id: elementId, data: node.data as NetworkTopologyNodeData });
        return;
      }
      const edge = model.edges?.find((e) => e.id === elementId);
      if (edge?.data && isConnectionEdgeData(edge.data)) {
        handleTracePath({ id: elementId, edgeData: edge.data as ConnectionEdgeData });
      }
    },
    [handleTracePath, model.edges, model.nodes]
  );

  const handleAssignInterface = useCallback(
    (resourceId: string, interfaceId: string) => {
      if (!onGroupsChange) {
        notify({
          title: `Interface assignment requested (prototype): ${interfaceId} → ${resourceId}`,
          variant: "info",
        });
        return;
      }
      let assignedLabel = interfaceId;
      const next = groups.map((group) => {
        const resource = group.resources.find((r) => r.id === resourceId);
        if (!resource) return group;
        const iface = group.resources.find((r) => r.id === interfaceId);
        if (iface) assignedLabel = iface.label;
        const related = [...(resource.related ?? [])];
        if (!related.includes(interfaceId) && !related.includes(iface?.label ?? "")) {
          related.push(iface?.label ?? interfaceId);
        }
        const edgeId = `${interfaceId}__${resourceId}`;
        const hasEdge = group.edges.some(
          (e) =>
            e.id === edgeId ||
            (e.from === interfaceId && e.to === resourceId) ||
            (e.from === resourceId && e.to === interfaceId)
        );
        return {
          ...group,
          resources: group.resources.map((r) => (r.id === resourceId ? { ...r, related } : r)),
          edges: hasEdge ? group.edges : [...group.edges, { id: edgeId, from: interfaceId, to: resourceId }],
        };
      });
      onGroupsChange(next);
      notify({
        title: `Assigned ${assignedLabel} to resource`,
        variant: "success",
      });
    },
    [groups, onGroupsChange, notify]
  );

  const handleUnassignInterface = useCallback(
    (resourceId: string, interfaceId: string) => {
      if (!onGroupsChange) {
        notify({
          title: `Interface removal requested (prototype): ${interfaceId} from ${resourceId}`,
          variant: "info",
        });
        return;
      }
      let removedLabel = interfaceId;
      const next = groups.map((group) => {
        const resource = group.resources.find((r) => r.id === resourceId);
        if (!resource) return group;
        const iface = group.resources.find((r) => r.id === interfaceId || r.label === interfaceId);
        if (iface) removedLabel = iface.label;
        const ifaceId = iface?.id ?? interfaceId;
        const ifaceLabel = iface?.label ?? interfaceId;
        const related = (resource.related ?? []).filter((rel) => rel !== ifaceId && rel !== ifaceLabel);
        const edges = group.edges.filter(
          (edge) =>
            !(
              (edge.from === ifaceId && edge.to === resourceId) ||
              (edge.to === ifaceId && edge.from === resourceId)
            )
        );
        return {
          ...group,
          resources: group.resources.map((r) => (r.id === resourceId ? { ...r, related } : r)),
          edges,
        };
      });
      onGroupsChange(next);
      notify({
        title: `Removed ${removedLabel} from resource`,
        variant: "success",
      });
    },
    [groups, onGroupsChange, notify]
  );

  const handleAttachWorkload = useCallback(
    (selection: TopologyDetailSelection) => {
      const path = resolveConfigurePath(selection);
      if (path) {
        navigate(`${path}?tab=virtualization`, { state: { fromTopology: true, tab: "virtualization" } });
        notify({
          title: "Opening network Virtualization tab to attach a workload",
          variant: "info",
        });
        return;
      }
      notify({
        title: "Attach workload (prototype) — open the network detail page Virtualization tab",
        variant: "info",
      });
    },
    [navigate, notify]
  );

  const handleSelectNode = useCallback((id: string) => {
    setSelectedIds([id]);
  }, []);

  useEffect(() => {
    setTopologyActionHandlers({
      onResourceLifecycleAction,
      onNotice: notify,
      onRequestRemoveWorkerGroup,
      onSelectNode: handleSelectNode,
      onOpenCreate: () => {
        setActiveCreateResource("cluster-user-defined-network");
      },
      onOpenWorkerModal: onOpenWorkerNodeModal,
      onWorkerAssignmentChange,
      onAttachStandaloneToGroup,
      onGroupsChange,
      getGroups: () => groups,
      onTracePath: handleTracePath,
      onTracePathFromElementId: handleTracePathFromElementId,
      onNavigate: (path) => navigate(path),
      onConfigureSelection: handleConfigureResource,
    });
  }, [
    onResourceLifecycleAction,
    notify,
    onRequestRemoveWorkerGroup,
    onOpenWorkerNodeModal,
    setActiveCreateResource,
    onWorkerAssignmentChange,
    onAttachStandaloneToGroup,
    onGroupsChange,
    groups,
    handleSelectNode,
    handleTracePath,
    handleTracePathFromElementId,
    navigate,
    handleConfigureResource,
  ]);

  const controlButtons = useMemo(
    () =>
      createTopologyControlButtons({
        ...defaultControlButtonsOptions,
        zoomInCallback: action(() => {
          controller.getGraph().scaleBy(4 / 3);
        }),
        zoomOutCallback: action(() => {
          controller.getGraph().scaleBy(0.75);
        }),
        fitToScreenCallback: action(() => {
          controller.getGraph().fit(120);
        }),
        resetViewCallback: action(() => {
          fitAfterLayoutRef.current = true;
          const graph = controller.getGraph();
          graph.reset();
          const type = graph.getLayout();
          if (type) {
            graph.setLayout(undefined);
            graph.setLayout(type);
          }
          graph.layout();
        }),
        legend: true,
        legendTip: "Show or hide the network resource legend",
        legendAriaLabel: "Network resource legend",
        legendCallback: action(() => {
          setShowLegend((prev) => !prev);
        }),
      }),
    [controller]
  );

  const resetLayout = useCallback(
    action(() => {
      fitAfterLayoutRef.current = true;
      const graph = controller.getGraph();
      graph.reset();
      const type = graph.getLayout() ?? layoutName;
      graph.setLayout(undefined);
      graph.setLayout(type);
      graph.layout();
    }),
    [controller, layoutName]
  );

  const isCreateEnabled = Boolean(
    nncWizard || onNadCreated || onUdnCreated || onCudnCreated || onNncpCreated
  );

  const showNncSwitcher =
    provisionGeneration > 0 && Boolean(physicalNetworkName) && Boolean(onPhysicalNetworkChange);

  const toolbarProps = {
    perspective,
    onPerspectiveChange: (next: TopologyPerspective) => {
      setPerspective(next);
      setSelectedIds([]);
      setFilterKind("all");
      if (next !== "host") {
        setLayoutId((current) =>
          current === "DagreLR" || current === "DagreTB" ? "ClusterPerspective" : current
        );
      }
    },
    searchTerm,
    onSearchTermChange: setSearchTerm,
    filterKind,
    onFilterKindChange: setFilterKind,
    filterCounts,
    viewMode,
    onViewModeChange,
    onShowShortcuts: () => setShortcutsOpen(true),
    displayLabels,
    onDisplayLabelsChange: setDisplayLabels,
    hideManagementPorts,
    onHideManagementPortsChange: setHideManagementPorts,
    ...(onTopologyScaleChange
      ? {
          topologyScale,
          onTopologyScaleChange,
        }
      : {}),
    layoutId,
    onLayoutIdChange: (nextLayout: TopologyLayoutId) => {
      fitAfterLayoutRef.current = true;
      setLayoutId(nextLayout);
    },
    onResetLayout: viewMode === "topology" ? resetLayout : undefined,
    isCreateEnabled,
    onCreateSelect: setActiveCreateResource,
    showNncSwitcher,
    physicalNetworkName,
    nncProfiles,
    onPhysicalNetworkChange,
    showCreateActions: !hideToolbarCreateActions,
  } as const;

  const unifiedToolbar = <TopologyUnifiedToolbar {...toolbarProps} embedded={viewMode === "topology"} />;

  const sideBar = (
    <TopologySideBar show={Boolean(selectedId)} resizable className="ocs-pf-topo-sidebar">
      <TopologyDetailPanel
        selection={selectedData}
        networkNodeAssignments={networkNodeAssignments}
        standaloneResources={standaloneResources}
        groups={groups}
        onWorkerAssignmentChange={onWorkerAssignmentChange}
        onResourceLifecycleAction={onResourceLifecycleAction}
        onNotice={notify}
        onRequestRemoveWorkerGroup={onRequestRemoveWorkerGroup}
        onConfigureResource={handleConfigureResource}
        onSelectNode={handleSelectNode}
        onAssignInterface={handleAssignInterface}
        onUnassignInterface={handleUnassignInterface}
        onTracePath={handleTracePath}
        onAttachWorkload={handleAttachWorkload}
        onClose={clearSelection}
        dataScale={topologyScale}
      />
    </TopologySideBar>
  );

  const topologyCanvas = (
    <div
      className={`ocs-pf-topo-canvas-wrap${displayLabels ? "" : " ocs-pf-topo-canvas-wrap--hide-labels"}${
        pathTraceActive ? " ocs-pf-topo-canvas-wrap--path-trace" : ""
      }`}
    >
      <TopologyView
        contextToolbar={null}
        viewToolbar={unifiedToolbar}
        controlBar={<TopologyControlBar controlButtons={controlButtons} />}
        sideBar={sideBar}
        sideBarOpen={Boolean(selectedId)}
        sideBarResizable
        defaultSideBarSize="380px"
        minSideBarSize="280px"
        maxSideBarSize="480px"
      >
        <VisualizationProvider controller={controller}>
          <VisualizationSurface state={{ selectedIds }} />
        </VisualizationProvider>
      </TopologyView>
      {pathTraceActive ? (
        <div className="ocs-pf-topo-trace-banner">
          <Label
            color="blue"
            onClose={clearPathTrace}
            closeBtnAriaLabel="Clear path trace"
          >
            Path trace active — Clear trace
          </Label>
        </div>
      ) : null}
      {filterKind === "unhealthy" ? (
        <div className="ocs-pf-topo-lightspeed-banner">
          <TopologyLightSpeedAction
            contextKey={topologyLightspeedContext("unhealthy-overview")}
            intent="troubleshoot"
            variant="secondary"
            size="sm"
          >
            Triage unhealthy resources with LightSpeed
          </TopologyLightSpeedAction>
        </div>
      ) : null}
      {showLegend ? <TopologyLegend /> : null}
      <TopologyMinimap
        controller={controller}
        selectedIds={selectedIds}
        refreshKey={`${perspective}-${layoutId}-${modelStructureKey}`}
      />
    </div>
  );

  return (
    <div className="ocs-net-topo-panel ocs-pf-topo-shell">
      <div className="ocs-net-topo-panel__stage">
        {viewMode === "table" ? (
          <div className="ocs-net-topo-panel__list-mode">
            <Drawer isExpanded={Boolean(selectedId)} isInline position="end">
              <DrawerContent
                panelContent={
                  selectedId ? (
                    <DrawerPanelContent
                      isPlain
                      className="ocs-net-topo-detail-drawer"
                      widths={{ default: "width_33" }}
                      focusTrap={{ enabled: true }}
                    >
                      <TopologyDetailPanel
                        selection={selectedData}
                        networkNodeAssignments={networkNodeAssignments}
                        standaloneResources={standaloneResources}
                        groups={groups}
                        onWorkerAssignmentChange={onWorkerAssignmentChange}
                        onResourceLifecycleAction={onResourceLifecycleAction}
                        onNotice={notify}
                        onRequestRemoveWorkerGroup={onRequestRemoveWorkerGroup}
                        onConfigureResource={handleConfigureResource}
                        onSelectNode={handleSelectNode}
                        onAssignInterface={handleAssignInterface}
        onUnassignInterface={handleUnassignInterface}
                        onTracePath={handleTracePath}
                        onAttachWorkload={handleAttachWorkload}
                        onClose={clearSelection}
                        showCloseButton
                      />
                    </DrawerPanelContent>
                  ) : undefined
                }
              >
                <DrawerContentBody className="ocs-net-topo-panel__drawer-body ocs-net-topo-panel__drawer-body--table">
                  <NodeNetworkTableList
                    groups={groups}
                    selectedGroupId={
                      selectedData?.data && "group" in selectedData.data
                        ? selectedData.data.group.id
                        : null
                    }
                    selectedResourceId={
                      selectedData?.data &&
                      "resource" in selectedData.data &&
                      selectedData.data.nodeKind === "resource"
                        ? selectedData.data.resource.id
                        : null
                    }
                    onSelectWorkerGroup={(group) => setSelectedIds([group.id])}
                    onSelectResource={(_group, resourceId) => setSelectedIds([resourceId])}
                    onSelectPeer={(peerId) => setSelectedIds([peerId])}
                    getResourceConnections={getTableResourceConnections}
                    onResourceLifecycleAction={onResourceLifecycleAction}
                    onNotice={notify}
                    onResourceDeleted={() => clearSelection()}
                    toolbarActions={
                      onViewModeChange ? (
                        <TopologyViewToggle currentView={viewMode} onChange={onViewModeChange} />
                      ) : null
                    }
                  />
                </DrawerContentBody>
              </DrawerContent>
            </Drawer>
          </div>
        ) : (
          <TopologyResizableSplit
            isPanelOpen={Boolean(activeCreateResource)}
            panel={
              activeCreateResource ? (
                <NetworkTopologyCreatePanel
                  resource={activeCreateResource}
                  onClose={() => setActiveCreateResource(null)}
                  nncWizard={nncWizard}
                  onNadCreated={onNadCreated}
                  onUdnCreated={onUdnCreated}
                  onCudnCreated={onCudnCreated}
                  onNncpCreated={onNncpCreated}
                />
              ) : null
            }
          >
            {topologyCanvas}
          </TopologyResizableSplit>
        )}
      </div>
      <Modal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} variant="small">
        <ModalHeader title="Topology shortcuts" />
        <ModalBody>
          <ul className="ocs-pf-topo-shortcuts">
            <li>
              <kbd>Click</kbd> select node / open inspector
            </li>
            <li>
              <kbd>⋮</kbd> or right-click for actions
            </li>
            <li>
              <kbd>Drag</kbd> move nodes and groups (hull outline or label)
            </li>
            <li>
              <kbd>Scroll</kbd> / control bar to zoom
            </li>
          </ul>
        </ModalBody>
      </Modal>
    </div>
  );
}
