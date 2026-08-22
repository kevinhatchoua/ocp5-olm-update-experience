/** Demo facts aligned to JuLim’s implemented Cluster Settings / Cluster Update surfaces. */

export const CLUSTER_CURRENT_VERSION = "5.0.0-ec.6";
export const CLUSTER_PATCH_VERSION = "5.0.1";
export const CLUSTER_MINOR_BLOCKED = "5.1.0";
export const CLUSTER_CHANNEL = "simple";

/** Select-a-version options (5.0+). Known-issue builds shown only when the toggle is on. */
export type ClusterVersionOption = {
  version: string;
  blocked?: boolean;
  knownIssues?: boolean;
  recommended?: boolean;
};

export const CLUSTER_VERSION_OPTIONS: ClusterVersionOption[] = [
  { version: "5.0.1", recommended: true },
  { version: "5.0.2", recommended: true },
  { version: "5.0.3", recommended: true },
  { version: "5.0.4", recommended: true },
  { version: "5.0.5", recommended: true },
  { version: "5.0.6", recommended: true },
  { version: "5.1.0", blocked: true },
  { version: "5.0.0-rc.2", knownIssues: true },
  { version: "5.0.7", knownIssues: true },
  { version: "5.0.8", knownIssues: true },
  { version: "5.1.1", knownIssues: true },
];
export const CLUSTER_LIGHTSPEED_VERSION = "1.1.3";
export const CLUSTER_ID = "ea311972-4cd3-4177-b534-3531d77b76be";
export const CLUSTER_SLA_DAYS_REMAINING = 57;

export const CLUSTER_BLOCKER_SECRET = "kube-system/aws-creds";

export const CLUSTER_BLOCKER_MESSAGE =
  "Parent credentials secret must be restored prior to upgrade: kube-system/aws-creds";

export const CLUSTER_CANNOT_UPDATE_MINOR_TITLE = `Your cluster cannot update to 5.1. You can continue to install patch releases in 5.0.`;

export const CLUSTER_IRREVERSIBLE_UPDATE =
  "After an update begins, you cannot roll back to the previous version.";

export const CLUSTER_IRREVERSIBLE_UPDATE_TITLE = "Cluster updates are irreversible";

const CLUSTER_UPDATE_STARTED_KEY = "ocs-demo-cluster-update-started";

export function readClusterUpdateStarted(): boolean {
  try {
    return sessionStorage.getItem(CLUSTER_UPDATE_STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markClusterUpdateStarted(): void {
  try {
    sessionStorage.setItem(CLUSTER_UPDATE_STARTED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearClusterUpdateStarted(): void {
  try {
    sessionStorage.removeItem(CLUSTER_UPDATE_STARTED_KEY);
  } catch {
    /* ignore */
  }
}

/** Proposed-update path display in Cluster Update (JuLim console uses dotted EC). */
export const CLUSTER_CURRENT_VERSION_PROPOSED = "5.0.0.ec.6";

export const CLUSTER_ANALYSIS_SANDBOX_PATCH = "ls-analysis-ota-5-0-0-ec-6-to-5-0-1";
export const CLUSTER_ANALYSIS_SANDBOX_MINOR = "ls-analysis-ota-5-0-0-ec-6-to-5-1-0";

export const CLUSTER_ANALYSIS_FAILED_MESSAGE =
  `analysis agent call: wait for sandbox: timeout waiting for pod '${CLUSTER_ANALYSIS_SANDBOX_PATCH}' after 5m0s`;

export const CLUSTER_PAYLOAD_VERIFY_FAILURE = `Retrieving payload failed version="${CLUSTER_PATCH_VERSION}"
image="quay.io/openshift-release-dev/ocp-release@sha256:00000000000000000000000000000000000000000000000000004c4b41"
failure=The update cannot be verified: verification is not possible`;
