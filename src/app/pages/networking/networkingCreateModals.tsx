import { useState } from "react";
import {
  Alert,
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Form,
  FormGroup,
  FormHelperText,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
} from "@patternfly/react-core";
import type { NadRecord, NncpRecord, UdnRecord } from "./networkingMockData";
import {
  PROTOTYPE_NS,
  createCudn,
  createNad,
  createNncp,
  createUdn,
  generateCudnName,
  generateNadName,
  generateNncpName,
  generateUdnName,
} from "./networkingMockData";
import { DualModeCreateLayout } from "./DualModeCreateLayout";
import {
  CUDN_YAML_SCHEMA,
  NAD_YAML_SCHEMA,
  NNCP_YAML_SCHEMA,
  UDN_YAML_SCHEMA,
  cudnFormToYaml,
  cudnYamlToForm,
  nadFormToYaml,
  nadYamlToForm,
  nncpFormToYaml,
  nncpYamlToForm,
  udnFormToYaml,
  udnYamlToForm,
} from "./networkCreateYaml";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

export type NetworkCreateResource =
  | "node-network-configuration"
  | "network-attachment-definition"
  | "user-defined-network"
  | "cluster-user-defined-network"
  | "node-network-configuration-policy";

const CREATE_ITEMS: { id: NetworkCreateResource; label: string }[] = [
  { id: "node-network-configuration", label: "Node network configuration" },
  { id: "network-attachment-definition", label: "NetworkAttachmentDefinition" },
  { id: "user-defined-network", label: "UserDefinedNetwork" },
  { id: "cluster-user-defined-network", label: "ClusterUserDefinedNetwork" },
  { id: "node-network-configuration-policy", label: "NodeNetworkConfigurationPolicy" },
];

