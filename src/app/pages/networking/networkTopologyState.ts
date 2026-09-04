import { useCallback, useSyncExternalStore } from "react";
import {
  getUdnRecordsForScale,
  getWorkerGroupsForScale,
  topologyWorkerCatalogFromGroups,
  attachStandaloneResourceToGroup,
  bridgeAssignmentKey,
  bridgeLabelFromAssignmentKey,
  createStandaloneBridgeForWorker,
  createStandaloneNetworkResources,
  crossEdgesForAssignments,
  isBridgeAssignmentKey,
  isLogicalNetworkStandalone,
  logicalNetworkFromRecord,
  logicalNetworkId,
  updateStandaloneResourcesByIdSuffix,
  type NetworkNodeAssignments,
  type NodeNetworkConfigurationInput,
  type ResourceInstallStatus,
  type StandaloneTopologyResource,
  type TopologyCrossEdge,
  type TopologyDataScale,
  type WorkerNodeGroup,
} from "./networkTopologyData";
import { type UdnRecord, udnDetailPath } from "./networkingMockData";

export type ResourceLifecycleAction = "pause" | "stop" | "restart" | "delete";

export type ResourceLifecycleTarget = {
  resourceId: string;
  placement: "group" | "standalone";
  groupId?: string;
  label: string;
};

function lifecycleStatusForAction(action: Exclude<ResourceLifecycleAction, "delete">): ResourceInstallStatus {
  if (action === "pause") return "pending";
  if (action === "stop") return "failed";
  return "installing";
}

function cloneGroups(scale: TopologyDataScale): WorkerNodeGroup[] {
  return getWorkerGroupsForScale(scale).map((group) => ({
    ...group,
    resources: group.resources.map((r) => ({ ...r })),
    edges: group.edges.map((e) => ({ ...e })),
  }));
}

function buildInitialLogicalLayer(
  scale: TopologyDataScale,
  groups: WorkerNodeGroup[]
): {
  standaloneResources: StandaloneTopologyResource[];
  networkNodeAssignments: NetworkNodeAssignments;
} {
  const records = getUdnRecordsForScale(scale);
  const standaloneResources = records.map((record, index) =>
    logicalNetworkFromRecord(record, index, udnDetailPath(record))
  );
  const allWorkerIds = groups.map((group) => group.id);
  const networkNodeAssignments: NetworkNodeAssignments = {};

  standaloneResources.filter(isLogicalNetworkStandalone).forEach((resource, index) => {
    if (resource.kind === "cudn") {
      networkNodeAssignments[resource.id] = allWorkerIds.filter((_, workerIndex) => workerIndex % 2 === 0);
      return;
    }
    const stride = 3 + (index % 2);
    networkNodeAssignments[resource.id] = allWorkerIds.filter((_, workerIndex) => workerIndex % stride === 0);
  });

  return { standaloneResources, networkNodeAssignments };
}

function buildTopologySnapshot(scale: TopologyDataScale): TopologySnapshot {
  const groups = cloneGroups(scale);
  const logical = buildInitialLogicalLayer(scale, groups);
  return {
    scale,
    groups,
    standaloneResources: logical.standaloneResources,
    crossEdges: crossEdgesForAssignments(logical.networkNodeAssignments, logical.standaloneResources, groups),
    networkNodeAssignments: logical.networkNodeAssignments,
    revealedGroupIds: groups.map((group) => group.id),
    provisionGeneration: 0,
    fitContentToken: 1,
    provisionedBridgeConfig: null,
  };
}

type TopologySnapshot = {
  scale: TopologyDataScale;
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  crossEdges: TopologyCrossEdge[];
  networkNodeAssignments: NetworkNodeAssignments;
  revealedGroupIds: string[];
  provisionGeneration: number;
  fitContentToken: number;
  provisionedBridgeConfig: NodeNetworkConfigurationInput | null;
};

let snapshot: TopologySnapshot = buildTopologySnapshot("compact");

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): TopologySnapshot {
  return snapshot;
}

export function getTopologyDataScale(): TopologyDataScale {
  return snapshot.scale;
}

export function setTopologyDataScale(scale: TopologyDataScale): void {
  if (snapshot.scale === scale) return;
  snapshot = {
    ...buildTopologySnapshot(scale),
    fitContentToken: snapshot.fitContentToken + 1,
  };
  emit();
}

function syncCrossEdgesFromAssignments() {
  snapshot = {
    ...snapshot,
    crossEdges: crossEdgesForAssignments(
      snapshot.networkNodeAssignments,
      snapshot.standaloneResources,
      snapshot.groups
    ),
  };
}

