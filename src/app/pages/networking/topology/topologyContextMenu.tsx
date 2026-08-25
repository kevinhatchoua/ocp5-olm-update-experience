import React from "react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  type GraphElement,
  type Node,
} from "@patternfly/react-topology";
import { getTopologyActionHandlers } from "./topologyActionHandlers";
import { resolveConfigurePath } from "./topologyConfigureNavigate";
import {
  isLogicalNetworkNodeData,
  isResourceNodeData,
  isWorkerGroupNodeData,
  isWorkloadNodeData,
  type NetworkTopologyNodeData,
} from "./topologyNodeData";
import type { TopologyDetailSelection } from "./TopologyDetailPanel";

function item(label: string, onClick: () => void) {
  return (
    <ContextMenuItem key={label} onClick={onClick}>
      {label}
    </ContextMenuItem>
  );
}

function separator(key: string) {
  return <ContextMenuSeparator component="li" key={key} />;
}

function notice(title: string, variant: "success" | "warning" | "info" = "info") {
  getTopologyActionHandlers().onNotice?.({ title, variant });
}

function selectionFromElement(element: GraphElement): TopologyDetailSelection {
  const data = (element as Node).getData?.() as NetworkTopologyNodeData | undefined;
  return { id: element.getId(), data };
}

function confirmDelete(label: string): boolean {
  return window.confirm(`Delete ${label}? This cannot be undone in the prototype.`);
}

/** Networking-domain context menu mirroring console topology kebab patterns. */
export function buildNodeContextMenu(element: GraphElement): React.ReactElement[] {
  const data = (element as Node).getData?.() as NetworkTopologyNodeData | undefined;
  const handlers = getTopologyActionHandlers();
  const id = element.getId();
  const selection = selectionFromElement(element);

  const viewDetails = item("View details", () => handlers.onSelectNode?.(id));
  const tracePath = item("Trace path from here", () => {
    if (handlers.onTracePath) {
      handlers.onTracePath(selection);
      return;
    }
    handlers.onTracePathFromElementId?.(id);
  });
  const configure = item("Configure", () => {
    if (handlers.onConfigureSelection) {
      handlers.onConfigureSelection(selection);
      return;
    }
    const path = resolveConfigurePath(selection);
    if (path) handlers.onNavigate?.(path);
    else notice("Configure is not available for this selection");
  });

  if (isResourceNodeData(data)) {
    const target = {
      resourceId: data.resource.id,
      placement: "group" as const,
      groupId: data.groupId,
      label: data.resource.label,
    };
    return [
      viewDetails,
      tracePath,
      configure,
      separator("s1"),
      item("Pause configuration", () => {
        handlers.onResourceLifecycleAction?.(target, "pause");
        notice(`Pause requested for ${data.resource.label}`);
      }),
      item("Stop configuration", () => {
        handlers.onResourceLifecycleAction?.(target, "stop");
        notice(`Stop requested for ${data.resource.label}`, "warning");
      }),
      item("Restart reconciliation", () => {
        handlers.onResourceLifecycleAction?.(target, "restart");
        notice(`Restart requested for ${data.resource.label}`, "success");
      }),
      separator("s2"),
      item("Edit labels", () => notice("Edit labels (prototype)")),
      item("Edit annotations", () => notice("Edit annotations (prototype)")),
      item("Edit resource YAML", () => notice("Open YAML editor (prototype)")),
      separator("s3"),
      item("Delete", () => {
        if (!confirmDelete(data.resource.label)) return;
        handlers.onResourceLifecycleAction?.(target, "delete");
        notice(`Deleted ${data.resource.label}`, "warning");
      }),
    ];
  }

  if (isLogicalNetworkNodeData(data)) {
    const target = {
      resourceId: data.resource.id,
      placement: "standalone" as const,
      label: data.resource.label,
    };
    return [
      viewDetails,
      tracePath,
      configure,
      item("Assign worker nodes", () => {
        handlers.onSelectNode?.(id);
        notice("Use the inspector to assign worker nodes");
      }),
      separator("s1"),
      item("Pause network", () => {
        handlers.onResourceLifecycleAction?.(target, "pause");
        notice(`Pause requested for ${data.resource.label}`);
      }),
      item("Restart network", () => {
        handlers.onResourceLifecycleAction?.(target, "restart");
        notice(`Restart requested for ${data.resource.label}`, "success");
      }),
      separator("s2"),
      item("Edit labels", () => notice("Edit labels (prototype)")),
      item("Edit annotations", () => notice("Edit annotations (prototype)")),
      separator("s3"),
      item(
        `Delete ${data.kind === "cudn" ? "ClusterUserDefinedNetwork" : "UserDefinedNetwork"}`,
        () => {
          if (!confirmDelete(data.resource.label)) return;
          handlers.onResourceLifecycleAction?.(target, "delete");
          notice(`Deleted ${data.resource.label}`, "warning");
        }
      ),
    ];
  }

  if (isWorkerGroupNodeData(data)) {
    const group = data.group;
    return [
      viewDetails,
      tracePath,
      configure,
      item("View node details", () => {
        handlers.onNavigate?.(`/compute/nodes/${group.hostname}`);
      }),
      item("Copy hostname", () => {
        void navigator.clipboard?.writeText(group.hostname);
        notice(`Copied ${group.hostname}`, "success");
      }),
      separator("s1"),
      item("Remove from topology", () => {
        if (!confirmDelete(group.shortName)) return;
        handlers.onRequestRemoveWorkerGroup?.({
          id: group.id,
          shortName: group.shortName,
          hostname: group.hostname,
        });
      }),
    ];
  }

  if (isWorkloadNodeData(data)) {
    return [
      viewDetails,
      tracePath,
      configure,
      separator("s1"),
      item("Edit attachment", () => {
        handlers.onConfigureSelection?.(selection);
      }),
    ];
  }

  return [
    item("Add worker node", () => handlers.onOpenWorkerModal?.()),
    item("Create network resource", () => handlers.onOpenCreate?.()),
  ];
}
