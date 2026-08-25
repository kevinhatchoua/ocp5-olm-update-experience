import { useParams } from "react-router";
import { Content, Flex, Label } from "@patternfly/react-core";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import GitOpsSimpleDetailPage, { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import { findPromotionPipeline, GITOPS_PROMOTION_PIPELINES } from "./gitopsData";

function promotionStatusColor(
  status: "Running" | "Blocked" | "Succeeded" | "Failed"
): "blue" | "orange" | "green" | "red" {
  if (status === "Running") return "blue";
  if (status === "Blocked") return "orange";
  if (status === "Succeeded") return "green";
  return "red";
}

export default function GitOpsPromotionsPage() {
  return (
    <GitOpsSimpleListPage
      title="Promotions"
      path="/gitops/promotions"
      createLabel="Create promotion"
      kind="Promotion"
      detailKind="promotions"
      items={GITOPS_PROMOTION_PIPELINES}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "environments", label: "Environments" },
        { key: "status", label: "Status" },
        { key: "gates", label: "Gates" },
        { key: "age", label: "Age" },
      ]}
      renderCell={(item, key) => {
        if (key === "environments") return item.environments;
        if (key === "status") {
          return (
            <Label color={promotionStatusColor(item.status)} isCompact>
              {item.status}
            </Label>
          );
        }
        if (key === "gates") return item.gates;
        if (key === "age") return item.age;
        return null;
      }}
      footnote="Promoter is Tech Preview timing — promotion UX may change before GA."
    />
  );
}

export function GitOpsPromotionDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findPromotionPipeline(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/promotions" listTitle="Promotions" />;

  const envParts = rec.environments.split(/\s*→\s*/).map((s) => s.trim()).filter(Boolean);

  return (
    <GitOpsSimpleDetailPage
      kindLabel="Promotion"
      listPath="/gitops/promotions"
      listTitle="Promotions"
      resourceKind="Promotion"
      detailKind="promotions"
      title={rec.name}
      ns={rec.ns}
      status={rec.status === "Succeeded" ? "Healthy" : rec.status === "Failed" ? "Degraded" : "Progressing"}
      fields={[
        { term: "Name", value: rec.name },
        { term: "Namespace", value: rec.ns },
        {
          term: "Environments",
          value: (
            <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
              {envParts.map((env, i) => (
                <Flex key={env} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                  <Label color="blue" isCompact>
                    {env}
                  </Label>
                  {i < envParts.length - 1 ? <Content component="small">→</Content> : null}
                </Flex>
              ))}
            </Flex>
          ),
        },
        {
          term: "Status",
          value: (
            <Label color={promotionStatusColor(rec.status)} isCompact>
              {rec.status}
            </Label>
          ),
        },
        { term: "Gates", value: rec.gates },
        { term: "Age", value: rec.age },
      ]}
      footnote={
        <>
          Detail stub for promotion pipeline gates.{" "}
          <strong>Promoter Tech Preview</strong> timing — environment strip and gate status are mock
          only until promoter UX lands.
        </>
      }
    />
  );
}
