import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Content, Form } from "@patternfly/react-core";
import { ResourceCreatePageShell } from "../components/prototype/ResourceCreatePageShell";
import {
  GENERIC_CREATE_KIND_TO_LIST_KEY,
  addPrototypeListItem,
} from "../lib/prototypeListStore";
import {
  getPrototypeCreateYaml,
  parseCreateLabel,
} from "../components/prototype/prototypeCreateTemplates";
import { useToast } from "../contexts/ToastContext";
import { DualModeCreateLayout } from "./networking/DualModeCreateLayout";
import { useSyncedFormYaml } from "./networking/useSyncedFormYaml";
import type { ParseYamlResult, YamlSchemaField } from "./networking/networkCreateYaml";

type GenericFormState = { name: string; namespace: string };

function genericFormToYaml(kind: string, state: GenericFormState): string {
  return getPrototypeCreateYaml(kind, state.name).replace(
    /namespace: default/,
    `namespace: ${state.namespace}`
  );
}

function genericYamlToForm(yaml: string): ParseYamlResult<GenericFormState> {
  const nameMatch = yaml.match(/^\s*name:\s*(.+)$/m);
  const nsMatch = yaml.match(/^\s*namespace:\s*(.+)$/m);
  const error =
    !yaml.trim() ? "YAML cannot be empty." : !/^apiVersion:/m.test(yaml) ? "Missing apiVersion field." : null;
  if (error) return { partial: null, error, hasUnmappedContent: false };
  return {
    partial: {
      name: nameMatch ? nameMatch[1].replace(/['"]/g, "").trim() : "",
      namespace: nsMatch ? nsMatch[1].replace(/['"]/g, "").trim() : "default",
    },
    error: null,
    hasUnmappedContent: true,
  };
}

const GENERIC_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "API version for this resource." },
  { name: "kind", type: "string", description: "Kubernetes resource kind." },
  { name: "metadata.name", type: "string", description: "Unique resource name." },
  { name: "metadata.namespace", type: "string", description: "Target namespace." },
];

const LIST_PATHS: Record<string, { label: string; path: string; section?: { label: string; path: string } }> = {
  deployment: { label: "Deployments", path: "/workloads/deployments", section: { label: "Workloads", path: "/workloads" } },
  pod: { label: "Pods", path: "/workloads/pods", section: { label: "Workloads", path: "/workloads" } },
  job: { label: "Jobs", path: "/workloads/jobs", section: { label: "Workloads", path: "/workloads" } },
  cronjob: { label: "CronJobs", path: "/workloads/cronjobs", section: { label: "Workloads", path: "/workloads" } },
  daemonset: { label: "DaemonSets", path: "/workloads/daemonsets", section: { label: "Workloads", path: "/workloads" } },
  statefulset: { label: "StatefulSets", path: "/workloads/statefulsets", section: { label: "Workloads", path: "/workloads" } },
  namespace: { label: "Namespaces", path: "/administration/namespaces", section: { label: "Administration", path: "/administration" } },
  crd: { label: "CustomResourceDefinitions", path: "/administration/custom-resource-definitions", section: { label: "Administration", path: "/administration" } },
  customresourcedefinition: { label: "CustomResourceDefinitions", path: "/administration/custom-resource-definitions", section: { label: "Administration", path: "/administration" } },
  resourcequota: { label: "ResourceQuotas", path: "/administration/resource-quotas", section: { label: "Administration", path: "/administration" } },
  limitrange: { label: "LimitRanges", path: "/administration/limit-ranges", section: { label: "Administration", path: "/administration" } },
  user: { label: "User Management", path: "/user-management" },
  build: { label: "Builds", path: "/builds" },
  volume: { label: "Storage", path: "/storage" },
  template: { label: "Templates", path: "/virtualization/templates", section: { label: "Virtualization", path: "/virtualization/virtualmachines" } },
  bootablevolume: { label: "Bootable volumes", path: "/virtualization/bootablevolumes", section: { label: "Virtualization", path: "/virtualization/virtualmachines" } },
  migrationpolicy: { label: "Migration policies", path: "/virtualization/migrationpolicies", section: { label: "Virtualization", path: "/virtualization/virtualmachines" } },
  networkpolicy: { label: "NetworkPolicies", path: "/networking/networkpolicies", section: { label: "Networking", path: "/networking" } },
  multinetworkpolicy: { label: "NetworkPolicies", path: "/networking/networkpolicies", section: { label: "Networking", path: "/networking" } },
};

export default function PrototypeGenericCreatePage({ forcedKind }: { forcedKind?: string }) {
  const { kind: paramKind = "Resource" } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const resourceLabel = parseCreateLabel(forcedKind ?? decodeURIComponent(paramKind));
  const kindKey = resourceLabel.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const listMeta = LIST_PATHS[kindKey] ?? { label: resourceLabel, path: "/" };

  const initialState = useMemo<GenericFormState>(() => ({ name: "example", namespace: "default" }), []);

  const sync = useSyncedFormYaml(
    {
      toYaml: (state) => genericFormToYaml(resourceLabel, state),
      fromYaml: genericYamlToForm,
      schemaTitle: resourceLabel,
      schemaFields: GENERIC_SCHEMA,
    },
    initialState
  );

  const handleCreate = () => {
    const listKey = GENERIC_CREATE_KIND_TO_LIST_KEY[kindKey];
    if (listKey) {
      addPrototypeListItem(listKey, {
        name: sync.formState.name,
        namespace: sync.formState.namespace,
        kind: resourceLabel,
      });
    }
    pushToast({ variant: "success", title: `Created ${resourceLabel} (prototype)` });
    navigate(listMeta.path);
  };

  const breadcrumbs = [
    { label: "Home", path: "/" },
    ...(listMeta.section ? [listMeta.section] : []),
    { label: listMeta.label, path: listMeta.path },
    { label: `Create ${resourceLabel}` },
  ];

  return (
    <ResourceCreatePageShell
      breadcrumbs={breadcrumbs}
      title={`Create ${resourceLabel}`}
      listPath={listMeta.path}
      canCreate={sync.canSubmit}
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
          <Content component="p" className="pf-v6-u-color-200">
            Use YAML view for full configuration. Form fields for {resourceLabel} will be expanded in a future
            iteration.
          </Content>
        </DualModeCreateLayout>
      </Form>
    </ResourceCreatePageShell>
  );
}
