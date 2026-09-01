import ClusterIcon from "@patternfly/react-icons/dist/esm/icons/cluster-icon";
import CubeIcon from "@patternfly/react-icons/dist/esm/icons/cube-icon";
import EthernetIcon from "@patternfly/react-icons/dist/esm/icons/ethernet-icon";
import ObjectGroupIcon from "@patternfly/react-icons/dist/esm/icons/object-group-icon";
import PlugIcon from "@patternfly/react-icons/dist/esm/icons/plug-icon";
import ProjectDiagramIcon from "@patternfly/react-icons/dist/esm/icons/project-diagram-icon";
import ShareAltIcon from "@patternfly/react-icons/dist/esm/icons/share-alt-icon";
import VirtualMachineIcon from "@patternfly/react-icons/dist/esm/icons/virtual-machine-icon";

const DEFAULT_SIZE = 26;

export function TopologyKindIcon({ kind, size = DEFAULT_SIZE }: { kind: string; size?: number }) {
  const props = { "aria-hidden": true as const, width: size, height: size };
  switch (kind) {
    case "interface":
    case "nic":
      return <EthernetIcon {...props} />;
    case "bridge":
      return <ClusterIcon {...props} />;
    case "tunnel":
      return <ShareAltIcon {...props} />;
    case "port":
      return <PlugIcon {...props} />;
    case "cudn":
      return <ProjectDiagramIcon {...props} />;
    case "udn":
      return <ObjectGroupIcon {...props} />;
    case "vm":
      return <VirtualMachineIcon {...props} />;
    case "pod":
      return <CubeIcon {...props} />;
    default:
      return <ClusterIcon {...props} />;
  }
}
