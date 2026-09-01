import { NodeShape } from "@patternfly/react-topology";
import type { NetResourceKind } from "../networkTopologyData";
import type { HostResourceRole } from "./topologyPerspective";

export function shapeForResourceNode(
  kind: NetResourceKind | string,
  hostRole?: HostResourceRole
): NodeShape {
  switch (kind) {
    case "bridge":
      if (hostRole === "ovn-bridge" || hostRole === "ovs-bridge") return NodeShape.hexagon;
      if (hostRole === "linux-bridge") return NodeShape.rhombus;
      return NodeShape.stadium;
    case "tunnel":
      return NodeShape.trapezoid;
    case "port":
      return NodeShape.octagon;
    case "interface":
      return hostRole === "bond" || hostRole === "vlan" ? NodeShape.rect : NodeShape.ellipse;
    case "cudn":
      return NodeShape.hexagon;
    case "udn":
      return NodeShape.rhombus;
    default:
      return NodeShape.ellipse;
  }
}

export function nodeShapeClass(shape: NodeShape): string {
  switch (shape) {
    case NodeShape.hexagon:
      return "ocs-pf-topo-node--hexagon";
    case NodeShape.rhombus:
      return "ocs-pf-topo-node--rhombus";
    case NodeShape.trapezoid:
      return "ocs-pf-topo-node--trapezoid";
    case NodeShape.octagon:
      return "ocs-pf-topo-node--octagon";
    case NodeShape.rect:
      return "ocs-pf-topo-node--rect";
    case NodeShape.stadium:
      return "ocs-pf-topo-node--stadium";
    case NodeShape.ellipse:
    case NodeShape.circle:
    default:
      return "ocs-pf-topo-node--ellipse";
  }
}

export function workerGroupHullClass(resources: { status: string }[]): string {
  if (resources.some((resource) => resource.status === "failed")) {
    return "ocs-pf-topo-worker-group--degraded";
  }
  if (resources.some((resource) => resource.status !== "configured")) {
    return "ocs-pf-topo-worker-group--pending";
  }
  return "ocs-pf-topo-worker-group--healthy";
}
