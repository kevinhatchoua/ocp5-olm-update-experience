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
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { getPodDetail, type PodContainer } from "./podDetailData";
import { podDetailPath } from "./podListData";

function containerName(container: PodContainer) {
  return container.name;
}

function PodContainersTable({ containers }: { containers: PodContainer[] }) {
  return (
    <OcsNamedResourceDataView
      ouiaId="pod-containers-data-view"
      ariaLabel="Containers"
      itemsLabel="containers"
      items={containers}
      getName={containerName}
    >
      {(rows) => (
        <>
          <Thead>
            <Tr>
              <Th dataLabel="Name">
                <PlainTableHeader label="Name" />
              </Th>
              <Th dataLabel="Image">
                <PlainTableHeader label="Image" />
              </Th>
              <Th dataLabel="State">
                <PlainTableHeader label="State" />
              </Th>
              <Th dataLabel="Ready">
                <PlainTableHeader label="Ready" />
              </Th>
              <Th dataLabel="Last State">
                <PlainTableHeader label="Last State" />
              </Th>
              <Th dataLabel="Restarts">
                <PlainTableHeader label="Restarts" />
              </Th>
              <Th dataLabel="Started">
                <PlainTableHeader label="Started" />
              </Th>
              <Th dataLabel="Finished">
                <PlainTableHeader label="Finished" />
              </Th>
              <Th dataLabel="Exit code">
                <PlainTableHeader label="Exit code" />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((c) => (
              <Tr key={c.name}>
                <Td dataLabel="Name">
                  <Content component="small">{c.name}</Content>
                </Td>
                <Td dataLabel="Image">
                  <Content component="small" className="ocs-pods-list__mono">
                    {c.image}
                  </Content>
                </Td>
                <Td dataLabel="State">
                  <Content component="small">{c.state}</Content>
                </Td>
                <Td dataLabel="Ready">
                  <Content component="small">{c.ready ? "True" : "False"}</Content>
                </Td>
                <Td dataLabel="Last State">
                  <Content component="small">{c.lastState}</Content>
                </Td>
                <Td dataLabel="Restarts">
                  <Content component="small">{c.restarts}</Content>
                </Td>
                <Td dataLabel="Started">
                  <Content component="small">{c.started}</Content>
                </Td>
                <Td dataLabel="Finished">
                  <Content component="small">{c.finished}</Content>
                </Td>
                <Td dataLabel="Exit code">
                  <Content component="small">{c.exitCode}</Content>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </>
      )}
    </OcsNamedResourceDataView>
  );
}

function PodStatusLabel({ status }: { status: string }) {
  switch (status) {
    case "Running":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="success" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          <Label color="green" isCompact>
            {status}
          </Label>
        </Flex>
      );
    case "Pending":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="warning" aria-hidden>
            <ClockIcon />
          </Icon>
          <Label color="orange" isCompact>
            {status}
          </Label>
        </Flex>
      );
    case "Failed":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="danger" aria-hidden>
            <TimesCircleIcon />
          </Icon>
          <Label color="red" isCompact>
            {status}
          </Label>
        </Flex>
      );
    default:
      return (
        <Label color="blue" isCompact>
          {status}
        </Label>
      );
  }
}

