import { useParams, useSearchParams } from "react-router";
import { Content, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsPrototypeListTable } from "../../components/dataView/OcsPrototypeListTable";
import { prototypeDetailPath } from "../../lib/prototypeListStore";
import NetworkResourceDetailShell, { DetailMetadataSection } from "./NetworkResourceDetailShell";
import {
  AnnotationsField,
  CreatedAtField,
  LabelsField,
  MetadataGrid,
  NamespaceValue,
  OwnerField,
  SelectorLink,
  YamlPanel,
} from "./networkingDetailFields";
import { networkPolicyYaml, resolveNetworkPolicyDetail } from "./networkingResourceDetailData";

export default function NetworkPolicyDetailPage() {
  const { namespace = "default", name = "" } = useParams();
  const [searchParams] = useSearchParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const model = resolveNetworkPolicyDetail(decodedNs, decodedName);
  const detailPath = prototypeDetailPath("networkpolicies", decodedNs, decodedName);
  const initialTab = searchParams.get("tab") === "yaml" ? "yaml" : "details";

  return (
    <NetworkResourceDetailShell
      kindAbbr="NP"
      kindLabel="NetworkPolicy"
      listTitle="NetworkPolicies"
      listPath="/networking/networkpolicies"
      detailCrumbLabel="NetworkPolicy details"
      name={decodedName}
      detailPath={detailPath}
      initialTab={initialTab}
      tabs={[
        {
          eventKey: "details",
          title: "Details",
          content: (
            <>
              <DetailMetadataSection title="NetworkPolicy details">
                <MetadataGrid
                  left={
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>{model.name}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Namespace</DescriptionListTerm>
                        <DescriptionListDescription>
                          <NamespaceValue namespace={model.namespace} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <LabelsField labels={model.labels} />
                      <AnnotationsField count={model.annotations} />
                      <CreatedAtField value={model.createdAt} />
                      <OwnerField />
                    </>
                  }
                  right={<></>}
                />
              </DetailMetadataSection>
              <DetailMetadataSection title="Ingress rules">
                <Content component="p" className="pf-v6-u-mb-md pf-v6-u-color-200">
                  By default, pods accept traffic from any source. NetworkPolicies can be used to restrict which
                  sources are allowed to reach the pods selected by this NetworkPolicy.
                </Content>
                <OcsPrototypeListTable ariaLabel="Ingress rules">
                  <Thead>
                    <Tr>
                      <Th>Target pods</Th>
                      <Th>From</Th>
                      <Th>To ports</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {model.ingressRules.map((rule) => (
                      <Tr key={`ingress-${rule.targetPods}`}>
                        <Td dataLabel="Target pods">
                          <SelectorLink value={rule.targetPods} />
                        </Td>
                        <Td dataLabel="From">
                          <DescriptionList isCompact className="ocs-node-details__nested-dl">
                            <DescriptionListGroup>
                              <DescriptionListTerm>Pod selector</DescriptionListTerm>
                              <DescriptionListDescription>
                                <SelectorLink value={rule.fromPodSelector} />
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>NS selector</DescriptionListTerm>
                              <DescriptionListDescription>
                                <SelectorLink value={rule.fromNsSelector} />
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </Td>
                        <Td dataLabel="To ports">{rule.toPorts}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </OcsPrototypeListTable>
              </DetailMetadataSection>
              <DetailMetadataSection title="Egress rules">
                <Content component="p" className="pf-v6-u-mb-md pf-v6-u-color-200">
                  By default, pods accept traffic on any port (both TCP and UDP) from any destination. Egress rules
                  can be used to restrict which destinations are allowed. Not all cluster network providers support
                  NetworkPolicy.
                </Content>
                <OcsPrototypeListTable ariaLabel="Egress rules">
                  <Thead>
                    <Tr>
                      <Th>From pods</Th>
                      <Th>To</Th>
                      <Th>To ports</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {model.egressRules.map((rule) => (
                      <Tr key={`egress-${rule.fromPodSelector}`}>
                        <Td dataLabel="From pods">
                          <DescriptionList isCompact className="ocs-node-details__nested-dl">
                            <DescriptionListGroup>
                              <DescriptionListTerm>Pod selector</DescriptionListTerm>
                              <DescriptionListDescription>
                                <SelectorLink value={rule.fromPodSelector} />
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>NS selector</DescriptionListTerm>
                              <DescriptionListDescription>
                                <SelectorLink value={rule.fromNsSelector} />
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </Td>
                        <Td dataLabel="To">
                          <DescriptionList isCompact className="ocs-node-details__nested-dl">
                            <DescriptionListGroup>
                              <DescriptionListTerm>Pod selector</DescriptionListTerm>
                              <DescriptionListDescription>
                                <SelectorLink value={rule.toPodSelector} />
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>NS selector</DescriptionListTerm>
                              <DescriptionListDescription>
                                <SelectorLink value={rule.toNsSelector} />
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </Td>
                        <Td dataLabel="To ports">{rule.toPorts}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </OcsPrototypeListTable>
              </DetailMetadataSection>
            </>
          ),
        },
        { eventKey: "yaml", title: "YAML", content: <YamlPanel yaml={networkPolicyYaml(model)} /> },
      ]}
    />
  );
}
