import { useMemo, useState } from "react";
import { getWorkerGroupsForScale } from "./networkTopologyData";
import NetworkTopologyPanel from "./NetworkTopologyPanel.legacy";
import NodeNetworkTableList from "./NodeNetworkTableList";
import TopologyViewToggle from "./TopologyViewToggle";
import { useNodeNetworkViewMode } from "./useNodeNetworkViewMode";

const NMSTATE_NODE_COUNT = 3;

type NodeNmStatePanelProps = {
  nameFilter?: string;
};

export default function NodeNmStatePanel({ nameFilter = "" }: NodeNmStatePanelProps) {
  const { viewMode, setViewMode } = useNodeNetworkViewMode();
  const groups = useMemo(
    () => getWorkerGroupsForScale("compact").slice(0, NMSTATE_NODE_COUNT),
    []
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const viewToggle = <TopologyViewToggle currentView={viewMode} onChange={setViewMode} />;

  if (viewMode === "table") {
    return (
      <div className="ocs-nnc-stage ocs-nnc-stage--table">
        <NodeNetworkTableList
          groups={groups}
          selectedGroupId={selectedGroupId}
          selectedResourceId={selectedResourceId}
          onSelectWorkerGroup={(group) => {
            setSelectedGroupId(group.id);
            setSelectedResourceId(null);
          }}
          onSelectResource={(group, resourceId) => {
            setSelectedGroupId(group.id);
            setSelectedResourceId(resourceId);
          }}
          onSelectPeer={() => undefined}
          getResourceConnections={() => []}
          toolbarActions={viewToggle}
        />
      </div>
    );
  }

  return (
    <div className="ocs-nnc-stage ocs-nnc-stage--graph">
      <NetworkTopologyPanel
        variant="nmstate"
        groups={groups}
        nameFilter={nameFilter}
        toolbarActions={viewToggle}
        standaloneResources={[]}
        crossEdges={[]}
        networkNodeAssignments={{}}
        revealedGroupIds={groups.map((group) => group.id)}
      />
    </div>
  );
}
