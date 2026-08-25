import { useToast } from "../../contexts/ToastContext";
import NodeNetworkConfigurationStage from "./NodeNetworkConfigurationStage";

export default function NetworkTopologyPage() {
  const { pushToast, dismissToast } = useToast();

  return <NodeNetworkConfigurationStage wrapInPageShell pushToast={pushToast} dismissToast={dismissToast} />;
}
