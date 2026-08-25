import { ModelKind, withContextMenu, type ComponentFactory } from "@patternfly/react-topology";
import type { ComponentType } from "react";
import { CustomCrossEdge, CustomOrthogonalEdge } from "./CustomOrthogonalEdge";
import { CustomLogicalLaneGroup } from "./CustomLogicalLaneGroup";
import { CustomLogicalNode, CustomResourceNode, PanZoomGraph } from "./CustomResourceNode";
import { CustomWorkerGroup } from "./CustomWorkerGroup";
import { buildNodeContextMenu } from "./topologyContextMenu";

type ElementComponent = ComponentType<{ element: unknown }>;

function createNetworkTopologyComponent(kind: ModelKind, type: string): ElementComponent | undefined {
  switch (type) {
    case "logical-lane":
      return CustomLogicalLaneGroup as unknown as ElementComponent;
    case "worker-group":
      return CustomWorkerGroup as unknown as ElementComponent;
    case "logical-network":
      return CustomLogicalNode as unknown as ElementComponent;
    case "resource":
      return CustomResourceNode as unknown as ElementComponent;
    case "workload":
      return CustomResourceNode as unknown as ElementComponent;
    case "cross-edge":
      return CustomCrossEdge as unknown as ElementComponent;
    case "edge":
      return CustomOrthogonalEdge as unknown as ElementComponent;
    default:
      switch (kind) {
        case ModelKind.graph:
          return withContextMenu(buildNodeContextMenu)(PanZoomGraph) as unknown as ElementComponent;
        case ModelKind.node:
          return CustomResourceNode as unknown as ElementComponent;
        case ModelKind.edge:
          return CustomOrthogonalEdge as unknown as ElementComponent;
        default:
          return undefined;
      }
  }
}

export const networkTopologyComponentFactory =
  createNetworkTopologyComponent as unknown as ComponentFactory;
