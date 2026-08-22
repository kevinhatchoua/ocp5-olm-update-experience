import { useParams } from "react-router";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import GitOpsSimpleDetailPage, { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import { findApplicationSet, GITOPS_APPLICATION_SETS } from "./gitopsData";
import { HealthStatus } from "./gitopsShared";

export default function GitOpsApplicationSetsPage() {
  return (
    <GitOpsSimpleListPage
      title="ApplicationSets"
      path="/gitops/applicationsets"
      createLabel="Create ApplicationSet"
      kind="ApplicationSet"
      detailKind="applicationsets"
      items={GITOPS_APPLICATION_SETS}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "generators", label: "Generators" },
        { key: "apps", label: "Applications" },
        { key: "age", label: "Age" },
        { key: "status", label: "Status" },
      ]}
      renderCell={(item, key) => {
        if (key === "generators") return item.generators;
        if (key === "apps") return item.apps;
        if (key === "age") return item.age;
        if (key === "status") return <HealthStatus status={item.status} />;
        return null;
      }}
      footnote="ApplicationSet graph sidebars are covered by HPUX-1942."
    />
  );
}

export function GitOpsApplicationSetDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findApplicationSet(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/applicationsets" listTitle="ApplicationSets" />;
  return (
    <GitOpsSimpleDetailPage
      kindLabel="ApplicationSet"
      listPath="/gitops/applicationsets"
      listTitle="ApplicationSets"
      resourceKind="ApplicationSet"
      detailKind="applicationsets"
      title={rec.name}
      ns={rec.ns}
      status={rec.status}
      fields={[
        { term: "Name", value: rec.name },
        { term: "Namespace", value: rec.ns },
        { term: "Generators", value: rec.generators },
        { term: "Applications", value: rec.apps },
        { term: "Repo", value: rec.repo },
        { term: "Path", value: rec.path },
      ]}
      footnote="ApplicationSet graph sidebars are covered by HPUX-1942."
    />
  );
}
