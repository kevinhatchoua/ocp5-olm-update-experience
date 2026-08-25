import { useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Grid,
  GridItem,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  NetworkVirtualMachinesTab,
  NetworkVmTabBadge,
} from "../../components/networking/NetworkVirtualMachinesTab";
import {
  getAttachedVmsForNetwork,
  getNad,
  nadDetailPath,
  nadTopologyHighlightId,
  nadYaml,
  topologyHighlightPath,
  type NetworkResourceRef,
} from "./networkingMockData";
import { NETWORKING_CRUMB as CRUMB } from "./networkingShared";

export default function NadDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromTopology = Boolean((location.state as { fromTopology?: boolean } | null)?.fromTopology);
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const nad = getNad(decodedNs, decodedName);
  const initialTab = searchParams.get("tab") === "yaml" ? "yaml" : "details";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [attachmentRev, setAttachmentRev] = useState(0);

  const networkRef: NetworkResourceRef = useMemo(
    () => ({ kind: "NAD", name: decodedName, namespace: decodedNs }),
    [decodedName, decodedNs]
  );

  const vmCount = useMemo(
    () => getAttachedVmsForNetwork(networkRef).length,
    [networkRef, attachmentRev]
  );

  const topologyCrumb = fromTopology
    ? [{ label: "Topology", path: "/networking/topology" }]
    : [];

  if (!nad) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            CRUMB,
            ...topologyCrumb,
            { label: "NetworkAttachmentDefinitions", path: "/networking/networkattachmentdefinitions" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            NetworkAttachmentDefinition not found
          </Title>
          <Link
            to="/networking/networkattachmentdefinitions"
            className="pf-v6-c-button pf-m-link pf-v6-u-mt-md"
          >
            Back to NetworkAttachmentDefinitions
          </Link>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = nadDetailPath(decodedNs, decodedName);
  const topologyPath = topologyHighlightPath(nadTopologyHighlightId(decodedNs, decodedName));

  return (
    <div className="ocs-app-page-outer ocs-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          CRUMB,
          ...topologyCrumb,
          { label: "NetworkAttachmentDefinitions", path: "/networking/networkattachmentdefinitions" },
          { label: "NetworkAttachmentDefinition details" },
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
              <Label color="blue" isCompact className="ocs-resource-label">
                NAD
              </Label>
              <Title headingLevel="h1" size="2xl">
                {nad.name}
              </Title>
              <FavoriteButton name={nad.name} path={detailPath} />
            </Flex>
            <Link to={topologyPath} className="pf-v6-c-button pf-m-link">
              View in Topology
            </Link>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="NetworkAttachmentDefinition details"
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
            <section className="ocs-node-details__panel" aria-label="NetworkAttachmentDefinition details">
              <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                NetworkAttachmentDefinition details
              </Title>
              <Grid hasGutter className="ocs-node-details__columns">
                <GridItem md={6}>
                  <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>{nad.name}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Namespace</DescriptionListTerm>
                      <DescriptionListDescription>{nad.namespace}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Description</DescriptionListTerm>
                      <DescriptionListDescription>{nad.description}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
                <GridItem md={6}>
                  <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Type</DescriptionListTerm>
                      <DescriptionListDescription>{nad.type}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Network type</DescriptionListTerm>
                      <DescriptionListDescription>{nad.networkType}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </section>
          ) : null}

          {activeTab === "yaml" ? (
            <section className="ocs-node-details__panel" aria-label="YAML">
              <pre className="ocs-net-yaml">{nadYaml(nad)}</pre>
            </section>
          ) : null}

          {activeTab === "virtualization" ? (
            <NetworkVirtualMachinesTab
              networkRef={networkRef}
              networkName={nad.name}
              onAttachmentsChange={() => setAttachmentRev((r) => r + 1)}
            />
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
