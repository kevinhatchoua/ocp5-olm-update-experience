import { useState } from "react";
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
  getNncp,
  nncpDetailPath,
  nncpTopologyHighlightId,
  nncpYaml,
  topologyHighlightPath,
} from "./networkingMockData";
import { NETWORKING_CRUMB as CRUMB } from "./networkingShared";

export default function NncpDetailPage() {
  const { name = "" } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromTopology = Boolean((location.state as { fromTopology?: boolean } | null)?.fromTopology);
  const decodedName = decodeURIComponent(name);
  const nncp = getNncp(decodedName);
  const initialTab = searchParams.get("tab") === "yaml" ? "yaml" : "details";
  const [activeTab, setActiveTab] = useState(initialTab);

  const topologyCrumb = fromTopology
    ? [{ label: "Topology", path: "/networking/topology" }]
    : [];

  if (!nncp) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            CRUMB,
            ...topologyCrumb,
            { label: "NodeNetworkConfigurationPolicy", path: "/networking/nodenetworkconfigurationpolicy" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            NodeNetworkConfigurationPolicy not found
          </Title>
          <Link
            to="/networking/nodenetworkconfigurationpolicy"
            className="pf-v6-c-button pf-m-link pf-v6-u-mt-md"
          >
            Back to NodeNetworkConfigurationPolicy
          </Link>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = nncpDetailPath(decodedName);
  const topologyPath = topologyHighlightPath(nncpTopologyHighlightId(decodedName));

  return (
    <div className="ocs-app-page-outer ocs-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          CRUMB,
          ...topologyCrumb,
          { label: "NodeNetworkConfigurationPolicy", path: "/networking/nodenetworkconfigurationpolicy" },
          { label: "NodeNetworkConfigurationPolicy details" },
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
                NNCP
              </Label>
              <Title headingLevel="h1" size="2xl">
                {nncp.name}
              </Title>
              <FavoriteButton name={nncp.name} path={detailPath} />
            </Flex>
            <Link to={topologyPath} className="pf-v6-c-button pf-m-link">
              View in Topology
            </Link>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="NodeNetworkConfigurationPolicy details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <section className="ocs-node-details__panel" aria-label="NodeNetworkConfigurationPolicy details">
              <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                NodeNetworkConfigurationPolicy details
              </Title>
              <Grid hasGutter className="ocs-node-details__columns">
                <GridItem md={6}>
                  <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>{nncp.name}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status</DescriptionListTerm>
                      <DescriptionListDescription>{nncp.status}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </section>
          ) : null}

          {activeTab === "yaml" ? (
            <section className="ocs-node-details__panel" aria-label="YAML">
              <pre className="ocs-net-yaml">{nncpYaml(nncp)}</pre>
            </section>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
