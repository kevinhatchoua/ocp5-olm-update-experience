import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../components/Breadcrumbs";
import FavoriteButton from "../components/FavoriteButton";
import {
  PROTOTYPE_LIST_META,
  findPrototypeListItem,
  prototypeDetailPath,
  type PrototypeListKey,
} from "../lib/prototypeListStore";

export default function PrototypeResourceDetailPage({ listKey }: { listKey: PrototypeListKey }) {
  const params = useParams();
  const name = decodeURIComponent(params.name ?? "");
  const namespace = decodeURIComponent(params.namespace ?? "");
  const meta = PROTOTYPE_LIST_META[listKey];
  const stored = findPrototypeListItem(listKey, namespace, name);
  const [activeTab, setActiveTab] = useState("details");
  const detailPath = prototypeDetailPath(listKey, namespace, name);

  const fields = useMemo(() => {
    const rows: { term: string; value: string }[] = [
      { term: "Name", value: name },
    ];
    if (namespace) rows.push({ term: "Namespace", value: namespace });
    rows.push({ term: "Kind", value: stored?.kind ?? meta.kind });
    if (stored?.createdAt) {
      rows.push({ term: "Created", value: new Date(stored.createdAt).toLocaleString() });
    }
    Object.entries(stored?.fields ?? {}).forEach(([key, value]) => {
      if (value) rows.push({ term: key, value });
    });
    return rows;
  }, [meta.kind, name, namespace, stored]);

  const breadcrumbs = [
    { label: "Home", path: "/" },
    ...(meta.section ? [meta.section] : []),
    { label: meta.listTitle, path: meta.listPath },
    { label: name },
  ];

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs items={breadcrumbs}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
              {meta.kindAbbr ? (
                <Label color="blue" isCompact className="ocs-resource-label">
                  {meta.kindAbbr}
                </Label>
              ) : null}
              <Title headingLevel="h1" size="2xl">
                {name}
              </Title>
            </Flex>
            <FavoriteButton name={name} path={detailPath} />
          </Flex>

          <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(String(key))} aria-label={`${meta.kind} details`}>
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
              <DescriptionList isCompact className="pf-v6-u-mt-md">
                {fields.map((field) => (
                  <DescriptionListGroup key={field.term}>
                    <DescriptionListTerm>{field.term}</DescriptionListTerm>
                    <DescriptionListDescription>{field.value}</DescriptionListDescription>
                  </DescriptionListGroup>
                ))}
              </DescriptionList>
              <Content component="p" className="pf-v6-u-mt-md pf-v6-u-color-200">
                Prototype detail view — configuration and live cluster data are not connected.
              </Content>
            </Tab>
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>}>
              <Content component="p" className="pf-v6-u-mt-md">
                YAML editing for created prototype resources will be expanded in a future iteration.
              </Content>
            </Tab>
          </Tabs>

          <Button variant="link" component={Link} to={meta.listPath} className="pf-v6-u-pl-0">
            Back to {meta.listTitle}
          </Button>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
