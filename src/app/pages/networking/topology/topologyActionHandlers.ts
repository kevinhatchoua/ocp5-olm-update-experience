import type { WorkerNodeGroup } from "../networkTopologyData";
import type { ResourceLifecycleAction, ResourceLifecycleTarget } from "../networkTopologyState";
import type { TopologyDetailSelection } from "./TopologyDetailPanel";

export type TopologyActionHandlers = {
  onResourceLifecycleAction?: (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => void;
  onNotice?: (notice: { title: string; variant: "success" | "warning" | "info" }) => void;
  onRequestRemoveWorkerGroup?: (worker: { id: string; shortName: string; hostname: string }) => void;
  onSelectNode?: (id: string) => void;
  onOpenCreate?: () => void;
  onOpenWorkerModal?: () => void;
  onWorkerAssignmentChange?: (logicalId: string, workerId: string, assigned: boolean) => void;
  onAttachStandaloneToGroup?: (resourceId: string, groupId: string, connectToResourceId?: string) => void;
  onGroupsChange?: (groups: WorkerNodeGroup[]) => void;
  getGroups?: () => WorkerNodeGroup[];
  onTracePath?: (selection: TopologyDetailSelection) => void;
  onTracePathFromElementId?: (elementId: string) => void;
  onNavigate?: (path: string) => void;
  onConfigureSelection?: (selection: TopologyDetailSelection) => void;
};

let handlers: TopologyActionHandlers = {};

export function setTopologyActionHandlers(next: TopologyActionHandlers) {
  handlers = next;
}

export function getTopologyActionHandlers(): TopologyActionHandlers {
  return handlers;
}

/** Flat element ids (nodes + edges) currently on an active path trace. */
let pathHighlightIds = new Set<string>();
const pathHighlightSubscribers = new Set<() => void>();

export function setPathHighlightIds(ids: Iterable<string>) {
  pathHighlightIds = new Set(ids);
  pathHighlightSubscribers.forEach((cb) => cb());
}

export function clearPathHighlightIds() {
  setPathHighlightIds([]);
}

export function getPathHighlightIds(): ReadonlySet<string> {
  return pathHighlightIds;
}

export function subscribePathHighlight(onStoreChange: () => void): () => void {
  pathHighlightSubscribers.add(onStoreChange);
  return () => {
    pathHighlightSubscribers.delete(onStoreChange);
  };
}

export function isPathHighlighted(id: string): boolean {
  return pathHighlightIds.has(id);
}
