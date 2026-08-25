import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import GitOpsApplicationDetailRich from "./GitOpsApplicationDetailRich";
import { GITOPS_APPLICATIONS } from "./gitopsData";
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
  return <GitOpsApplicationDetailRich />;
}
