import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import GitOpsSimpleDetailPage, { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import { ARGO_INSTANCES, findArgoCd } from "./gitopsData";
import { HealthStatus } from "./gitopsShared";
import { useParams } from "react-router";

export default function GitOpsArgoCdPage() {
  return (
    <GitOpsSimpleListPage
      title="Argo CD"
      path="/gitops/argocd"
      createLabel="Create Argo CD"
      kind="ArgoCD"
      detailKind="argocd"
      items={ARGO_INSTANCES}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "status", label: "Status" },
        { key: "version", label: "Version" },
        { key: "applications", label: "Applications" },
        { key: "age", label: "Age" },
      ]}
      renderCell={(item, key) => {
        if (key === "status") return <HealthStatus status={item.status} />;
        if (key === "version") return item.version;
        if (key === "applications") return item.applications;
        if (key === "age") return item.age;
        return null;
      }}
    />
  );
}

export function GitOpsArgoCdDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findArgoCd(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/argocd" listTitle="Argo CD" />;
  return (
    <GitOpsSimpleDetailPage
      kindLabel="Argo CD"
      listPath="/gitops/argocd"
      listTitle="Argo CD"
      resourceKind="ArgoCD"
      detailKind="argocd"
      title={rec.name}
      ns={rec.ns}
      status={rec.status}
      fields={[
        { term: "Name", value: rec.name },
        { term: "Namespace", value: rec.ns },
        { term: "Server", value: rec.server },
        { term: "Version", value: rec.version },
        { term: "Applications", value: rec.applications },
        { term: "Age", value: rec.age },
      ]}
    />
  );
}