export function NetworkResourceCreateDropdown({
  onSelect,
  isDisabled = false,
}: {
  onSelect: (resource: NetworkCreateResource) => void;
  isDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={(isOpen) => setOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setOpen((o) => !o)}
          variant="primary"
          isDisabled={isDisabled}
        >
          Create
        </MenuToggle>
      )}
      popperProps={{ position: "right" }}
    >
      <DropdownList>
        {CREATE_ITEMS.map((item) => (
          <DropdownItem
            key={item.id}
            itemId={item.id}
            onClick={() => {
              setOpen(false);
              onSelect(item.id);
            }}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

function isValidCidr(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(value.trim());
}

type CreateFormProps<T> = {
  onCancel: () => void;
  onCreated: (record: T) => void;
};

function CreateFormActions({
  canCreate,
  onCancel,
  onCreate,
}: {
  canCreate: boolean;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <Flex gap={{ default: "gapMd" }} className="pf-v6-u-mt-lg">
      <Button variant="primary" isDisabled={!canCreate} onClick={onCreate}>
        Create
      </Button>
      <Button variant="link" onClick={onCancel}>
        Cancel
      </Button>
    </Flex>
  );
}

export function CreateNadForm({ onCancel, onCreated }: CreateFormProps<NadRecord>) {
  const sync = useSyncedFormYaml(
    {
      toYaml: nadFormToYaml,
      fromYaml: nadYamlToForm,
      schemaTitle: "NetworkAttachmentDefinition",
      schemaFields: NAD_YAML_SCHEMA,
    },
    { name: generateNadName(), namespace: PROTOTYPE_NS, type: "Linux bridge" }
  );

  const canCreate =
    sync.canSubmit &&
    sync.formState.name.trim().length > 0 &&
    sync.formState.namespace.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const { name, namespace, type } = sync.formState;
    onCreated(createNad({ name, namespace, type }));
  };

  return (
    <>
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
        <Content component="p">
          Create a secondary network for pods and virtual machines to attach to using a Linux bridge on the node.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Name" isRequired fieldId="nad-name">
            <TextInput
              id="nad-name"
              value={sync.formState.name}
              onChange={(_e, v) => sync.patchFormState({ name: v })}
              type="text"
            />
          </FormGroup>
          <FormGroup label="Namespace" isRequired fieldId="nad-namespace">
            <TextInput
              id="nad-namespace"
              value={sync.formState.namespace}
              onChange={(_e, v) => sync.patchFormState({ namespace: v })}
              type="text"
            />
          </FormGroup>
          <FormGroup label="Type" isRequired fieldId="nad-type">
            <TextInput
              id="nad-type"
              value={sync.formState.type}
              onChange={(_e, v) => sync.patchFormState({ type: v })}
              type="text"
            />
          </FormGroup>
        </Form>
      </DualModeCreateLayout>
      <CreateFormActions canCreate={canCreate} onCancel={onCancel} onCreate={handleCreate} />
    </>
  );
}

export function CreateUdnForm({ onCancel, onCreated }: CreateFormProps<UdnRecord>) {
  const sync = useSyncedFormYaml(
    {
      toYaml: udnFormToYaml,
      fromYaml: udnYamlToForm,
      schemaTitle: "UserDefinedNetwork",
      schemaFields: UDN_YAML_SCHEMA,
    },
    { project: PROTOTYPE_NS, name: generateUdnName(), cidr: "10.128.0.0/24" }
  );

  const canCreate =
    sync.canSubmit &&
    sync.formState.project.trim().length > 0 &&
    sync.formState.name.trim().length > 0 &&
    isValidCidr(sync.formState.cidr);

  const handleCreate = () => {
    if (!canCreate) return;
    const { project, name, cidr } = sync.formState;
    onCreated(createUdn({ name, namespace: project, subnetCidr: cidr }));
  };

  return (
    <>
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
        <Alert variant="warning" title="No namespace is configured for a primary user-defined network." isInline>
          At creation time the namespace must be configured with{" "}
          <code>k8s.ovn.org/primary-user-defined-network</code> label. Go to{" "}
          <Button variant="link" isInline component="a" href="/administration/namespaces">
            Namespaces
          </Button>{" "}
          to create a new namespace.
        </Alert>
        <Content component="p" className="pf-v6-u-mt-md">
          Define the network used by VirtualMachines and Pods to communicate in the given project.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Project name" isRequired fieldId="udn-project">
            <TextInput
              id="udn-project"
              value={sync.formState.project}
              onChange={(_e, v) => sync.patchFormState({ project: v })}
              type="text"
            />
          </FormGroup>
          <FormGroup label="Name" isRequired fieldId="udn-name">
            <TextInput
              id="udn-name"
              value={sync.formState.name}
              onChange={(_e, v) => sync.patchFormState({ name: v })}
              type="text"
            />
          </FormGroup>
          <FormGroup label="Subnet CIDR" isRequired fieldId="udn-cidr">
            <TextInput
              id="udn-cidr"
              value={sync.formState.cidr}
              onChange={(_e, v) => sync.patchFormState({ cidr: v })}
              type="text"
            />
            <FormHelperText>
              Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed. The
              format should match standard CIDR notation (for example, &apos;192.168.123.0/24&apos;).
            </FormHelperText>
          </FormGroup>
        </Form>
      </DualModeCreateLayout>
      <CreateFormActions canCreate={canCreate} onCancel={onCancel} onCreate={handleCreate} />
    </>
  );
}

export function CreateClusterUdnForm({ onCancel, onCreated }: CreateFormProps<UdnRecord>) {
  const sync = useSyncedFormYaml(
    {
      toYaml: cudnFormToYaml,
      fromYaml: cudnYamlToForm,
      schemaTitle: "ClusterUserDefinedNetwork",
      schemaFields: CUDN_YAML_SCHEMA,
    },
    { name: generateCudnName(), cidr: "10.132.0.0/16", matchLabels: "app=frontend" }
  );

  const canCreate = sync.canSubmit && sync.formState.name.trim().length > 0 && isValidCidr(sync.formState.cidr);

  const handleCreate = () => {
    if (!canCreate) return;
    onCreated(createCudn({ name: sync.formState.name, subnetCidr: sync.formState.cidr }));
  };

  return (
    <>
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
        <Content component="p">
          Define a cluster-scoped user-defined network for VirtualMachines and Pods across selected namespaces.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Name" isRequired fieldId="cudn-name">
            <TextInput
              id="cudn-name"
              value={sync.formState.name}
              onChange={(_e, v) => sync.patchFormState({ name: v })}
              type="text"
            />
          </FormGroup>
          <FormGroup label="Subnet CIDR" isRequired fieldId="cudn-cidr">
            <TextInput
              id="cudn-cidr"
              value={sync.formState.cidr}
              onChange={(_e, v) => sync.patchFormState({ cidr: v })}
              type="text"
            />
            <FormHelperText>
              Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed. The
              format should match standard CIDR notation (for example, &apos;192.168.123.0/24&apos;).
            </FormHelperText>
          </FormGroup>
          <FormGroup label="Namespace(s)" fieldId="cudn-ns">
            <FormGroup label="Match Labels" isRequired fieldId="cudn-labels">
              <TextArea
                id="cudn-labels"
                value={sync.formState.matchLabels}
                onChange={(_e, v) => sync.patchFormState({ matchLabels: v })}
              />
              <FormHelperText>
                matchLabels is a map of {"{key,value}"} pairs. A single {"{key,value}"} in the matchLabels map is
                equivalent to an element of matchExpressions, whose key field is &apos;key&apos;, the operator is
                &apos;In&apos;, and the values array contains only &apos;value&apos;. The requirements are ANDed.
              </FormHelperText>
            </FormGroup>
          </FormGroup>
        </Form>
      </DualModeCreateLayout>
      <CreateFormActions canCreate={canCreate} onCancel={onCancel} onCreate={handleCreate} />
    </>
  );
}

export function CreateNncpForm({ onCancel, onCreated }: CreateFormProps<NncpRecord>) {
  const sync = useSyncedFormYaml(
    {
      toYaml: nncpFormToYaml,
      fromYaml: nncpYamlToForm,
      schemaTitle: "NodeNetworkConfigurationPolicy",
      schemaFields: NNCP_YAML_SCHEMA,
    },
    { name: generateNncpName() }
  );

  const canCreate = sync.canSubmit && sync.formState.name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreated(createNncp({ name: sync.formState.name }));
  };

  return (
    <>
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
        <Content component="p">
          Configure node network interfaces and bridges on selected nodes. This prototype creates a policy that
          provisions <strong>br-localnet</strong> on worker nodes.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Name" isRequired fieldId="nncp-name">
            <TextInput
              id="nncp-name"
              value={sync.formState.name}
              onChange={(_e, v) => sync.patchFormState({ name: v })}
              type="text"
            />
          </FormGroup>
        </Form>
      </DualModeCreateLayout>
      <CreateFormActions canCreate={canCreate} onCancel={onCancel} onCreate={handleCreate} />
    </>
  );
}

export function CreateNadModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: NadRecord) => void;
}) {
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-nad-title">
      <ModalHeader title="Create NetworkAttachmentDefinition" labelId="create-nad-title" />
      <ModalBody>
        <CreateNadForm onCancel={onClose} onCreated={onCreated} />
      </ModalBody>
    </Modal>
  );
}

export function CreateUdnModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: UdnRecord) => void;
}) {
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-udn-title">
      <ModalHeader title="Create UserDefinedNetwork" labelId="create-udn-title" />
      <ModalBody>
        <CreateUdnForm onCancel={onClose} onCreated={onCreated} />
      </ModalBody>
    </Modal>
  );
}

export function CreateClusterUdnModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: UdnRecord) => void;
}) {
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-cudn-title">
      <ModalHeader title="Create ClusterUserDefinedNetwork" labelId="create-cudn-title" />
      <ModalBody>
        <CreateClusterUdnForm onCancel={onClose} onCreated={onCreated} />
      </ModalBody>
    </Modal>
  );
}

export function CreateNncpModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: NncpRecord) => void;
}) {
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-nncp-title">
      <ModalHeader title="Create NodeNetworkConfigurationPolicy" labelId="create-nncp-title" />
      <ModalBody>
        <CreateNncpForm onCancel={onClose} onCreated={onCreated} />
      </ModalBody>
    </Modal>
  );
}
