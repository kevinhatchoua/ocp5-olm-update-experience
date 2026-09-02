import { parseCreateLabel } from "./prototypeCreateTemplates";

const CREATE_PATHS: Record<string, string> = {
  service: "/networking/services/create",
  route: "/networking/routes/create",
  ingress: "/networking/ingresses/create",
  networkpolicy: "/networking/networkpolicies/create",
  multinetworkpolicy: "/networking/networkpolicies/create?kind=multinetworkpolicy",
  deployment: "/workloads/deployments/create",
  pod: "/workloads/pods/create",
  job: "/workloads/jobs/create",
  cronjob: "/workloads/cronjobs/create",
  daemonset: "/workloads/daemonsets/create",
  statefulset: "/workloads/statefulsets/create",
  namespace: "/administration/namespaces/create",
  crd: "/administration/custom-resource-definitions/create",
  customresourcedefinition: "/administration/custom-resource-definitions/create",
  resourcequota: "/administration/resource-quotas/create",
  limitrange: "/administration/limit-ranges/create",
  user: "/user-management/create",
  build: "/builds/create",
  volume: "/storage/create",
  template: "/virtualization/templates/create",
  bootablevolume: "/virtualization/bootablevolumes/create",
  migrationpolicy: "/virtualization/migrationpolicies/create",
};

export function prototypeCreatePath(createLabel: string): string {
  const kind = parseCreateLabel(createLabel)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return CREATE_PATHS[kind] ?? `/create/${encodeURIComponent(parseCreateLabel(createLabel))}`;
}
