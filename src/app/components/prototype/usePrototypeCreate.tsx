import { useCallback, useMemo, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import PrototypeCreateModal from "./PrototypeCreateModal";
import { getPrototypeCreateYaml, parseCreateLabel } from "./prototypeCreateTemplates";

export function usePrototypeCreate(createLabel: string) {
  const resourceLabel = useMemo(() => parseCreateLabel(createLabel), [createLabel]);
  const [isOpen, setIsOpen] = useState(false);
  const { pushToast } = useToast();
  const yaml = useMemo(() => getPrototypeCreateYaml(resourceLabel), [resourceLabel]);

  const openCreate = useCallback(() => setIsOpen(true), []);
  const closeCreate = useCallback(() => setIsOpen(false), []);

  const modal = (
    <PrototypeCreateModal
      isOpen={isOpen}
      resourceLabel={resourceLabel}
      yaml={yaml}
      onClose={closeCreate}
      onCreate={() => {
        pushToast({
          variant: "success",
          title: `Created ${resourceLabel} (prototype)`,
        });
        closeCreate();
      }}
    />
  );

  return { openCreate, modal, resourceLabel };
}
