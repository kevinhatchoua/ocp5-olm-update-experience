import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Label,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { NETWORKING_CRUMB } from "./networkingShared";

export type NetworkDetailTab = { eventKey: string; title: string; content: ReactNode };

type NetworkResourceDetailShellProps = {
  kindAbbr: string;
  kindLabel: string;
  listTitle: string;
  listPath: string;
  detailCrumbLabel: string;
  name: string;
  detailPath: string;
  tabs: NetworkDetailTab[];
  initialTab?: string;
  headerExtra?: ReactNode;
};

export default function NetworkResourceDetailShell({
  kindAbbr,
  kindLabel,
  listTitle,
  listPath,
  detailCrumbLabel,
  name,
  detailPath,
  tabs,
  initialTab = "details",
  headerExtra,
}: NetworkResourceDetailShellProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [actionsOpen, setActionsOpen] = useState(false);
  const active = tabs.find((tab) => tab.eventKey === activeTab) ?? tabs[0];

  return (
    <div className="ocs-app-page-outer ocs-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          NETWORKING_CRUMB,
          { label: listTitle, path: listPath },
          { label: detailCrumbLabel },
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
              <Label color="blue" isCompact className="ocs-resource-label">
                {kindAbbr}
              </Label>
              <Title headingLevel="h1" size="2xl">
                {name}
              </Title>
              <FavoriteButton name={name} path={detailPath} />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              {headerExtra}
              <Dropdown
                isOpen={actionsOpen}
                onOpenChange={setActionsOpen}
                onSelect={() => setActionsOpen(false)}
                popperProps={{ position: "right" }}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((open) => !open)} variant="secondary">
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem itemId="edit-yaml">Edit YAML</DropdownItem>
                  <DropdownItem itemId="delete" isDanger>
                    Delete {kindLabel}
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </Flex>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label={`${kindLabel} details`}
          >
            {tabs.map((tab) => (
              <Tab key={tab.eventKey} eventKey={tab.eventKey} title={<TabTitleText>{tab.title}</TabTitleText>} />
            ))}
          </Tabs>

          {active?.content}

          <Button variant="link" component={Link} to={listPath} className="pf-v6-u-pl-0">
            Back to {listTitle}
          </Button>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

export function DetailMetadataSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ocs-node-details__panel" aria-label={title}>
      <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
        {title}
      </Title>
      {children}
    </section>
  );
}
