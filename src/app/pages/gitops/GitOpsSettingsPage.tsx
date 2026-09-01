import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Content, Flex, Label, Tab, Tabs, TabTitleText, Title } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OcsNamedResourceDataView,
  OcsPrototypeListTable,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { useToast } from "../../contexts/ToastContext";
import {
  GITOPS_IMAGE_UPDATERS,
  GITOPS_NOTIFICATION_HISTORY,
  GITOPS_SETTINGS_ANALYSIS_TEMPLATES,
  GITOPS_SETTINGS_CLUSTERS,
  GITOPS_SETTINGS_NAMESPACES,
  GITOPS_SETTINGS_NOTIFICATIONS,
  GITOPS_SETTINGS_REPOS,
  GITOPS_SETTINGS_ROLLOUT_MANAGERS,
  gitopsDetailPath,
} from "./gitopsData";
import { GitOpsEditDeleteMenu, GitOpsLink, HealthStatus, ResourceName } from "./gitopsShared";

const TABS = [
  { key: "repositories", label: "Repositories" },
  { key: "clusters", label: "Clusters" },
  { key: "notifications", label: "Notifications" },
  { key: "rollout-managers", label: "Rollout Managers" },
  { key: "image-updaters", label: "Image Updaters" },
  { key: "namespace-mgmt", label: "Namespace Mgmt" },
  { key: "analysis-templates", label: "AnalysisTemplates" },
  { key: "notification-history", label: "Notification History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ADD_LABEL: Record<TabKey, string> = {
  repositories: "Connect repository",
  clusters: "Add cluster",
  notifications: "Add notification",
  "rollout-managers": "Create Rollout Manager",
  "image-updaters": "Create ImageUpdater",
  "namespace-mgmt": "Manage namespaces",
  "analysis-templates": "Create AnalysisTemplate",
  "notification-history": "Refresh",
};

export default function GitOpsSettingsPage() {
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const activeTab: TabKey = TABS.some((t) => t.key === requested) ? (requested as TabKey) : "repositories";

  const setTab = (key: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    setParams(next, { replace: true });
  };

  const onAdd = () => {
    if (activeTab === "image-updaters") {
      navigate("/gitops/create?kind=imageupdater");
      return;
    }
    if (activeTab === "rollout-managers") {
      navigate("/gitops/create?kind=rollout");
      return;
    }
    if (activeTab === "namespace-mgmt") {
      navigate("/administration/namespaces");
      return;
    }
    pushToast({
      variant: "success",
      title: `${ADD_LABEL[activeTab]} (prototype)`,
    });
  };

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
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
                GitOps Settings
              </Title>
              <FavoriteButton name="GitOps Settings" path="/gitops/settings" />
            </Flex>
            <Button variant="primary" onClick={onAdd}>
              {ADD_LABEL[activeTab]}
            </Button>
          </Flex>

          <Tabs activeKey={activeTab} onSelect={(_e, key) => setTab(String(key))} aria-label="GitOps settings">
            {TABS.map((tab) => (
              <Tab key={tab.key} eventKey={tab.key} title={<TabTitleText>{tab.label}</TabTitleText>} />
            ))}
          </Tabs>

          {activeTab === "repositories" ? (
            <OcsNamedResourceDataView
              ouiaId="gitops-settings-repos"
              ariaLabel="Repositories"
              itemsLabel="repositories"
              items={GITOPS_SETTINGS_REPOS}
              getName={(item) => item.name}
            >
              {(rows) => (
                <>
                  <Thead>
                    <Tr>
                      <Th dataLabel="URL">
                        <PlainTableHeader label="URL" />
                      </Th>
                      <Th dataLabel="Type">
                        <PlainTableHeader label="Type" />
                      </Th>
                      <Th dataLabel="Name">
                        <PlainTableHeader label="Name" />
                      </Th>
                      <Th dataLabel="Applications">
                        <PlainTableHeader label="Applications" />
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
                      <Tr key={item.url}>
                        <Td dataLabel="URL">
                          <Button variant="link" isInline component="a" href={item.url} target="_blank" rel="noreferrer">
                            {item.url}
                          </Button>
                        </Td>
                        <Td dataLabel="Type">
                          <Label color="grey" isCompact>
                            {item.type}
                          </Label>
                        </Td>
                        <Td dataLabel="Name">{item.name === "" ? "—" : item.name}</Td>
                        <Td dataLabel="Applications">
                          <GitOpsLink to="/gitops/applications">{item.applications}</GitOpsLink>
                        </Td>
                        <Td dataLabel="Status">
                          <Label color="grey" isCompact>
                            {item.status}
                          </Label>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <GitOpsEditDeleteMenu
                            kind="Repository"
                            name={item.name}
                            extraItems={[{ id: "refresh", label: "Refresh" }]}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          ) : null}

          {activeTab === "clusters" ? (
            <OcsNamedResourceDataView
              ouiaId="gitops-settings-clusters"
              ariaLabel="Clusters"
              itemsLabel="clusters"
              items={GITOPS_SETTINGS_CLUSTERS}
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
                        <Td dataLabel="Applications">
                          <GitOpsLink to="/gitops/applications">{item.apps}</GitOpsLink>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <GitOpsEditDeleteMenu kind="Cluster" name={item.name} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          ) : null}

          {activeTab === "notifications" ? (
            <OcsPrototypeListTable ariaLabel="Notification services">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Type">
                    <PlainTableHeader label="Type" />
                  </Th>
                  <Th dataLabel="Trigger">
                    <PlainTableHeader label="Trigger" />
                  </Th>
                  <Th dataLabel="Destination">
                    <PlainTableHeader label="Destination" />
                  </Th>
                  <Th modifier="fitContent" dataLabel="Actions">
                    <PlainTableHeader label="Actions" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {GITOPS_SETTINGS_NOTIFICATIONS.map((item) => (
                  <Tr key={item.name}>
                    <Td dataLabel="Name">{item.name}</Td>
                    <Td dataLabel="Type">{item.type}</Td>
                    <Td dataLabel="Trigger">{item.trigger}</Td>
                    <Td dataLabel="Destination">{item.destination}</Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <GitOpsEditDeleteMenu
                        kind="Notification"
                        name={item.name}
                        extraItems={[{ id: "test", label: "Send test" }]}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          {activeTab === "rollout-managers" ? (
            <OcsPrototypeListTable ariaLabel="Rollout managers">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Namespace">
                    <PlainTableHeader label="Namespace" />
                  </Th>
                  <Th dataLabel="Status">
                    <PlainTableHeader label="Status" />
                  </Th>
                  <Th dataLabel="Rollouts">
                    <PlainTableHeader label="Rollouts" />
                  </Th>
                  <Th modifier="fitContent" dataLabel="Actions">
                    <PlainTableHeader label="Actions" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {GITOPS_SETTINGS_ROLLOUT_MANAGERS.map((item) => (
                  <Tr key={`${item.ns}/${item.name}`}>
                    <Td dataLabel="Name">
                      <GitOpsLink to="/gitops/rollouts">{item.name}</GitOpsLink>
                    </Td>
                    <Td dataLabel="Namespace">
                      <ResourceName kind="Namespace" name={item.ns} />
                    </Td>
                    <Td dataLabel="Status">
                      <HealthStatus status={item.status} />
                    </Td>
                    <Td dataLabel="Rollouts">{item.rollouts}</Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <GitOpsEditDeleteMenu kind="RolloutManager" name={item.name} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          {activeTab === "image-updaters" ? (
            <OcsPrototypeListTable ariaLabel="Image updaters">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Namespace">
                    <PlainTableHeader label="Namespace" />
                  </Th>
                  <Th dataLabel="Images">
                    <PlainTableHeader label="Images" />
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
                {GITOPS_IMAGE_UPDATERS.map((item) => {
                  const href = gitopsDetailPath("imageupdaters", item.ns, item.name);
                  return (
                    <Tr key={`${item.ns}/${item.name}`} onClick={() => navigate(href)}>
                      <Td dataLabel="Name">
                        <ResourceName kind="ImageUpdater" name={item.name} to={href} />
                      </Td>
                      <Td dataLabel="Namespace">
                        <ResourceName kind="Namespace" name={item.ns} />
                      </Td>
                      <Td dataLabel="Images">{item.images}</Td>
                      <Td dataLabel="Status">
                        <HealthStatus status={item.status} />
                      </Td>
                      <Td dataLabel="Actions" isActionCell hasAction>
                        <GitOpsEditDeleteMenu kind="ImageUpdater" name={item.name} />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          {activeTab === "namespace-mgmt" ? (
            <OcsPrototypeListTable ariaLabel="Managed namespaces">
              <Thead>
                <Tr>
                  <Th dataLabel="Namespace">
                    <PlainTableHeader label="Namespace" />
                  </Th>
                  <Th dataLabel="Applications">
                    <PlainTableHeader label="Applications" />
                  </Th>
                  <Th dataLabel="GitOps managed">
                    <PlainTableHeader label="GitOps managed" />
                  </Th>
                  <Th modifier="fitContent" dataLabel="Actions">
                    <PlainTableHeader label="Actions" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {GITOPS_SETTINGS_NAMESPACES.map((item) => (
                  <Tr key={item.name}>
                    <Td dataLabel="Namespace">
                      <GitOpsLink to={`/administration/namespaces/${encodeURIComponent(item.name)}`}>
                        {item.name}
                      </GitOpsLink>
                    </Td>
                    <Td dataLabel="Applications">
                      <GitOpsLink to="/gitops/applications">{item.apps}</GitOpsLink>
                    </Td>
                    <Td dataLabel="GitOps managed">
                      <Label color={item.managed ? "green" : "grey"} isCompact>
                        {item.managed ? "Managed" : "Unmanaged"}
                      </Label>
                    </Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <GitOpsEditDeleteMenu kind="Namespace" name={item.name} extraItems={[{ id: "protect", label: "Protect edits" }]} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          {activeTab === "analysis-templates" ? (
            <OcsPrototypeListTable ariaLabel="Analysis templates">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Namespace">
                    <PlainTableHeader label="Namespace" />
                  </Th>
                  <Th dataLabel="Provider">
                    <PlainTableHeader label="Provider" />
                  </Th>
                  <Th dataLabel="Age">
                    <PlainTableHeader label="Age" />
                  </Th>
                  <Th modifier="fitContent" dataLabel="Actions">
                    <PlainTableHeader label="Actions" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {GITOPS_SETTINGS_ANALYSIS_TEMPLATES.map((item) => (
                  <Tr key={`${item.ns}/${item.name}`}>
                    <Td dataLabel="Name">{item.name}</Td>
                    <Td dataLabel="Namespace">
                      <ResourceName kind="Namespace" name={item.ns} />
                    </Td>
                    <Td dataLabel="Provider">{item.provider}</Td>
                    <Td dataLabel="Age">{item.age}</Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <GitOpsEditDeleteMenu kind="AnalysisTemplate" name={item.name} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          {activeTab === "notification-history" ? (
            <OcsPrototypeListTable ariaLabel="Notification history">
              <Thead>
                <Tr>
                  <Th dataLabel="When">
                    <PlainTableHeader label="When" />
                  </Th>
                  <Th dataLabel="Channel">
                    <PlainTableHeader label="Channel" />
                  </Th>
                  <Th dataLabel="Event">
                    <PlainTableHeader label="Event" />
                  </Th>
                  <Th dataLabel="Resource">
                    <PlainTableHeader label="Resource" />
                  </Th>
                  <Th dataLabel="Result">
                    <PlainTableHeader label="Result" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {GITOPS_NOTIFICATION_HISTORY.map((item) => (
                  <Tr key={`${item.when}-${item.resource}`}>
                    <Td dataLabel="When">{item.when}</Td>
                    <Td dataLabel="Channel">{item.channel}</Td>
                    <Td dataLabel="Event">{item.event}</Td>
                    <Td dataLabel="Resource">
                      <GitOpsLink to="/gitops/applications">{item.resource}</GitOpsLink>
                    </Td>
                    <Td dataLabel="Result">
                      <Label color="green" isCompact>
                        {item.result}
                      </Label>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          <Content component="small" className="pf-v6-u-color-200">
            Settings tabs are interactive prototype surfaces for HPUX-2073 / GITOPS-10917.
          </Content>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
