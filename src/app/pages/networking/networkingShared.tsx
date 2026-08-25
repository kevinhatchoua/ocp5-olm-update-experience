import type { ReactNode } from "react";
import {
  Button,
  Content,
  Flex,
  Title,
} from "@patternfly/react-core";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";

export const NETWORKING_CRUMB = { label: "Networking", path: "/networking" };

export function NetworkingPageShell({
  title,
  path,
  createLabel,
  onCreate,
  createButton,
  children,
  extraHeader,
  aboveTitle,
  breadcrumbExtra,
  className,
}: {
  title: string;
  path: string;
  createLabel?: string;
  onCreate?: () => void;
  createButton?: ReactNode;
  children: ReactNode;
  extraHeader?: ReactNode;
  /** OCP pattern: project selector (or similar) above the page title. */
  aboveTitle?: ReactNode;
  /** Extra breadcrumb items inserted before the current page title crumb. */
  breadcrumbExtra?: { label: string; path?: string }[];
  className?: string;
}) {
  return (
    <div className={["ocs-app-page-outer", "w-full", className].filter(Boolean).join(" ")}>
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          NETWORKING_CRUMB,
          ...(breadcrumbExtra ?? []),
          { label: title, path },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} flexWrap={{ default: "nowrap" }}>
          {aboveTitle ? <div className="ocs-networking-above-title">{aboveTitle}</div> : null}
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                {title}
              </Title>
              <FavoriteButton name={title} path={path} />
            </Flex>
            {createButton ??
              (createLabel ? (
                <Button variant="primary" onClick={onCreate}>
                  {createLabel}
                </Button>
              ) : null)}
          </Flex>
          {extraHeader}
          {children}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

export function NetworkingEmptyState({
  title,
  description,
  createLabel,
  onCreate,
  learnMoreHref,
  learnMoreLabel,
}: {
  title: string;
  description: string;
  createLabel: string;
  onCreate?: () => void;
  learnMoreHref?: string;
  learnMoreLabel?: string;
}) {
  return (
    <div className="ocs-nodes-list__table-wrap ocs-networking-empty">
      <Flex
        direction={{ default: "column" }}
        alignItems={{ default: "alignItemsCenter" }}
        justifyContent={{ default: "justifyContentCenter" }}
        gap={{ default: "gapMd" }}
        className="pf-v6-u-py-3xl"
      >
        <PlusCircleIcon aria-hidden className="ocs-networking-empty__icon" />
        <Title headingLevel="h2" size="lg">
          {title}
        </Title>
        <Content component="p" className="pf-v6-u-text-align-center ocs-networking-empty__desc">
          {description}
        </Content>
        <Button variant="primary" onClick={onCreate}>
          {createLabel}
        </Button>
        {learnMoreHref && learnMoreLabel ? (
          <Button
            variant="link"
            isInline
            component="a"
            href={learnMoreHref}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLinkAltIcon />}
            iconPosition="right"
          >
            {learnMoreLabel}
          </Button>
        ) : null}
      </Flex>
    </div>
  );
}

export function NetworkingTablePanel({ children }: { children: ReactNode }) {
  return <div className="ocs-pods-list__panel">{children}</div>;
}
