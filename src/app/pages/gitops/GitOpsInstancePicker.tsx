import { useCallback, useEffect, useState } from "react";
import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
import { ARGO_INSTANCES } from "./gitopsData";

const STORAGE_KEY = "ocs-gitops-instance";

function readStoredInstance(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ARGO_INSTANCES.some((a) => a.name === stored)) return stored;
  } catch {
    /* ignore */
  }
  return ARGO_INSTANCES[0]?.name ?? "openshift-gitops";
}

export function useGitOpsInstance() {
  const [instance, setInstanceState] = useState(readStoredInstance);

  useEffect(() => {
    setInstanceState(readStoredInstance());
  }, []);

  const setInstance = useCallback((name: string) => {
    setInstanceState(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* ignore */
    }
  }, []);

  return { instance, setInstance, instances: ARGO_INSTANCES };
}

export default function GitOpsInstancePicker({
  className,
}: {
  className?: string;
}) {
  const { instance, setInstance, instances } = useGitOpsInstance();
  const [open, setOpen] = useState(false);

  return (
    <Select
      id="gitops-instance-picker"
      className={className}
      isOpen={open}
      selected={instance}
      onSelect={(_e, value) => {
        setInstance(String(value));
        setOpen(false);
      }}
      onOpenChange={(isOpen) => setOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setOpen((o) => !o)}
          isExpanded={open}
          aria-label="Argo CD instance"
        >
          Argo CD instance: {instance}
        </MenuToggle>
      )}
    >
      <SelectList>
        {instances.map((argo) => (
          <SelectOption key={`${argo.ns}/${argo.name}`} value={argo.name}>
            {argo.name}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
}
