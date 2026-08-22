import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Grid,
  GridItem,
  Icon,
  Label,
  MenuToggle,
  Spinner,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import OutlinedStopCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-stop-circle-icon";
import PauseIcon from "@patternfly/react-icons/dist/esm/icons/pause-icon";
import PlayIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import RedoIcon from "@patternfly/react-icons/dist/esm/icons/redo-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { VMNetworkResourceLink } from "../../components/networking/VMNetworkResourceLink";
import { getVirtualMachine, vmDetailPath, type VmNetworkInterface } from "../networking/networkingMockData";
import { VIRT_CRUMB } from "./virtualizationMockData";
import { VirtualizationProjectLayout } from "./virtualizationShared";

export default function VirtualMachineDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const vm = getVirtualMachine(decodedNs, decodedName);
  const [activeTab, setActiveTab] = useState("overview");
  const [configTab, setConfigTab] = useState("network");
  const [actionsOpen, setActionsOpen] = useState(false);

  if (!vm) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            VIRT_CRUMB,
            { label: "VirtualMachines", path: "/virtualization/virtualmachines" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            VirtualMachine not found
          </Title>
          <Button variant="link" component={Link} to="/virtualization/virtualmachines" className="pf-v6-u-mt-md">
            Back to VirtualMachines
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = vmDetailPath(decodedNs, decodedName);

  return (
    <div className="ocs-app-page-outer ocs-vm-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          VIRT_CRUMB,
          { label: "VirtualMachines", path: "/virtualization/virtualmachines" },
          { label: decodedName },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <Label color="blue" isCompact className="ocs-resource-label">
                VM
              </Label>
              <Title headingLevel="h1" size="2xl">
                {vm.name}
              </Title>
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <Icon status="danger" aria-hidden>
                  <ExclamationCircleIcon />
                </Icon>
                <Label color="red" isCompact>
                  {vm.status}
                </Label>
              </Flex>
              <FavoriteButton name={vm.name} path={detailPath} />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <Button variant="plain" aria-label="Stop" icon={<OutlinedStopCircleIcon />} />
              <Button variant="plain" aria-label="Restart" icon={<RedoIcon />} />
              <Button variant="plain" aria-label="Pause" icon={<PauseIcon />} />
              <Button variant="plain" aria-label="Start" icon={<PlayIcon />} />
              <Dropdown
                isOpen={actionsOpen}
                onOpenChange={setActionsOpen}
                onSelect={() => setActionsOpen(false)}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((o) => !o)} variant="secondary">
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem itemId="edit">Edit VirtualMachine</DropdownItem>
                  <DropdownItem itemId="delete" isDanger>
                    Delete VirtualMachine
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </Flex>
          </Flex>

          <VirtualizationProjectLayout selectedProject={decodedNs} selectedVm={decodedName}>
            <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(String(key))} aria-label="VirtualMachine">
              <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>} />
              <Tab eventKey="metrics" title={<TabTitleText>Metrics</TabTitleText>} />
              <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
              <Tab eventKey="configuration" title={<TabTitleText>Configuration</TabTitleText>} />
              <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
              <Tab eventKey="console" title={<TabTitleText>Console</TabTitleText>} />
              <Tab eventKey="snapshots" title={<TabTitleText>Snapshots</TabTitleText>} />
              <Tab eventKey="diagnostics" title={<TabTitleText>Diagnostics</TabTitleText>} />
            </Tabs>

            {activeTab === "overview" ? (
              <Grid hasGutter>
                <GridItem md={8}>
                  <section className="ocs-node-details__panel pf-v6-u-mb-md">
                    <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                      Details
                    </Title>
                    <Grid hasGutter>
                      <GridItem md={6}>
                        <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                          <DescriptionListGroup>
                            <DescriptionListTerm>Name</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.name}{" "}
                              <Label color="blue" isCompact>
                                {vm.architecture ?? "amd64"}
                              </Label>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Status</DescriptionListTerm>
                            <DescriptionListDescription>
                              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                <Icon status="danger" aria-hidden>
                                  <ExclamationCircleIcon />
                                </Icon>
                                {vm.status}
                              </Flex>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Created</DescriptionListTerm>
                            <DescriptionListDescription>Just now (0 minutes ago)</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Operating system</DescriptionListTerm>
                            <DescriptionListDescription>Guest agent is required</DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </GridItem>
                      <GridItem md={6}>
                        <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                          <DescriptionListGroup>
                            <DescriptionListTerm>CPU | Memory</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.cpu ?? "1 CPU"} | {vm.memory ?? "4 GiB Memory"}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Time zone</DescriptionListTerm>
                            <DescriptionListDescription>—</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>InstanceType</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.instanceType}{" "}
                              <Label color="blue" isCompact>
                                CR
                              </Label>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Preference</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.preference}{" "}
                              <Label color="blue" isCompact>
                                CR
                              </Label>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Hostname</DescriptionListTerm>
                            <DescriptionListDescription>{vm.hostname}</DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </GridItem>
                    </Grid>
                  </section>
                  <section className="ocs-node-details__panel pf-v6-u-mb-md">
                    <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} className="pf-v6-u-mb-md">
                      <Title headingLevel="h2" size="lg">
                        VNC console
                      </Title>
                      <Button variant="link" isInline icon={<ExternalLinkAltIcon />} iconPosition="right">
                        Open web console
                      </Button>
                    </Flex>
                    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                      <Spinner size="md" aria-label="Connecting" />
                      <Content component="span">Connecting</Content>
                    </Flex>
                  </section>
                  <section className="ocs-node-details__panel">
                    <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                      Utilization
                    </Title>
                    <Content component="p" className="pf-v6-u-color-200">
                      VirtualMachine is not running
                    </Content>
                  </section>
                </GridItem>
                <GridItem md={4}>
                  <VmSidePanel vm={vm} />
                </GridItem>
              </Grid>
            ) : null}

            {activeTab === "configuration" ? (
              <Flex>
                <Tabs
                  isVertical
                  activeKey={configTab}
                  onSelect={(_e, key) => setConfigTab(String(key))}
                  aria-label="Configuration"
                  className="ocs-vm-config-tabs pf-v6-u-mr-lg"
                >
                  <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
                  <Tab eventKey="network" title={<TabTitleText>Network</TabTitleText>} />
                  <Tab eventKey="storage" title={<TabTitleText>Storage</TabTitleText>} />
                </Tabs>
                {configTab === "network" ? (
                  <div className="ocs-pods-list__panel pf-v6-u-flex-fill">
                    <Title headingLevel="h2" size="lg" className="pf-v6-u-p-md">
                      Network interfaces
                    </Title>
                    <VmNetworkInterfacesTable interfaces={vm.interfaces} />
                  </div>
                ) : (
                  <section className="ocs-node-details__panel pf-v6-u-flex-fill">
                    <Content component="p" className="pf-v6-u-color-200">
                      {configTab === "details" ? "Configuration details prototype stub." : "Storage configuration prototype stub."}
                    </Content>
                  </section>
                )}
              </Flex>
            ) : null}

            {activeTab !== "overview" && activeTab !== "configuration" ? (
              <section className="ocs-node-details__panel">
                <Content component="p" className="pf-v6-u-color-200">
                  {activeTab} tab prototype stub.
                </Content>
              </section>
            ) : null}
          </VirtualizationProjectLayout>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

