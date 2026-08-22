import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import {
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Grid,
  GridItem,
  Icon,
  Label,
  MenuToggle,
  PageSection,
  Popover,
  Progress,
  SimpleList,
  SimpleListItem,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  TitleSizes,
} from "@patternfly/react-core";
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleUpIcon from "@patternfly/react-icons/dist/esm/icons/angle-up-icon";
import ArrowRightIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClipboardCheckIcon from "@patternfly/react-icons/dist/esm/icons/clipboard-check-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import FlagIcon from "@patternfly/react-icons/dist/esm/icons/flag-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import OutlinedQuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon";
import RouteIcon from "@patternfly/react-icons/dist/esm/icons/route-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import FavoriteButton from "../components/FavoriteButton";

const recentEvents = [
  {
    time: "12:52 PM",
    text: "Received signal to terminate, beginning graceful termination",
    badge: "P",
    color: "teal" as const,
    id: 1,
  },
  {
    time: "12:40 PM",
    text: "Received signal to terminate, beginning graceful termination",
    badge: "P",
    color: "teal" as const,
    id: 2,
  },
  {
    time: "12:14 PM",
    text: "Received signal to terminate, beginning graceful termination",
    badge: "P",
    color: "teal" as const,
    id: 3,
  },
  {
    time: "11:53 AM",
    text: "Received signal to terminate, beginning graceful termination",
    badge: "P",
    color: "teal" as const,
    id: 4,
  },
];

type StatusTone = "success" | "warning" | "danger" | "info";

const statusRows: { label: string; status: StatusTone; path: string | null }[] = [
  { label: "Cluster", status: "success", path: "/administration/cluster-settings" },
  { label: "Control Plane", status: "success", path: null },
  { label: "Operators", status: "danger", path: "/ecosystem/installed-operators" },
  { label: "Dynamic Plugins", status: "success", path: "/administration/dynamic-plugins" },
  { label: "Insights", status: "success", path: null },
  { label: "OpenShift Virtualization", status: "warning", path: "/virtualization" },
];

const statusAlerts: {
  title: string;
  variant: "info" | "warning" | "danger";
  path: string;
}[] = [
  { title: "A cluster version update is available", variant: "info", path: "/administration/cluster-update" },
  { title: "LowKVMNodesCount", variant: "warning", path: "/alerts" },
  { title: "PodDisruptionBudgetLimit", variant: "danger", path: "/alerts" },
  { title: "CDIDefaultStorageClassDegraded", variant: "warning", path: "/alerts" },
];

function StatusIcon({ status }: { status: StatusTone }) {
  if (status === "success") {
    return (
      <Icon status="success" size="sm">
        <CheckCircleIcon />
      </Icon>
    );
  }
  if (status === "warning") {
    return (
      <Icon status="warning" size="sm">
        <ExclamationTriangleIcon />
      </Icon>
    );
  }
  if (status === "danger") {
    return (
      <Icon status="danger" size="sm">
        <ExclamationCircleIcon />
      </Icon>
    );
  }
  return (
    <Icon status="info" size="sm">
      <InfoCircleIcon />
    </Icon>
  );
}

