import { useState } from "react";
import {
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import OutlinedStopCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-stop-circle-icon";
import PauseIcon from "@patternfly/react-icons/dist/esm/icons/pause-icon";
import RedoIcon from "@patternfly/react-icons/dist/esm/icons/redo-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import type { ResourceLifecycleAction, ResourceLifecycleTarget } from "./networkTopologyState";

type TopologyResourceActionsMenuProps = {
  label: string;
  lifecycleTarget?: ResourceLifecycleTarget;
  onResourceLifecycleAction?: (target: ResourceLifecycleTarget, action: ResourceLifecycleAction) => void;
  onConfigure?: () => void;
  configureLabel?: string;
  onNotice?: (notice: { title: string; variant: "success" | "warning" | "info" }) => void;
  onDeleted?: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  toggleVariant?: "plain" | "secondary";
  showActionsLabel?: boolean;
};

export default function TopologyResourceActionsMenu({
  label,
  lifecycleTarget,
  onResourceLifecycleAction,
  onConfigure,
  configureLabel = "Configure",
  onNotice,
  onDeleted,
  isOpen,
  onOpenChange,
  toggleVariant = "plain",
  showActionsLabel = false,
}: TopologyResourceActionsMenuProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const canLifecycle = Boolean(onResourceLifecycleAction && lifecycleTarget);

  if (!canLifecycle && !onConfigure) return null;

  const runLifecycleAction = (action: Exclude<ResourceLifecycleAction, "delete">) => {
    if (!lifecycleTarget || !onResourceLifecycleAction) return;
    onResourceLifecycleAction(lifecycleTarget, action);
    onNotice?.({
      variant: "info",
      title: `${action.charAt(0).toUpperCase()}${action.slice(1)} requested for ${label}.`,
    });
    onOpenChange(false);
  };

  const confirmDelete = () => {
    if (!lifecycleTarget || !onResourceLifecycleAction) return;
    onResourceLifecycleAction(lifecycleTarget, "delete");
    onNotice?.({
      variant: "success",
      title: `Deleted ${label} from the topology.`,
    });
    setDeleteConfirmOpen(false);
    onOpenChange(false);
    onDeleted?.();
  };

  const modalId = lifecycleTarget?.resourceId ?? label;

  return (
    <>
      <Dropdown
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSelect={() => onOpenChange(false)}
        popperProps={{ position: "right" }}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            variant={toggleVariant}
            isExpanded={isOpen}
            onClick={() => onOpenChange(!isOpen)}
            aria-label={`Actions for ${label}`}
          >
            {showActionsLabel ? "Actions" : <EllipsisVIcon aria-hidden />}
          </MenuToggle>
        )}
      >
        <DropdownList aria-label={`Actions for ${label}`}>
          {onConfigure ? (
            <DropdownItem
              itemId="configure"
              icon={<CogIcon aria-hidden />}
              onClick={() => {
                onConfigure();
                onOpenChange(false);
              }}
            >
              {configureLabel}
            </DropdownItem>
          ) : null}
          {canLifecycle ? (
            <>
              <DropdownItem itemId="pause" icon={<PauseIcon aria-hidden />} onClick={() => runLifecycleAction("pause")}>
                Pause
              </DropdownItem>
              <DropdownItem
                itemId="stop"
                icon={<OutlinedStopCircleIcon aria-hidden />}
                onClick={() => runLifecycleAction("stop")}
              >
                Stop
              </DropdownItem>
              <DropdownItem
                itemId="restart"
                icon={<RedoIcon aria-hidden />}
                onClick={() => runLifecycleAction("restart")}
              >
                Restart
              </DropdownItem>
              <DropdownItem
                itemId="delete"
                isDanger
                icon={<TrashIcon aria-hidden />}
                onClick={() => {
                  onOpenChange(false);
                  setDeleteConfirmOpen(true);
                }}
              >
                Delete
              </DropdownItem>
            </>
          ) : null}
        </DropdownList>
      </Dropdown>

      {canLifecycle ? (
        <Modal
          variant="small"
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          aria-labelledby={`delete-topo-resource-${modalId}`}
        >
          <ModalHeader title={`Delete ${label}?`} labelId={`delete-topo-resource-${modalId}`} />
          <ModalBody>
            <Content component="p">
              Deleting <strong>{label}</strong> removes it from the topology view. Cluster resources may remain until
              reconciled.
            </Content>
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </>
  );
}
