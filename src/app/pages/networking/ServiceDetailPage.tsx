import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
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
  Label,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  OCS_PROTOTYPE_TABLE_CLASS,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  getService,
  serviceDetailPath,
  serviceEditPath,
  serviceYaml,
} from "./networkingMockData";
import { NETWORKING_CRUMB as CRUMB } from "./networkingShared";

export default function ServiceDetailPage() {
  const navigate = useNavigate();
  const { namespace = "", name = "" } = useParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const service = getService(decodedNs, decodedName);
  const [activeTab, setActiveTab] = useState("details");
  const [actionsOpen, setActionsOpen] = useState(false);

  if (!service) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            CRUMB,
            { label: "Services", path: "/networking" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            Service not found
          </Title>
          <Button variant="link" component={Link} to="/networking" className="pf-v6-u-mt-md">
            Back to Services
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = serviceDetailPath(service.namespace, service.name);
  const hostname = `${service.name}.${service.namespace}.svc.cluster.local`;
  const typeLabel = service.type === "ClusterIP" ? "Cluster IP" : service.type;

  return (
    <div className="ocs-app-page-outer ocs-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          CRUMB,
          { label: "Services", path: "/networking" },
          { label: "Service details" },
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
              <Label color="green" isCompact className="ocs-resource-label">
                S
              </Label>
              <Title headingLevel="h1" size="2xl">
                {service.name}
              </Title>
              <FavoriteButton name={service.name} path={detailPath} />
            </Flex>
            <Dropdown
              isOpen={actionsOpen}
              onOpenChange={setActionsOpen}
              toggle={(toggleRef) => (
                <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((o) => !o)} variant="secondary">
                  Actions
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem>Edit Labels</DropdownItem>
                <DropdownItem>Edit Annotations</DropdownItem>
                <DropdownItem
                  onClick={() => {
                    setActionsOpen(false);
                    navigate(serviceEditPath(decodedNs, decodedName));
                  }}
                >
                  Edit Service
                </DropdownItem>
                <DropdownItem>Delete Service</DropdownItem>
              </DropdownList>
            </Dropdown>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Service details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="pods" title={<TabTitleText>Pods</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <section className="ocs-node-details__panel app-glass-panel" aria-label="Service details">
              <Grid hasGutter className="ocs-node-details__columns">
                <GridItem md={6}>
                  <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                    Service details
                  </Title>
                  <DescriptionList isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>{service.name}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Namespace</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Button variant="link" isInline>
                          {service.namespace}
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        <Flex
                          alignItems={{ default: "alignItemsCenter" }}
                          gap={{ default: "gapSm" }}
                          className="ocs-node-details__labels-term-inner"
                        >
                          Labels
                          <Button variant="plain" aria-label="Edit labels" icon={<PencilAltIcon />} />
                        </Flex>
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {service.labels.length === 0 ? (
                          <Content component="small">No labels</Content>
                        ) : (
                          <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                            {service.labels.map((l) => (
                              <Label key={l.key} color="green" isCompact>
                                {l.key}={l.value}
                              </Label>
                            ))}
                          </Flex>
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Pod selector</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Button variant="link" isInline icon={<SearchIcon />} iconPosition="start">
                          {service.podSelector}
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Annotations</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Button variant="link" isInline icon={<PencilAltIcon />} iconPosition="end">
                          {service.annotationCount === 0
                            ? "0 annotations"
                            : `${service.annotationCount} annotation${service.annotationCount === 1 ? "" : "s"}`}
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Session affinity</DescriptionListTerm>
                      <DescriptionListDescription>{service.sessionAffinity}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created at</DescriptionListTerm>
                      <DescriptionListDescription>{service.createdAt}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Owner</DescriptionListTerm>
                      <DescriptionListDescription>{service.owner}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>

                <GridItem md={6}>
                  <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                    Service routing
                  </Title>
                  <DescriptionList isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Hostname</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                          <Content component="p" className="pf-v6-u-mb-0">
                            {hostname}
                          </Content>
                          <Content component="small">Accessible within the cluster only</Content>
                        </Flex>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>

                  <Title headingLevel="h3" size="lg" className="pf-v6-u-mt-lg pf-v6-u-mb-md">
                    Service address
                  </Title>
                  <Grid hasGutter>
                    <GridItem span={6}>
                      <DescriptionList isCompact className="ocs-node-details__dl">
                        <DescriptionListGroup>
                          <DescriptionListTerm>Type</DescriptionListTerm>
                          <DescriptionListDescription>{typeLabel}</DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </GridItem>
                    <GridItem span={6}>
                      <DescriptionList isCompact className="ocs-node-details__dl">
                        <DescriptionListGroup>
                          <DescriptionListTerm>Location</DescriptionListTerm>
                          <DescriptionListDescription>
                            {service.clusterIP || service.location || "—"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </GridItem>
                  </Grid>
                  <Content component="small" className="pf-v6-u-mt-sm">
                    Accessible within the cluster only
                  </Content>

                  <Title headingLevel="h3" size="lg" className="pf-v6-u-mt-lg pf-v6-u-mb-md">
                    Service port mapping
                  </Title>
                  {service.ports.length === 0 ? (
                    <Content component="p">No ports configured.</Content>
                  ) : (
                    <Table className={OCS_PROTOTYPE_TABLE_CLASS} aria-label="Service port mapping" variant="compact">
                      <Thead>
                        <Tr>
                          <Th>
                            <PlainTableHeader label="Name" />
                          </Th>
                          <Th>
                            <PlainTableHeader label="Port" />
                          </Th>
                          <Th>
                            <PlainTableHeader label="Protocol" />
                          </Th>
                          <Th>
                            <PlainTableHeader label="Pod port or name" />
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {service.ports.map((port) => (
                          <Tr key={`${port.name}-${port.port}`}>
                            <Td dataLabel="Name">
                              <Button variant="link" isInline>
                                {port.name}
                              </Button>
                            </Td>
                            <Td dataLabel="Port">
                              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                <Label color="green" isCompact className="ocs-resource-label">
                                  S
                                </Label>
                                {port.port}
                              </Flex>
                            </Td>
                            <Td dataLabel="Protocol">{port.protocol}</Td>
                            <Td dataLabel="Pod port or name">
                              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                <Label color="blue" isCompact className="ocs-resource-label">
                                  P
                                </Label>
                                {port.targetPort}
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </GridItem>
              </Grid>
            </section>
          ) : null}

          {activeTab === "yaml" ? (
            <section className="ocs-node-details__panel app-glass-panel" aria-label="Service YAML">
              <pre className="ocs-net-yaml">{serviceYaml(service)}</pre>
            </section>
          ) : null}

          {activeTab === "pods" ? (
            <section className="ocs-node-details__panel app-glass-panel" aria-label="Service pods">
              <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                Pods
              </Title>
              <Content component="p">
                {service.selectorPairs.length === 0
                  ? `No pods currently selected by this Service in ${service.namespace}.`
                  : `Pods matching selector ${service.selectorPairs.join(", ")} will appear here when available.`}
              </Content>
            </section>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
