import { Button, Content, Label, Title } from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import {
  ovnPathSummaryLine,
  type OvnNetworkPathModel,
  type OvnPathSegment,
  type OvnPathTier,
} from "./topologyOvnPath";

const TIER_LABEL: Record<OvnPathTier, string> = {
  configured: "Configured",
  observed: "Observed",
  "ovn-logical": "OVN logical",
};

const TIER_COLOR: Record<OvnPathTier, "blue" | "purple" | "cyan"> = {
  configured: "blue",
  observed: "purple",
  "ovn-logical": "cyan",
};

const DO282_REFERENCE =
  "https://role.rhu.redhat.com/rol/app/courses/do282-4.20/pages/ch01s08";

type OvnNetworkPathProps = {
  model: OvnNetworkPathModel;
  onSelectNode?: (nodeId: string) => void;
  onTracePath?: () => void;
};

function PathSegmentRow({
  segment,
  isLast,
  onSelectNode,
}: {
  segment: OvnPathSegment;
  isLast: boolean;
  onSelectNode?: (nodeId: string) => void;
}) {
  const clickable = Boolean(segment.nodeId && onSelectNode);

  return (
    <li
      className={`ocs-pf-topo-ovn-path__segment${segment.anchor ? " ocs-pf-topo-ovn-path__segment--anchor" : ""}`}
    >
      <div className="ocs-pf-topo-ovn-path__segment-body">
        <div className="ocs-pf-topo-ovn-path__segment-meta">
          <Label isCompact color={TIER_COLOR[segment.tier]} className="ocs-pf-topo-ovn-path__tier">
            {TIER_LABEL[segment.tier]}
          </Label>
          <span className="ocs-pf-topo-ovn-path__role">{segment.role}</span>
        </div>
        {clickable ? (
          <Button variant="link" isInline className="ocs-pf-topo-ovn-path__label" onClick={() => onSelectNode?.(segment.nodeId!)}>
            {segment.label}
          </Button>
        ) : (
          <span className="ocs-pf-topo-ovn-path__label">{segment.label}</span>
        )}
        {segment.detail ? (
          <Content component="small" className="ocs-pf-topo-ovn-path__detail">
            {segment.detail}
          </Content>
        ) : null}
        {segment.anchor ? (
          <Label isCompact color="blue" className="ocs-pf-topo-ovn-path__you-are-here">
            Selected
          </Label>
        ) : null}
      </div>
      {!isLast ? <span className="ocs-pf-topo-ovn-path__connector" aria-hidden /> : null}
    </li>
  );
}

export default function OvnNetworkPath({ model, onSelectNode, onTracePath }: OvnNetworkPathProps) {
  return (
    <div className="ocs-pf-topo-ovn-path">
      <Content component="p" className="ocs-pf-topo-ovn-path__intro">
        Per-node network stack for <strong>{model.nodeName}</strong> ({model.nodeHostname}), aligned with the DO282 OVN
        architecture flow.
      </Content>

      <div className="ocs-pf-topo-ovn-path__summary">
        <Title headingLevel="h3" size="md">
          Path summary
        </Title>
        <Content component="p">{ovnPathSummaryLine(model)}</Content>
      </div>

      <Title headingLevel="h3" size="md" className="ocs-pf-topo-ovn-path__stack-title">
        Component stack
      </Title>
      <ol className="ocs-pf-topo-ovn-path__stack" aria-label={`Network path on ${model.nodeName}`}>
        {model.segments.map((segment, index) => (
          <PathSegmentRow
            key={segment.id}
            segment={segment}
            isLast={index === model.segments.length - 1}
            onSelectNode={onSelectNode}
          />
        ))}
      </ol>

      {model.peerNodes.length > 0 ? (
        <div className="ocs-pf-topo-ovn-path__peers">
          <Title headingLevel="h3" size="md">
            Cluster fabric
          </Title>
          <Content component="p" className="ocs-pf-topo-ovn-path__muted">
            <code>ovn_cluster_router</code> connects to peer nodes via the transit switch (
            <code>transit_switch</code>): {model.peerNodes.join(", ")}.
          </Content>
        </div>
      ) : null}

      <div className="ocs-pf-topo-ovn-path__footer">
        {onTracePath ? (
          <Button variant="link" isInline onClick={onTracePath}>
            Highlight path on graph
          </Button>
        ) : null}
        <Button
          variant="link"
          isInline
          component="a"
          href={DO282_REFERENCE}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
        >
          DO282 reference
        </Button>
      </div>
    </div>
  );
}
