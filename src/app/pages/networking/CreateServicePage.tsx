import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Alert,
  Button,
  Content,
  ExpandableSection,
  Flex,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  TextArea,
  TextInput,
  Title,
} from "@patternfly/react-core";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { ConsoleYamlCreateView, type ConsoleSchemaField } from "./ConsoleYamlCreateView";
import { EditorToggle } from "./EditorToggle";
import {
  createDefaultServiceFormState,
  EMPTY_SERVICE_PORT_ROW,
  EMPTY_SERVICE_SELECTOR_PAIR,
  selectorPairsToLines,
  serviceFormToYaml,
  serviceRecordToFormState,
  serviceYamlToForm,
  type ServiceFormState,
  type ServiceKeyValuePair,
  type ServicePortRow,
} from "./networkCreateYaml";
import {
  countPodsMatchingSelector,
  createService,
  getService,
  serviceDetailPath,
  serviceEditPath,
} from "./networkingMockData";
import { NETWORKING_CRUMB } from "./networkingShared";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

const SERVICE_TYPES = ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"] as const;
const PORT_PROTOCOLS = ["TCP", "UDP", "SCTP"] as const;

const SERVICE_SCHEMA_INTRO =
  "Service is a named abstraction of software service (for example, mysql) consisting of local port that the proxy listens on, and the selector that determines which pods will answer requests sent through the proxy.";

const SERVICE_SCHEMA_FIELDS: ConsoleSchemaField[] = [
  {
    name: "apiVersion",
    type: "string",
    description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values.",
    allowedValues: "v1",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#service-v1-core",
  },
  {
    name: "kind",
    type: "string",
    description:
      "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated.",
    allowedValues: "Service",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#service-v1-core",
  },
  {
    name: "metadata",
    type: "object",
    description: "Standard object's metadata.",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#objectmeta-v1-meta",
    hasViewDetails: true,
  },
  {
    name: "spec",
    type: "object",
    description:
      "Spec defines the behavior of a service. https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#servicespec-v1-core",
    hasViewDetails: true,
  },
];

function hasRequiredText(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasCompleteSelector(pairs: ServiceKeyValuePair[] | undefined): boolean {
  return (pairs ?? []).some((p) => p.key.trim().length > 0 && p.value.trim().length > 0);
}

function hasValidPortRows(rows: ServicePortRow[] | undefined): boolean {
  const usable = (rows ?? []).filter((r) => r.port.trim());
  if (usable.length === 0) return false;
  return usable.every((r) => /^\d+$/.test(r.port.trim()));
}

function KeyValuePairBuilder({
  idPrefix,
  pairs,
  onChange,
  addLabel,
  keyPlaceholder = "key",
  valuePlaceholder = "value",
}: {
  idPrefix: string;
  pairs: ServiceKeyValuePair[];
  onChange: (next: ServiceKeyValuePair[]) => void;
  addLabel: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const rows = pairs.length > 0 ? pairs : [{ ...EMPTY_SERVICE_SELECTOR_PAIR }];

  const updateRow = (index: number, patch: Partial<ServiceKeyValuePair>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{ ...EMPTY_SERVICE_SELECTOR_PAIR }]);
  };

  return (
    <div className="ocs-kv-builder">
      <div className="ocs-kv-builder__header" aria-hidden>
        <span>Key</span>
        <span aria-hidden className="ocs-kv-builder__eq">
          =
        </span>
        <span>Value</span>
        <span className="ocs-kv-builder__actions" />
      </div>
      {rows.map((row, index) => (
        <div className="ocs-kv-builder__row" key={`${idPrefix}-${index}`}>
          <TextInput
            id={`${idPrefix}-key-${index}`}
            value={row.key}
            onChange={(_e, v) => updateRow(index, { key: v })}
            aria-label={`${idPrefix} key ${index + 1}`}
            placeholder={keyPlaceholder}
          />
          <span aria-hidden className="ocs-kv-builder__eq">
            =
          </span>
          <TextInput
            id={`${idPrefix}-value-${index}`}
            value={row.value}
            onChange={(_e, v) => updateRow(index, { value: v })}
            aria-label={`${idPrefix} value ${index + 1}`}
            placeholder={valuePlaceholder}
          />
          <Button
            variant="plain"
            aria-label={`Remove ${idPrefix} row ${index + 1}`}
            icon={<TrashIcon />}
            onClick={() => removeRow(index)}
            isDisabled={rows.length === 1 && !row.key && !row.value}
          />
        </div>
      ))}
      <Button
        variant="link"
        icon={<PlusCircleIcon />}
        onClick={() => onChange([...rows, { ...EMPTY_SERVICE_SELECTOR_PAIR }])}
        className="ocs-kv-builder__add"
      >
        {addLabel}
      </Button>
    </div>
  );
}

