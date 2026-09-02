import { useParams, useSearchParams } from "react-router";
import { Content, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Label } from "@patternfly/react-core";
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
  YamlPanel,
} from "./networkingDetailFields";
import { resolveServiceDetail, serviceYaml } from "./networkingResourceDetailData";

export default function ServiceDetailPage() {
  const { namespace = "default", name = "" } = useParams();
  const [searchParams] = useSearchParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const model = resolveServiceDetail(decodedNs, decodedName);
  const detailPath = prototypeDetailPath("services", decodedNs, decodedName);
  const initialTab = searchParams.get("tab") === "yaml" ? "yaml" : searchParams.get("tab") === "pods" ? "pods" : "details";

  return (
    <NetworkResourceDetailShell
      kindAbbr="S"
      kindLabel="Service"
      listTitle="Services"
      listPath="/networking"
      detailCrumbLabel="Service details"
      name={decodedName}
      detailPath={detailPath}
      initialTab={initialTab}
      tabs={[
        {
          eventKey: "details",
          title: "Details",
          content: (
            <>
              <DetailMetadataSection title="Service details">
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
                      <DescriptionListGroup>
                        <DescriptionListTerm>Pod selector</DescriptionListTerm>
                        <DescriptionListDescription>{model.podSelector}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <AnnotationsField count={0} />
                      <DescriptionListGroup>
                        <DescriptionListTerm>Session affinity</DescriptionListTerm>
                        <DescriptionListDescription>{model.sessionAffinity}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <CreatedAtField value={model.createdAt} />
                      <OwnerField />
                    </>
                  }
                  right={
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Hostname</DescriptionListTerm>
                        <DescriptionListDescription>
                          {model.hostname}
                          <Content component="small" className="pf-v6-u-display-block pf-v6-u-color-200">
                            Accessible within the cluster only
                          </Content>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Service address</DescriptionListTerm>
                        <DescriptionListDescription>
                          <DescriptionListGroup className="ocs-node-details__nested-dl">
                            <DescriptionListTerm>Type</DescriptionListTerm>
                            <DescriptionListDescription>{model.serviceType}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup className="ocs-node-details__nested-dl">
                            <DescriptionListTerm>Location</DescriptionListTerm>
                            <DescriptionListDescription>
                              {model.clusterIp}
                              <Content component="small" className="pf-v6-u-display-block pf-v6-u-color-200">
                                Accessible within the cluster only
                              </Content>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </>
                  }
                />
              </DetailMetadataSection>
              <DetailMetadataSection title="Service port mapping">
                <OcsPrototypeListTable ariaLabel="Service port mapping">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Port</Th>
                      <Th>Protocol</Th>
                      <Th>Pod port or name</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {model.ports.map((port) => (
                      <Tr key={port.name}>
                        <Td dataLabel="Name">{port.name}</Td>
                        <Td dataLabel="Port">
                          <Label color="green" isCompact>
                            {port.port}
                          </Label>
                        </Td>
                        <Td dataLabel="Protocol">{port.protocol}</Td>
                        <Td dataLabel="Pod port or name">
                          <Label color="blue" isCompact>
                            {port.targetPort}
                          </Label>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </OcsPrototypeListTable>
              </DetailMetadataSection>
            </>
          ),
        },
        { eventKey: "yaml", title: "YAML", content: <YamlPanel yaml={serviceYaml(model)} /> },
        {
          eventKey: "pods",
          title: "Pods",
          content: (
            <section className="ocs-node-details__panel">
              <Content component="p">No Pods are managed by this Service in this prototype.</Content>
            </section>
          ),
        },
      ]}
    />
  );
}
