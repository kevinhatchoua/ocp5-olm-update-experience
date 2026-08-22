import { type ReactNode, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { gitopsDetailPath } from "./gitopsData";
import { GitOpsEditDeleteMenu, HealthStatus, ResourceName } from "./gitopsShared";

type Field = { term: string; value: ReactNode };

export default function GitOpsSimpleDetailPage({
  kindLabel,
  listPath,
  listTitle,
  resourceKind,
  detailKind,
  title,
  ns,
  status,
  fields,
  footnote,
}: {
  kindLabel: string;
  listPath: string;
  listTitle: string;
  resourceKind: "Application" | "ApplicationSet" | "ArgoCD";
  detailKind: "applications" | "applicationsets" | "argocd";
  title: string;
  ns: string;
  status?: string;
  fields: Field[];
  footnote?: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const href = gitopsDetailPath(detailKind, ns, title);
  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/rollouts" },
          { label: listTitle, path: listPath },
          { label: title },
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
              <ResourceName kind={resourceKind} name={title} />
              {status ? <HealthStatus status={status} /> : null}
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={title} path={href} />
              <GitOpsEditDeleteMenu kind={kindLabel} name={title} variant="secondary" />
            </Flex>
          </Flex>
          <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(String(key))} aria-label={`${kindLabel} details`}>
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
          </Tabs>
          {activeTab === "details" ? (
            <DescriptionList isHorizontal isCompact>
              {fields.map((f) => (
                <DescriptionListGroup key={f.term}>
                  <DescriptionListTerm>{f.term}</DescriptionListTerm>
                  <DescriptionListDescription>{f.value}</DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          ) : (
            <Content component="p" className="pf-v6-u-color-200">
              {activeTab} view is a prototype stub.
            </Content>
          )}
          {footnote ? (
            <Content component="small" className="pf-v6-u-color-200">
              {footnote}
            </Content>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

export function GitOpsNotFound({ listPath, listTitle }: { listPath: string; listTitle: string }) {
  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/rollouts" },
          { label: listTitle, path: listPath },
          { label: "Not found" },
        ]}
      >
        <Title headingLevel="h1">Not found</Title>
        <Button variant="link" component={Link} to={listPath} className="pf-v6-u-mt-md">
          Back to {listTitle}
        </Button>
      </Breadcrumbs>
    </div>
  );
}
