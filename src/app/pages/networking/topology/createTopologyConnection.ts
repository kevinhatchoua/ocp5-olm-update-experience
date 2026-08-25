import { isGraph, isNode, type Graph, type Node } from "@patternfly/react-topology";
import {
  isLogicalNetworkStandalone,
  type TopologyEdge,
  type WorkerNodeGroup,
} from "../networkTopologyData";
import { getTopologyActionHandlers } from "./topologyActionHandlers";
import {
  isLogicalNetworkNodeData,
  isResourceNodeData,
  isWorkloadNodeData,
  type NetworkTopologyNodeData,
} from "./topologyNodeData";

function nodeData(node: Node): NetworkTopologyNodeData | undefined {
  return node.getData() as NetworkTopologyNodeData | undefined;
}

function addGroupEdge(
  groups: WorkerNodeGroup[],
  groupId: string,
  from: string,
  to: string
): WorkerNodeGroup[] | null {
  if (from === to) return null;
  const id = `${from}__${to}`;
  let changed = false;
  const next = groups.map((group) => {
    if (group.id !== groupId) return group;
    if (group.edges.some((e) => e.id === id || (e.from === from && e.to === to))) return group;
    const edge: TopologyEdge = { id, from, to };
    changed = true;
    return { ...group, edges: [...group.edges, edge] };
  });
  return changed ? next : null;
}

/**
 * PatternFly create-connector drop handler: drag from a node handle onto another node
 * to create a topology link (assignment, attach, or underlay edge).
 */
export function onTopologyCreateConnector(
  source: Node,
  target: Node | Graph
): void {
  if (isGraph(target) || !isNode(target) || source.getId() === target.getId()) return;

  const handlers = getTopologyActionHandlers();
  const sourceData = nodeData(source);
  const targetData = nodeData(target);
  if (!sourceData || !targetData) return;

  // Logical network → bridge on a worker: assign network to that worker.
  if (isLogicalNetworkNodeData(sourceData) && isResourceNodeData(targetData) && targetData.kind === "bridge") {
    handlers.onWorkerAssignmentChange?.(sourceData.resource.id, targetData.groupId, true);
    handlers.onNotice?.({
      variant: "success",
      title: `Linked ${sourceData.resource.label} → ${targetData.resource.label} on ${targetData.groupShortName}.`,
    });
    return;
  }

  // Bridge → logical network (reverse drag).
  if (isResourceNodeData(sourceData) && sourceData.kind === "bridge" && isLogicalNetworkNodeData(targetData)) {
    handlers.onWorkerAssignmentChange?.(targetData.resource.id, sourceData.groupId, true);
    handlers.onNotice?.({
      variant: "success",
      title: `Linked ${targetData.resource.label} → ${sourceData.resource.label} on ${sourceData.groupShortName}.`,
    });
    return;
  }

  // Standalone non-logical → attach into a worker group at a target resource.
  if (
    isLogicalNetworkNodeData(sourceData) &&
    !isLogicalNetworkStandalone(sourceData.resource) &&
    isResourceNodeData(targetData)
  ) {
    handlers.onAttachStandaloneToGroup?.(sourceData.resource.id, targetData.groupId, targetData.resource.id);
    handlers.onNotice?.({
      variant: "success",
      title: `Attached ${sourceData.resource.label} to ${targetData.groupShortName}.`,
    });
    return;
  }

  // Workload → network / bridge: prototype attachment notice + optional open create.
  if (isWorkloadNodeData(sourceData) && (isLogicalNetworkNodeData(targetData) || isResourceNodeData(targetData))) {
    const targetLabel = isLogicalNetworkNodeData(targetData)
      ? targetData.resource.label
      : targetData.resource.label;
    handlers.onNotice?.({
      variant: "info",
      title: `Network attachment requested: ${sourceData.attachment.label} → ${targetLabel}.`,
    });
    return;
  }

  if (isWorkloadNodeData(targetData) && (isLogicalNetworkNodeData(sourceData) || isResourceNodeData(sourceData))) {
    const sourceLabel = isLogicalNetworkNodeData(sourceData)
      ? sourceData.resource.label
      : sourceData.resource.label;
    handlers.onNotice?.({
      variant: "info",
      title: `Network attachment requested: ${targetData.attachment.label} → ${sourceLabel}.`,
    });
    return;
  }

  // Same-worker underlay edge between host resources.
  if (isResourceNodeData(sourceData) && isResourceNodeData(targetData) && sourceData.groupId === targetData.groupId) {
    const next = handlers.getGroups
      ? addGroupEdge(handlers.getGroups(), sourceData.groupId, sourceData.resource.id, targetData.resource.id)
      : null;
    if (next) {
      handlers.onGroupsChange?.(next);
      handlers.onNotice?.({
        variant: "success",
        title: `Connected ${sourceData.resource.label} → ${targetData.resource.label}.`,
      });
    } else {
      handlers.onNotice?.({
        variant: "info",
        title: "Those resources are already linked on this worker.",
      });
    }
  }
}