function UtilizationToolbarDropdown({ label, menuId }: { label: string; menuId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={() => setIsOpen(false)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          id={menuId}
          variant="secondary"
          onClick={() => setIsOpen((o) => !o)}
          isExpanded={isOpen}
          icon={isOpen ? <AngleUpIcon /> : <AngleDownIcon />}
        >
          {label}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem itemId="1" onClick={() => setIsOpen(false)}>
          Option 1
        </DropdownItem>
        <DropdownItem itemId="2" onClick={() => setIsOpen(false)}>
          Option 2
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

const utilizationRows: { name: string; detail: string; value: number }[] = [
  { name: "CPU", detail: "21.76 cores / 24 cores", value: Math.round((21.76 / 24) * 100) },
  { name: "Memory", detail: "29.79 GiB / 32.12 GiB", value: Math.round((29.79 / 32.12) * 100) },
  { name: "Filesystem", detail: "186.6 GiB / 718.7 GiB", value: Math.round((186.6 / 718.7) * 100) },
  { name: "Network transfer", detail: "5.10 MBps in / 5.16 MBps out", value: 45 },
];

type GettingStartedLink = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  external?: boolean;
};

type GettingStartedSectionCardProps = {
  id: string;
  icon: ReactNode;
  title: string;
  titleColor: string;
  description?: string;
  links: GettingStartedLink[];
  moreLink?: GettingStartedLink;
};

function GettingStartedSectionCard({
  id,
  icon,
  title,
  titleColor,
  description,
  links,
  moreLink,
}: GettingStartedSectionCardProps) {
  return (
    <Flex
      direction={{ default: "column" }}
      grow={{ default: "grow" }}
      className="ocs-getting-started-card"
      data-test={`card ${id}`}
    >
      <Title headingLevel="h3" size={TitleSizes.md} style={{ color: titleColor }} data-test="title">
        <span className="ocs-getting-started-card__title-icon">{icon}</span>
        {title}
      </Title>

      {description ? (
        <Content component={ContentVariants.small} data-test="description">
          {description}
        </Content>
      ) : null}

      <Flex direction={{ default: "column" }} grow={{ default: "grow" }}>
        <SimpleList isControlled={false} className="ocs-getting-started-card__list">
          {links.map((link) => (
            <SimpleListItem
              key={link.id}
              component={link.href ? (link.external ? "a" : Link) : "button"}
              componentProps={
                link.external
                  ? {
                      href: link.href,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      "data-test": `item ${link.id}`,
                    }
                  : link.href
                    ? {
                        to: link.href.startsWith("/settings")
                          ? "/administration/cluster-settings"
                          : link.href,
                        "data-test": `item ${link.id}`,
                      }
                    : {
                        "data-test": `item ${link.id}`,
                      }
              }
            >
              <>
                <Content component="p">
                  {link.title}
                  <Icon size="bodySm" className="pf-v6-u-ml-xs">
                    {link.external ? <ExternalLinkAltIcon /> : <ArrowRightIcon />}
                  </Icon>
                </Content>
                {link.description ? (
                  <Content component={ContentVariants.small}>{link.description}</Content>
                ) : null}
              </>
            </SimpleListItem>
          ))}
        </SimpleList>
      </Flex>

      {moreLink ? (
        <FlexItem>
          {moreLink.external ? (
            <Button
              variant="link"
              isInline
              component="a"
              href={moreLink.href}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLinkAltIcon />}
              iconPosition="end"
              className="ocs-getting-started-card__more-link"
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </Button>
          ) : moreLink.href ? (
            <Button
              variant="link"
              isInline
              component={Link}
              to={moreLink.href}
              className="ocs-getting-started-card__more-link"
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </Button>
          ) : (
            <Button
              variant="link"
              isInline
              className="ocs-getting-started-card__more-link"
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </Button>
          )}
        </FlexItem>
      ) : null}
    </Flex>
  );
}

function GettingStartedCard() {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Card
      id="getting-started-resources-card"
      className="ocs-getting-started-expandable-grid"
      variant="secondary"
      data-test="getting-started"
      isExpanded={expanded}
    >
        <CardHeader
          onExpand={() => setExpanded((v) => !v)}
          actions={{
            actions: (
              <Button
                variant="plain"
                aria-label="Close"
                icon={<TimesIcon />}
                onClick={() => setDismissed(true)}
              />
            ),
          }}
          toggleButtonProps={{
            id: "toggle-button1",
            "aria-label": "Expandable details",
            "aria-labelledby": "expandable-card-title toggle-button1",
            "aria-expanded": expanded,
          }}
        >
          <CardTitle data-test="title" id="expandable-card-title">
            Getting started resources{" "}
            <Popover
              bodyContent="Use our collection of resources to help you get started with the Console."
              triggerAction="hover"
            >
              <span role="button" aria-label="More info">
                <OutlinedQuestionCircleIcon />
              </span>
            </Popover>
          </CardTitle>
        </CardHeader>
        <CardExpandableContent>
          <CardBody
            data-test="getting-started-content"
            className="ocs-getting-started-expandable-grid__content"
          >
            <GettingStartedSectionCard
              id="cluster-setup"
              icon={
                <ClipboardCheckIcon
                  color="var(--co-global--palette--blue-400)"
                  aria-hidden="true"
                />
              }
              title="Set up your cluster"
              titleColor="var(--co-global--palette--blue-400)"
              description="Finish setting up your cluster with recommended configurations."
              links={[
                { id: "console-tour", title: "Take console tour" },
                {
                  id: "alert-receivers",
                  title: "Configure alert receivers",
                  href: "/settings/cluster/alertmanagerconfig",
                },
              ]}
              moreLink={{
                id: "machine-configuration",
                title: "View all steps in documentation",
                href: "https://access.redhat.com/documentation/en-us/openshift_container_platform/4.21/html/postinstallation_configuration/index",
                external: true,
              }}
            />
            <GettingStartedSectionCard
              id="quick-start"
              icon={
                <RouteIcon color="var(--co-global--palette--purple-600)" aria-hidden="true" />
              }
              title="Build with guided documentation"
              titleColor="var(--co-global--palette--purple-600)"
              description="Follow guided documentation to build applications and familiarize yourself with key features."
              links={[
                { id: "enable-developer-perspective", title: "Enable the Developer Perspective" },
                { id: "user-impersonation", title: "Impersonating the system:admin user" },
              ]}
              moreLink={{
                id: "all-quick-starts",
                title: "View all quick starts",
                href: "/quickstart",
              }}
            />
            <GettingStartedSectionCard
              id="admin-features"
              icon={
                <FlagIcon color="var(--co-global--palette--orange-400)" aria-hidden="true" />
              }
              title="Explore new features and capabilities"
              titleColor="var(--co-global--palette--orange-400)"
              links={[
                {
                  id: "openshift-ai",
                  title: "OpenShift AI",
                  description: "Build, deploy, and manage AI-enabled applications.",
                  href: "/catalog?catalogType=operator&keyword=openshift+ai",
                },
                {
                  id: "trusted-software-supply-chain",
                  title: "Trusted Software Supply Chain",
                  description: "Assess risk, validate integrity, secure artifacts, release safely.",
                  href: "/quickstart?keyword=trusted",
                },
                {
                  id: "lightspeed",
                  title: "OpenShift Lightspeed",
                  description: "Your personal AI helper.",
                  href: "/catalog?catalogType=operator&keyword=lightspeed",
                },
              ]}
              moreLink={{
                id: "whats-new",
                title: "See what's new in OpenShift 5.0",
                href: "https://www.openshift.com/learn/whats-new",
                external: true,
              }}
            />
          </CardBody>
        </CardExpandableContent>
      </Card>
  );
}

function DetailsCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isFullHeight isGlass={isGlass}>
      <CardHeader
        actions={{
          actions: (
            <Button variant="link" component={Link} to="/administration/cluster-settings" isInline>
              View settings
            </Button>
          ),
        }}
      >
        <CardTitle component="h2">Details</CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster API address</DescriptionListTerm>
            <DescriptionListDescription>
              <Content component="small">
                <code>https://api.rhamilto.devcluster.openshift.com:6443</code>
              </Content>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster ID</DescriptionListTerm>
            <DescriptionListDescription>
              <Button
                variant="link"
                isInline
                component="a"
                href="https://console.redhat.com/openshift"
                target="_blank"
                rel="noopener noreferrer"
              >
                <code>03242ee9-8986-4f0f-acc0-65aad26ba6a5</code>
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Infrastructure provider</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color="orange">AWS</Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>OpenShift version</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex flexWrap={{ default: "wrap" }} gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                <Content component="small">
                  <code>5.0.0-ec.6</code>
                </Content>
                <Button variant="link" isInline component={Link} to="/administration/cluster-update">
                  Update cluster
                </Button>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Service Level Agreement (SLA)</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <Icon status="warning" size="sm">
                    <ExclamationTriangleIcon />
                  </Icon>
                  <Content component="p">Self-support, 60 day trial</Content>
                </Flex>
                <Button
                  variant="link"
                  isInline
                  component="a"
                  href="https://console.redhat.com/openshift/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage subscription settings
                </Button>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Update channel</DescriptionListTerm>
            <DescriptionListDescription>
              <Content component="small">
                <code>simple</code>
              </Content>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>OpenShift Lightspeed version</DescriptionListTerm>
            <DescriptionListDescription>
              <Content component="small">
                <code>1.1.3</code>
              </Content>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
}

function ActivityCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isFullHeight isGlass={isGlass}>
      <CardHeader>
        <CardTitle component="h2">Activity</CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <div>
            <Title headingLevel="h3" size="md" className="pf-v6-u-mb-sm">
              Ongoing
            </Title>
            <Content component="p">There are no ongoing activities.</Content>
          </div>
          <Divider />
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
            <Title headingLevel="h3" size="md">
              Recent events
            </Title>
            <Button variant="link" isInline>
              Pause
            </Button>
          </Flex>
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            {recentEvents.map((event, index) => (
              <div key={event.id}>
                {index > 0 ? <Divider className="pf-v6-u-mb-md" /> : null}
                <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsFlexStart" }}>
                  <Label color={event.color} isCompact>
                    {event.badge}
                  </Label>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} flex={{ default: "flex_1" }}>
                    <Content component="small">
                      <code>{event.time}</code>
                    </Content>
                    <Button variant="link" isInline component={Link} to={`/activity/${event.id}`}>
                      {event.text}
                    </Button>
                  </Flex>
                  <Button variant="plain" aria-label={`Expand event ${event.id}`} icon={<AngleDownIcon />} />
                </Flex>
              </div>
            ))}
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

function StatusCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isGlass={isGlass}>
      <CardHeader
        actions={{
          actions: (
            <Button variant="link" component={Link} to="/alerts" isInline>
              View alerts
            </Button>
          ),
        }}
      >
        <CardTitle component="h2">Status</CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Gallery hasGutter minWidths={{ default: "140px" }} maxWidths={{ default: "1fr" }}>
            {statusRows.map((row) => (
              <GalleryItem key={row.label}>
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <StatusIcon status={row.status} />
                  {row.path ? (
                    <Button variant="link" isInline component={Link} to={row.path}>
                      {row.label}
                    </Button>
                  ) : (
                    <Content component="p">{row.label}</Content>
                  )}
                </Flex>
              </GalleryItem>
            ))}
          </Gallery>

          <Divider />

          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            {statusAlerts.map((alert) => (
              <Flex
                key={alert.title}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
                alignItems={{ default: "alignItemsCenter" }}
                gap={{ default: "gapMd" }}
                flexWrap={{ default: "wrap" }}
              >
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <StatusIcon
                    status={
                      alert.variant === "info" ? "info" : alert.variant === "danger" ? "danger" : "warning"
                    }
                  />
                  <Content component="p">{alert.title}</Content>
                </Flex>
                <Button variant="link" isInline component={Link} to={alert.path}>
                  View details
                </Button>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

function ClusterUtilizationCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isGlass={isGlass}>
      <CardHeader
        actions={{
          actions: (
            <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
              <UtilizationToolbarDropdown label="Filter by Node type" menuId="overview-node-type" />
              <UtilizationToolbarDropdown label="1 hour" menuId="overview-time-range" />
            </Flex>
          ),
        }}
      >
        <CardTitle component="h2">Cluster utilization</CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} flexWrap={{ default: "wrap" }} gap={{ default: "gapMd" }}>
            <Content component="p">
              <strong>Resource</strong>
            </Content>
            <Content component="p">
              <strong>Usage</strong>
            </Content>
          </Flex>
          <Divider />
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            {utilizationRows.map((row) => (
              <div key={row.name}>
                <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                  <Content component="p">
                    <strong>{row.name}</strong>
                  </Content>
                  <Content component="small">
                    <code>{row.detail}</code>
                  </Content>
                  <Progress
                    value={row.value}
                    title=""
                    measureLocation="none"
                    aria-label={`${row.name} utilization`}
                  />
                </Flex>
                {row.name !== "Network transfer" ? <Divider className="pf-v6-u-mt-md" /> : null}
              </div>
            ))}
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

export default function HomePage() {
  const isGlass = usePatternFlyGlassActive();
  const [activeTab, setActiveTab] = useState<string | number>(0);

  return (
    <PageSection className="ocs-app-page-chrome">
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsFlexStart" }}
          gap={{ default: "gapMd" }}
        >
          <Title headingLevel="h1" size="2xl" id="main-title">
            Overview
          </Title>
          <FavoriteButton name="Overview" path="/" />
        </Flex>

        <Tabs
          className="ocs-overview-tabs"
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(key)}
          aria-label="Overview views"
        >
          <Tab eventKey={0} title={<TabTitleText>Cluster</TabTitleText>} />
        </Tabs>

        {activeTab === 0 ? (
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            <GettingStartedCard />

            <Grid hasGutter>
              <GridItem span={12} lg={3}>
                <DetailsCard isGlass={isGlass} />
              </GridItem>
              <GridItem span={12} lg={6}>
                <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
                  <StatusCard isGlass={isGlass} />
                  <ClusterUtilizationCard isGlass={isGlass} />
                </Flex>
              </GridItem>
              <GridItem span={12} lg={3}>
                <ActivityCard isGlass={isGlass} />
              </GridItem>
            </Grid>
          </Flex>
        ) : null}
      </Flex>
    </PageSection>
  );
}
