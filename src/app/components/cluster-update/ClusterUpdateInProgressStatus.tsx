import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Popover,
  Progress,
  ProgressSize,
} from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import OutlinedQuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import SyncAltIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {
  CLUSTER_CHANNEL,
  CLUSTER_CURRENT_VERSION,
} from "../../constants/clusterVersionDemo";
import { useClusterUpdateDemoVariant } from "../../contexts/ClusterUpdateDemoContext";
import { readUpdateInProgress } from "../../lib/clusterUpdateWorkflow";

type ProgressBucket = {
  label: string;
  completed: number;
  total: number;
  percent: number;
  help?: string;
};

const OPERATOR_TOTAL = 25;
const MASTER_TOTAL = 3;
const WORKER_TOTAL = 8;

/** Staggered 0→100% timelines (ms). */
const OPERATOR_DURATION_MS = 40_000;
const MASTER_DURATION_MS = 50_000;
const WORKER_DURATION_MS = 65_000;
const MASTER_DELAY_MS = 2_500;
const WORKER_DELAY_MS = 6_000;

function clampPct(value: number): number {
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}

function pctFromElapsed(elapsedMs: number, delayMs: number, durationMs: number): number {
  const t = elapsedMs - delayMs;
  if (t <= 0) return 0;
  return clampPct((t / durationMs) * 100);
}

function progressFromElapsed(elapsedMs: number): {
  operators: number;
  masters: number;
  workers: number;
  operatorPct: number;
  masterPct: number;
  workerPct: number;
} {
  const operatorPct = pctFromElapsed(elapsedMs, 0, OPERATOR_DURATION_MS);
  const masterPct = pctFromElapsed(elapsedMs, MASTER_DELAY_MS, MASTER_DURATION_MS);
  const workerPct = pctFromElapsed(elapsedMs, WORKER_DELAY_MS, WORKER_DURATION_MS);
  return {
    operatorPct,
    masterPct,
    workerPct,
    operators: Math.min(OPERATOR_TOTAL, Math.floor((operatorPct / 100) * OPERATOR_TOTAL)),
    masters: Math.min(MASTER_TOTAL, Math.floor((masterPct / 100) * MASTER_TOTAL)),
    workers: Math.min(WORKER_TOTAL, Math.floor((workerPct / 100) * WORKER_TOTAL)),
  };
}

function parseStartedAt(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return parsed;
    const asNum = Number(raw);
    if (Number.isFinite(asNum)) return asNum;
  }
  return Date.now();
}

function UpdateProgressRow({ label, completed, total, percent, help }: ProgressBucket) {
  const value = Math.round(percent);
  return (
    <div className="co-cluster-settings__progress-item" data-test={`cv-progress-${label}`}>
      <Flex
        alignItems={{ default: "alignItemsCenter" }}
        gap={{ default: "gapXs" }}
        className="co-cluster-settings__progress-label"
      >
        <Button
          variant="link"
          isInline
          component={(props) => (
            <Link
              {...props}
              to={
                label === "Cluster Operators"
                  ? "/administration/cluster-settings?tab=cluster-operators"
                  : "/compute/nodes"
              }
            />
          )}
        >
          {label}
        </Button>
        {help ? (
          <Popover headerContent={label} bodyContent={help}>
            <Button
              variant="plain"
              aria-label={`More information for ${label}`}
              icon={<OutlinedQuestionCircleIcon />}
              className="co-cluster-settings__progress-help"
            />
          </Popover>
        ) : null}
      </Flex>
      <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} className="co-cluster-settings__progress-meta">
        <Content component="small">
          {completed} of {total}
        </Content>
        <Content component="small">{value}%</Content>
      </Flex>
      <Progress
        value={value}
        size={ProgressSize.sm}
        aria-label={`${label} update progress ${value}%`}
        measureLocation="none"
      />
    </div>
  );
}

/**
 * OpenShift console-aligned “update in progress” status card (replaces the channel path graph).
 */
