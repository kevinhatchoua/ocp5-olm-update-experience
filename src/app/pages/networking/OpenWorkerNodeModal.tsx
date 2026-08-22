import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Content,
  Flex,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import type { TopologyWorkerCatalogEntry } from "./networkTopologyData";

function workerName(worker: TopologyWorkerCatalogEntry) {
  return worker.shortName;
}

type OpenWorkerNodeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workers: TopologyWorkerCatalogEntry[];
  revealedGroupIds: string[];
  onAddWorkers: (workerIds: string[]) => void;
  onRequestRemoveWorker?: (worker: TopologyWorkerCatalogEntry) => void;
};

export function OpenWorkerNodeModal({
  isOpen,
  onClose,
  workers,
  revealedGroupIds,
  onAddWorkers,
  onRequestRemoveWorker,
}: OpenWorkerNodeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const revealedSet = useMemo(() => new Set(revealedGroupIds), [revealedGroupIds]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setSelectedIds([...revealedGroupIds]);
      setIsLoading(false);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [isOpen, revealedGroupIds]);

  const pendingAddIds = useMemo(
    () => selectedIds.filter((workerId) => !revealedSet.has(workerId)),
    [selectedIds, revealedSet]
  );

  const allWorkersSelected =
    workers.length > 0 && workers.every((worker) => selectedIds.includes(worker.id));

  const toggleWorker = (workerId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? (prev.includes(workerId) ? prev : [...prev, workerId]) : prev.filter((id) => id !== workerId)
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? workers.map((worker) => worker.id) : []);
  };

  const handleAdd = () => {
    if (pendingAddIds.length === 0) return;
    onAddWorkers(pendingAddIds);
    onClose();
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="open-worker-node-modal-title">
      <ModalHeader
        title="Manage worker nodes on topology"
        description="Checked rows reflect worker nodes on the canvas. Select additional nodes to add them to the topology."
        labelId="open-worker-node-modal-title"
      />
      <ModalBody>
        {isLoading ? (
          <Flex
            direction={{ default: "column" }}
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentCenter" }}
            gap={{ default: "gapMd" }}
            className="ocs-net-topo-worker-modal__loading"
          >
            <Spinner size="lg" aria-label="Loading worker nodes" />
            <Content component="p">Loading cluster worker nodes…</Content>
          </Flex>
        ) : (
          <OcsNamedResourceDataView
            ouiaId="open-worker-node-data-view"
            ariaLabel="Cluster worker nodes"
            itemsLabel="worker nodes"
            items={workers}
            getName={workerName}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th
                      screenReaderText="Select worker node"
                      select={{
                        onSelect: (_event, isSelected) => toggleAll(isSelected),
                        isSelected: allWorkersSelected,
                      }}
                    />
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Hostname">
                      <PlainTableHeader label="Hostname" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Topology">
                      <PlainTableHeader label="Topology" />
                    </Th>
                    <Th screenReaderText="Actions" />
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((worker) => {
                    const onTopology = revealedSet.has(worker.id);
                    const isSelected = selectedIds.includes(worker.id);
                    return (
                      <Tr key={worker.id}>
                        <Td
                          select={{
                            onSelect: (_event, isChecked) => toggleWorker(worker.id, Boolean(isChecked)),
                            isSelected,
                            rowIndex: 0,
                          }}
                        />
                        <Td dataLabel="Name">{worker.shortName}</Td>
                        <Td dataLabel="Hostname">
                          <Content component="small">{worker.hostname}</Content>
                        </Td>
                        <Td dataLabel="Status">
                          <Label color={worker.ready ? "green" : "orange"} isCompact>
                            {worker.ready ? "Ready" : "Not ready"}
                          </Label>
                        </Td>
                        <Td dataLabel="Topology">
                          {onTopology ? (
                            <Label color="blue" isCompact>
                              On canvas
                            </Label>
                          ) : (
                            <Content component="small" className="ocs-net-topo-sidepanel__hint">
                              Not added
                            </Content>
                          )}
                        </Td>
                        <Td dataLabel="Actions" isActionCell>
                          {onTopology && onRequestRemoveWorker ? (
                            <Button
                              variant="link"
                              isDanger
                              isInline
                              onClick={() => onRequestRemoveWorker(worker)}
                              aria-label={`Remove ${worker.shortName} from topology`}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAdd}
          isDisabled={isLoading || pendingAddIds.length === 0}
          aria-label={
            pendingAddIds.length === 0
              ? "Add selected worker nodes"
              : `Add ${pendingAddIds.length} worker node${pendingAddIds.length === 1 ? "" : "s"} to topology`
          }
        >
          Add {pendingAddIds.length > 0 ? `(${pendingAddIds.length})` : "selected"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
