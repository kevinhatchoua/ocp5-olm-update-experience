import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Content } from "@patternfly/react-core";
import { useToast } from "../../contexts/ToastContext";
import NetworkTopologyPanel from "./NetworkTopologyPanel";
import { OpenWorkerNodeModal } from "./OpenWorkerNodeModal";
import {
  RemoveWorkerNodeGroupModal,
  type WorkerNodeRemovalTarget,
} from "./RemoveWorkerNodeGroupModal";
import { topologyWorkerCatalogFromGroups } from "./networkTopologyData";
import { NNC_WIZARD_STEPS } from "./NodeNetworkConfigurationWizard";
import { NetworkResourceCreateDropdown, type NetworkCreateResource } from "./networkingCreateModals";
import { nadDetailPath } from "./networkingMockData";
import { NetworkingPageShell } from "./networkingShared";
import { useNetworkTopologyState } from "./networkTopologyState";
import { useNodeNetworkConfigurationCreate } from "./useNodeNetworkConfigurationCreate";
import { useNodeNetworkViewMode } from "./useNodeNetworkViewMode";

type NodeNetworkConfigurationStageProps = {
  pushToast: ReturnType<typeof useToast>["pushToast"];
  dismissToast: ReturnType<typeof useToast>["dismissToast"];
  /** Render the Topology page chrome with Create next to the title. */
  wrapInPageShell?: boolean;
};

