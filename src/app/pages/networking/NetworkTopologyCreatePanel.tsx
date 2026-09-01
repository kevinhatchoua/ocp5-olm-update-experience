import { DrawerActions, DrawerCloseButton, DrawerHead, Title } from "@patternfly/react-core";
import NodeNetworkConfigurationWizard from "./NodeNetworkConfigurationWizard";
import { TopologyLightSpeedAction } from "./topology/TopologyLightSpeedAction";
import { topologyLightspeedContext } from "./topology/topologyLightspeed";
import {
  CreateClusterUdnForm,
  CreateNadForm,
  CreateNncpForm,
  CreateUdnForm,
  type NetworkCreateResource,
} from "./networkingCreateModals";
import type { NadRecord, NncpRecord, UdnRecord } from "./networkingMockData";

export const CREATE_RESOURCE_TITLES: Record<NetworkCreateResource, string> = {
  "node-network-configuration": "Node network configuration",
  "network-attachment-definition": "Create NetworkAttachmentDefinition",
  "user-defined-network": "Create UserDefinedNetwork",
  "cluster-user-defined-network": "Create ClusterUserDefinedNetwork",
  "node-network-configuration-policy": "Create NodeNetworkConfigurationPolicy",
};

const CREATE_LIGHTSPEED_SCENARIO: Record<NetworkCreateResource, string> = {
  "node-network-configuration": "nnc",
  "network-attachment-definition": "nad",
  "user-defined-network": "udn",
  "cluster-user-defined-network": "cudn",
  "node-network-configuration-policy": "nncp",
};

function CreatePanelLightSpeedAssist({ resource }: { resource: NetworkCreateResource }) {
  return (
    <div className="ocs-net-topo-create-panel__lightspeed">
      <TopologyLightSpeedAction
        contextKey={topologyLightspeedContext("create", CREATE_LIGHTSPEED_SCENARIO[resource])}
        intent="create"
        variant="link"
        isInline
      >
        Draft with LightSpeed
      </TopologyLightSpeedAction>
    </div>
  );
}

export type NetworkTopologyNncWizardProps = {
  activeStep: number;
  onActiveStepChange: (step: number) => void;
  physicalNetworkName: string;
  onPhysicalNetworkNameChange: (value: string) => void;
  onCreate: () => void;
  onOpen?: () => void;
};

type NetworkTopologyCreatePanelProps = {
  resource: NetworkCreateResource;
  onClose: () => void;
  nncWizard?: NetworkTopologyNncWizardProps;
  onNadCreated?: (record: NadRecord) => void;
  onUdnCreated?: (record: UdnRecord) => void;
  onCudnCreated?: (record: UdnRecord) => void;
  onNncpCreated?: (record: NncpRecord) => void;
};

export default function NetworkTopologyCreatePanel({
  resource,
  onClose,
  nncWizard,
  onNadCreated,
  onUdnCreated,
  onCudnCreated,
  onNncpCreated,
}: NetworkTopologyCreatePanelProps) {
  const isNncWizard = resource === "node-network-configuration";

  if (isNncWizard && nncWizard) {
    return (
      <div className="ocs-net-topo-create-panel ocs-net-topo-create-panel--wizard">
        <NodeNetworkConfigurationWizard
          variant="drawer"
          activeStep={nncWizard.activeStep}
          physicalNetworkName={nncWizard.physicalNetworkName}
          onActiveStepChange={nncWizard.onActiveStepChange}
          onPhysicalNetworkNameChange={nncWizard.onPhysicalNetworkNameChange}
          onClose={onClose}
          onCreate={() => {
            nncWizard.onCreate();
            onClose();
          }}
        />
      </div>
    );
  }

  return (
    <div className="ocs-net-topo-create-panel">
      <DrawerHead className="ocs-net-topo-create-panel__head">
        <Title headingLevel="h2" size="xl">
          {CREATE_RESOURCE_TITLES[resource]}
        </Title>
        <CreatePanelLightSpeedAssist resource={resource} />
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <div className="ocs-net-topo-create-panel__body">
        {resource === "network-attachment-definition" ? (
          <CreateNadForm
            onCancel={onClose}
            onCreated={(record) => {
              onNadCreated?.(record);
              onClose();
            }}
          />
        ) : null}
        {resource === "user-defined-network" ? (
          <CreateUdnForm
            onCancel={onClose}
            onCreated={(record) => {
              onUdnCreated?.(record);
              onClose();
            }}
          />
        ) : null}
        {resource === "cluster-user-defined-network" ? (
          <CreateClusterUdnForm
            onCancel={onClose}
            onCreated={(record) => {
              onCudnCreated?.(record);
              onClose();
            }}
          />
        ) : null}
        {resource === "node-network-configuration-policy" ? (
          <CreateNncpForm
            onCancel={onClose}
            onCreated={(record) => {
              onNncpCreated?.(record);
              onClose();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