export default function PodDetailPage() {
  const { namespace = "", podName = "" } = useParams();
  const decodedNamespace = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(podName);
  const pod = getPodDetail(decodedNamespace, decodedName);

  const [activeTab, setActiveTab] = useState<string>("details");
  const [actionsOpen, setActionsOpen] = useState(false);

  if (!pod) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            { label: "Workloads", path: "/workloads" },
            { label: "Pods", path: "/workloads/pods" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            Pod not found
          </Title>
          <Button variant="link" component={Link} to="/workloads/pods" className="pf-v6-u-mt-md">
            Back to Pods
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = podDetailPath(pod.namespace, pod.name);

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "Pods", path: "/workloads/pods" },
          { label: "Pod details" },
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
              <Label color="teal" isCompact className="ocs-resource-label">
                P
              </Label>
              <Title headingLevel="h1" size="2xl" className="ocs-pod-details__title">
                {pod.name}
              </Title>
              <PodStatusLabel status={pod.status} />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={pod.name} path={detailPath} />
              <Dropdown
                isOpen={actionsOpen}
                onOpenChange={setActionsOpen}
                onSelect={() => setActionsOpen(false)}
                popperProps={{ position: "right" }}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((o) => !o)} variant="secondary">
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem itemId="edit">Edit resource</DropdownItem>
                  <DropdownItem itemId="delete" isDanger>
                    Delete Pod
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </Flex>
          </Flex>

          <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(String(key))} aria-label="Pod details">
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="metrics" title={<TabTitleText>Metrics</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="environment" title={<TabTitleText>Environment</TabTitleText>} />
            <Tab eventKey="logs" title={<TabTitleText>Logs</TabTitleText>} />
            <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
            <Tab eventKey="terminal" title={<TabTitleText>Terminal</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <>
              <section className="ocs-pod-details__section" aria-label="Pod details">
                <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                  Pod details
                </Title>
                <Grid hasGutter className="ocs-pod-details__columns">
                  <GridItem md={6}>
                    <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>{pod.name}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Namespace</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Button variant="link" isInline component={Link} to="/administration/namespaces">
                            {pod.namespace}
                          </Button>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Labels</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                            {pod.labels.map((label) => (
                              <Label key={label} color="blue" isCompact>
                                {label}
                              </Label>
                            ))}
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Node selector</DescriptionListTerm>
                        <DescriptionListDescription>{pod.nodeSelector}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Tolerations</DescriptionListTerm>
                        <DescriptionListDescription>{pod.tolerations}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Annotations</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Button variant="link" isInline>
                            {pod.annotations}
                          </Button>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Creation timestamp</DescriptionListTerm>
                        <DescriptionListDescription>{pod.creationTimestamp}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Owner</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Button variant="link" isInline>
                            {pod.ownerDisplay}
                          </Button>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </GridItem>
                  <GridItem md={6}>
                    <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                      <DescriptionListGroup>
                        <DescriptionListTerm>Status</DescriptionListTerm>
                        <DescriptionListDescription>
                          <PodStatusLabel status={pod.status} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Restart policy</DescriptionListTerm>
                        <DescriptionListDescription>{pod.restartPolicy}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Active deadline seconds</DescriptionListTerm>
                        <DescriptionListDescription>{pod.activeDeadlineSeconds}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Pod IP</DescriptionListTerm>
                        <DescriptionListDescription>{pod.podIp}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Host IP</DescriptionListTerm>
                        <DescriptionListDescription>{pod.hostIp}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Node</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Button
                            variant="link"
                            isInline
                            component={Link}
                            to={`/compute/nodes/${encodeURIComponent(pod.node)}`}
                          >
                            {pod.node}
                          </Button>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Image pull secret</DescriptionListTerm>
                        <DescriptionListDescription>{pod.imagePullSecret}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>PodDisruptionBudget</DescriptionListTerm>
                        <DescriptionListDescription>{pod.podDisruptionBudget}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Receiving Traffic</DescriptionListTerm>
                        <DescriptionListDescription>{pod.receivingTraffic}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </GridItem>
                </Grid>
              </section>

              <section className="ocs-pod-details__section" aria-label="Containers">
                <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                  Containers
                </Title>
                <PodContainersTable containers={pod.containers} />
              </section>

              <section className="ocs-pod-details__section" aria-label="Volumes">
                <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                  Volumes
                </Title>
                <DescriptionList isHorizontal isCompact>
                  {pod.volumes.map((vol) => (
                    <DescriptionListGroup key={vol}>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>{vol}</DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              </section>
            </>
          ) : (
            <div className="ocs-pod-details__section">
              <Content component="p" className="pf-v6-u-color-200">
                {activeTab.charAt(0).toUpperCase()}
                {activeTab.slice(1)} view is not available in this prototype.
              </Content>
              <Button variant="link" onClick={() => setActiveTab("details")}>
                Return to Details
              </Button>
            </div>
          )}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
