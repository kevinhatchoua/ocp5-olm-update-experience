import { useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import {
  Button,
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
  Label,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OcsPrototypeListTable } from "../../components/dataView/OcsPrototypeListTable";
import {
  NetworkVirtualMachinesTab,
  NetworkVmTabBadge,
} from "../../components/networking/NetworkVirtualMachinesTab";
import {
  getAttachedVmsForNetwork,
  getUdn,
  topologyHighlightPath,
  udnDetailPath,
  udnTopologyHighlightId,
  udnYaml,
  type NetworkResourceRef,
} from "./networkingMockData";
import { NETWORKING_CRUMB as CRUMB } from "./networkingShared";

export default function UdnDetailPage() {
  const { name = "", namespace: nsParam } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromTopology = Boolean((location.state as { fromTopology?: boolean } | null)?.fromTopology);
  const decodedName = decodeURIComponent(name);
  const isCluster = location.pathname.includes("/userdefinednetworks/cluster/");
  const decodedNs = nsParam ? decodeURIComponent(nsParam) : undefined;
  const udn = getUdn(decodedName, decodedNs);
  const initialTab = searchParams.get("tab") === "yaml" ? "yaml" : "details";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [attachmentRev, setAttachmentRev] = useState(0);

  const networkRef: NetworkResourceRef = useMemo(
    () =>
      udn?.kind === "CUDN"
        ? { kind: "CUDN", name: decodedName }
        : { kind: "UDN", name: decodedName, namespace: decodedNs },
    [decodedName, decodedNs, udn?.kind]
  );

  const vmCount = useMemo(
    () => getAttachedVmsForNetwork(networkRef).length,
    [networkRef, attachmentRev]
  );

  const topologyCrumb = fromTopology
    ? [{ label: "Topology", path: "/networking/topology" }]
    : [];

  if (!udn || (isCluster && udn.kind !== "CUDN") || (!isCluster && udn.kind === "CUDN")) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            CRUMB,
            ...topologyCrumb,
            { label: "UserDefinedNetworks", path: "/networking/userdefinednetworks" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            UserDefinedNetwork not found
          </Title>
          <Link to="/networking/userdefinednetworks" className="pf-v6-c-button pf-m-link pf-v6-u-mt-md">
            Back to UserDefinedNetworks
          </Link>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = udnDetailPath(udn);
  const kindLabel = udn.kind === "CUDN" ? "CUDN" : "UDN";
  const detailSectionTitle =
    udn.kind === "CUDN" ? "ClusterUserDefinedNetwork details" : "UserDefinedNetwork details";
  const detailCrumbLabel =
    udn.kind === "CUDN" ? "ClusterUserDefinedNetwork details" : "UserDefinedNetwork details";
  const topologyPath = topologyHighlightPath(udnTopologyHighlightId(udn));
  const [actionsOpen, setActionsOpen] = useState(false);
  const cudnSubnets = udn.kind === "CUDN" ? "192.168.123.0/24" : null;

  return (
    <div className="ocs-app-page-outer ocs-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          CRUMB,
          ...topologyCrumb,
          { label: "UserDefinedNetworks", path: "/networking/userdefinednetworks" },
          { label: detailCrumbLabel },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            gap={{ default: "gapMd" }}
            flexWrap={{ default: "wrap" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <Label color="purple" isCompact className="ocs-resource-label">
                {kindLabel}
              </Label>
              <Title headingLevel="h1" size="2xl">
                {udn.name}
              </Title>
              <FavoriteButton name={udn.name} path={detailPath} />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <Link to={topologyPath} className="pf-v6-c-button pf-m-link">
                View in Topology
              </Link>
              <Dropdown
                isOpen={actionsOpen}
                onOpenChange={setActionsOpen}
                onSelect={() => setActionsOpen(false)}
                popperProps={{ position: "right" }}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((open) => !open)} variant="secondary">
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem itemId="edit-yaml">Edit YAML</DropdownItem>
                  <DropdownItem itemId="delete" isDanger>
                    Delete {kindLabel}
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </Flex>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="UserDefinedNetwork details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab
              eventKey="virtualization"
              title={
                <TabTitleText>
                  Virtualization <NetworkVmTabBadge count={vmCount} />
                </TabTitleText>
              }
            />
          </Tabs>

          {activeTab === "details" ? (
            <>
              <section className="ocs-node-details__panel" aria-label={detailSectionTitle}>
                <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                  {detailSectionTitle}
                </Title>
                <Grid hasGutter className="ocs-node-details__columns">
                  <GridItem md={6}>
                    <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>{udn.name}</DescriptionListDescription>
                      </DescriptionListGroup>
                      {udn.kind === "UDN" ? (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Namespace</DescriptionListTerm>
                          <DescriptionListDescription>{udn.namespace ?? "—"}</DescriptionListDescription>
                        </DescriptionListGroup>
                      ) : null}
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
                            <span>Labels</span>
                            <Button variant="link" isInline icon={<PencilAltIcon aria-hidden />} iconPosition="right">
                              Edit
                            </Button>
                          </Flex>
                        </DescriptionListTerm>
                        <DescriptionListDescription>No labels</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Annotations</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <span>0 annotations</span>
                            <Button variant="plain" aria-label="Edit annotations" icon={<PencilAltIcon aria-hidden />} />
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created at</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <OutlinedClockIcon className="ocs-node-details__uptime-icon" aria-hidden />
                            Just now
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Owner</DescriptionListTerm>
                        <DescriptionListDescription>No owner</DescriptionListDescription>
                      </DescriptionListGroup>
                      {udn.kind === "UDN" ? (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Description</DescriptionListTerm>
                          <DescriptionListDescription>{udn.description}</DescriptionListDescription>
                        </DescriptionListGroup>
                      ) : null}
                    </DescriptionList>
                  </GridItem>
                  <GridItem md={6}>
                    <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                      <DescriptionListGroup>
                        <DescriptionListTerm>Topology</DescriptionListTerm>
                        <DescriptionListDescription>{udn.topology}</DescriptionListDescription>
                      </DescriptionListGroup>
                      {udn.kind === "CUDN" ? (
                        <DescriptionListGroup>
                          <DescriptionListTerm>IPAM Lifecycle</DescriptionListTerm>
                          <DescriptionListDescription>Persistent</DescriptionListDescription>
                        </DescriptionListGroup>
                      ) : null}
                      <DescriptionListGroup>
                        <DescriptionListTerm>MTU</DescriptionListTerm>
                        <DescriptionListDescription>{udn.mtu}</DescriptionListDescription>
                      </DescriptionListGroup>
                      {udn.kind === "CUDN" ? (
                        <>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Role</DescriptionListTerm>
                            <DescriptionListDescription>Primary</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Subnets</DescriptionListTerm>
                            <DescriptionListDescription>
                              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                {cudnSubnets}
                                <Button variant="plain" aria-label="Copy subnet" icon={<CopyIcon aria-hidden />} />
                              </Flex>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>JoinSubnets</DescriptionListTerm>
                            <DescriptionListDescription>Not available</DescriptionListDescription>
                          </DescriptionListGroup>
                        </>
                      ) : (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Condition</DescriptionListTerm>
                          <DescriptionListDescription>{udn.condition}</DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                    </DescriptionList>
                  </GridItem>
                </Grid>
              </section>
              {udn.kind === "CUDN" ? (
                <section className="ocs-node-details__panel" aria-label="Conditions">
                  <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                    Conditions
                  </Title>
                  <OcsPrototypeListTable ariaLabel="Conditions">
                    <Thead>
                      <Tr>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th>Updated</Th>
                        <Th>Reason</Th>
                        <Th>Message</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td dataLabel="Type">NetworkCreated</Td>
                        <Td dataLabel="Status">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" aria-hidden />
                            True
                          </Flex>
                        </Td>
                        <Td dataLabel="Updated">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <OutlinedClockIcon className="ocs-node-details__uptime-icon" aria-hidden />
                            Just now
                          </Flex>
                        </Td>
                        <Td dataLabel="Reason">NetworkAttachmentDefinitionCreated</Td>
                        <Td dataLabel="Message">
                          NetworkAttachmentDefinition has been created in following namespaces: []
                        </Td>
                      </Tr>
                    </Tbody>
                  </OcsPrototypeListTable>
                </section>
              ) : null}
            </>
          ) : null}

          {activeTab === "yaml" ? (
            <section className="ocs-node-details__panel" aria-label="YAML">
              <pre className="ocs-net-yaml">{udnYaml(udn)}</pre>
            </section>
          ) : null}

          {activeTab === "virtualization" ? (
            <NetworkVirtualMachinesTab
              networkRef={networkRef}
              networkName={udn.name}
              onAttachmentsChange={() => setAttachmentRev((r) => r + 1)}
            />
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
