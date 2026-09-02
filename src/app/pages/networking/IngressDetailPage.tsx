import { useParams, useSearchParams } from "react-router";
import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from "@patternfly/react-core";
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
  ServiceLink,
  YamlPanel,
} from "./networkingDetailFields";
import { ingressYaml, resolveIngressDetail } from "./networkingResourceDetailData";

export default function IngressDetailPage() {
  const { namespace = "default", name = "" } = useParams();
  const [searchParams] = useSearchParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const model = resolveIngressDetail(decodedNs, decodedName);
  const detailPath = prototypeDetailPath("ingresses", decodedNs, decodedName);
  const initialTab = searchParams.get("tab") === "yaml" ? "yaml" : "details";

  return (
    <NetworkResourceDetailShell
      kindAbbr="IN"
      kindLabel="Ingress"
      listTitle="Ingresses"
      listPath="/networking/ingresses"
      detailCrumbLabel="Ingress details"
      name={decodedName}
      detailPath={detailPath}
      initialTab={initialTab}
      tabs={[
        {
          eventKey: "details",
          title: "Details",
          content: (
            <>
              <DetailMetadataSection title="Ingress details">
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
                      <LabelsField labels={[]} />
                      <AnnotationsField count={0} />
                      <DescriptionListGroup>
                        <DescriptionListTerm>TLS certificate</DescriptionListTerm>
                        <DescriptionListDescription>{model.tlsCertificate}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <CreatedAtField value={model.createdAt} />
                      <OwnerField />
                    </>
                  }
                  right={<></>}
                />
              </DetailMetadataSection>
              <DetailMetadataSection title="Ingress rules">
                <p className="pf-v6-u-mb-md pf-v6-u-color-200">
                  These rules are handled by a routing layer (Ingress Controller) which is updated as the rules are
                  modified. The Ingress controller implementation defines how headers and other metadata are forwarded
                  or manipulated.
                </p>
                <OcsPrototypeListTable ariaLabel="Ingress rules">
                  <Thead>
                    <Tr>
                      <Th>Host</Th>
                      <Th>Path</Th>
                      <Th>Path type</Th>
                      <Th>Service</Th>
                      <Th>Service port</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td dataLabel="Host">{model.host}</Td>
                      <Td dataLabel="Path">{model.path}</Td>
                      <Td dataLabel="Path type">{model.pathType}</Td>
                      <Td dataLabel="Service">
                        <ServiceLink namespace={model.namespace} name={model.serviceName} />
                      </Td>
                      <Td dataLabel="Service port">{model.servicePort}</Td>
                    </Tr>
                  </Tbody>
                </OcsPrototypeListTable>
              </DetailMetadataSection>
            </>
          ),
        },
        { eventKey: "yaml", title: "YAML", content: <YamlPanel yaml={ingressYaml(model)} /> },
      ]}
    />
  );
}
