import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FormGroup,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Spinner,
} from "@patternfly/react-core";
import RhUiAiInfoIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-ai-info-icon";
import {
  CLUSTER_CURRENT_VERSION,
  CLUSTER_MINOR_BLOCKED,
  CLUSTER_PATCH_VERSION,
} from "../../constants/clusterVersionDemo";
import {
  UPDATE_CHANNELS,
  canRunPreflight,
  isUpdateActivelyRunning,
  preflightBannerTitle,
  readPreflightPhase,
  readTargetChannel,
  readTargetVersion,
  writePreflightPhase,
  writeTargetChannel,
  writeTargetVersion,
  type PreflightPhase,
} from "../../lib/clusterUpdateWorkflow";
import { finishPrecheckPlan, startPrecheckPlan } from "../../lib/updatePlansStore";

type Props = {
  onRunPreflight: (version: string, channel: string) => void;
  onApproveStart?: (version: string, channel: string) => void;
  showApproveStart?: boolean;
};

/**
 * Version-first plan controls: channel + target version must be chosen before preflight.
 * Selectors stay enabled during ValidationMode; only an active update locks them.
 */
export function UpdatePlanTargetCard({ onRunPreflight, onApproveStart, showApproveStart }: Props) {
  const updateLocked = isUpdateActivelyRunning();
  const [channel, setChannel] = useState(readTargetChannel);
  const [version, setVersion] = useState(() => readTargetVersion() || CLUSTER_PATCH_VERSION);
  const [phase, setPhase] = useState<PreflightPhase>(readPreflightPhase);
  const [channelOpen, setChannelOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const activePlanIdRef = useRef<string | null>(null);

  useEffect(() => {
    writeTargetChannel(channel);
  }, [channel]);

  useEffect(() => {
    writeTargetVersion(version);
  }, [version]);

  const preflightEnabled = canRunPreflight(version) && phase !== "validating";

  const runPreflight = () => {
    if (!preflightEnabled) return;
    writePreflightPhase("validating");
    setPhase("validating");
    const run = startPrecheckPlan(version, channel);
    activePlanIdRef.current = run.id;
    onRunPreflight(version, channel);
    window.setTimeout(() => {
      if (activePlanIdRef.current !== run.id) return;
      if (isUpdateActivelyRunning()) return;
      finishPrecheckPlan(run.id, "failed");
      writePreflightPhase("failed");
      setPhase("failed");
      activePlanIdRef.current = null;
    }, 2200);
  };

  const cancelActivePlan = () => {
    if (!activePlanIdRef.current) return;
    finishPrecheckPlan(activePlanIdRef.current, "cancelled");
    activePlanIdRef.current = null;
  };

  return (
    <Card data-test="update-plan-target-card">
      <CardHeader>
        <CardTitle>Target channel &amp; version</CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Content component="p">
            Current version: <strong>{CLUSTER_CURRENT_VERSION}</strong>. Select a target before running a
            pre-flight check. Pre-flight validates readiness only — it does not start an update.
          </Content>

          <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }} alignItems={{ default: "alignItemsFlexEnd" }}>
            <FormGroup label="Channel" fieldId="update-plan-channel">
              <Select
                id="update-plan-channel"
                isOpen={channelOpen}
                selected={channel}
                onSelect={(_e, value) => {
                  setChannel(String(value));
                  setChannelOpen(false);
                  cancelActivePlan();
                  writePreflightPhase("idle");
                  setPhase("idle");
                }}
                onOpenChange={setChannelOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setChannelOpen((o) => !o)}
                    isExpanded={channelOpen}
                    isDisabled={updateLocked}
                    style={{ minWidth: "12rem" }}
                  >
                    {channel}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {UPDATE_CHANNELS.map((c) => (
                    <SelectOption key={c} value={c}>
                      {c}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </FormGroup>

            <FormGroup label="Target version" fieldId="update-plan-version">
              <Select
                id="update-plan-version"
                isOpen={versionOpen}
                selected={version}
                onSelect={(_e, value) => {
                  setVersion(String(value));
                  setVersionOpen(false);
                  cancelActivePlan();
                  writePreflightPhase("idle");
                  setPhase("idle");
                }}
                onOpenChange={setVersionOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setVersionOpen((o) => !o)}
                    isExpanded={versionOpen}
                    isDisabled={updateLocked}
                    style={{ minWidth: "12rem" }}
                  >
                    {version}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  <SelectOption value={CLUSTER_PATCH_VERSION}>{CLUSTER_PATCH_VERSION} (recommended)</SelectOption>
                  <SelectOption value={CLUSTER_MINOR_BLOCKED}>
                    {CLUSTER_MINOR_BLOCKED} (blocked)
                  </SelectOption>
                </SelectList>
              </Select>
            </FormGroup>
          </Flex>

          {(phase === "validating" || phase === "failed" || phase === "passed") && version ? (
            <Alert
              isInline
              variant={phase === "failed" ? "danger" : phase === "passed" ? "success" : "info"}
              title={preflightBannerTitle(version, channel)}
              data-test="preflight-target-banner"
            >
              {phase === "validating" ? (
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <Spinner size="sm" aria-label="Pre-flight validation in progress" />
                  <Content component="p" style={{ margin: 0 }}>
                    ValidationMode — version selection remains available. An update has not started.
                  </Content>
                </Flex>
              ) : phase === "failed" ? (
                <Content component="p" style={{ margin: 0 }}>
                  Pre-flight found blockers for OCP {version}. Resolve issues before Approve &amp; Start
                  Update. Cluster status remains ready — not Updating.
                </Content>
              ) : (
                <Content component="p" style={{ margin: 0 }}>
                  Pre-flight passed for OCP {version}. You can approve and start the update when ready.
                </Content>
              )}
            </Alert>
          ) : null}

          <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
            <Button
              variant="secondary"
              icon={phase === "validating" ? <Spinner size="sm" /> : <RhUiAiInfoIcon aria-hidden />}
              isDisabled={!preflightEnabled || updateLocked}
              onClick={runPreflight}
              data-test="run-preflight-check"
            >
              Run Pre-Flight Check
            </Button>
            {showApproveStart && onApproveStart ? (
              <Button
                variant="primary"
                isDisabled={updateLocked || version === CLUSTER_MINOR_BLOCKED || phase === "validating"}
                onClick={() => onApproveStart(version, channel)}
                data-test="approve-start-update"
              >
                Approve &amp; Start Update
              </Button>
            ) : null}
          </Flex>
          {!version || version === CLUSTER_MINOR_BLOCKED ? (
            <Content component="small">
              Choose a valid target version to enable pre-flight. {CLUSTER_MINOR_BLOCKED} remains blocked until
              prerequisites are resolved.
            </Content>
          ) : null}
        </Flex>
      </CardBody>
    </Card>
  );
}
