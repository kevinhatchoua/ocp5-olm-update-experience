import { useParams, useSearchParams } from "react-router";
import { Button, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Flex } from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import { prototypeDetailPath } from "../../lib/prototypeListStore";
import NetworkResourceDetailShell, { DetailMetadataSection } from "./NetworkResourceDetailShell";
import {
  AnnotationsField,
  CreatedAtField,
  LabelsField,
  MetadataGrid,
  MetricsPlaceholder,
  NamespaceValue,
  OwnerField,
  ServiceLink,
  YamlPanel,
} from "./networkingDetailFields";
import { resolveRouteDetail, routeYaml } from "./networkingResourceDetailData";

export default function RouteDetailPage() {
  const { namespace = "default", name = "" } = useParams();
  const [searchParams] = useSearchParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const model = resolveRouteDetail(decodedNs, decodedName);
  const detailPath = prototypeDetailPath("routes", decodedNs, decodedName);
  const initialTab =
    searchParams.get("tab") === "yaml" ? "yaml" : searchParams.get("tab") === "metrics" ? "metrics" : "details";

  return (
    <NetworkResourceDetailShell
      kindAbbr="RT"
      kindLabel="Route"
      listTitle="Routes"
      listPath="/networking/routes"
      detailCrumbLabel="Route details"
      name={decodedName}
      detailPath={detailPath}
      initialTab={initialTab}
      tabs={[
        {
          eventKey: "details",
          title: "Details",
          content: (
            <>
              <DetailMetadataSection title="Route details">
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
                      <DescriptionListGroup>
                        <DescriptionListTerm>Service</DescriptionListTerm>
                        <DescriptionListDescription>
                          <ServiceLink namespace={model.namespace} name={model.serviceName} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Target port</DescriptionListTerm>
                        <DescriptionListDescription>{model.targetPort}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <CreatedAtField value={model.createdAt} />
                      <OwnerField />
                    </>
                  }
                  right={
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Location</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Button variant="link" isInline component="a" href={model.location}>
                              {model.location}
                            </Button>
                            <Button variant="plain" aria-label="Copy location" icon={<CopyIcon aria-hidden />} />
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Status</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" aria-hidden />
                            {model.status}
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Host</DescriptionListTerm>
                        <DescriptionListDescription>{model.host}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Path</DescriptionListTerm>
                        <DescriptionListDescription>{model.path}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Router canonical hostname</DescriptionListTerm>
                        <DescriptionListDescription>
                          {model.routerCanonicalHostname}
                          <Button variant="link" isInline className="pf-v6-u-display-block pf-v6-u-pl-0">
                            Do you need to set up custom DNS?
                          </Button>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </>
                  }
                />
              </DetailMetadataSection>
              <DetailMetadataSection title="TLS settings">
                <MetadataGrid
                  left={
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Termination type</DescriptionListTerm>
                        <DescriptionListDescription>{model.terminationType}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Insecure traffic</DescriptionListTerm>
                        <DescriptionListDescription>{model.insecureTraffic}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </>
                  }
                  right={
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Certificate</DescriptionListTerm>
                        <DescriptionListDescription>—</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Key</DescriptionListTerm>
                        <DescriptionListDescription>—</DescriptionListDescription>
                      </DescriptionListGroup>
                    </>
                  }
                />
              </DetailMetadataSection>
            </>
          ),
        },
        {
          eventKey: "metrics",
          title: "Metrics",
          content: (
            <div className="ocs-net-detail-metrics">
              <MetricsPlaceholder title="Traffic in" />
              <MetricsPlaceholder title="Traffic out" />
              <MetricsPlaceholder title="Connection rate" />
            </div>
          ),
        },
        { eventKey: "yaml", title: "YAML", content: <YamlPanel yaml={routeYaml(model)} /> },
      ]}
    />
  );
}