export function useNetworkTopologyState() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const setGroups = useCallback((updater: WorkerNodeGroup[] | ((prev: WorkerNodeGroup[]) => WorkerNodeGroup[])) => {
    snapshot = {
      ...snapshot,
      groups: typeof updater === "function" ? updater(snapshot.groups) : updater,
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  const setStandaloneResources = useCallback(
    (updater: StandaloneTopologyResource[] | ((prev: StandaloneTopologyResource[]) => StandaloneTopologyResource[])) => {
      snapshot = {
        ...snapshot,
        standaloneResources:
          typeof updater === "function" ? updater(snapshot.standaloneResources) : updater,
      };
      syncCrossEdgesFromAssignments();
      emit();
    },
    []
  );

  const setCrossEdges = useCallback(
    (updater: TopologyCrossEdge[] | ((prev: TopologyCrossEdge[]) => TopologyCrossEdge[])) => {
      snapshot = {
        ...snapshot,
        crossEdges: typeof updater === "function" ? updater(snapshot.crossEdges) : updater,
      };
      emit();
    },
    []
  );

  const setNetworkNodeAssignments = useCallback(
    (updater: NetworkNodeAssignments | ((prev: NetworkNodeAssignments) => NetworkNodeAssignments)) => {
      snapshot = {
        ...snapshot,
        networkNodeAssignments:
          typeof updater === "function" ? updater(snapshot.networkNodeAssignments) : updater,
      };
      syncCrossEdgesFromAssignments();
      emit();
    },
    []
  );

  const bumpFitContent = useCallback(() => {
    snapshot = { ...snapshot, fitContentToken: snapshot.fitContentToken + 1 };
    emit();
  }, []);

  const setWorkerAssignedToNetwork = useCallback((assignmentKey: string, workerId: string, assigned: boolean) => {
    if (isBridgeAssignmentKey(assignmentKey)) {
      const bridgeLabel = bridgeLabelFromAssignmentKey(assignmentKey);
      const config = snapshot.provisionedBridgeConfig ?? {
        physicalNetworkName: "localnet-rzpi1d",
        bridgeName: bridgeLabel,
      };
      const current = snapshot.networkNodeAssignments[assignmentKey] ?? [];
      const standaloneId = `${workerId}-${bridgeLabel}`;

      if (assigned) {
        if (current.includes(workerId)) return;
        const nextWorkers = [...current, workerId];
        const worker = topologyWorkerCatalogFromGroups(snapshot.groups).find((entry) => entry.id === workerId);
        const group = snapshot.groups.find((entry) => entry.id === workerId);
        if (!worker || !group) return;

        const alreadyNested = group.resources.some((resource) => resource.id === standaloneId);
        let nextGroups = snapshot.groups;
        let nextStandalones = snapshot.standaloneResources;

        if (!alreadyNested) {
          const floatingStandalone = snapshot.standaloneResources.find((resource) => resource.id === standaloneId);
          const standaloneToNest =
            floatingStandalone ?? createStandaloneBridgeForWorker(config, worker, nextWorkers.length - 1);
          nextGroups = snapshot.groups.map((entry) =>
            entry.id === workerId ? attachStandaloneResourceToGroup(entry, standaloneToNest) : entry
          );
          nextStandalones = snapshot.standaloneResources.filter((resource) => resource.id !== standaloneId);
        }

        const revealedGroupIds = snapshot.revealedGroupIds.includes(workerId)
          ? snapshot.revealedGroupIds
          : [...snapshot.revealedGroupIds, workerId];

        snapshot = {
          ...snapshot,
          networkNodeAssignments: {
            ...snapshot.networkNodeAssignments,
            [assignmentKey]: nextWorkers,
          },
          groups: nextGroups,
          standaloneResources: nextStandalones,
          revealedGroupIds,
        };
      } else {
        const nextWorkers = current.filter((id) => id !== workerId);
        snapshot = {
          ...snapshot,
          networkNodeAssignments: {
            ...snapshot.networkNodeAssignments,
            [assignmentKey]: nextWorkers,
          },
          standaloneResources: snapshot.standaloneResources.filter((resource) => resource.id !== standaloneId),
          groups: snapshot.groups.map((group) => {
            if (!group.resources.some((resource) => resource.id === standaloneId)) return group;
            return {
              ...group,
              resources: group.resources.filter((resource) => resource.id !== standaloneId),
              edges: group.edges.filter((edge) => edge.from !== standaloneId && edge.to !== standaloneId),
            };
          }),
        };
      }

      syncCrossEdgesFromAssignments();
      emit();
      return;
    }

    const current = snapshot.networkNodeAssignments[assignmentKey] ?? [];
    const nextWorkers = assigned
      ? current.includes(workerId)
        ? current
        : [...current, workerId]
      : current.filter((id) => id !== workerId);

    const nextAssignments = {
      ...snapshot.networkNodeAssignments,
      [assignmentKey]: nextWorkers,
    };

    const revealedGroupIds =
      assigned && !snapshot.revealedGroupIds.includes(workerId)
        ? [...snapshot.revealedGroupIds, workerId]
        : snapshot.revealedGroupIds;

    snapshot = {
      ...snapshot,
      networkNodeAssignments: nextAssignments,
      revealedGroupIds,
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  const addLogicalNetwork = useCallback((record: UdnRecord) => {
    const id = logicalNetworkId(record.name, record.kind);
    if (snapshot.standaloneResources.some((resource) => resource.id === id)) return;

    const logicalCount = snapshot.standaloneResources.filter(isLogicalNetworkStandalone).length;
    const resource = logicalNetworkFromRecord(record, logicalCount, udnDetailPath(record));

    snapshot = {
      ...snapshot,
      standaloneResources: [...snapshot.standaloneResources, resource],
      networkNodeAssignments: {
        ...snapshot.networkNodeAssignments,
        [id]: [],
      },
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  const provisionConfiguration = useCallback((physicalNetworkName: string) => {
    const name = physicalNetworkName.trim() || "localnet-rzpi1d";
    const bridgeConfig = { physicalNetworkName: name, bridgeName: "br-localnet" };
    snapshot = {
      ...snapshot,
      standaloneResources: [
        ...snapshot.standaloneResources.filter(
          (resource) => !resource.id.endsWith("br-localnet") || isLogicalNetworkStandalone(resource)
        ),
        ...createStandaloneNetworkResources(bridgeConfig),
      ],
      networkNodeAssignments: {
        ...snapshot.networkNodeAssignments,
        [bridgeAssignmentKey("br-localnet")]: [],
      },
      provisionedBridgeConfig: bridgeConfig,
      provisionGeneration: snapshot.provisionGeneration + 1,
    };
    syncCrossEdgesFromAssignments();
    emit();
    return name;
  }, []);

  const attachStandaloneToGroup = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      const standalone = snapshot.standaloneResources.find((r) => r.id === resourceId);
      if (!standalone || isLogicalNetworkStandalone(standalone)) return null;
      snapshot = {
        ...snapshot,
        standaloneResources: snapshot.standaloneResources.filter((r) => r.id !== resourceId),
        groups: snapshot.groups.map((group) =>
          group.id === groupId ? attachStandaloneResourceToGroup(group, standalone, connectToResourceId) : group
        ),
        revealedGroupIds: snapshot.revealedGroupIds.includes(groupId)
          ? snapshot.revealedGroupIds
          : [...snapshot.revealedGroupIds, groupId],
      };
      syncCrossEdgesFromAssignments();
      emit();
      return standalone;
    },
    []
  );

  const markStandalonesInstalling = useCallback(() => {
    const updateGroupBridges = (groups: WorkerNodeGroup[]) =>
      groups.map((group) => ({
        ...group,
        resources: group.resources.map((resource) =>
          resource.id.endsWith("br-localnet") ? { ...resource, status: "installing" as const } : resource
        ),
      }));
    snapshot = {
      ...snapshot,
      standaloneResources: updateStandaloneResourcesByIdSuffix(snapshot.standaloneResources, "br-localnet", "installing"),
      groups: updateGroupBridges(snapshot.groups),
    };
    emit();
  }, []);

  const markStandalonesConfigured = useCallback(() => {
    const updateGroupBridges = (groups: WorkerNodeGroup[]) =>
      groups.map((group) => ({
        ...group,
        resources: group.resources.map((resource) =>
          resource.id.endsWith("br-localnet") ? { ...resource, status: "configured" as const } : resource
        ),
      }));
    snapshot = {
      ...snapshot,
      standaloneResources: updateStandaloneResourcesByIdSuffix(snapshot.standaloneResources, "br-localnet", "configured"),
      groups: updateGroupBridges(snapshot.groups),
    };
    emit();
  }, []);

  const revealWorkerGroups = useCallback((workerIds: string[]) => {
    const unique = workerIds.filter((id) => !snapshot.revealedGroupIds.includes(id));
    if (unique.length === 0) return;
    snapshot = {
      ...snapshot,
      revealedGroupIds: [...snapshot.revealedGroupIds, ...unique],
    };
    emit();
  }, []);

  const hideWorkerGroups = useCallback((workerIds: string[]) => {
    const idSet = new Set(workerIds.filter(Boolean));
    if (idSet.size === 0) return;

    const nextAssignments: NetworkNodeAssignments = {};
    Object.entries(snapshot.networkNodeAssignments).forEach(([logicalId, assigned]) => {
      nextAssignments[logicalId] = assigned.filter((workerId) => !idSet.has(workerId));
    });

    snapshot = {
      ...snapshot,
      revealedGroupIds: snapshot.revealedGroupIds.filter((id) => !idSet.has(id)),
      networkNodeAssignments: nextAssignments,
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  const applyResourceLifecycleAction = useCallback(
    (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => {
      if (action === "delete") {
        const bridgeKey = bridgeAssignmentKey("br-localnet");
        const isNncpConfig = target.resourceId === "nncp-br-localnet";
        const isPerWorkerBridge = target.resourceId.endsWith("-br-localnet") && !isNncpConfig;

        if (isNncpConfig) {
          snapshot = {
            ...snapshot,
            standaloneResources: snapshot.standaloneResources.filter(
              (resource) => resource.id !== target.resourceId && !resource.id.endsWith("-br-localnet")
            ),
            groups: snapshot.groups.map((group) => ({
              ...group,
              resources: group.resources.filter((resource) => !resource.id.endsWith("-br-localnet")),
              edges: group.edges.filter(
                (edge) => !edge.from.endsWith("-br-localnet") && !edge.to.endsWith("-br-localnet")
              ),
            })),
            networkNodeAssignments: {
              ...snapshot.networkNodeAssignments,
              [bridgeKey]: [],
            },
          };
        } else if (isPerWorkerBridge) {
          const workerId = target.groupId ?? target.resourceId.replace(/-br-localnet$/, "");
          const current = snapshot.networkNodeAssignments[bridgeKey] ?? [];
          snapshot = {
            ...snapshot,
            standaloneResources: snapshot.standaloneResources.filter(
              (resource) => resource.id !== target.resourceId
            ),
            groups: snapshot.groups.map((group) => {
              if (!group.resources.some((resource) => resource.id === target.resourceId)) return group;
              return {
                ...group,
                resources: group.resources.filter((resource) => resource.id !== target.resourceId),
                edges: group.edges.filter(
                  (edge) => edge.from !== target.resourceId && edge.to !== target.resourceId
                ),
              };
            }),
            networkNodeAssignments: {
              ...snapshot.networkNodeAssignments,
              [bridgeKey]: current.filter((id) => id !== workerId),
            },
          };
        } else if (target.placement === "standalone") {
          snapshot = {
            ...snapshot,
            standaloneResources: snapshot.standaloneResources.filter(
              (resource) => resource.id !== target.resourceId
            ),
          };
        } else {
          snapshot = {
            ...snapshot,
            groups: snapshot.groups.map((group) => {
              if (group.id !== target.groupId) return group;
              return {
                ...group,
                resources: group.resources.filter((resource) => resource.id !== target.resourceId),
                edges: group.edges.filter(
                  (edge) => edge.from !== target.resourceId && edge.to !== target.resourceId
                ),
              };
            }),
          };
        }
        syncCrossEdgesFromAssignments();
        emit();
        return;
      }

      const nextStatus = lifecycleStatusForAction(action);
      if (target.placement === "standalone") {
        snapshot = {
          ...snapshot,
          standaloneResources: snapshot.standaloneResources.map((resource) =>
            resource.id === target.resourceId ? { ...resource, status: nextStatus } : resource
          ),
        };
      } else if (target.groupId) {
        snapshot = {
          ...snapshot,
          groups: snapshot.groups.map((group) => {
            if (group.id !== target.groupId) return group;
            return {
              ...group,
              resources: group.resources.map((resource) =>
                resource.id === target.resourceId ? { ...resource, status: nextStatus } : resource
              ),
            };
          }),
        };
      }
      emit();
    },
    []
  );

  return {
    ...state,
    setTopologyDataScale,
    setGroups,
    setStandaloneResources,
    setCrossEdges,
    setNetworkNodeAssignments,
    setWorkerAssignedToNetwork,
    bumpFitContent,
    addLogicalNetwork,
    provisionConfiguration,
    attachStandaloneToGroup,
    revealWorkerGroups,
    hideWorkerGroups,
    markStandalonesInstalling,
    markStandalonesConfigured,
    applyResourceLifecycleAction,
  };
}
