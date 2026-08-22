import {
  CLUSTER_ANALYSIS_SANDBOX_MINOR,
  CLUSTER_ANALYSIS_SANDBOX_PATCH,
  CLUSTER_BLOCKER_MESSAGE,
  CLUSTER_CHANNEL,
  CLUSTER_CURRENT_VERSION,
  CLUSTER_MINOR_BLOCKED,
  CLUSTER_PATCH_VERSION,
} from "./clusterVersionDemo";

export const AGENTIC_RUNS_LIST_PATH = "/agentic-runs";
export const AGENTIC_RUN_NAMESPACE = "openshift-lightspeed";
export const AGENTIC_RUN_TRIGGER_DOMAIN = "cluster-version-operator";

export type AgenticAnalysisPhase = "Analyzing" | "Analysed" | "Failed" | "Cancelled";
export type AgenticRunStatus = "Completed" | "Failed" | "Cancelled" | "In progress";

export type AgenticUpdateRun = {
  id: string;
  targetVersion: string;
  updateType: "Patch" | "Minor";
  phase: AgenticAnalysisPhase;
  status: AgenticRunStatus;
  age: string;
  generatedAt: string;
  created: string;
  sandbox: string;
  channel: string;
  updatePath: string;
  otherRecommended: string;
  selectedOption: string;
  namespace: string;
  triggerDomain: string;
  tokensConsumed: string;
  recommendation: "not-recommended" | null;
};

export const AGENTIC_UPDATE_RUNS: AgenticUpdateRun[] = [
  {
    id: "ota-5-0-0-ec-6-to-5-0-1",
    targetVersion: CLUSTER_PATCH_VERSION,
    updateType: "Patch",
    phase: "Analysed",
    status: "Completed",
    age: "Aug 21, 2026, 8:16 AM",
    generatedAt: "Aug 21, 2026, 8:16 AM",
    created: "6 minutes ago",
    sandbox: CLUSTER_ANALYSIS_SANDBOX_PATCH,
    channel: CLUSTER_CHANNEL,
    updatePath: "Recommended",
    otherRecommended: CLUSTER_MINOR_BLOCKED,
    namespace: AGENTIC_RUN_NAMESPACE,
    triggerDomain: AGENTIC_RUN_TRIGGER_DOMAIN,
    tokensConsumed: "-",
    recommendation: "not-recommended",
    selectedOption:
      "Block upgrade to 5.0.1 until the cloud credential secret is restored and operator compatibility is confirmed",
  },
  {
    id: "ota-5-0-0-ec-6-to-5-1-0",
    targetVersion: CLUSTER_MINOR_BLOCKED,
    updateType: "Minor",
    phase: "Analysed",
    status: "Completed",
    age: "1 minute ago",
    generatedAt: "Aug 21, 2026, 8:16 AM",
    created: "6 minutes ago",
    sandbox: CLUSTER_ANALYSIS_SANDBOX_MINOR,
    channel: CLUSTER_CHANNEL,
    updatePath: "Recommended",
    otherRecommended: CLUSTER_PATCH_VERSION,
    namespace: AGENTIC_RUN_NAMESPACE,
    triggerDomain: AGENTIC_RUN_TRIGGER_DOMAIN,
    tokensConsumed: "-",
    recommendation: "not-recommended",
    selectedOption:
      "Block upgrade to 5.1.0 until the cloud credential secret is restored and operator compatibility is confirmed",
  },
];

export type ReadinessCheckStatus = "fail" | "warn" | "pass";

export type ReadinessCheck = {
  check: string;
  status: ReadinessCheckStatus;
  details: string;
};

export const MINOR_READINESS_CHECKS: ReadinessCheck[] = [
  {
    check: "API Deprecations",
    status: "pass",
    details: "No APIs removed in the target release are in use",
  },
  {
    check: "Cluster Conditions",
    status: "fail",
    details: "Parent credentials secret missing: kube-system/aws-creds",
  },
  {
    check: "etcd Health",
    status: "pass",
    details: "etcd members are healthy",
  },
  {
    check: "Network",
    status: "pass",
    details: "OVN-Kubernetes is available",
  },
  {
    check: "Node Capacity",
    status: "pass",
    details: "All nodes ready and schedulable",
  },
  {
    check: "OLM Operator Lifecycle",
    status: "warn",
    details: "Compatibility for OCP 5.0 could not be confirmed for several operators",
  },
  {
    check: "Operator Health",
    status: "fail",
    details: "cloud-credential and machine-config report issues",
  },
  {
    check: "PDB Drain",
    status: "warn",
    details: "kube-apiserver guard PDB has disruptionsAllowed=0",
  },
];

