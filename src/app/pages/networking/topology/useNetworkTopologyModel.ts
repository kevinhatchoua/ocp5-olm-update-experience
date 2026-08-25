import { useMemo } from "react";
import {
  EdgeStyle,
  LabelPosition,
  Model,
  NodeShape,
  type EdgeModel,
  type NodeModel,
} from "@patternfly/react-topology";
import {
  isLogicalNetworkStandalone,
  RESOURCE_KIND_LABELS,
  visibleTopologyGroupIds,
  type NetworkNodeAssignments,
  type StandaloneTopologyResource,
  type TopologyCrossEdge,
  type WorkerNodeGroup,
} from "../networkTopologyData";
import { installStatusToNodeStatus } from "./statusMap";
import {
  LOGICAL_LANE_ID,
  WORKLOAD_LANE_ID,
  type ConnectionEdgeData,
  type LogicalLaneNodeData,
  type LogicalNetworkNodeData,
  type ResourceNodeData,
  type WorkerGroupNodeData,
  type WorkloadNodeData,
} from "./topologyNodeData";
import {
  attachmentsForNetwork,
  hostRoleForResource,
  resourceMatchesFilter,
  resourceVisibleInPerspective,
  type TopologyPerspective,
  type TopologyResourceFilter,
} from "./topologyPerspective";
import type { TopologyLayoutId } from "./topologyLayouts";

/** Standard PF topology circular badge diameter (matches console topology). */
const RESOURCE_SIZE = 75;
const LOGICAL_SIZE = 75;
const WORKLOAD_SIZE = 64;

function shapeForKind(_kind: string): NodeShape {
  return NodeShape.circle;
}

export type UseNetworkTopologyModelArgs = {
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  crossEdges: TopologyCrossEdge[];
  networkNodeAssignments: NetworkNodeAssignments;
  revealedGroupIds: string[];
  searchTerm?: string;
  filterKind?: TopologyResourceFilter;
  layoutName: TopologyLayoutId;
  perspective?: TopologyPerspective;
};

