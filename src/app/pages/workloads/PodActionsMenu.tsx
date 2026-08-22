import { useState } from "react";
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import type { PodRecord } from "./podListData";

type PodActionsMenuProps = {
  pod: PodRecord;
  onDebug: (pod: PodRecord) => void;
  variant?: "plain" | "secondary";
  label?: string;
};

export default function PodActionsMenu({
  pod,
  onDebug,
  variant = "plain",
  label,
}: PodActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      onSelect={() => setOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant={variant}
          aria-label={label ?? `Actions for ${pod.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          isExpanded={open}
        >
          {variant === "plain" ? <EllipsisVIcon /> : (label ?? "Actions")}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem
          itemId="debug"
          onClick={(e) => {
            e.stopPropagation();
            onDebug(pod);
          }}
        >
          Debug
        </DropdownItem>
        <DropdownItem itemId="edit" onClick={(e) => e.stopPropagation()}>
          Edit Pod
        </DropdownItem>
        <DropdownItem itemId="delete" isDanger onClick={(e) => e.stopPropagation()}>
          Delete Pod
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
