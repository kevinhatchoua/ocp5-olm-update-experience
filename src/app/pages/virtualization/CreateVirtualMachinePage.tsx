import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Button,
  Checkbox,
  Content,
  Flex,
  FormGroup,
  Grid,
  GridItem,
  Label,
  Radio,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Tab,
  Tabs,
  TabTitleText,
  TextArea,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import CloneIcon from "@patternfly/react-icons/dist/esm/icons/clone-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import EditIcon from "@patternfly/react-icons/dist/esm/icons/edit-icon";
import LinuxIcon from "@patternfly/react-icons/dist/esm/icons/linux-icon";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import WindowsIcon from "@patternfly/react-icons/dist/esm/icons/windows-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import {
  createVirtualMachine,
  generateVirtualMachineName,
  vmDetailPath,
} from "../networking/networkingMockData";
import {
  BOOT_VOLUMES,
  COMPUTE_SERIES,
  COMPUTE_SIZES,
  GUEST_OS_OPTIONS,
  VIRT_CRUMB,
} from "./virtualizationMockData";

const WIZARD_STEPS = [
  "Deployment details",
  "Guest OS",
  "Boot source",
  "Compute resources",
  "Customization",
  "Review and create",
] as const;

export default function CreateVirtualMachinePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const project = searchParams.get("project") ?? "default";

  const [stepIndex, setStepIndex] = useState(0);
  const [deploymentMethod, setDeploymentMethod] = useState<"custom" | "template" | "clone">("custom");
  const [guestOs, setGuestOs] = useState("rhel");
  const [preference, setPreference] = useState("rhel.10");
  const [prefOpen, setPrefOpen] = useState(false);
  const [bootSource, setBootSource] = useState<"volume" | "none">("volume");
  const [selectedVolume, setSelectedVolume] = useState("rhel10");
  const [computeSeries, setComputeSeries] = useState("u");
  const [computeSize, setComputeSize] = useState("medium");
  const [sizeOpen, setSizeOpen] = useState(false);
  const [configTab, setConfigTab] = useState("details");
  const [vmName, setVmName] = useState(() => generateVirtualMachineName());
  const [description, setDescription] = useState("");
  const [startAfterCreate, setStartAfterCreate] = useState(true);

  const step = WIZARD_STEPS[stepIndex];
  const sizeMeta = COMPUTE_SIZES.find((s) => s.id === computeSize) ?? COMPUTE_SIZES[0];

  const goNext = () => setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleCreate = () => {
    const vm = createVirtualMachine({
      name: vmName,
      namespace: project,
      instanceType: sizeMeta.instanceType,
      preference,
      description,
      cpu: sizeMeta.cpu,
      memory: sizeMeta.memory,
    });
    navigate(vmDetailPath(vm.namespace, vm.name));
  };

  return (
    <div className="ocs-app-page-outer ocs-virt-wizard-page">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          VIRT_CRUMB,
          { label: "VirtualMachines", path: "/virtualization/virtualmachines" },
          { label: "Create VirtualMachine" },
        ]}
      >
        <Title headingLevel="h1" size="2xl" className="pf-v6-u-mb-lg">
          Create VirtualMachine
        </Title>
        <Flex className="ocs-virt-wizard" alignItems={{ default: "alignItemsStretch" }} gap={{ default: "gapLg" }}>
          <nav className="ocs-virt-wizard__nav app-glass-panel" aria-label="Create VirtualMachine steps">
            <ol className="ocs-virt-wizard__steps">
              {WIZARD_STEPS.map((label, i) => (
                <li
                  key={label}
                  className={`ocs-virt-wizard__step${i === stepIndex ? " ocs-virt-wizard__step--active" : ""}${i < stepIndex ? " ocs-virt-wizard__step--done" : ""}`}
                >
                  <span className="ocs-virt-wizard__step-num">{i + 1}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </nav>
          <div className="ocs-virt-wizard__content app-glass-panel pf-v6-u-flex-fill">
            {step === "Deployment details" ? (
              <StepDeployment
                method={deploymentMethod}
                onMethodChange={setDeploymentMethod}
                project={project}
              />
            ) : null}
            {step === "Guest OS" ? (
              <StepGuestOs
                guestOs={guestOs}
                onGuestOsChange={(id) => {
                  setGuestOs(id);
                  const opt = GUEST_OS_OPTIONS.find((o) => o.id === id);
                  if (opt) setPreference(opt.preference);
                }}
                preference={preference}
                prefOpen={prefOpen}
                onPrefOpenChange={setPrefOpen}
                onPreferenceChange={setPreference}
              />
            ) : null}
            {step === "Boot source" ? (
              <StepBootSource
                bootSource={bootSource}
                onBootSourceChange={setBootSource}
                selectedVolume={selectedVolume}
                onSelectVolume={setSelectedVolume}
              />
            ) : null}
            {step === "Compute resources" ? (
              <StepCompute
                series={computeSeries}
                onSeriesChange={setComputeSeries}
                size={computeSize}
                sizeOpen={sizeOpen}
                onSizeOpenChange={setSizeOpen}
                onSizeChange={setComputeSize}
              />
            ) : null}
            {step === "Customization" ? (
              <StepCustomization configTab={configTab} onConfigTabChange={setConfigTab} />
            ) : null}
            {step === "Review and create" ? (
              <StepReview
                project={project}
                vmName={vmName}
                onVmNameChange={setVmName}
                description={description}
                onDescriptionChange={setDescription}
                startAfterCreate={startAfterCreate}
                onStartAfterCreateChange={setStartAfterCreate}
              />
            ) : null}

            <Flex
              className="ocs-virt-wizard__footer"
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsCenter" }}
            >
              <Flex gap={{ default: "gapSm" }}>
                <Button variant="secondary" isDisabled={stepIndex === 0} onClick={goBack}>
                  Back
                </Button>
                {stepIndex < WIZARD_STEPS.length - 1 ? (
                  <Button variant="primary" onClick={goNext}>
                    Next
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleCreate}>
                    Create VirtualMachine
                  </Button>
                )}
              </Flex>
              <Button variant="link" component={Link} to="/virtualization/virtualmachines">
                Cancel
              </Button>
            </Flex>
          </div>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

function StepDeployment({
  method,
  onMethodChange,
  project,
}: {
  method: string;
  onMethodChange: (m: "custom" | "template" | "clone") => void;
  project: string;
}) {
  return (
    <>
      <Title headingLevel="h2" size="xl">
        Select a creation method
      </Title>
      <Grid hasGutter className="pf-v6-u-mt-lg">
        <GridItem md={4}>
          <MethodCard
            selected={method === "custom"}
            onSelect={() => onMethodChange("custom")}
            icon={<PlusCircleIcon aria-hidden />}
            title="Custom configuration (default)"
            description="Create a new VM by selecting an operating system and the right performance for your workload."
          />
        </GridItem>
        <GridItem md={4}>
          <MethodCard
            selected={method === "template"}
            onSelect={() => onMethodChange("template")}
            icon={<CopyIcon aria-hidden />}
            title="Create from Template"
            description="Create a pre-configured VM using standardized images. This option requires an existing template."
          />
        </GridItem>
        <GridItem md={4}>
          <MethodCard
            selected={method === "clone"}
            onSelect={() => onMethodChange("clone")}
            icon={<CloneIcon aria-hidden />}
            title="Clone existing VirtualMachine"
            description="Create a copy of an existing VirtualMachine."
          />
        </GridItem>
      </Grid>
      <Content component="p" className="pf-v6-u-mt-xl pf-v6-u-color-200">
        Your VirtualMachine will be created in the following location unless you edit it:
      </Content>
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} className="pf-v6-u-mt-sm">
        <Content component="span">
          <strong>Project</strong> {project} &gt; <strong>Folder</strong> —
        </Content>
        <Button variant="plain" aria-label="Edit location" icon={<EditIcon />} />
      </Flex>
    </>
  );
}

function MethodCard({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className={`ocs-virt-method-card${selected ? " ocs-virt-method-card--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
        <span className="ocs-virt-method-card__icon">{icon}</span>
        <Radio isChecked={selected} aria-label={title} />
      </Flex>
      <Title headingLevel="h3" size="md" className="pf-v6-u-mt-md">
        {title}
      </Title>
      <Content component="p" className="pf-v6-u-mt-sm pf-v6-u-color-200">
        {description}
      </Content>
    </button>
  );
}

function StepGuestOs({
  guestOs,
  onGuestOsChange,
  preference,
  prefOpen,
  onPrefOpenChange,
  onPreferenceChange,
}: {
  guestOs: string;
  onGuestOsChange: (id: string) => void;
  preference: string;
  prefOpen: boolean;
  onPrefOpenChange: (open: boolean) => void;
  onPreferenceChange: (v: string) => void;
}) {
  return (
    <>
      <Title headingLevel="h2" size="xl">
        Guest operating system
      </Title>
      <Content component="p" className="pf-v6-u-color-200">
        Choose your OS to ensure the best compatibility and system stability for your VirtualMachine.
      </Content>
      <Grid hasGutter className="pf-v6-u-mt-lg">
        {GUEST_OS_OPTIONS.map((opt) => (
          <GridItem md={4} key={opt.id}>
            <button
              type="button"
              className={`ocs-virt-os-card${guestOs === opt.id ? " ocs-virt-os-card--selected" : ""}`}
              onClick={() => onGuestOsChange(opt.id)}
            >
              {opt.id === "windows" ? <WindowsIcon aria-hidden /> : <LinuxIcon aria-hidden />}
              <Content component="span" className="pf-v6-u-mt-md">
                {opt.label}
              </Content>
            </button>
          </GridItem>
        ))}
      </Grid>
      <FormGroup label="Guest operating system type" className="pf-v6-u-mt-xl">
        <Select
          isOpen={prefOpen}
          selected={preference}
          onSelect={(_e, value) => {
            onPreferenceChange(String(value));
            onPrefOpenChange(false);
          }}
          onOpenChange={onPrefOpenChange}
          toggle={(toggleRef) => (
            <button ref={toggleRef} type="button" className="pf-v6-c-menu-toggle" onClick={() => onPrefOpenChange(!prefOpen)}>
              {preference}
            </button>
          )}
        >
          <SelectList>
            <SelectOption value="rhel.10">rhel.10</SelectOption>
            <SelectOption value="rhel.9">rhel.9</SelectOption>
          </SelectList>
        </Select>
      </FormGroup>
    </>
  );
}

function StepBootSource({
  bootSource,
  onBootSourceChange,
  selectedVolume,
  onSelectVolume,
}: {
  bootSource: "volume" | "none";
  onBootSourceChange: (v: "volume" | "none") => void;
  selectedVolume: string;
  onSelectVolume: (name: string) => void;
}) {
  return (
    <>
      <Title headingLevel="h2" size="xl">
        Boot source
      </Title>
      <Content component="p" className="pf-v6-u-color-200">
        Select a boot source (volume or ISO) now or configure it later.
      </Content>
      <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="pf-v6-u-mt-lg">
        <Radio
          isChecked={bootSource === "volume"}
          onChange={() => onBootSourceChange("volume")}
          label="Boot volume"
          id="boot-volume"
          name="boot"
        />
        {bootSource === "volume" ? (
          <div className="ocs-pods-list__panel pf-v6-u-ml-lg">
            <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} className="pf-v6-u-p-md">
              <Label color="green" isCompact>
                PR All projects
              </Label>
              <Button variant="secondary">Add volume</Button>
            </Flex>
            <OcsNamedResourceDataView
              ouiaId="create-vm-boot-volumes-data-view"
              ariaLabel="Boot volumes"
              itemsLabel="volumes"
              items={BOOT_VOLUMES}
              getName={(vol) => vol.name}
            >
              {(rows) => (
                <>
                  <Thead>
                    <Tr>
                      <Th />
                      <Th dataLabel="Volume name">
                        <PlainTableHeader label="Volume name" />
                      </Th>
                      <Th dataLabel="Architecture">
                        <PlainTableHeader label="Architecture" />
                      </Th>
                      <Th dataLabel="Operating system">
                        <PlainTableHeader label="Operating system" />
                      </Th>
                      <Th dataLabel="Storage class">
                        <PlainTableHeader label="Storage class" />
                      </Th>
                      <Th dataLabel="Size">
                        <PlainTableHeader label="Size" />
                      </Th>
                      <Th dataLabel="Description">
                        <PlainTableHeader label="Description" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((vol) => (
                      <Tr key={vol.name}>
                        <Td>
                          <Radio
                            isChecked={selectedVolume === vol.name}
                            onChange={() => onSelectVolume(vol.name)}
                            aria-label={`Select ${vol.name}`}
                            id={`vol-${vol.name}`}
                            name="boot-volume-select"
                          />
                        </Td>
                        <Td dataLabel="Volume name">{vol.name}</Td>
                        <Td dataLabel="Architecture">{vol.architecture}</Td>
                        <Td dataLabel="Operating system">{vol.operatingSystem}</Td>
                        <Td dataLabel="Storage class">{vol.storageClass}</Td>
                        <Td dataLabel="Size">{vol.size}</Td>
                        <Td dataLabel="Description">{vol.description}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          </div>
        ) : null}
        <Radio
          isChecked={bootSource === "none"}
          onChange={() => onBootSourceChange("none")}
          label="No boot source"
          description="Assign a boot source for your VM during the customization step."
          id="boot-none"
          name="boot"
        />
      </Flex>
    </>
  );
}

function StepCompute({
  series,
  onSeriesChange,
  size,
  sizeOpen,
  onSizeOpenChange,
  onSizeChange,
}: {
  series: string;
  onSeriesChange: (id: string) => void;
  size: string;
  sizeOpen: boolean;
  onSizeOpenChange: (open: boolean) => void;
  onSizeChange: (id: string) => void;
}) {
  const sizeLabel = COMPUTE_SIZES.find((s) => s.id === size)?.label ?? COMPUTE_SIZES[0].label;
  return (
    <>
      <Title headingLevel="h2" size="xl">
        Compute resources
      </Title>
      <Content component="p" className="pf-v6-u-color-200">
        Define resources by selecting series and size.
      </Content>
      <Tabs activeKey="redhat" aria-label="Compute provider" className="pf-v6-u-mt-md">
        <Tab eventKey="redhat" title={<TabTitleText>Red Hat provided</TabTitleText>} />
        <Tab eventKey="user" title={<TabTitleText>User provided</TabTitleText>} />
      </Tabs>
      <Grid hasGutter className="pf-v6-u-mt-lg">
        {COMPUTE_SERIES.map((s) => (
          <GridItem sm={6} md={4} lg={3} key={s.id}>
            <button
              type="button"
              className={`ocs-virt-series-card${series === s.id ? " ocs-virt-series-card--selected" : ""}`}
              onClick={() => onSeriesChange(s.id)}
            >
              {s.label}
            </button>
          </GridItem>
        ))}
      </Grid>
      <FormGroup label="Size" className="pf-v6-u-mt-xl">
        <Select
          isOpen={sizeOpen}
          selected={size}
          onSelect={(_e, value) => {
            onSizeChange(String(value));
            onSizeOpenChange(false);
          }}
          onOpenChange={onSizeOpenChange}
          toggle={(toggleRef) => (
            <button ref={toggleRef} type="button" className="pf-v6-c-menu-toggle" onClick={() => onSizeOpenChange(!sizeOpen)}>
              {sizeLabel}
            </button>
          )}
        >
          <SelectList>
            {COMPUTE_SIZES.map((s) => (
              <SelectOption key={s.id} value={s.id}>
                {s.label}
              </SelectOption>
            ))}
          </SelectList>
        </Select>
      </FormGroup>
    </>
  );
}

function StepCustomization({
  configTab,
  onConfigTabChange,
}: {
  configTab: string;
  onConfigTabChange: (tab: string) => void;
}) {
  return (
    <>
      <Title headingLevel="h2" size="xl">
        Customization
      </Title>
      <Content component="p" className="pf-v6-u-color-200">
        Optionally, explore the tabs to further edit your VirtualMachine.
      </Content>
      <SearchInput placeholder="Find settings" className="pf-v6-u-mt-md pf-v6-u-mb-md" />
      <Tabs activeKey={configTab} onSelect={(_e, key) => onConfigTabChange(String(key))}>
        <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
        <Tab eventKey="storage" title={<TabTitleText>Storage</TabTitleText>} />
        <Tab eventKey="network" title={<TabTitleText>Network</TabTitleText>} />
        <Tab eventKey="scheduling" title={<TabTitleText>Scheduling</TabTitleText>} />
        <Tab eventKey="ssh" title={<TabTitleText>SSH</TabTitleText>} />
        <Tab eventKey="initial" title={<TabTitleText>Initial run</TabTitleText>} />
        <Tab eventKey="metadata" title={<TabTitleText>Metadata</TabTitleText>} />
      </Tabs>
      {configTab === "details" ? (
        <Grid hasGutter className="pf-v6-u-mt-lg">
          <GridItem md={6}>
            <SettingRow label="Description" value="None" />
            <SettingRow label="Hostname" value="rose-bovid-74" />
            <SettingToggle label="Headless mode" checked={false} />
            <SettingToggle label="Guest system log access" checked />
            <SettingToggle label="Deletion protection" checked={false} />
          </GridItem>
          <GridItem md={6}>
            <Content component="p" className="pf-v6-u-color-200">
              Hardware devices (0)
            </Content>
            <Content component="p" className="pf-v6-u-color-200 pf-v6-u-mt-md">
              Boot management
            </Content>
          </GridItem>
        </Grid>
      ) : (
        <Content component="p" className="pf-v6-u-mt-lg pf-v6-u-color-200">
          {configTab} settings prototype stub.
        </Content>
      )}
    </>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} className="pf-v6-u-mb-md">
      <Content component="span">{label}</Content>
      <Flex gap={{ default: "gapSm" }}>
        <Content component="span">{value}</Content>
        <Button variant="plain" aria-label={`Edit ${label}`} icon={<EditIcon />} />
      </Flex>
    </Flex>
  );
}

function SettingToggle({ label, checked }: { label: string; checked: boolean }) {
  return (
    <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} className="pf-v6-u-mb-md">
      <Content component="span">{label}</Content>
      <Checkbox id={label} isChecked={checked} aria-label={label} />
    </Flex>
  );
}

function StepReview({
  project,
  vmName,
  onVmNameChange,
  description,
  onDescriptionChange,
  startAfterCreate,
  onStartAfterCreateChange,
}: {
  project: string;
  vmName: string;
  onVmNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  startAfterCreate: boolean;
  onStartAfterCreateChange: (v: boolean) => void;
}) {
  return (
    <>
      <Title headingLevel="h2" size="xl">
        Review and create
      </Title>
      <Content component="p" className="pf-v6-u-color-200">
        Review your VirtualMachine configuration. After the name is set, you&apos;re ready to create your VirtualMachine.
      </Content>
      <div className="pf-v6-u-mt-lg">
        <ReviewSection title="Details" open>
          <ReviewRow label="Cluster" value="—" />
          <ReviewRow label="Project" value={project} />
          <ReviewRow label="Folder" value="—" />
        </ReviewSection>
        <ReviewSection title="Storage" />
        <ReviewSection title="Network" />
        <ReviewSection title="Hardware devices" />
      </div>
      <FormGroup label="Name" isRequired className="pf-v6-u-mt-xl">
        <TextInput value={vmName} onChange={(_e, v) => onVmNameChange(v)} />
      </FormGroup>
      <FormGroup label="Description" className="pf-v6-u-mt-md">
        <TextArea value={description} onChange={(_e, v) => onDescriptionChange(v)} />
      </FormGroup>
      <Checkbox
        id="start-after-create"
        label="Start this VirtualMachine after creation"
        isChecked={startAfterCreate}
        onChange={(_e, checked) => onStartAfterCreateChange(checked)}
        className="pf-v6-u-mt-md"
      />
    </>
  );
}

function ReviewSection({ title, open, children }: { title: string; open?: boolean; children?: React.ReactNode }) {
  return (
    <details className="ocs-virt-review-section" open={open}>
      <summary>{title}</summary>
      {children ? <div className="ocs-virt-review-section__body">{children}</div> : null}
    </details>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} className="pf-v6-u-mb-sm">
      <Content component="span" className="pf-v6-u-color-200">
        {label}
      </Content>
      <Content component="span">{value}</Content>
    </Flex>
  );
}
