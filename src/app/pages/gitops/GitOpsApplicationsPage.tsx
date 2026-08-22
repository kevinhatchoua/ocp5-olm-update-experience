import { useParams } from "react-router";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import GitOpsSimpleDetailPage, { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import { findApplication, GITOPS_APPLICATIONS } from "./gitopsData";
import { HealthStatus, ManagedByCell } from "./gitopsShared";

export default function GitOpsApplicationsPage() {
  return (
    <GitOpsSimpleListPage
      title="Applications"
      path="/gitops/applications"
      createLabel="Create Application"
      kind="Application"
      detailKind="applications"
      items={GITOPS_APPLICATIONS}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "project", label: "Project" },
        { key: "sync", label: "Sync status" },
        { key: "health", label: "Health" },
        { key: "managedBy", label: "Managed by" },
        { key: "age", label: "Age" },
      ]}
      renderCell={(item, key) => {
        if (key === "project") return item.project;
        if (key === "sync") return <HealthStatus status={item.sync} />;
        if (key === "health") return <HealthStatus status={item.health} />;
        if (key === "managedBy") return <ManagedByCell owner={item.managedBy} />;
        if (key === "age") return item.age;
        return null;
      }}
      footnote="Application inventory and graph sidebars are covered by HPUX-1942."
    />
  );
}

export function GitOpsApplicationDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findApplication(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/applications" listTitle="Applications" />;
  return (
    <GitOpsSimpleDetailPage
      kindLabel="Application"
      listPath="/gitops/applications"
      listTitle="Applications"
      resourceKind="Application"
      detailKind="applications"
      title={rec.name}
      ns={rec.ns}
      status={rec.health}
      fields={[
        { term: "Name", value: rec.name },
        { term: "Namespace", value: rec.ns },
        { term: "Project", value: rec.project },
        { term: "Sync status", value: rec.sync },
        { term: "Repo", value: rec.repo },
        { term: "Path", value: rec.path },
        { term: "Revision", value: rec.revision },
        { term: "Destination", value: rec.destination },
        { term: "Managed by", value: <ManagedByCell owner={rec.managedBy} /> },
      ]}
      footnote="Application inventory and graph sidebars are covered by HPUX-1942."
    />
  );
}
