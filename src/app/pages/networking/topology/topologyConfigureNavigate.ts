import type { NavigateFunction } from "react-router";
import { getNncpRecords, nadDetailPath, nncpDetailPath, vmDetailPath } from "../networkingMockData";
import type { TopologyDetailSelection } from "./TopologyDetailPanel";
import {
  isLogicalNetworkNodeData,
  isResourceNodeData,
  isWorkerGroupNodeData,
  isWorkloadNodeData,
} from "./topologyNodeData";

const NNCP_LIST_PATH = "/networking/nodenetworkconfigurationpolicy";

function udnOrCudnPath(kind: "udn" | "cudn", name: string, namespace?: string): string {
  if (kind === "cudn") {
    return `/networking/userdefinednetworks/cluster/${encodeURIComponent(name)}`;
  }
  return `/networking/userdefinednetworks/${encodeURIComponent(namespace || "default")}/${encodeURIComponent(name)}`;
}

function resolveNncpConfigurePath(resourceId?: string): string {
  if (resourceId?.startsWith("nncp-")) {
    return nncpDetailPath(resourceId);
  }
  const records = getNncpRecords();
  if (records[0]) return nncpDetailPath(records[0].name);
  return NNCP_LIST_PATH;
}

/** Resolve where "Configure" should navigate for a topology selection. */
export function resolveConfigurePath(selection: TopologyDetailSelection): string | null {
  if (selection.edgeData) {
    return null;
  }

  const data = selection.data;
  if (!data) return null;

  if (isWorkloadNodeData(data)) {
    const { attachment } = data;
    if (attachment.kind === "vm") {
      return vmDetailPath(attachment.namespace, attachment.label);
    }
    if (attachment.networkId) {
      return nadDetailPath(attachment.namespace, attachment.networkLabel || attachment.networkId);
    }
    return nadDetailPath(attachment.namespace, attachment.label);
  }

  if (isLogicalNetworkNodeData(data)) {
    if (data.detailPath) return data.detailPath;
    const kind = data.kind === "cudn" ? "cudn" : "udn";
    const ns = kind === "udn" ? data.resource.targetNodeLabel || "default" : undefined;
    return udnOrCudnPath(kind, data.resource.label, ns);
  }

  if (isWorkerGroupNodeData(data)) {
    return `/compute/nodes/${encodeURIComponent(data.group.hostname)}`;
  }

  if (isResourceNodeData(data)) {
    if (data.kind === "cudn" || data.kind === "udn") {
      const detailPath =
        "detailPath" in data.resource ? (data.resource as { detailPath?: string }).detailPath : undefined;
      if (detailPath) return detailPath;
      return udnOrCudnPath(data.kind, data.resource.label, data.kind === "udn" ? "default" : undefined);
    }
    // Bridge / interface / tunnel / port → NNCP detail (or list)
    return resolveNncpConfigurePath(data.resource.id);
  }

  return null;
}

export function navigateToConfigure(
  navigate: NavigateFunction,
  selection: TopologyDetailSelection,
  onEdgeNotice?: () => void
): void {
  if (selection.edgeData) {
    onEdgeNotice?.();
    return;
  }
  const path = resolveConfigurePath(selection);
  if (path) {
    navigate(path, { state: { fromTopology: true } });
  }
}
