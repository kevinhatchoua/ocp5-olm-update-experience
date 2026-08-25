import { useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Icon,
  Label,
  MenuToggle,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import type { GitOpsHealth, GitOpsOwner } from "./gitopsData";
import { gitopsDetailPath } from "./gitopsData";

const KIND_ABBREV: Record<string, string> = {
  Application: "A",
  ApplicationSet: "AS",
  Rollout: "AR",
  ReplicaSet: "RS",
  Pod: "P",
  Namespace: "NS",
  ArgoCD: "AC",
  AppProject: "AP",
  ImageUpdater: "IU",
  Agent: "AG",
  Promotion: "PR",
};

const KIND_COLOR: Record<string, "blue" | "green" | "teal" | "purple" | "orange" | "grey"> = {
  Application: "blue",
  ApplicationSet: "purple",
  Rollout: "orange",
  ReplicaSet: "blue",
  Pod: "teal",
  Namespace: "green",
  ArgoCD: "orange",
  AppProject: "teal",
  ImageUpdater: "purple",
  Agent: "green",
  Promotion: "blue",
};

export function ResourceName({
  kind,
  name,
  to,
}: {
  kind: string;
  name: string;
  to?: string | null;
}) {
  const abbrev = KIND_ABBREV[kind] ?? kind.slice(0, 2).toUpperCase();
  const color = KIND_COLOR[kind] ?? "grey";
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapSm" }}
      flexWrap={{ default: "nowrap" }}
    >
      <Label color={color} isCompact className="ocs-resource-label">
        {abbrev}
      </Label>
      {to ? (
        <Button variant="link" isInline component={Link} to={to}>
          {name}
        </Button>
      ) : (
        <span>{name}</span>
      )}
    </Flex>
  );
}

export function ManagedByCell({ owner }: { owner: GitOpsOwner }) {
  if (!owner) return <span className="pf-v6-u-color-200">—</span>;
  const to =
    owner.kind === "Application"
      ? gitopsDetailPath("applications", owner.ns ?? "argocd", owner.name)
      : owner.kind === "ApplicationSet"
        ? gitopsDetailPath("applicationsets", owner.ns ?? "argocd", owner.name)
        : owner.kind === "Rollout"
          ? gitopsDetailPath("rollouts", owner.ns ?? "argocd", owner.name)
          : null;
  return <ResourceName kind={owner.kind} name={owner.name} to={to} />;
}

export function HealthStatus({ status }: { status: GitOpsHealth | "Synced" | "OutOfSync" | string }) {
  if (status === "Healthy" || status === "Synced") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="success" aria-hidden>
          <CheckCircleIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "Paused") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="info" aria-hidden>
          <ClockIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "Progressing" || status === "OutOfSync") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="warning" aria-hidden>
          <SyncIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "Degraded" || status === "Aborting") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="danger" aria-hidden>
          <ExclamationCircleIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  return <span>{status}</span>;
}

export function InfoLabel({ text, color }: { text: string; color: "green" | "blue" | "purple" | "grey" | "red" }) {
  return (
    <Label color={color} isCompact>
      {text}
    </Label>
  );
}

export function GitOpsEditDeleteMenu({
  kind,
  name,
  variant = "plain",
}: {
  kind: string;
  name: string;
  variant?: "plain" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      onSelect={() => setOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant={variant}
          aria-label={`Actions for ${kind} ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          isExpanded={open}
        >
          {variant === "plain" ? <EllipsisVIcon /> : "Actions"}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem itemId="edit" onClick={(e) => e.stopPropagation()}>
          Edit
        </DropdownItem>
        <DropdownItem itemId="delete" isDanger onClick={(e) => e.stopPropagation()}>
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
