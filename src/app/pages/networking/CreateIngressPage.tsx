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
  INGRESS_YAML_SCHEMA,
  generateRouteName,
  ingressFormToYaml,
  ingressYamlToForm,
  type IngressFormState,
} from "./consoleResourceCreateYaml";
import { NETWORKING_CRUMB } from "./networkingShared";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

const SERVICE_OPTIONS = ["kubernetes", "openshift"];

export default function CreateIngressPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [serviceOpen, setServiceOpen] = useState(false);

  const initialState = useMemo<IngressFormState>(
    () => ({
      name: generateRouteName().replace(/^route-/, "ingress-"),
      namespace: "default",
      host: "",
      path: "/",
      serviceName: "",
      port: "8080",
    }),
    []
  );

  const sync = useSyncedFormYaml(
    {
      toYaml: ingressFormToYaml,
      fromYaml: ingressYamlToForm,
      schemaTitle: "Ingress",
      schemaFields: INGRESS_YAML_SCHEMA,
    },
    initialState
  );

  const canCreate =
    sync.canSubmit && sync.formState.name.trim().length > 0 && sync.formState.serviceName.trim().length > 0;

  const handleCreate = () => {
    addPrototypeListItem("ingresses", {
      name: sync.formState.name,
      namespace: sync.formState.namespace,
      fields: {
        host: sync.formState.host,
        serviceName: sync.formState.serviceName,
        path: sync.formState.path,
      },
    });
    pushToast({ variant: "success", title: `Created Ingress ${sync.formState.name} (prototype)` });
    navigate("/networking/ingresses");
  };

  return (
    <ResourceCreatePageShell
      breadcrumbs={[
        { label: "Home", path: "/" },
        NETWORKING_CRUMB,
        { label: "Ingresses", path: "/networking/ingresses" },
        { label: "Create Ingress" },
      ]}
      title="Create Ingress"
      description="Ingress exposes HTTP and HTTPS routes from outside the cluster to Services within the cluster."
      listPath="/networking/ingresses"
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
          <FormGroup label="Name" isRequired fieldId="ingress-name">
            <TextInput
              id="ingress-name"
              value={sync.formState.name}
              onChange={(_e, value) => sync.patchFormState({ name: value })}
            />
          </FormGroup>

          <FormGroup label="Hostname" fieldId="ingress-host">
            <TextInput
              id="ingress-host"
              value={sync.formState.host}
              onChange={(_e, value) => sync.patchFormState({ host: value })}
            />
          </FormGroup>

          <FormGroup label="Path" fieldId="ingress-path">
            <TextInput
              id="ingress-path"
              value={sync.formState.path}
              onChange={(_e, value) => sync.patchFormState({ path: value })}
            />
          </FormGroup>

          <FormGroup label="Service" isRequired fieldId="ingress-service">
            <Select
              id="ingress-service"
              isOpen={serviceOpen}
              selected={sync.formState.serviceName}
              onSelect={(_e, value) => {
                sync.patchFormState({ serviceName: String(value) });
                setServiceOpen(false);
              }}
              onOpenChange={setServiceOpen}
              toggle={(toggleRef) => (
                <MenuToggle ref={toggleRef} onClick={() => setServiceOpen((o) => !o)} isExpanded={serviceOpen} isFullWidth>
                  {sync.formState.serviceName || "Select a Service"}
                </MenuToggle>
              )}
            >
              <SelectList>
                {SERVICE_OPTIONS.map((svc) => (
                  <SelectOption key={svc} value={svc}>
                    {svc}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
            <FormHelperText>
              <span>Backend Service for this Ingress rule.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Service port" fieldId="ingress-port">
            <TextInput
              id="ingress-port"
              type="number"
              value={sync.formState.port}
              onChange={(_e, value) => sync.patchFormState({ port: value })}
            />
          </FormGroup>
        </DualModeCreateLayout>
      </Form>
    </ResourceCreatePageShell>
  );
}
