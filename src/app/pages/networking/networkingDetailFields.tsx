import type { ReactNode } from "react";
import { Link } from "react-router";
import {
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
} from "@patternfly/react-core";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import { prototypeDetailPath } from "../../lib/prototypeListStore";

export function NamespaceValue({ namespace }: { namespace: string }) {
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      <Label color="green" isCompact className="ocs-resource-label">
        NS
      </Label>
      <Button variant="link" isInline component={Link} to={`/administration/namespaces/${encodeURIComponent(namespace)}`}>
        {namespace}
      </Button>
    </Flex>
  );
}

export function LabelsField({ labels }: { labels: { key: string; value: string }[] }) {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
          <span>Labels</span>
          <Button variant="link" isInline icon={<PencilAltIcon aria-hidden />} iconPosition="right">
            Edit
          </Button>
        </Flex>
      </DescriptionListTerm>
      <DescriptionListDescription>
        {labels.length === 0 ? (
          "No labels"
        ) : (
          <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }} className="ocs-node-details__label-group">
            {labels.map((label) => (
              <Label key={`${label.key}=${label.value}`} color="grey" isCompact>
                {label.key}={label.value}
              </Label>
            ))}
          </Flex>
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
}

export function AnnotationsField({ count }: { count: number }) {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Annotations</DescriptionListTerm>
      <DescriptionListDescription>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <span>
            {count} annotation{count === 1 ? "" : "s"}
          </span>
          <Button variant="plain" aria-label="Edit annotations" icon={<PencilAltIcon aria-hidden />} />
        </Flex>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
}

export function CreatedAtField({ value }: { value: string }) {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Created at</DescriptionListTerm>
      <DescriptionListDescription>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <OutlinedClockIcon className="ocs-node-details__uptime-icon" aria-hidden />
          {value}
        </Flex>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
}

export function OwnerField() {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Owner</DescriptionListTerm>
      <DescriptionListDescription>No owner</DescriptionListDescription>
    </DescriptionListGroup>
  );
}

export function ServiceLink({ namespace, name }: { namespace: string; name: string }) {
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      <Label color="green" isCompact className="ocs-resource-label">
        S
      </Label>
      <Button
        variant="link"
        isInline
        component={Link}
        to={prototypeDetailPath("services", namespace, name)}
      >
        {name}
      </Button>
    </Flex>
  );
}

export function SelectorLink({ value }: { value: string }) {
  return (
    <Button variant="link" isInline icon={<SearchIcon aria-hidden />} iconPosition="right">
      {value}
    </Button>
  );
}

export function MetadataGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <Grid hasGutter className="ocs-node-details__columns">
      <GridItem md={6}>
        <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
          {left}
        </DescriptionList>
      </GridItem>
      <GridItem md={6}>
        <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
          {right}
        </DescriptionList>
      </GridItem>
    </Grid>
  );
}

export function YamlPanel({ yaml }: { yaml: string }) {
  return (
    <section className="ocs-node-details__panel" aria-label="YAML">
      <pre className="ocs-net-yaml">{yaml}</pre>
    </section>
  );
}

export function MetricsPlaceholder({ title }: { title: string }) {
  return (
    <div className="ocs-net-detail-metrics-card">
      <Content component="h3" className="ocs-net-detail-metrics-card__title">
        {title}
      </Content>
      <div className="ocs-net-detail-metrics-card__chart" aria-hidden />
    </div>
  );
}