export type OlmOperatorRow = {
  name: string;
  version: string;
  channel: string;
  compatible: boolean;
  lifecycle: string;
};

export const ASSESSMENT_OLM_OPERATORS: OlmOperatorRow[] = [
  {
    name: "cert-manager Operator for Red Hat OpenShift",
    version: "1.20.0",
    channel: "stable-v1",
    compatible: false,
    lifecycle: "Full Support",
  },
  {
    name: "Red Hat build of Keycloak Operator",
    version: "26.6.4-opr.1",
    channel: "stable-v26.6",
    compatible: false,
    lifecycle: "Full Support",
  },
  {
    name: "DNS Operator",
    version: "1.4.1",
    channel: "stable",
    compatible: false,
    lifecycle: "Full Support",
  },
  {
    name: "MCP Gateway Operator (Tech Preview)",
    version: "0.7.1",
    channel: "preview",
    compatible: false,
    lifecycle: "Maintenance Support",
  },
  {
    name: "Advanced Cluster Security for Kubernetes",
    version: "4.17.0-nightly.2025.08.12",
    channel: "latest",
    compatible: false,
    lifecycle: "Maintenance Support",
  },
];

export const OPERATOR_HEALTH_WARNING_COMMAND =
  "oc get clusteroperator cloud-credential machine-config && oc get mcp";

export const PDB_DRAIN_WARNING_COMMAND =
  "oc get pdb kube-apiserver-guard-pdb -n openshift-kube-apiserver -o wide";

export const OLM_OPERATORS_WARNING_COMMAND = "oc get subscription -A && oc get csv -A";

export const CLUSTER_CONDITIONS_BLOCKER_COMMAND =
  "oc get secret -n kube-system aws-creds -o yaml && oc wait --for=jsonpath='{.status.conditions[?(@.type==\"Upgradeable\")].status}'='True' clusteroperator/cloud-credential --timeout=5m";

export const OLM_LIFECYCLE_WARNING_COMMAND = OLM_OPERATORS_WARNING_COMMAND;

export function agenticRunPath(runId: string): string {
  return `${AGENTIC_RUNS_LIST_PATH}/${encodeURIComponent(runId)}`;
}

export function getAgenticUpdateRun(runId: string): AgenticUpdateRun | undefined {
  try {
    const raw = localStorage.getItem("ocs-demo-update-plans");
    if (raw) {
      const parsed = JSON.parse(raw) as AgenticUpdateRun[];
      const stored = parsed.find((run) => run.id === runId);
      if (stored) return stored;
    }
  } catch {
    /* fall through to seed data */
  }
  return AGENTIC_UPDATE_RUNS.find((run) => run.id === runId);
}

export function analysisRequestPrompt(): string {
  return [
    "You are an OpenShift upgrade advisor. Analyze Cluster Readiness Data for this cluster and produce a risk assessment for the proposed update.",
    "",
    "Classify each finding as a blocker, warning, or info.",
    "",
    "Use the update-advisor skill for cluster update readiness. Use the product-lifecycle skill to cross-reference operator and OCP compatibility.",
  ].join("\n");
}

export function clusterReadinessJson(run: AgenticUpdateRun): string {
  return JSON.stringify({
    current_version: CLUSTER_CURRENT_VERSION,
    target_version: run.targetVersion,
    channel: run.channel,
    update_type: run.updateType,
    checks: [
      {
        name: "cloud-credential-secret",
        status: "fail",
        message: CLUSTER_BLOCKER_MESSAGE,
      },
    ],
    api_deprecations: [],
  });
}

export function analysisLogLines(run: AgenticUpdateRun): string {
  return [
    `[analysis] sandbox=${run.sandbox}`,
    "[analysis] loading ClusterVersion and operator compatibility",
    "[analysis] skill=update-advisor",
    "[analysis] skill=product-lifecycle",
    `[analysis] proposed path ${CLUSTER_CURRENT_VERSION} → ${run.targetVersion} (${run.updateType})`,
    `[analysis] blocker: ${CLUSTER_BLOCKER_MESSAGE}`,
    "[analysis] writing remediation option",
  ].join("\n");
}
