import { isBridgeNetworkResource } from "./networkTopologyData";
import type { NetResource } from "./networkTopologyData";
import { getNncpRecords, nncpDetailPath } from "./networkingMockData";

export type NncpLineageLink = {
  nncpName: string;
  nncpPath: string;
  bridgeLabel: string;
  bridgeResourceId: string;
};

const DEFAULT_NNCP_NAME = "nncp-br-localnet";

export function resolveNncpLineageForBridge(resource: {
  id: string;
  label: string;
  kind: string;
}): NncpLineageLink | null {
  if (!isBridgeNetworkResource(resource)) return null;

  const records = getNncpRecords();
  const nncpName = records[0]?.name ?? DEFAULT_NNCP_NAME;

  return {
    nncpName,
    nncpPath: nncpDetailPath(nncpName),
    bridgeLabel: resource.label,
    bridgeResourceId: resource.id,
  };
}

export type NncpLineageConnectionEntry = {
  edgeId: string;
  direction: "out";
  peerId: string;
  peerLabel: string;
  peerSubtitle: string;
  lineage?: true;
};

export function buildNncpLineageConnections(
  resource: NetResource,
  lineage: NncpLineageLink
): NncpLineageConnectionEntry[] {
  return [
    {
      edgeId: `nncp-lineage-${lineage.nncpName}`,
      direction: "out",
      peerId: `nncp-${lineage.bridgeLabel}`,
      peerLabel: lineage.nncpName,
      peerSubtitle: "NodeNetworkConfigurationPolicy source manifest",
      lineage: true,
    },
    {
      edgeId: `nncp-applies-${resource.id}`,
      direction: "out",
      peerId: resource.id,
      peerLabel: resource.label,
      peerSubtitle: "Applies state to target OVS bridge",
      lineage: true,
    },
  ];
}
