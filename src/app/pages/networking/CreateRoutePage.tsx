import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Checkbox,
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
  ROUTE_YAML_SCHEMA,
  generateRouteName,
  routeFormToYaml,
  routeYamlToForm,
  type RouteFormState,
} from "./consoleResourceCreateYaml";
import { NETWORKING_CRUMB } from "./networkingShared";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

const SERVICE_OPTIONS = ["kubernetes", "openshift"];

export default function CreateRoutePage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [serviceOpen, setServiceOpen] = useState(false);

  const initialState = useMemo<RouteFormState>(
    () => ({
      name: generateRouteName(),
      namespace: "default",
      host: "",
      path: "",
      serviceName: "",
      weight: "100",
      secureRoute: false,
    }),
    []
  );

  const sync = useSyncedFormYaml(
    {
      toYaml: routeFormToYaml,
      fromYaml: routeYamlToForm,
      schemaTitle: "Route",
      schemaFields: ROUTE_YAML_SCHEMA,
    },
    initialState
  );

  const canCreate =
    sync.canSubmit && sync.formState.name.trim().length > 0 && sync.formState.serviceName.trim().length > 0;

  const handleCreate = () => {
    addPrototypeListItem("routes", {
      name: sync.formState.name,
      namespace: sync.formState.namespace,
      fields: {
        host: sync.formState.host,
        serviceName: sync.formState.serviceName,
        path: sync.formState.path,
      },
    });
    pushToast({ variant: "success", title: `Created Route ${sync.formState.name} (prototype)` });
    navigate("/networking/routes");
  };

  return (
    <ResourceCreatePageShell
      breadcrumbs={[
        { label: "Home", path: "/" },
        NETWORKING_CRUMB,
        { label: "Routes", path: "/networking/routes" },
        { label: "Create Route" },
      ]}
      title="Create Route"
      description="Routing is a way to make your application publicly visible."
      listPath="/networking/routes"
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
          <FormGroup label="Name" isRequired fieldId="route-name">
            <TextInput
              id="route-name"
              value={sync.formState.name}
              onChange={(_e, value) => sync.patchFormState({ name: value })}
            />
            <FormHelperText>
              <span>A unique name for the Route within the project.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Hostname" fieldId="route-host">
            <TextInput
              id="route-host"
              value={sync.formState.host}
              onChange={(_e, value) => sync.patchFormState({ host: value })}
            />
            <FormHelperText>
              <span>Public hostname for the Route. Leave blank to generate automatically.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Path" fieldId="route-path">
            <TextInput
              id="route-path"
              value={sync.formState.path}
              onChange={(_e, value) => sync.patchFormState({ path: value })}
            />
            <FormHelperText>
              <span>Path that the router watches to forward traffic to the service.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Service" isRequired fieldId="route-service">
            <Select
              id="route-service"
              isOpen={serviceOpen}
              selected={sync.formState.serviceName}
              onSelect={(_e, value) => {
                sync.patchFormState({ serviceName: String(value) });
                setServiceOpen(false);
              }}
              onOpenChange={setServiceOpen}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setServiceOpen((open) => !open)}
                  isExpanded={serviceOpen}
                  isFullWidth
                >
                  {sync.formState.serviceName || "Select a Service"}
                </MenuToggle>
              )}
              placeholder="Select a Service"
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
              <span>Target Service for the Route.</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Service weight" fieldId="route-weight">
            <TextInput
              id="route-weight"
              type="number"
              min={0}
              max={255}
              value={sync.formState.weight}
              onChange={(_e, value) => sync.patchFormState({ weight: value })}
            />
            <FormHelperText>
              <span>Weight for traffic distribution (0–255).</span>
            </FormHelperText>
          </FormGroup>

          <FormGroup fieldId="route-secure" label="Security">
            <Checkbox
              id="route-secure"
              label="Secure Route"
              isChecked={sync.formState.secureRoute}
              onChange={(_e, checked) => sync.patchFormState({ secureRoute: checked })}
            />
            <FormHelperText>
              <span>Enable TLS termination for HTTPS access.</span>
            </FormHelperText>
          </FormGroup>
        </DualModeCreateLayout>
      </Form>
    </ResourceCreatePageShell>
  );
}