function PortsBuilder({
  ports,
  onChange,
  showNodePort,
}: {
  ports: ServicePortRow[];
  onChange: (next: ServicePortRow[]) => void;
  showNodePort: boolean;
}) {
  const rows = ports.length > 0 ? ports : [{ ...EMPTY_SERVICE_PORT_ROW }];

  const updateRow = (index: number, patch: Partial<ServicePortRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{ ...EMPTY_SERVICE_PORT_ROW }]);
  };

  return (
    <div className="ocs-port-builder">
      <div
        className={`ocs-port-builder__header${showNodePort ? " ocs-port-builder__header--nodeport" : ""}`}
        aria-hidden
      >
        <span>Protocol</span>
        <span>Port</span>
        <span>Target port</span>
        <span>Name</span>
        {showNodePort ? <span>Node port</span> : null}
        <span className="ocs-port-builder__actions" />
      </div>
      {rows.map((row, index) => (
        <div
          className={`ocs-port-builder__row${showNodePort ? " ocs-port-builder__row--nodeport" : ""}`}
          key={`port-${index}`}
        >
          <FormSelect
            id={`service-port-protocol-${index}`}
            value={row.protocol || "TCP"}
            onChange={(_e, v) => updateRow(index, { protocol: v })}
            aria-label={`Port protocol ${index + 1}`}
          >
            {PORT_PROTOCOLS.map((protocol) => (
              <FormSelectOption key={protocol} value={protocol} label={protocol} />
            ))}
          </FormSelect>
          <TextInput
            id={`service-port-${index}`}
            value={row.port}
            onChange={(_e, v) => updateRow(index, { port: v })}
            aria-label={`Port ${index + 1}`}
            placeholder="80"
            inputMode="numeric"
          />
          <TextInput
            id={`service-target-port-${index}`}
            value={row.targetPort}
            onChange={(_e, v) => updateRow(index, { targetPort: v })}
            aria-label={`Target port ${index + 1}`}
            placeholder="9376"
          />
          <TextInput
            id={`service-port-name-${index}`}
            value={row.name}
            onChange={(_e, v) => updateRow(index, { name: v })}
            aria-label={`Port name ${index + 1}`}
            placeholder="http"
          />
          {showNodePort ? (
            <TextInput
              id={`service-node-port-${index}`}
              value={row.nodePort}
              onChange={(_e, v) => updateRow(index, { nodePort: v })}
              aria-label={`Node port ${index + 1}`}
              placeholder="auto"
              inputMode="numeric"
            />
          ) : null}
          <Button
            variant="plain"
            aria-label={`Remove port row ${index + 1}`}
            icon={<TrashIcon />}
            onClick={() => removeRow(index)}
            isDisabled={rows.length === 1 && !row.port && !row.targetPort && !row.name}
          />
        </div>
      ))}
      <Button
        variant="link"
        icon={<PlusCircleIcon />}
        onClick={() => onChange([...rows, { ...EMPTY_SERVICE_PORT_ROW }])}
        className="ocs-port-builder__add"
      >
        Add port
      </Button>
    </div>
  );
}

