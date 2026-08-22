import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import {
  Button,
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
  getUdn,
  udnDetailPath,
  udnYaml,
  type NetworkResourceRef,
} from "./networkingMockData";
import { NETWORKING_CRUMB as CRUMB } from "./networkingShared";

export default function UdnDetailPage() {
  const { name = "", namespace: nsParam } = useParams();
  const location = useLocation();
  const decodedName = decodeURIComponent(name);
  const isCluster = location.pathname.includes("/userdefinednetworks/cluster/");
  const decodedNs = nsParam ? decodeURIComponent(nsParam) : undefined;
  const udn = getUdn(decodedName, decodedNs);
  const [activeTab, setActiveTab] = useState("details");
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

  if (!udn || (isCluster && udn.kind !== "CUDN") || (!isCluster && udn.kind === "CUDN")) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            CRUMB,
            { label: "UserDefinedNetworks", path: "/networking/userdefinednetworks" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            UserDefinedNetwork not found
          </Title>
          <Button variant="link" component={Link} to="/networking/userdefinednetworks" className="pf-v6-u-mt-md">
            Back to UserDefinedNetworks
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = udnDetailPath(udn);
  const kindLabel = udn.kind === "CUDN" ? "CUDN" : "UDN";

  return (
    <div className="ocs-app-page-outer ocs-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          CRUMB,
          { label: "UserDefinedNetworks", path: "/networking/userdefinednetworks" },
          { label: "UserDefinedNetwork details" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
            <Label color="purple" isCompact className="ocs-resource-label">
              {kindLabel}
            </Label>
            <Title headingLevel="h1" size="2xl">
              {udn.name}
            </Title>
            <FavoriteButton name={udn.name} path={detailPath} />
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
            <section className="ocs-node-details__panel" aria-label="UserDefinedNetwork details">
              <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                UserDefinedNetwork details
              </Title>
              <Grid hasGutter className="ocs-node-details__columns">
                <GridItem md={6}>
                  <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>{udn.name}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Namespace</DescriptionListTerm>
                      <DescriptionListDescription>{udn.namespace ?? "—"}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Description</DescriptionListTerm>
                      <DescriptionListDescription>{udn.description}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
                <GridItem md={6}>
                  <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Topology</DescriptionListTerm>
                      <DescriptionListDescription>{udn.topology}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>MTU</DescriptionListTerm>
                      <DescriptionListDescription>{udn.mtu}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Condition</DescriptionListTerm>
                      <DescriptionListDescription>{udn.condition}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </section>
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