export function ClusterUpdateInProgressStatus({
  targetVersion,
  channel = CLUSTER_CHANNEL,
  currentVersion = CLUSTER_CURRENT_VERSION,
}: {
  targetVersion?: string;
  channel?: string;
  currentVersion?: string;
}) {
  const { clusterUpdateDemoResetEpoch } = useClusterUpdateDemoVariant();
  const stored = readUpdateInProgress();
  const version = targetVersion || stored?.version || "5.0.1";
  const startedAt = parseStartedAt(stored?.startedAt);

  const [progress, setProgress] = useState(() => progressFromElapsed(Date.now() - startedAt));

  useEffect(() => {
    const tick = () => setProgress(progressFromElapsed(Date.now() - startedAt));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [startedAt, clusterUpdateDemoResetEpoch]);

  const releaseNotesHref = `https://docs.openshift.com/container-platform/5.0/release_notes/ocp-${currentVersion.replace(/\./g, "-")}.html`;

  return (
    <div className="co-cluster-settings co-cluster-settings--updating" aria-label="Cluster update in progress">
      <div className="co-cluster-settings__row">
        <div className="co-cluster-settings__section co-cluster-settings__section--current">
          <DescriptionList className="co-cluster-settings__details" isHorizontal={false}>
            <DescriptionListGroup>
              <DescriptionListTerm data-test="cv-current-version-header">Current version</DescriptionListTerm>
              <DescriptionListDescription data-test="cv-current-version">
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  <span className="co-select-to-copy" data-test="cluster-version" data-test-id="cluster-version">
                    {currentVersion}
                  </span>
                  <Button
                    variant="link"
                    isInline
                    component="a"
                    href={releaseNotesHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="end"
                  >
                    View release notes
                  </Button>
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </div>

        <div className="co-cluster-settings__section co-cluster-settings__section--updating">
          <div className="co-cluster-settings__updating-header">
            <DescriptionList className="co-cluster-settings__details co-cluster-settings__details--status">
              <DescriptionListGroup>
                <DescriptionListTerm>Update status</DescriptionListTerm>
                <DescriptionListDescription>
                  <div className="co-update-status" data-test="cv-update-status-updating">
                    <SyncAltIcon className="co-update-status__sync" aria-hidden />
                    <span>Update to {version} in progress</span>
                  </div>
                  <Button
                    variant="link"
                    isInline
                    className="co-cluster-settings__view-conditions"
                    component={(props) => (
                      <Link {...props} to="/administration/cluster-update" />
                    )}
                  >
                    View conditions
                  </Button>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>

            <DescriptionList className="co-cluster-settings__details co-cluster-settings__details--channel">
              <DescriptionListGroup>
                <DescriptionListTerm>
                  <Popover
                    headerContent="Channel"
                    bodyContent="Channels help to control the pace of updates and recommend the appropriate release versions."
                  >
                    <span className="pf-v6-c-description-list__text pf-m-help-text" role="button" tabIndex={0}>
                      Channel
                    </span>
                  </Popover>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Button
                    variant="link"
                    isInline
                    data-test="current-channel-update-link"
                    icon={<PencilAltIcon />}
                    iconPosition="end"
                    isDisabled
                  >
                    {channel}
                  </Button>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </div>

          <div className="co-cluster-settings__updates-progress" data-test="cv-updates-progress">
            <UpdateProgressRow
              label="Cluster Operators"
              completed={progress.operators}
              total={OPERATOR_TOTAL}
              percent={progress.operatorPct}
            />
            <UpdateProgressRow
              label="Master Nodes"
              completed={progress.masters}
              total={MASTER_TOTAL}
              percent={progress.masterPct}
            />
            <UpdateProgressRow
              label="Worker Nodes"
              completed={progress.workers}
              total={WORKER_TOTAL}
              percent={progress.workerPct}
              help="Worker and custom MachineConfigPools update after or alongside the control plane, depending on your update options."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
