import { useState } from "react";
import {
  Button,
  Content,
  Flex,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { useToast } from "../../contexts/ToastContext";
import { GitOpsEditDeleteMenu, HealthStatus, ResourceName } from "./gitopsShared";

const REPOS = [
  {
    name: "argocd-example-apps",
    url: "https://github.com/argoproj/argocd-example-apps.git",
    type: "git",
    status: "Healthy" as const,
  },
  {
    name: "payments-api",
    url: "https://gitlab.example.com/payments/payments-api.git",
    type: "git",
    status: "Degraded" as const,
  },
  {
    name: "helm-charts",
    url: "https://charts.example.com",
    type: "helm",
    status: "Healthy" as const,
  },
];

const CLUSTERS = [
  {
    name: "in-cluster",
    server: "https://kubernetes.default.svc",
    status: "Healthy" as const,
    apps: "12",
  },
  {
    name: "spoke-east",
    server: "https://api.spoke-east.example.com",
    status: "Healthy" as const,
    apps: "7",
  },
  {
    name: "edge-lab",
    server: "https://api.edge-lab.example.com",
    status: "Degraded" as const,
    apps: "2",
  },
];

export default function GitOpsSettingsPage() {
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState("repositories");

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/rollouts" },
          { label: "Settings", path: "/gitops/settings" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                Settings
              </Title>
              <FavoriteButton name="GitOps Settings" path="/gitops/settings" />
            </Flex>
            <Button
              variant="primary"
              onClick={() =>
                pushToast({
                  variant: "info",
                  title:
                    activeTab === "repositories"
                      ? "Add repository (prototype stub)"
                      : "Add cluster (prototype stub)",
                })
              }
            >
              {activeTab === "repositories" ? "Add repository" : "Add cluster"}
            </Button>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="GitOps settings"
          >
            <Tab eventKey="repositories" title={<TabTitleText>Repositories</TabTitleText>} />
            <Tab eventKey="clusters" title={<TabTitleText>Clusters</TabTitleText>} />
          </Tabs>

          {activeTab === "repositories" ? (
            <OcsNamedResourceDataView
              ouiaId="gitops-settings-repos"
              ariaLabel="Repositories"
              itemsLabel="repositories"
              items={REPOS}
              getName={(item) => item.name}
            >
              {(rows) => (
                <>
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <PlainTableHeader label="Name" />
                      </Th>
                      <Th dataLabel="URL">
                        <PlainTableHeader label="URL" />
                      </Th>
                      <Th dataLabel="Type">
                        <PlainTableHeader label="Type" />
                      </Th>
                      <Th dataLabel="Status">
                        <PlainTableHeader label="Status" />
                      </Th>
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((item) => (
                      <Tr key={item.name}>
                        <Td dataLabel="Name">
                          <ResourceName kind="Application" name={item.name} />
                        </Td>
                        <Td dataLabel="URL">{item.url}</Td>
                        <Td dataLabel="Type">{item.type}</Td>
                        <Td dataLabel="Status">
                          <HealthStatus status={item.status} />
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <GitOpsEditDeleteMenu kind="Repository" name={item.name} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          ) : (
            <OcsNamedResourceDataView
              ouiaId="gitops-settings-clusters"
              ariaLabel="Clusters"
              itemsLabel="clusters"
              items={CLUSTERS}
              getName={(item) => item.name}
            >
              {(rows) => (
                <>
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <PlainTableHeader label="Name" />
                      </Th>
                      <Th dataLabel="Server">
                        <PlainTableHeader label="Server" />
                      </Th>
                      <Th dataLabel="Status">
                        <PlainTableHeader label="Status" />
                      </Th>
                      <Th dataLabel="Applications">
                        <PlainTableHeader label="Applications" />
                      </Th>
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((item) => (
                      <Tr key={item.name}>
                        <Td dataLabel="Name">{item.name}</Td>
                        <Td dataLabel="Server">{item.server}</Td>
                        <Td dataLabel="Status">
                          <HealthStatus status={item.status} />
                        </Td>
                        <Td dataLabel="Applications">{item.apps}</Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <GitOpsEditDeleteMenu kind="Cluster" name={item.name} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          )}

          <Content component="small" className="pf-v6-u-color-200">
            Settings (P4) — Add actions are toast stubs only.
          </Content>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
