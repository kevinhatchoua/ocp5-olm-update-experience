import { NodeStatus } from "@patternfly/react-topology";
import type { NetResourceKind, ResourceInstallStatus } from "../networkTopologyData";
import { RESOURCE_INSTALL_STATUS_LABELS } from "../networkTopologyData";

export function installStatusToNodeStatus(status: ResourceInstallStatus): NodeStatus {
  switch (status) {
    case "configured":
      return NodeStatus.success;
    case "installing":
      return NodeStatus.info;
    case "creating":
      return NodeStatus.warning;
    case "failed":
      return NodeStatus.danger;
    case "pending":
    default:
      return NodeStatus.default;
  }
}

export function installStatusLabel(status: ResourceInstallStatus): string {
  return RESOURCE_INSTALL_STATUS_LABELS[status];
}

/** Map resource kinds to PF CSS status/color token classes (no raw hex). */
export const KIND_TOKEN_CLASS: Record<NetResourceKind, string> = {
  bridge: "ocs-pf-topo-node--kind-bridge",
  interface: "ocs-pf-topo-node--kind-interface",
  tunnel: "ocs-pf-topo-node--kind-tunnel",
  port: "ocs-pf-topo-node--kind-port",
  cudn: "ocs-pf-topo-node--kind-cudn",
  udn: "ocs-pf-topo-node--kind-udn",
};

export const STATUS_TOKEN_CLASS: Record<ResourceInstallStatus, string> = {
  configured: "ocs-pf-topo-status--configured",
  pending: "ocs-pf-topo-status--pending",
  installing: "ocs-pf-topo-status--installing",
  creating: "ocs-pf-topo-status--creating",
  failed: "ocs-pf-topo-status--failed",
};
