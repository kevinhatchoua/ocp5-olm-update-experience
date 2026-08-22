import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  Alert,
  Button,
  Content,
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
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import DebugPodModal, { type DebugPodTarget } from "./DebugPodModal";
import PodActionsMenu from "./PodActionsMenu";
import PodStatusDisplay from "./PodStatusDisplay";
import { getPodDetail, type PodContainer } from "./podDetailData";
import { podDetailPath, type PodStatus } from "./podListData";

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

function PodStatusLabel({
  status,
  podName,
  onDebug,
}: {
  status: string;
  podName: string;
  onDebug?: () => void;
}) {
  return (
    <PodStatusDisplay
      pod={{ name: podName, status: status as PodStatus }}
      onDebug={onDebug}
      asLabel
    />
  );
}

export default function PodDetailPage() {
  const { namespace = "", podName = "" } = useParams();
  const decodedNamespace = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(podName);
  const pod = getPodDetail(decodedNamespace, decodedName);

  const [activeTab, setActiveTab] = useState<string>("details");
  const [debugTarget, setDebugTarget] = useState<DebugPodTarget | null>(null);

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
              <PodStatusLabel
                status={pod.status}
                podName={pod.name}
                onDebug={() => setDebugTarget({ namespace: pod.namespace, name: pod.name, pod })}
              />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={pod.name} path={detailPath} />
              <PodActionsMenu
                pod={pod}
                variant="secondary"
                label="Actions"
                onDebug={(p) => setDebugTarget({ namespace: p.namespace, name: p.name, pod: p })}
              />
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
                          <PodStatusLabel
                            status={pod.status}
                            podName={pod.name}
                            onDebug={() => setDebugTarget({ namespace: pod.namespace, name: pod.name, pod })}
                          />
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
          ) : activeTab === "terminal" ? (
            <div className="ocs-pod-details__section">
              {pod.distroless || pod.status === "CrashLoopBackOff" ? (
                <>
                  <Alert variant="danger" isInline title="Unable to exec into container">
                    <code>OCI runtime exec failed: exec failed: unable to start container process: exec:
                    &quot;sh&quot;: executable file not found in $PATH</code>
                  </Alert>
                  <Content component="p" className="pf-v6-u-mt-md">
                    This workload image has no shell. Use <strong>Debug</strong> to start an ephemeral
                    support-tools container (equivalent to <code>oc debug</code>).
                  </Content>
                  <Button
                    variant="primary"
                    className="pf-v6-u-mt-md"
                    onClick={() => setDebugTarget({ namespace: pod.namespace, name: pod.name, pod })}
                  >
                    Debug
                  </Button>
                </>
              ) : (
                <pre className="ocs-debug-terminal ocs-debug-terminal--session" aria-label="Pod terminal">
                  {`Connected to ${pod.namespace}/${pod.name}\nsh-5.1# `}
                </pre>
              )}
            </div>
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
      <DebugPodModal
        target={debugTarget}
        isOpen={debugTarget !== null}
        onClose={() => setDebugTarget(null)}
      />
    </div>
  );
}
