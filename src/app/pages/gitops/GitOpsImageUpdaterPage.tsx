import { useState } from "react";
import { useParams } from "react-router";
import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Tab,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import { findImageUpdater, GITOPS_IMAGE_UPDATERS, gitopsDetailPath } from "./gitopsData";
import { GitOpsEditDeleteMenu, HealthStatus, ResourceName } from "./gitopsShared";

const MOCK_HISTORY = [
  { when: "2h ago", image: "quay.io/demo/payments-api:1.4.3", result: "Updated" },
  { when: "1d ago", image: "quay.io/demo/payments-api:1.4.2", result: "Updated" },
  { when: "3d ago", image: "quay.io/demo/payments-api:1.4.1", result: "Skipped (pin)" },
];

export default function GitOpsImageUpdaterPage() {
  return (
    <GitOpsSimpleListPage
      title="Image Updater"
      path="/gitops/imageupdaters"
      createLabel="Create ImageUpdater"
      kind="ImageUpdater"
      detailKind="imageupdaters"
      items={GITOPS_IMAGE_UPDATERS}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "images", label: "Images" },
        { key: "strategy", label: "Strategy" },
        { key: "status", label: "Status" },
        { key: "lastUpdate", label: "Last update" },
        { key: "age", label: "Age" },
      ]}
      renderCell={(item, key) => {
        if (key === "images") return item.images;
        if (key === "strategy") return item.strategy;
        if (key === "status") return <HealthStatus status={item.status} />;
        if (key === "lastUpdate") return item.lastUpdate;
        if (key === "age") return item.age;
        return null;
      }}
    />
  );
}

export function GitOpsImageUpdaterDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findImageUpdater(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/imageupdaters" listTitle="Image Updater" />;
  return <ImageUpdaterDetailBody rec={rec} />;
}

function ImageUpdaterDetailBody({
  rec,
}: {
  rec: NonNullable<ReturnType<typeof findImageUpdater>>;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const href = gitopsDetailPath("imageupdaters", rec.ns, rec.name);
  const historyRows =
    rec.name === "frontend-canary-updater"
      ? [
          { when: "1d ago", image: "argoproj/rollouts-demo:yellow", result: "Failed (registry)" },
          { when: "2d ago", image: "argoproj/rollouts-demo:blue", result: "Updated" },
        ]
      : MOCK_HISTORY;

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/rollouts" },
          { label: "Image Updater", path: "/gitops/imageupdaters" },
          { label: rec.name },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex
              alignItems={{ default: "alignItemsCenter" }}
              gap={{ default: "gapMd" }}
              flexWrap={{ default: "wrap" }}
            >
              <ResourceName kind="ImageUpdater" name={rec.name} />
              <HealthStatus status={rec.status} />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={rec.name} path={href} />
              <GitOpsEditDeleteMenu kind="ImageUpdater" name={rec.name} variant="secondary" />
            </Flex>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Image Updater details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="history" title={<TabTitleText>History</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>{rec.name}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>{rec.ns}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Images</DescriptionListTerm>
                <DescriptionListDescription>{rec.images}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Strategy</DescriptionListTerm>
                <DescriptionListDescription>{rec.strategy}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <HealthStatus status={rec.status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Last update</DescriptionListTerm>
                <DescriptionListDescription>{rec.lastUpdate}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Age</DescriptionListTerm>
                <DescriptionListDescription>{rec.age}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "events" || activeTab === "yaml" ? (
            <Content component="p" className="pf-v6-u-color-200">
              {activeTab} view is a prototype stub.
            </Content>
          ) : null}

          {activeTab === "history" ? (
            <OcsPrototypeListTable ariaLabel="Image update history">
              <Thead>
                <Tr>
                  <Th dataLabel="When">
                    <PlainTableHeader label="When" />
                  </Th>
                  <Th dataLabel="Image">
                    <PlainTableHeader label="Image" />
                  </Th>
                  <Th dataLabel="Result">
                    <PlainTableHeader label="Result" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {historyRows.map((row) => (
                  <Tr key={`${row.when}-${row.image}`}>
                    <Td dataLabel="When">{row.when}</Td>
                    <Td dataLabel="Image">{row.image}</Td>
                    <Td dataLabel="Result">{row.result}</Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