function VmSidePanel({ vm }: { vm: NonNullable<ReturnType<typeof getVirtualMachine>> }) {
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
      <section aria-label="Alerts">
        <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
          Alerts (0)
        </Title>
          <Content component="p" className="pf-v6-u-color-200">
            No alerts
          </Content>
      </section>
      <section aria-label="General">
        <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
          General
        </Title>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Namespace</DescriptionListTerm>
              <DescriptionListDescription>
                <Label color="green" isCompact className="ocs-resource-label">
                  NS
                </Label>{" "}
                {vm.namespace}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Node</DescriptionListTerm>
              <DescriptionListDescription>—</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>VirtualMachineInstance</DescriptionListTerm>
              <DescriptionListDescription>
                <Label color="blue" isCompact className="ocs-resource-label">
                  VMI
                </Label>{" "}
                {vm.name}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Pod</DescriptionListTerm>
              <DescriptionListDescription>
                <Label color="teal" isCompact className="ocs-resource-label">
                  P
                </Label>{" "}
                virt-launcher-{vm.name.slice(0, 10)}…
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Owner</DescriptionListTerm>
              <DescriptionListDescription>No owner</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
      </section>
      <section aria-label="Snapshots">
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} className="ocs-pod-details__section-title">
          <Title headingLevel="h2" size="lg">
            Snapshots (0)
          </Title>
            <Button variant="link" isInline>
              Take snapshot
            </Button>
        </Flex>
          <Content component="p" className="pf-v6-u-color-200">
            No snapshots found
          </Content>
      </section>
      <section aria-label="Network">
        <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
          Network ({vm.interfaces.length})
        </Title>
          {vm.interfaces.map((iface) => (
            <Flex
              key={iface.name}
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              className="pf-v6-u-mb-sm"
            >
              <Content component="span">{iface.name}</Content>
              <Content component="span">
                {iface.network.kind === "pod" ? "—" : <VMNetworkResourceLink network={iface.network} />}
              </Content>
            </Flex>
          ))}
          <Content component="p" className="pf-v6-u-mt-md pf-v6-u-color-200 pf-v6-u-font-size-sm">
            Internal FQDN: {vm.name}.headless.{vm.namespace}…
          </Content>
      </section>
    </Flex>
  );
}

function interfaceName(iface: VmNetworkInterface) {
  return iface.name;
}

function VmNetworkInterfacesTable({ interfaces }: { interfaces: VmNetworkInterface[] }) {
  return (
    <OcsNamedResourceDataView
      ouiaId="vm-network-interfaces-data-view"
      ariaLabel="Network interfaces"
      itemsLabel="interfaces"
      items={interfaces}
      getName={interfaceName}
    >
      {(rows) => (
        <>
          <Thead>
            <Tr>
              <Th dataLabel="Name">
                <PlainTableHeader label="Name" />
              </Th>
              <Th dataLabel="Model">
                <PlainTableHeader label="Model" />
              </Th>
              <Th dataLabel="Network">
                <PlainTableHeader label="Network" />
              </Th>
              <Th dataLabel="State">
                <PlainTableHeader label="State" />
              </Th>
              <Th dataLabel="Type">
                <PlainTableHeader label="Type" />
              </Th>
              <Th dataLabel="MAC address">
                <PlainTableHeader label="MAC address" />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((iface) => (
              <Tr key={iface.name}>
                <Td dataLabel="Name">{iface.name}</Td>
                <Td dataLabel="Model">{iface.model}</Td>
                <Td dataLabel="Network">
                  <VMNetworkResourceLink network={iface.network} />
                </Td>
                <Td dataLabel="State">{iface.state}</Td>
                <Td dataLabel="Type">{iface.type}</Td>
                <Td dataLabel="MAC address">{iface.macAddress}</Td>
              </Tr>
            ))}
          </Tbody>
        </>
      )}
    </OcsNamedResourceDataView>
  );
}
