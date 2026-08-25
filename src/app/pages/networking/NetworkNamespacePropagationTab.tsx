import { Link } from "react-router";
import { Content, Flex, Label, Title } from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import {
  getNamespacePropagationTargets,
  nadDetailPath,
  type NetworkResourceKind,
} from "./networkingMockData";

const NAMESPACES_PATH = "/administration/namespaces";

export default function NetworkNamespacePropagationTab({
  networkName,
  networkKind,
}: {
  networkName: string;
  networkKind: Extract<NetworkResourceKind, "UDN" | "CUDN">;
}) {
  const targets = getNamespacePropagationTargets(networkName, networkKind);

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-mt-md">
      {/* ... existing metadata details blocks ... */}

      <Content component="p" className="ocs-net-topo-sidepanel__hint">
        {networkKind === "CUDN"
          ? "ClusterUserDefinedNetwork namespace selectors determine where NetworkAttachmentDefinitions are auto-provisioned."
          : "UserDefinedNetwork scope determines the namespace where its NetworkAttachmentDefinition is created."}
      </Content>

      {targets.length === 0 ? (
        <Content component="p">No namespace propagation targets are configured for this network.</Content>
      ) : (
        <ul className="ocs-net-topo-propagation-list" aria-label="Namespace propagation targets">
          {targets.map((target) => (
            <li key={`${target.namespace}/${target.nadName}`} className="ocs-net-topo-propagation-row">
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                gap={{ default: "gapSm" }}
                flexWrap={{ default: "wrap" }}
              >
                <Label color="blue" isCompact>
                  Namespace
                </Label>
                <Link to={NAMESPACES_PATH} className="pf-v6-c-button pf-m-link pf-m-inline">
                  {target.namespace}
                </Link>
                {target.namespaceSelector ? (
                  <Content component="small" className="ocs-net-topo-propagation-row__selector">
                    Selector: {target.namespaceSelector}
                  </Content>
                ) : null}
                <span className="ocs-net-topo-propagation-row__arrow" aria-hidden>
                  →
                </span>
                <Label color="green" isCompact>
                  NAD
                </Label>
                <Link
                  to={nadDetailPath(target.namespace, target.nadName)}
                  className="pf-v6-c-button pf-m-link pf-m-inline"
                >
                  {target.nadName} <ExternalLinkAltIcon />
                </Link>
              </Flex>
            </li>
          ))}
        </ul>
      )}

      <Title headingLevel="h4" size="md">
        Propagation summary
      </Title>
      <Content component="small">
        {targets.length} namespace{targets.length === 1 ? "" : "s"} receive auto-generated NAD
        {targets.length === 1 ? "" : "s"} from this {networkKind}.
      </Content>
    </Flex>
  );
}
