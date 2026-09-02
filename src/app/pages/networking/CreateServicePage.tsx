import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Form,
  FormGroup,
  FormHelperText,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInput,
} from "@patternfly/react-core";
import { ResourceCreatePageShell } from "../../components/prototype/ResourceCreatePageShell";
import { addPrototypeListItem } from "../../lib/prototypeListStore";
import { useToast } from "../../contexts/ToastContext";
import { DualModeCreateLayout } from "./DualModeCreateLayout";
import {
  SERVICE_YAML_SCHEMA,
  generateServiceName,
  serviceFormToYaml,
  serviceYamlToForm,
  type ServiceFormState,
} from "./consoleResourceCreateYaml";
import { NETWORKING_CRUMB } from "./networkingShared";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

const SERVICE_TYPES = ["ClusterIP", "NodePort", "LoadBalancer"];

export default function CreateServicePage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [typeOpen, setTypeOpen] = useState(false);

  const initialState = useMemo<ServiceFormState>(
    () => ({
      name: generateServiceName(),
      namespace: "default",
      type: "ClusterIP",
      port: "8080",
      targetPort: "8080",
      selector: "app=",
    }),
    []
  );

  const sync = useSyncedFormYaml(
    {
      toYaml: serviceFormToYaml,
      fromYaml: serviceYamlToForm,
      schemaTitle: "Service",
      schemaFields: SERVICE_YAML_SCHEMA,
    },
    initialState
  );

  const canCreate = sync.canSubmit && sync.formState.name.trim().length > 0;

  const handleCreate = () => {
    addPrototypeListItem("services", {
      name: sync.formState.name,
      namespace: sync.formState.namespace,
      fields: {
        type: sync.formState.type,
        port: sync.formState.port,
        targetPort: sync.formState.targetPort,
      },
    });
    pushToast({ variant: "success", title: `Created Service ${sync.formState.name} (prototype)` });
    navigate("/networking");
  };

  return (
    <ResourceCreatePageShell
      breadcrumbs={[
        { label: "Home", path: "/" },
        NETWORKING_CRUMB,
        { label: "Services", path: "/networking" },
        { label: "Create Service" },
      ]}
      title="Create Service"
      description="Expose pods on a stable network endpoint inside or outside the cluster."
      listPath="/networking"
      canCreate={canCreate}
      onCreate={handleCreate}
      yamlText={sync.yamlText}
      showDownload={sync.viewMode === "yaml"}
    >
      <Form>
        <DualModeCreateLayout
          viewMode={sync.viewMode}
          onViewModeChange={sync.setViewMode}
          yamlText={sync.yamlText}
          onYamlChange={sync.handleYamlChange}
          yamlError={sync.yamlError}
          hasUnmappedContent={sync.hasUnmappedContent}
          schemaTitle={sync.schemaTitle}
          schemaFields={sync.schemaFields}
        >
          <FormGroup label="Name" isRequired fieldId="service-name">
            <TextInput
              id="service-name"
              value={sync.formState.name}
              onChange={(_e, value) => sync.patchFormState({ name: value })}
            />
            <FormHelperText>
              <span>A unique name for the Service within the project.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Type" fieldId="service-type">
            <Select
              id="service-type"
              isOpen={typeOpen}
              selected={sync.formState.type}
              onSelect={(_e, value) => {
                sync.patchFormState({ type: String(value) });
                setTypeOpen(false);
              }}
              onOpenChange={setTypeOpen}
              toggle={(toggleRef) => (
                <MenuToggle ref={toggleRef} onClick={() => setTypeOpen((open) => !open)} isExpanded={typeOpen} isFullWidth>
                  {sync.formState.type}
                </MenuToggle>
              )}
            >
              <SelectList>
                {SERVICE_TYPES.map((type) => (
                  <SelectOption key={type} value={type}>
                    {type}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
            <FormHelperText>
              <span>ClusterIP for internal access; NodePort or LoadBalancer for external access.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Pod selector" fieldId="service-selector">
            <TextInput
              id="service-selector"
              value={sync.formState.selector}
              onChange={(_e, value) => sync.patchFormState({ selector: value })}
              placeholder="app=my-app"
            />
            <FormHelperText>
              <span>Label selector matching pods for this Service (key=value).</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Port" fieldId="service-port">
            <TextInput
              id="service-port"
              type="number"
              value={sync.formState.port}
              onChange={(_e, value) => sync.patchFormState({ port: value })}
            />
            <FormHelperText>
              <span>Port exposed by the Service.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Target port" fieldId="service-target-port">
            <TextInput
              id="service-target-port"
              type="number"
              value={sync.formState.targetPort}
              onChange={(_e, value) => sync.patchFormState({ targetPort: value })}
            />
            <FormHelperText>
              <span>Port on the pod to forward traffic to.</span>
            </FormHelperText>
          </FormGroup>
        </DualModeCreateLayout>
      </Form>
    </ResourceCreatePageShell>
  );
}
