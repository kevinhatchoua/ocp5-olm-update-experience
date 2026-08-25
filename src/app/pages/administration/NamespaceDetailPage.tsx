import { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Flex,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { DataView } from "@patternfly/react-data-view";
import {
  applicationsForNamespace,
  gitopsDetailPath,
} from "../gitops/gitopsData";
import { HealthStatus, ResourceName } from "../gitops/gitopsShared";

const NAMESPACE_META: Record<string, { status: string; created: string }> = {
  default: { status: "Active", created: "2026-07-01T12:00:00Z" },
  "kube-system": { status: "Active", created: "2026-07-01T12:00:00Z" },
  "kube-public": { status: "Active", created: "2026-07-01T12:00:00Z" },
  "openshift-console": { status: "Active", created: "2026-07-01T12:00:00Z" },
  "openshift-monitoring": { status: "Active", created: "2026-07-01T12:00:00Z" },
  "my-application": { status: "Active", created: "2026-08-10T09:30:00Z" },
  payments: { status: "Active", created: "2026-08-12T08:00:00Z" },
  "demo-workloads": { status: "Active", created: "2026-08-05T11:15:00Z" },
  "rollouts-demo": { status: "Active", created: "2026-08-01T10:00:00Z" },
  argocd: { status: "Active", created: "2026-07-15T14:20:00Z" },
};

function namespaceYaml(name: string, status: string, created: string) {
  return `apiVersion: v1
kind: Namespace
metadata:
  name: ${name}
  creationTimestamp: "${created}"
status:
  phase: ${status}`;
}

export default function NamespaceDetailPage() {
  const { name = "" } = useParams();
  const nsName = decodeURIComponent(name);
  const [activeTab, setActiveTab] = useState("details");
  const meta = NAMESPACE_META[nsName] ?? { status: "Active", created: "2026-08-01T00:00:00Z" };
  const apps = useMemo(() => applicationsForNamespace(nsName), [nsName]);
  const detailPath = `/administration/namespaces/${encodeURIComponent(nsName)}`;

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Administration", path: "/administration" },
          { label: "Namespaces", path: "/administration/namespaces" },
          { label: nsName },
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
                NS
              </Label>
              <Title headingLevel="h1" size="2xl">
                {nsName}
              </Title>
              <Label color="green" isCompact>
                {meta.status}
              </Label>
            </Flex>
            <FavoriteButton name={nsName} path={detailPath} />
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Namespace details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="gitops" title={<TabTitleText>GitOps</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>{nsName}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="green" isCompact>
                    {meta.status}
                  </Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>{meta.created}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "gitops" ? (
            apps.length === 0 ? (
              <EmptyState variant={EmptyStateVariant.sm} titleText="No GitOps applications" headingLevel="h2">
                <EmptyStateBody>
                  No Applications target namespace <code>{nsName}</code>.
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <div className="ocs-pods-list__panel">
                <DataView ouiaId="namespace-gitops-apps" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
                  <OcsPrototypeListTable ariaLabel="GitOps applications for namespace">
                    <Thead>
                      <Tr>
                        <Th dataLabel="Name">
                          <PlainTableHeader label="Name" />
                        </Th>
                        <Th dataLabel="Sync">
                          <PlainTableHeader label="Sync status" />
                        </Th>
                        <Th dataLabel="Health">
                          <PlainTableHeader label="Health" />
                        </Th>
                        <Th dataLabel="Destination">
                          <PlainTableHeader label="Destination" />
                        </Th>
                        <Th dataLabel="Age">
                          <PlainTableHeader label="Age" />
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {apps.map((app) => (
                        <Tr key={`${app.ns}/${app.name}`}>
                          <Td dataLabel="Name">
                            <ResourceName
                              kind="Application"
                              name={app.name}
                              to={gitopsDetailPath("applications", app.ns, app.name)}
                            />
                          </Td>
                          <Td dataLabel="Sync">
                            <HealthStatus status={app.sync} />
                          </Td>
                          <Td dataLabel="Health">
                            <HealthStatus status={app.health} />
                          </Td>
                          <Td dataLabel="Destination">{app.destination}</Td>
                          <Td dataLabel="Age">{app.age}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </OcsPrototypeListTable>
                </DataView>
              </div>
            )
          ) : null}

          {activeTab === "yaml" ? (
            <pre className="ocs-net-yaml">{namespaceYaml(nsName, meta.status, meta.created)}</pre>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