export default function CreateServicePage() {
  const navigate = useNavigate();
  const { namespace: routeNs = "", name: routeName = "" } = useParams();
  const editNamespace = routeNs ? decodeURIComponent(routeNs) : "";
  const editName = routeName ? decodeURIComponent(routeName) : "";
  const existing = editNamespace && editName ? getService(editNamespace, editName) : undefined;
  const isEdit = Boolean(existing);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const initialForm = useMemo(
    () => (existing ? serviceRecordToFormState(existing) : createDefaultServiceFormState()),
    // Remount via key below when edit target changes; compute once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const sync = useSyncedFormYaml<ServiceFormState & Record<string, unknown>>(
    {
      toYaml: serviceFormToYaml,
      fromYaml: serviceYamlToForm,
      schemaTitle: "Service",
      schemaFields: [],
    },
    initialForm
  );

  const form = sync.formState;
  const serviceType = form.type || "ClusterIP";
  const isExternalName = serviceType === "ExternalName";
  const isNodePortFamily = serviceType === "NodePort" || serviceType === "LoadBalancer";
  const isLoadBalancer = serviceType === "LoadBalancer";

  const matchingPodCount = useMemo(
    () => countPodsMatchingSelector(form.namespace, form.selector ?? []),
    [form.namespace, form.selector]
  );

  const selectorComplete = hasCompleteSelector(form.selector);

  const canSubmit =
    sync.canSubmit &&
    hasRequiredText(form.name) &&
    hasRequiredText(form.namespace) &&
    (sync.viewMode === "yaml" ||
      (isExternalName
        ? hasRequiredText(form.externalName)
        : hasCompleteSelector(form.selector) && hasValidPortRows(form.ports)));

  const patch = (next: Partial<ServiceFormState>) => sync.patchFormState(next);

  const handleSubmit = () => {
    if (!canSubmit) return;
    createService({
      name: form.name,
      namespace: form.namespace,
      type: form.type,
      selector: isExternalName ? "" : selectorPairsToLines(form.selector ?? []),
      portMappings: isExternalName
        ? []
        : (form.ports ?? [])
            .filter((p) => p.port.trim())
            .map((p) => ({
              name: p.name.trim() || `${(p.protocol || "tcp").toLowerCase()}-${p.port.trim()}`,
              port: p.port.trim(),
              protocol: (p.protocol || "TCP").toUpperCase(),
              targetPort: p.targetPort.trim() || p.port.trim(),
            })),
      sessionAffinity: form.sessionAffinity,
      annotationCount: (form.annotations ?? []).filter((a) => a.key.trim()).length,
    });
    navigate(isEdit ? serviceDetailPath(form.namespace, form.name) : "/networking");
  };

  const handleDownload = () => {
    const blob = new Blob([sync.yamlText], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${form.name || "service"}.yaml`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const pagePath = isEdit ? serviceEditPath(editNamespace, editName) : "/networking/services/create";
  const pageTitle = isEdit ? "Edit Service" : "Create Service";
  const description =
    sync.viewMode === "yaml"
      ? isEdit
        ? "Edit this Service by updating YAML or JSON definitions."
        : "Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor."
      : isEdit
        ? "Update this Service using the form. Name and namespace cannot be changed. Switch to YAML view for full control."
        : "Create a Service using the form. Switch to YAML view for full control, including fields not shown in the form.";

  if (editNamespace && editName && !existing) {
    return (
      <div className="ocs-app-page-outer w-full ocs-create-service-page">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            NETWORKING_CRUMB,
            { label: "Services", path: "/networking" },
            { label: "Edit Service", path: pagePath },
          ]}
        >
          <Alert variant="danger" title="Service not found" isInline>
            No Service named {editName} in namespace {editNamespace}.
          </Alert>
          <Button variant="secondary" className="pf-v6-u-mt-md" onClick={() => navigate("/networking")}>
            Back to Services
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  return (
    <div className="ocs-app-page-outer w-full ocs-create-service-page" key={isEdit ? pagePath : "create"}>
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          NETWORKING_CRUMB,
          { label: "Services", path: "/networking" },
          ...(isEdit
            ? [
                { label: editName, path: serviceDetailPath(editNamespace, editName) },
                { label: "Edit Service", path: pagePath },
              ]
            : [{ label: "Create Service", path: "/networking/services/create" }]),
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="ocs-create-service-page__body">
          <Flex
            alignItems={{ default: "alignItemsFlexStart" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "nowrap" }}
          >
            <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
              <Title headingLevel="h1" size="2xl">
                {pageTitle}
              </Title>
              <Content component="p" className="ocs-create-service-page__desc">
                {description}
              </Content>
            </Flex>
            <FavoriteButton name={pageTitle} path={pagePath} />
          </Flex>

          <EditorToggle value={sync.viewMode} onChange={sync.setViewMode} idPrefix="service-create" />

          {sync.yamlError ? (
            <Alert variant="danger" title="YAML validation error" isInline>
              {sync.yamlError}
            </Alert>
          ) : null}

          {sync.viewMode === "form" && sync.hasUnmappedContent ? (
            <Alert variant="info" title="Some fields may not be represented in the form view." isInline>
              Select YAML view for full control of unrecognized configuration.
            </Alert>
          ) : null}

          {sync.viewMode === "yaml" ? (
            <ConsoleYamlCreateView
              yamlText={sync.yamlText}
              onYamlChange={sync.handleYamlChange}
              schemaTitle="Service"
              schemaIntro={SERVICE_SCHEMA_INTRO}
              schemaFields={SERVICE_SCHEMA_FIELDS}
              ariaLabel="Service YAML"
            />
          ) : (
            <div className="app-glass-panel pf-v6-u-p-lg">
              <Content component="p">
                Expose an application running on a set of pods as a network service. Form fields sync with the YAML
                manifest.
              </Content>
              <Form className="pf-v6-u-mt-md">
                <FormGroup label="Name" isRequired fieldId="service-name">
                  <TextInput
                    id="service-name"
                    value={form.name}
                    onChange={(_e, v) => patch({ name: v })}
                    type="text"
                    isReadOnly={isEdit}
                    readOnlyVariant={isEdit ? "default" : undefined}
                  />
                  {isEdit ? (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>Name cannot be changed after the Service is created.</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  ) : null}
                </FormGroup>
                <FormGroup label="Namespace" isRequired fieldId="service-namespace">
                  <TextInput
                    id="service-namespace"
                    value={form.namespace}
                    onChange={(_e, v) => patch({ namespace: v })}
                    type="text"
                    isReadOnly={isEdit}
                    readOnlyVariant={isEdit ? "default" : undefined}
                  />
                  {isEdit ? (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>Namespace cannot be changed after the Service is created.</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  ) : null}
                </FormGroup>
                <FormGroup label="Type" isRequired fieldId="service-type">
                  <FormSelect
                    id="service-type"
                    value={serviceType}
                    onChange={(_e, v) => patch({ type: v })}
                    aria-label="Service type"
                  >
                    {SERVICE_TYPES.map((type) => (
                      <FormSelectOption key={type} value={type} label={type} />
                    ))}
                  </FormSelect>
                </FormGroup>

                {isExternalName ? (
                  <FormGroup label="External hostname" isRequired fieldId="service-external-name">
                    <TextInput
                      id="service-external-name"
                      value={form.externalName}
                      onChange={(_e, v) => patch({ externalName: v })}
                      type="text"
                      placeholder="my.database.example.com"
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>
                          DNS name that this ExternalName Service aliases. Selector and ports are not used.
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                ) : (
                  <>
                    <FormGroup label="Selector" isRequired fieldId="service-selector">
                      <KeyValuePairBuilder
                        idPrefix="service-selector"
                        pairs={form.selector ?? []}
                        onChange={(selector) => patch({ selector })}
                        addLabel="Add label"
                        keyPlaceholder="app"
                        valuePlaceholder="MyApp"
                      />
                      <FormHelperText>
                        <HelperText isLiveRegion id="service-selector-match-status">
                          {!selectorComplete ? (
                            <HelperTextItem>Add key/value pairs to select backing pods.</HelperTextItem>
                          ) : matchingPodCount > 0 ? (
                            <HelperTextItem variant="success">
                              {matchingPodCount} pod{matchingPodCount === 1 ? "" : "s"} match
                            </HelperTextItem>
                          ) : (
                            <HelperTextItem variant="warning">No pods match</HelperTextItem>
                          )}
                        </HelperText>
                      </FormHelperText>
                    </FormGroup>

                    <FormGroup label="Ports" isRequired fieldId="service-ports">
                      <PortsBuilder
                        ports={form.ports ?? []}
                        onChange={(ports) => patch({ ports })}
                        showNodePort={isNodePortFamily}
                      />
                      {isNodePortFamily ? (
                        <FormHelperText>
                          <HelperText>
                            <HelperTextItem>
                              Leave Node port blank (auto) to let Kubernetes assign a port from the node port range.
                            </HelperTextItem>
                          </HelperText>
                        </FormHelperText>
                      ) : null}
                    </FormGroup>

                    {isNodePortFamily ? (
                      <FormGroup label="External traffic policy" fieldId="service-external-traffic-policy">
                        <FormSelect
                          id="service-external-traffic-policy"
                          value={form.externalTrafficPolicy || "Cluster"}
                          onChange={(_e, v) => patch({ externalTrafficPolicy: v })}
                          aria-label="External traffic policy"
                        >
                          <FormSelectOption value="Cluster" label="Cluster" />
                          <FormSelectOption value="Local" label="Local" />
                        </FormSelect>
                      </FormGroup>
                    ) : null}

                    {isLoadBalancer ? (
                      <FormGroup label="Load balancer IP" fieldId="service-lb-ip">
                        <TextInput
                          id="service-lb-ip"
                          value={form.loadBalancerIP}
                          onChange={(_e, v) => patch({ loadBalancerIP: v })}
                          type="text"
                          placeholder="Optional"
                        />
                        <FormHelperText>
                          <HelperText>
                            <HelperTextItem>
                              Requested load balancer IP when supported by the cloud provider.
                            </HelperTextItem>
                          </HelperText>
                        </FormHelperText>
                      </FormGroup>
                    ) : null}
                  </>
                )}

                <ExpandableSection
                  toggleText={advancedOpen ? "Hide advanced options" : "Show advanced options"}
                  onToggle={(_e, isExpanded) => setAdvancedOpen(isExpanded)}
                  isExpanded={advancedOpen}
                  isIndented
                  className="pf-v6-u-mt-md"
                >
                  <FormGroup label="Session affinity" fieldId="service-session-affinity">
                    <FormSelect
                      id="service-session-affinity"
                      value={form.sessionAffinity || "None"}
                      onChange={(_e, v) => patch({ sessionAffinity: v })}
                      aria-label="Session affinity"
                    >
                      <FormSelectOption value="None" label="None" />
                      <FormSelectOption value="ClientIP" label="ClientIP" />
                    </FormSelect>
                  </FormGroup>
                  {!isExternalName ? (
                    <FormGroup label="Internal traffic policy" fieldId="service-internal-traffic-policy">
                      <FormSelect
                        id="service-internal-traffic-policy"
                        value={form.internalTrafficPolicy || "Cluster"}
                        onChange={(_e, v) => patch({ internalTrafficPolicy: v })}
                        aria-label="Internal traffic policy"
                      >
                        <FormSelectOption value="Cluster" label="Cluster" />
                        <FormSelectOption value="Local" label="Local" />
                      </FormSelect>
                    </FormGroup>
                  ) : null}
                  <FormGroup label="External IPs" fieldId="service-external-ips">
                    <TextArea
                      id="service-external-ips"
                      value={form.externalIPs}
                      onChange={(_e, v) => patch({ externalIPs: v })}
                      resizeOrientation="vertical"
                      rows={2}
                      aria-label="External IPs"
                      placeholder={"203.0.113.10\n198.51.100.5"}
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>One IP address per line.</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                  <FormGroup label="Annotations" fieldId="service-annotations">
                    <KeyValuePairBuilder
                      idPrefix="service-annotation"
                      pairs={form.annotations ?? []}
                      onChange={(annotations) => patch({ annotations })}
                      addLabel="Add annotation"
                    />
                  </FormGroup>
                </ExpandableSection>
              </Form>
            </div>
          )}

          <Flex
            className="ocs-create-service-page__footer"
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex gap={{ default: "gapMd" }}>
              <Button variant="primary" isDisabled={!canSubmit} onClick={handleSubmit}>
                {isEdit ? "Save" : "Create"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(isEdit ? serviceDetailPath(editNamespace, editName) : "/networking")
                }
              >
                Cancel
              </Button>
            </Flex>
            <Button variant="secondary" icon={<DownloadIcon />} onClick={handleDownload}>
              Download
            </Button>
          </Flex>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