export default function NodeNetworkConfigurationStage({
  pushToast,
  dismissToast,
  wrapInPageShell = false,
}: NodeNetworkConfigurationStageProps) {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useNodeNetworkViewMode();
  const {
    scale,
    groups,
    standaloneResources,
    crossEdges,
    networkNodeAssignments,
    revealedGroupIds,
    provisionGeneration,
    fitContentToken,
    setGroups,
    setStandaloneResources,
    setCrossEdges,
    setWorkerAssignedToNetwork,
    setTopologyDataScale,
    addLogicalNetwork,
    attachStandaloneToGroup,
    revealWorkerGroups,
    hideWorkerGroups,
    applyResourceLifecycleAction,
  } = useNetworkTopologyState();
  const [workerNodeModalOpen, setWorkerNodeModalOpen] = useState(false);
  const [workerRemovalTarget, setWorkerRemovalTarget] = useState<WorkerNodeRemovalTarget | null>(null);
  const [activeCreateResource, setActiveCreateResource] = useState<NetworkCreateResource | null>(null);

  const {
    openFormWizard,
    activeStep,
    setActiveStep,
    physicalNetworkName,
    setPhysicalNetworkName,
    handleCreateConfiguration,
  } = useNodeNetworkConfigurationCreate(pushToast, dismissToast, {
    successTitle: (configName) =>
      `Successfully created node network configuration for ${configName}. Assign worker nodes from the topology Assigned Nodes tab.`,
  });

  const handleAttachStandaloneToGroup = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      const standalone = attachStandaloneToGroup(resourceId, groupId, connectToResourceId);
      if (!standalone) return;
      pushToast({
        variant: "info",
        title: `Attached ${standalone.label} to ${standalone.targetNodeLabel}.`,
      });
    },
    [attachStandaloneToGroup, pushToast]
  );

  const handleAddWorkersToTopology = useCallback(
    (workerIds: string[]) => {
      revealWorkerGroups(workerIds);
      const count = workerIds.length;
      pushToast({
        variant: "success",
        title: `Added ${count} worker node${count === 1 ? "" : "s"} to the topology.`,
      });
    },
    [revealWorkerGroups, pushToast]
  );

  const requestRemoveWorkerGroup = useCallback(
    (worker: { id: string; shortName: string; hostname: string }) => {
      setWorkerRemovalTarget({
        id: worker.id,
        shortName: worker.shortName,
        hostname: worker.hostname,
      });
    },
    []
  );

  const confirmRemoveWorkerGroup = useCallback(
    (workerId: string) => {
      const worker = topologyWorkerCatalogFromGroups(groups).find((entry) => entry.id === workerId);
      hideWorkerGroups([workerId]);
      pushToast({
        variant: "success",
        title: worker
          ? `Removed ${worker.shortName} from the topology.`
          : "Removed worker node group from the topology.",
      });
      setWorkerRemovalTarget(null);
    },
    [groups, hideWorkerGroups, pushToast]
  );

  const workerCatalog = useMemo(() => topologyWorkerCatalogFromGroups(groups), [groups]);

  const panel = (
    <div className="ocs-nnc-stage">
      <NetworkTopologyPanel
        groups={groups}
        standaloneResources={standaloneResources}
        crossEdges={crossEdges}
        networkNodeAssignments={networkNodeAssignments}
        revealedGroupIds={revealedGroupIds}
        onStandaloneResourcesChange={setStandaloneResources}
        onCrossEdgesChange={setCrossEdges}
        onWorkerAssignmentChange={setWorkerAssignedToNetwork}
        onGroupsChange={setGroups}
        onResourceLifecycleAction={applyResourceLifecycleAction}
        onAttachStandaloneToGroup={handleAttachStandaloneToGroup}
        onOpenWorkerNodeModal={() => setWorkerNodeModalOpen(true)}
        onRequestRemoveWorkerGroup={requestRemoveWorkerGroup}
        topologyScale={scale}
        onTopologyScaleChange={setTopologyDataScale}
        fitContentToken={fitContentToken}
        highlightResourceSuffix={provisionGeneration > 0 ? "br-localnet" : undefined}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeStep={NNC_WIZARD_STEPS[activeStep]?.id}
        physicalNetworkName={physicalNetworkName}
        hideToolbarCreateActions={wrapInPageShell}
        activeCreateResource={activeCreateResource}
        onActiveCreateResourceChange={(resource) => {
          setActiveCreateResource(resource);
          if (resource) openFormWizard();
        }}
        nncWizard={{
          activeStep,
          onActiveStepChange: setActiveStep,
          physicalNetworkName,
          onPhysicalNetworkNameChange: setPhysicalNetworkName,
          onCreate: handleCreateConfiguration,
          onOpen: openFormWizard,
        }}
        onNadCreated={(record) => {
          pushToast({
            variant: "success",
            title: `Created NetworkAttachmentDefinition ${record.name}.`,
          });
          navigate(nadDetailPath(record.namespace, record.name));
        }}
        onUdnCreated={(record) => {
          addLogicalNetwork(record);
          pushToast({
            variant: "success",
            title: `Created UserDefinedNetwork ${record.name}. Linked on the topology graph.`,
          });
        }}
        onCudnCreated={(record) => {
          addLogicalNetwork(record);
          pushToast({
            variant: "success",
            title: `Created ClusterUserDefinedNetwork ${record.name}. Linked on the topology graph.`,
          });
        }}
        onNncpCreated={(record) => {
          pushToast({
            variant: "success",
            title: `Created NodeNetworkConfigurationPolicy ${record.name}.`,
          });
          navigate("/networking/nodenetworkconfigurationpolicy");
        }}
      />
    </div>
  );

  const modals = (
    <>
      <OpenWorkerNodeModal
        isOpen={workerNodeModalOpen}
        onClose={() => setWorkerNodeModalOpen(false)}
        workers={workerCatalog}
        revealedGroupIds={revealedGroupIds}
        onAddWorkers={handleAddWorkersToTopology}
        onRequestRemoveWorker={(worker) => {
          setWorkerNodeModalOpen(false);
          requestRemoveWorkerGroup(worker);
        }}
      />
      <RemoveWorkerNodeGroupModal
        target={workerRemovalTarget}
        onClose={() => setWorkerRemovalTarget(null)}
        onConfirm={confirmRemoveWorkerGroup}
      />
    </>
  );

  if (wrapInPageShell) {
    return (
      <>
        <NetworkingPageShell
          title="Topology"
          path="/networking/topology"
          className="ocs-net-topo-page"
          createButton={
            <NetworkResourceCreateDropdown
              onSelect={(resource) => {
                setActiveCreateResource(resource);
                openFormWizard();
              }}
            />
          }
          extraHeader={
            <Content component="p" className="ocs-net-topo-page-desc">
              Visualize, scale, and manage your cluster topology. Right-click the canvas for additional actions.
            </Content>
          }
        >
          {panel}
        </NetworkingPageShell>
        {modals}
      </>
    );
  }

  return (
    <>
      {panel}
      {modals}
    </>
  );
}