export function useNetworkTopologyModel({
  groups,
  standaloneResources,
  crossEdges,
  networkNodeAssignments,
  revealedGroupIds,
  searchTerm = "",
  filterKind = "all",
  layoutName,
  perspective = "host",
}: UseNetworkTopologyModelArgs): Model {
  return useMemo(() => {
    const visibleIds = visibleTopologyGroupIds(networkNodeAssignments, revealedGroupIds);
    const visibleGroups = groups.filter((group) => visibleIds.has(group.id));
    const logicalStandalones = standaloneResources.filter(isLogicalNetworkStandalone);
    const otherStandalones = standaloneResources.filter((r) => !isLogicalNetworkStandalone(r));
    const query = searchTerm.trim().toLowerCase();
    const showLogicalLane = perspective === "workload" || perspective === "cluster";
    const showWorkloads = perspective === "workload" || perspective === "cluster";
    const showWorkers = perspective === "host" || perspective === "cluster";

    const isWorkloadTypeFilter = filterKind === "pod" || filterKind === "vm";

    const matchesFilter = (
      label: string,
      kind: string,
      extra?: { hostRole?: ReturnType<typeof hostRoleForResource>; attachmentKind?: string },
    ) => {
      if (
        !resourceMatchesFilter(filterKind, perspective, {
          kind,
          hostRole: extra?.hostRole,
          attachmentKind: extra?.attachmentKind,
        })
      ) {
        return false;
      }
      if (!query) return true;
      return label.toLowerCase().includes(query) || kind.toLowerCase().includes(query);
    };

    const nodes: NodeModel[] = [];
    const edges: EdgeModel[] = [];
    const labelById = new Map<string, string>();

    if (showLogicalLane && logicalStandalones.length > 0) {
      const logicalChildren: string[] = [];
      logicalStandalones.forEach((resource) => {
        if (!resourceVisibleInPerspective(resource, perspective)) return;
        if (isWorkloadTypeFilter) {
          const hasMatch = attachmentsForNetwork(resource.label, resource.id).some((a) => a.kind === filterKind);
          if (!hasMatch) return;
          if (query && !resource.label.toLowerCase().includes(query)) return;
        } else if (!matchesFilter(resource.label, resource.kind, { hostRole: hostRoleForResource(resource) })) {
          return;
        }
        logicalChildren.push(resource.id);
        labelById.set(resource.id, resource.label);
        const data: LogicalNetworkNodeData = {
          nodeKind: "logical-network",
          resource,
          kind: resource.kind,
          status: resource.status,
          topologyMode: resource.topologyMode,
          detailPath: resource.detailPath,
        };
        nodes.push({
          id: resource.id,
          type: "logical-network",
          label: resource.label,
          width: LOGICAL_SIZE,
          height: LOGICAL_SIZE,
          shape: shapeForKind(resource.kind),
          status: installStatusToNodeStatus(resource.status),
          data,
        });
      });

      if (logicalChildren.length > 0) {
        const laneData: LogicalLaneNodeData = { nodeKind: "logical-lane" };
        nodes.push({
          id: LOGICAL_LANE_ID,
          type: "logical-lane",
          group: true,
          children: logicalChildren,
          label: perspective === "workload" ? "Networks" : "Logical networks",
          labelPosition: LabelPosition.top,
          style: { padding: 28 },
          data: laneData,
        });
      }
    }

    if (perspective !== "host") {
      otherStandalones.forEach((resource) => {
        if (!resourceVisibleInPerspective(resource, perspective)) return;
        if (isWorkloadTypeFilter) return;
        if (!matchesFilter(resource.label, resource.kind, { hostRole: hostRoleForResource(resource) })) return;
        labelById.set(resource.id, resource.label);
        const data: LogicalNetworkNodeData = {
          nodeKind: "logical-network",
          resource,
          kind: resource.kind,
          status: resource.status,
          topologyMode: resource.topologyMode,
          detailPath: resource.detailPath,
        };
        nodes.push({
          id: resource.id,
          type: "logical-network",
          label: resource.label,
          width: RESOURCE_SIZE,
          height: RESOURCE_SIZE,
          shape: shapeForKind(resource.kind),
          status: installStatusToNodeStatus(resource.status),
          data,
        });
      });
    }

    if (showWorkers) {
      visibleGroups.forEach((group) => {
        const childIds: string[] = [];
        group.resources.forEach((resource) => {
          if (!resourceVisibleInPerspective(resource, perspective)) return;
          if (isWorkloadTypeFilter) return;
          if (!matchesFilter(resource.label, resource.kind, { hostRole: hostRoleForResource(resource) })) return;
          childIds.push(resource.id);
          labelById.set(resource.id, resource.label);
          const data: ResourceNodeData = {
            nodeKind: "resource",
            resource,
            groupId: group.id,
            groupShortName: group.shortName,
            groupHostname: group.hostname,
            kind: resource.kind,
            status: resource.status,
            hostRole: hostRoleForResource(resource),
          };
          nodes.push({
            id: resource.id,
            type: "resource",
            label: resource.label,
            width: RESOURCE_SIZE,
            height: RESOURCE_SIZE,
            shape: shapeForKind(resource.kind),
            status: installStatusToNodeStatus(resource.status),
            data,
          });
        });

        if (childIds.length === 0) return;

        const groupData: WorkerGroupNodeData = {
          nodeKind: "worker-group",
          group,
        };
        nodes.push({
          id: group.id,
          type: "worker-group",
          group: true,
          children: childIds,
          label: group.shortName,
          labelPosition: LabelPosition.top,
          style: { padding: 32 },
          data: groupData,
        });

        group.edges.forEach((edge) => {
          if (!childIds.includes(edge.from) || !childIds.includes(edge.to)) return;
          const edgeData: ConnectionEdgeData = {
            edgeKind: "connection",
            linkType: "underlay",
            sourceLabel: labelById.get(edge.from) ?? edge.from,
            targetLabel: labelById.get(edge.to) ?? edge.to,
            note: "Host underlay link (NNCP / nmstate)",
          };
          edges.push({
            id: edge.id,
            type: "edge",
            source: edge.from,
            target: edge.to,
            edgeStyle: EdgeStyle.default,
            data: edgeData,
          });
        });
      });
    }

    if (showLogicalLane) {
      crossEdges.forEach((edge) => {
        const sourceExists = nodes.some((n) => n.id === edge.fromStandaloneId);
        const targetExists = nodes.some((n) => n.id === edge.toResourceId);
        if (!sourceExists || !targetExists) return;
        const edgeData: ConnectionEdgeData = {
          edgeKind: "connection",
          linkType: "logical-attachment",
          sourceLabel: labelById.get(edge.fromStandaloneId) ?? edge.fromStandaloneId,
          targetLabel: labelById.get(edge.toResourceId) ?? edge.toResourceId,
          bridgeMapping: `${edge.toGroupId} → ${edge.toResourceId}`,
          note: "Logical network attached to worker bridge",
        };
        edges.push({
          id: edge.id,
          type: "cross-edge",
          source: edge.fromStandaloneId,
          target: edge.toResourceId,
          edgeStyle: EdgeStyle.dashed,
          data: edgeData,
        });
      });
    }

    if (showWorkloads) {
      const workloadChildren: string[] = [];
      const networkNodes = nodes.filter((n) => n.type === "logical-network");
      const bridgeFallback = nodes.filter((n) => {
        const data = n.data as ResourceNodeData | undefined;
        return data?.nodeKind === "resource" && data.hostRole.includes("bridge");
      });

      const attachTargets =
        networkNodes.length > 0
          ? networkNodes
          : bridgeFallback.slice(0, 3);

      attachTargets.forEach((networkNode) => {
        const attachments = attachmentsForNetwork(networkNode.label ?? networkNode.id, networkNode.id);
        attachments.forEach((attachment) => {
          if (filterKind === "pod" || filterKind === "vm") {
            if (attachment.kind !== filterKind) return;
          }
          if (query && !attachment.label.toLowerCase().includes(query) && !attachment.kind.includes(query)) {
            return;
          }
          const nodeId = `${attachment.id}__${networkNode.id}`;
          if (nodes.some((n) => n.id === nodeId)) return;
          workloadChildren.push(nodeId);
          const data: WorkloadNodeData = {
            nodeKind: "workload",
            attachment: { ...attachment, networkId: networkNode.id, networkLabel: networkNode.label ?? networkNode.id },
          };
          nodes.push({
            id: nodeId,
            type: "workload",
            label: attachment.label,
            width: WORKLOAD_SIZE,
            height: WORKLOAD_SIZE,
            shape: NodeShape.circle,
            data,
          });
          const edgeData: ConnectionEdgeData = {
            edgeKind: "connection",
            linkType: "workload-attachment",
            sourceLabel: attachment.label,
            targetLabel: networkNode.label ?? networkNode.id,
            sourceKind: attachment.kind,
            targetKind: "network",
            note: `${attachment.kind === "vm" ? "VirtualMachine" : "Pod"} attached to network`,
          };
          edges.push({
            id: `wl__${nodeId}`,
            type: "edge",
            source: nodeId,
            target: networkNode.id,
            edgeStyle: EdgeStyle.default,
            data: edgeData,
          });
        });
      });

      if (workloadChildren.length > 0) {
        nodes.push({
          id: WORKLOAD_LANE_ID,
          type: "logical-lane",
          group: true,
          children: workloadChildren,
          label: "Pods & VMs",
          labelPosition: LabelPosition.top,
          style: { padding: 28 },
          data: { nodeKind: "logical-lane" },
        });
      }
    }

    return {
      nodes,
      edges,
      graph: {
        id: "network-topology-graph",
        type: "graph",
        layout: layoutName,
      },
    };
  }, [
    groups,
    standaloneResources,
    crossEdges,
    networkNodeAssignments,
    revealedGroupIds,
    searchTerm,
    filterKind,
    layoutName,
    perspective,
  ]);
}

export function kindLabel(kind: string): string {
  return RESOURCE_KIND_LABELS[kind as keyof typeof RESOURCE_KIND_LABELS] ?? kind;
}
