import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FormGroup,
  Icon,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Popover,
  Radio,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
  Switch,
  ExpandableSection,
  MenuToggle,
} from "@patternfly/react-core";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import ArrowCircleUpIcon from "@patternfly/react-icons/dist/esm/icons/arrow-circle-up-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import RhUiAiInfoIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-ai-info-icon";
import { Sparkles } from "@/lib/pfIcons";
import { useChat } from "../../contexts/ChatContext";
import { useClusterUpdateDemoVariant } from "../../contexts/ClusterUpdateDemoContext";
import {
  CLUSTER_BLOCKER_MESSAGE,
  CLUSTER_CANNOT_UPDATE_MINOR_TITLE,
  CLUSTER_CHANNEL,
  CLUSTER_CURRENT_VERSION,
  CLUSTER_IRREVERSIBLE_UPDATE,
  CLUSTER_IRREVERSIBLE_UPDATE_TITLE,
  CLUSTER_MINOR_BLOCKED,
  CLUSTER_PATCH_VERSION,
  CLUSTER_VERSION_OPTIONS,
  markClusterUpdateStarted,
  readClusterUpdateStarted,
} from "../../constants/clusterVersionDemo";
import { ClusterUpdateInProgressStatus } from "./ClusterUpdateInProgressStatus";
import {
  isUpdateActivelyRunning,
  readPreflightPhase,
  readTargetChannel,
  readTargetVersion,
  readUpdateInProgress,
  writePreflightPhase,
  writeTargetChannel,
  writeTargetVersion,
} from "../../lib/clusterUpdateWorkflow";
import {
  finishPrecheckPlan,
  startPrecheckPlan,
} from "../../lib/updatePlansStore";

export function ClusterBlockedUpdateAlert({
  onViewOperators,
  includeInstalledOperatorsLink = true,
}: {
  onViewOperators: () => void;
  includeInstalledOperatorsLink?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <Alert
      isInline
      variant="warning"
      title={CLUSTER_CANNOT_UPDATE_MINOR_TITLE}
      actionLinks={
        <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
          <Button variant="link" isInline onClick={onViewOperators}>
            View ClusterOperators
          </Button>
          {includeInstalledOperatorsLink ? (
            <Button variant="link" isInline onClick={() => navigate("/ecosystem/installed-operators")}>
              View installed Operators
            </Button>
          ) : null}
        </Flex>
      }
    >
      <Content component="p">{CLUSTER_BLOCKER_MESSAGE}</Content>
    </Alert>
  );
}

export function ClusterSettingsAiAssessment({
  onPrecheck,
  onUpdateStatus,
  onDrillDown,
  onApplyRemediation,
  showUpdateStatus,
  preflightTargetLabel,
  preflightFailed,
}: {
  onPrecheck: () => void;
  onUpdateStatus: () => void;
  onDrillDown: () => void;
  onApplyRemediation: () => void;
  showUpdateStatus: boolean;
  preflightTargetLabel?: string;
  preflightFailed?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <Card
      id="cluster-settings-ai-assessment"
      isExpanded={expanded}
      className="pf-v6-u-border-color-info pf-v6-u-border-width-sm ocs-ai-assessment-card"
      data-test="cluster-settings-update-assessment-box"
    >
      <CardHeader
        onExpand={() => setExpanded((value) => !value)}
        toggleButtonProps={{
          id: "update-assessment-toggle",
          "aria-label": expanded ? "Collapse AI assessment" : "Expand AI assessment",
        }}
      >
        <CardTitle>AI assessment</CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          {preflightTargetLabel ? (
            <Alert
              isInline
              variant="info"
              className="pf-v6-u-mb-md"
              customIcon={<Sparkles aria-hidden />}
              title={preflightTargetLabel}
              data-test="settings-preflight-target-banner"
            >
              Pre-flight validation only — cluster is not in an Updating phase.
            </Alert>
          ) : null}
          <Alert
            isInline
            variant="info"
            customIcon={<Sparkles aria-hidden />}
            title="Cluster issues detected"
            actionLinks={
              showUpdateStatus ? (
                <Button
                  variant="primary"
                  size="sm"
                  data-test="ols-update-status"
                  icon={<Sparkles aria-hidden />}
                  onClick={onUpdateStatus}
                >
                  Update status
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  data-test="ols-precheck-cluster"
                  icon={<RhUiAiInfoIcon aria-hidden />}
                  onClick={onPrecheck}
                >
                  Precheck your cluster with AI
                </Button>
              )
            }
          >
            <Stack hasGutter>
              <StackItem>
                <Label color="red" isCompact>
                  Issue detected
                </Label>
              </StackItem>
              <StackItem>
                <Content component="p" style={{ whiteSpace: "pre-line" }}>
                  {`1 cluster operator is experiencing issues and needs to be healthy before the cluster can be updated.

Affected operators: machine-config (degraded)

Check the operator status and ensure they have sufficient resources and network connectivity.`}
                </Content>
              </StackItem>
              {preflightFailed ? (
                <StackItem>
                  <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<RhUiAiInfoIcon aria-hidden />}
                      onClick={onDrillDown}
                      data-test="settings-drill-down-lightspeed"
                    >
                      Learn more with AI
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onApplyRemediation}
                      data-test="settings-apply-remediation"
                    >
                      Apply Recommended Remediation
                    </Button>
                  </Flex>
                </StackItem>
              ) : null}
              <StackItem>
                <ExpandableSection
                  toggleText="View technical details"
                  isExpanded={detailsOpen}
                  onToggle={(_event, next) => setDetailsOpen(next)}
                >
                  <Content component="pre" className="ocs-agentic-run__code">
                    {`machine-config
  Status: Degraded=True
  Reason: MachineConfigControllerFailed
  Message: Failed to resync 5.0.0-ec.6 because: during waitForControllerConfigToBeCompleted: [context deadline exceeded, controllerconfig is not completed: status for ControllerConfig machine-config-controller is being reported for 14, expecting it for 26]`}
                  </Content>
                </ExpandableSection>
              </StackItem>
            </Stack>
          </Alert>
          <Alert
            isInline
            isPlain
            variant="warning"
            className="pf-v6-u-mt-sm"
            title={CLUSTER_IRREVERSIBLE_UPDATE_TITLE}
            data-test="update-assessment-irreversibility-notice"
          >
            {CLUSTER_IRREVERSIBLE_UPDATE}
          </Alert>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
}

function ClusterUpdatePathGraph({ onBlockedVersion }: { onBlockedVersion: () => void }) {
  return (
    <div className="co-cluster-settings__updates-graph" data-test="cv-updates-graph">
      <div className="co-channel" data-test="cv-channel">
        <ul
          className="co-channel-path co-channel-path--current"
          aria-label={`${CLUSTER_CURRENT_VERSION} to ${CLUSTER_PATCH_VERSION}; ${CLUSTER_MINOR_BLOCKED} blocked on ${CLUSTER_CHANNEL} channel`}
        >
          <li className="co-channel-line">
            <span className="co-channel-version co-channel-version--current" data-test="cv-channel-version">
              {CLUSTER_CURRENT_VERSION}
            </span>
            <div className="co-channel-version-dot co-channel-version-dot--current" data-test="cv-channel-version-dot" />
          </li>
          <li className="co-channel-line">
            <span className="co-channel-version" data-test="cv-channel-version">
              {CLUSTER_PATCH_VERSION}
            </span>
            <div className="co-channel-version-dot" data-test="cv-channel-version-dot" />
          </li>
          <li className="co-channel-line">
            <span className="co-channel-version co-channel-version--update-blocked" data-test="cv-channel-version-blocked">
              <ExclamationTriangleIcon
                className="co-channel-version__warning-icon co-icon-space-r"
                aria-hidden
              />
              {CLUSTER_MINOR_BLOCKED}
            </span>
            <Button
              variant="secondary"
              className="co-channel-version-dot co-channel-version-dot--update-blocked"
              data-test="cv-channel-version-dot-blocked"
              aria-label={`${CLUSTER_MINOR_BLOCKED} update blocked`}
              onClick={onBlockedVersion}
            />
          </li>
        </ul>
        <span className="co-channel-name co-channel-name--current" data-test="cv-channel-name">
          {CLUSTER_CHANNEL} channel
        </span>
      </div>
    </div>
  );
}

function SelectVersionModal({
  isOpen,
  onClose,
  onPrecheck,
  onUpdate,
  onViewOperators,
  onVersionChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPrecheck: (version: string) => void;
  onUpdate: (version: string) => void;
  onViewOperators: () => void;
  onVersionChange?: (version: string) => void;
}) {
  const [selectedVersion, setSelectedVersion] = useState(
    () => readTargetVersion() || CLUSTER_PATCH_VERSION,
  );
  const [includeKnownIssues, setIncludeKnownIssues] = useState(false);
  const [updateScope, setUpdateScope] = useState<"full" | "control-plane">("full");
  const [versionOpen, setVersionOpen] = useState(false);

  const visibleVersions = CLUSTER_VERSION_OPTIONS.filter(
    (option) => includeKnownIssues || !option.knownIssues,
  );
  const recommended = visibleVersions.filter((option) => !option.knownIssues);
  const knownIssueVersions = visibleVersions.filter((option) => option.knownIssues);
  const isBlocked = selectedVersion === CLUSTER_MINOR_BLOCKED;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedVersion(readTargetVersion() || CLUSTER_PATCH_VERSION);
  }, [isOpen]);

  const chooseVersion = (version: string) => {
    setSelectedVersion(version);
    writeTargetVersion(version);
    onVersionChange?.(version);
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="select-version-title"
      aria-describedby="select-version-body"
    >
      <ModalHeader title="Select a version" labelId="select-version-title" />
      <ModalBody id="select-version-body">
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <ClusterBlockedUpdateAlert
            onViewOperators={() => {
              onClose();
              onViewOperators();
            }}
            includeInstalledOperatorsLink={false}
          />
          <div>
            <Content component="p" className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
              Current version
            </Content>
            <Content component="p">{CLUSTER_CURRENT_VERSION}</Content>
          </div>
          <FormGroup label="Select a version" fieldId="select-version-choice">
            <Select
              id="select-version-choice"
              isOpen={versionOpen}
              selected={selectedVersion}
              onSelect={(_event, value) => {
                chooseVersion(String(value));
                setVersionOpen(false);
              }}
              onOpenChange={setVersionOpen}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setVersionOpen((open) => !open)}
                  isExpanded={versionOpen}
                  aria-label="Select a version"
                  style={{ minWidth: "16rem" }}
                >
                  {selectedVersion}
                </MenuToggle>
              )}
            >
              <div className="ocs-select-version-menu-toggle" onClick={(e) => e.stopPropagation()}>
                <Switch
                  id="include-known-issues"
                  label="Include versions with known issues"
                  isChecked={includeKnownIssues}
                  onChange={(_e, checked) => setIncludeKnownIssues(checked)}
                />
                <Popover
                  headerContent="Versions with known issues"
                  bodyContent="When enabled, the list includes releases that ship with documented known issues."
                >
                  <Button variant="plain" aria-label="More information for known issues" icon={<InfoCircleIcon />} />
                </Popover>
              </div>
              <div className="ocs-select-version-menu-divider" aria-hidden />
              <SelectList>
                <SelectOption isDisabled className="ocs-select-version-group">
                  Recommended
                </SelectOption>
                {recommended.map((option) => (
                  <SelectOption key={option.version} value={option.version}>
                    {option.blocked ? (
                      <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                        <span>{option.version}</span>
                        <Label
                          color="orange"
                          variant="outline"
                          isCompact
                          icon={<ExclamationTriangleIcon />}
                        >
                          Update blocked
                        </Label>
                      </Flex>
                    ) : (
                      option.version
                    )}
                  </SelectOption>
                ))}
                {includeKnownIssues && knownIssueVersions.length > 0 ? (
                  <>
                    <SelectOption isDisabled className="ocs-select-version-group">
                      Known issues
                    </SelectOption>
                    {knownIssueVersions.map((option) => (
                      <SelectOption key={option.version} value={option.version}>
                        {option.version}
                      </SelectOption>
                    ))}
                  </>
                ) : null}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup
            label={
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapXs" }}>
                <span>Update options</span>
                <Popover
                  headerContent="Update options"
                  bodyContent="Choose whether worker and custom pool nodes update with the control plane, or pause those pools to fit your maintenance window."
                >
                  <Button variant="plain" aria-label="More information for update options" icon={<InfoCircleIcon />} />
                </Popover>
              </Flex>
            }
            fieldId="update-scope"
          >
            <Radio
              id="update-scope-full"
              name="update-scope"
              label="Full cluster update"
              description="Control plane, Worker, and custom pool Nodes are updated concurrently. This might take longer, so make sure to allocate enough time for maintenance."
              isChecked={updateScope === "full"}
              onChange={() => setUpdateScope("full")}
            />
            <Radio
              id="update-scope-cp"
              name="update-scope"
              label="Control plane only update"
              description="Pause Worker or custom pool Node updates to accommodate your maintenance schedule."
              isChecked={updateScope === "control-plane"}
              onChange={() => setUpdateScope("control-plane")}
            />
          </FormGroup>
          <Alert
            isInline
            variant="custom"
            customIcon={<RhUiAiInfoIcon aria-hidden />}
            title="Update Prerequisites"
            className="ocs-update-prerequisites"
          >
            <Content component="p">
              Updating from {CLUSTER_CURRENT_VERSION} to {selectedVersion}
            </Content>
            <Button
              variant="secondary"
              icon={<RhUiAiInfoIcon aria-hidden />}
              isDisabled={isBlocked}
              onClick={() => onPrecheck(selectedVersion)}
            >
              Precheck your cluster with AI
            </Button>
          </Alert>
          <Alert isInline isPlain variant="warning" title={CLUSTER_IRREVERSIBLE_UPDATE_TITLE}>
            <Content component="p">{CLUSTER_IRREVERSIBLE_UPDATE}</Content>
          </Alert>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={isBlocked} onClick={() => onUpdate(selectedVersion)}>
          Update
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function ClusterSettingsUpdatePanel({
  onViewClusterOperators,
  onPrecheckStarted,
  onTargetVersionChange,
  showAiAssessment = true,
  autoStartPrecheck = false,
  navigateOnPrecheck,
}: {
  onViewClusterOperators: () => void;
  /** Fired when the user starts an AI precheck (does not start an update). */
  onPrecheckStarted?: () => void;
  /** Fired when the Select a version modal changes the target version. */
  onTargetVersionChange?: (version: string) => void;
  /** When false, only channel/version status + select modal are shown (Cluster Update page). */
  showAiAssessment?: boolean;
  /** Start OLS + analysis once on mount (e.g. navigated from Settings with ?precheck=1). */
  autoStartPrecheck?: boolean;
  /** If set, Precheck from the AI assessment card navigates here instead of running in place. */
  navigateOnPrecheck?: string;
}) {
  const navigate = useNavigate();
  const { setIsOpen, setContext, context, isOpen } = useChat();
  const { clusterUpdateDemoResetEpoch, startClusterUpdateDemo } = useClusterUpdateDemoVariant();
  const [selectVersionOpen, setSelectVersionOpen] = useState(false);
  const [updateStarted, setUpdateStarted] = useState(readClusterUpdateStarted);
  const [preflightPhase, setPreflightPhase] = useState(readPreflightPhase);
  const targetVersion = readTargetVersion() || CLUSTER_PATCH_VERSION;
  const targetChannel = readTargetChannel() || CLUSTER_CHANNEL;
  const updateLocked = isUpdateActivelyRunning();
  void clusterUpdateDemoResetEpoch;
  const autoStartedRef = useRef(false);
  const activePlanIdRef = useRef<string | null>(null);
  const precheckTimerRef = useRef<number>();
  const lightsOpenRef = useRef(isOpen);

  const openPrecheck = (version = targetVersion, channel = targetChannel) => {
    if (updateLocked) return;
    writeTargetVersion(version);
    writeTargetChannel(channel);
    writePreflightPhase("validating");
    setPreflightPhase("validating");
    onTargetVersionChange?.(version);
    const run = startPrecheckPlan(version, channel);
    activePlanIdRef.current = run.id;
    onPrecheckStarted?.();
    setContext(`ols-preflight:${version}:${channel}`);
    setIsOpen(true);
    if (precheckTimerRef.current) window.clearTimeout(precheckTimerRef.current);
    precheckTimerRef.current = window.setTimeout(() => {
      if (activePlanIdRef.current !== run.id) return;
      if (isUpdateActivelyRunning()) return;
      finishPrecheckPlan(run.id, "failed");
      if (activePlanIdRef.current !== run.id) return;
      writePreflightPhase("failed");
      setPreflightPhase("failed");
      activePlanIdRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    const wasOpen = lightsOpenRef.current;
    lightsOpenRef.current = isOpen;
    if (!wasOpen || isOpen || !activePlanIdRef.current) return;
    const runId = activePlanIdRef.current;
    if (precheckTimerRef.current) window.clearTimeout(precheckTimerRef.current);
    finishPrecheckPlan(runId, "cancelled");
    writePreflightPhase("idle");
    setPreflightPhase("idle");
    activePlanIdRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!autoStartPrecheck || autoStartedRef.current || updateLocked) return;
    autoStartedRef.current = true;
    openPrecheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot on land
  }, [autoStartPrecheck]);

  const openUpdateStatus = () => {
    if (context === "ols-update-status") {
      setContext("");
      window.setTimeout(() => setContext("ols-update-status"), 0);
      return;
    }
    setContext("ols-update-status");
    setIsOpen(true);
  };

  const openRemediation = () => {
    setContext("ols-preflight-remediation");
    setIsOpen(true);
  };

  const applyRemediation = () => {
    setContext("ols-preflight-apply-remediation");
    setIsOpen(true);
  };

  const handleAssessmentPrecheck = () => {
    if (navigateOnPrecheck) {
      writeTargetVersion(targetVersion);
      writeTargetChannel(targetChannel);
      navigate(`${navigateOnPrecheck}${navigateOnPrecheck.includes("?") ? "&" : "?"}precheck=1`);
      return;
    }
    openPrecheck();
  };

  return (
    <>
      <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
        {showAiAssessment ? (
          <>
            <ClusterBlockedUpdateAlert onViewOperators={onViewClusterOperators} />
            <ClusterSettingsAiAssessment
              onPrecheck={handleAssessmentPrecheck}
              onUpdateStatus={openUpdateStatus}
              onDrillDown={openRemediation}
              onApplyRemediation={applyRemediation}
              showUpdateStatus={updateStarted && updateLocked}
              preflightFailed={preflightPhase === "failed"}
              preflightTargetLabel={undefined}
            />
          </>
        ) : null}
        {!showAiAssessment ? (
          updateLocked ? (
            <ClusterUpdateInProgressStatus
              targetVersion={readUpdateInProgress()?.version || targetVersion}
              channel={targetChannel}
              currentVersion={CLUSTER_CURRENT_VERSION}
            />
          ) : (
        <div className="co-cluster-settings" aria-label="Cluster update status">
          <div className="co-cluster-settings__row">
            <div className="co-cluster-settings__section co-cluster-settings__section--current">
              <DescriptionList className="co-cluster-settings__details">
                <DescriptionListGroup>
                  <DescriptionListTerm data-test="cv-current-version-header">Current version</DescriptionListTerm>
                  <DescriptionListDescription data-test="cv-current-version">
                    <span className="co-select-to-copy" data-test="cluster-version" data-test-id="cluster-version">
                      {CLUSTER_CURRENT_VERSION}
                    </span>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </div>
            <div className="co-cluster-settings__section">
              <div className="co-cluster-settings__row">
                <DescriptionList className="co-cluster-settings__details co-cluster-settings__details--status">
                  <DescriptionListGroup>
                    <DescriptionListTerm>Update status</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div className="co-update-status" data-test="cv-update-status-available-updates">
                        {preflightPhase === "validating" ? (
                          <>
                            <Icon status="info">
                              <InfoCircleIcon />
                            </Icon>{" "}
                            Pre-flight validation (not updating)
                          </>
                        ) : (
                          <>
                            <Icon status="info">
                              <ArrowCircleUpIcon />
                            </Icon>{" "}
                            Available updates
                          </>
                        )}
                      </div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
                <div className="co-cluster-settings__row">
                  <DescriptionList className="co-cluster-settings__details">
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        <Popover
                          headerContent="Channel"
                          bodyContent="Channels help to control the pace of updates and recommend the appropriate release versions. Update channels are tied to a minor version of OpenShift Container Platform."
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
                          data-test-id="current-channel-update-link"
                          icon={<PencilAltIcon />}
                          iconPosition="end"
                          onClick={() => setSelectVersionOpen(true)}
                        >
                          {CLUSTER_CHANNEL}
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                  <div className="co-cluster-settings__details">
                    <Button
                      variant="primary"
                      data-test="cv-update-button"
                      data-test-id="cv-update-button"
                      onClick={() => setSelectVersionOpen(true)}
                    >
                      Select a version
                    </Button>
                  </div>
                </div>
              </div>
              <ClusterUpdatePathGraph onBlockedVersion={() => setSelectVersionOpen(true)} />
              <div className="co-cluster-settings__updates-progress" data-test="cv-updates-progress" />
            </div>
          </div>
        </div>
          )
        ) : null}
      </Flex>
      {!showAiAssessment ? (
      <SelectVersionModal
        isOpen={selectVersionOpen}
        onClose={() => setSelectVersionOpen(false)}
        onViewOperators={onViewClusterOperators}
        onVersionChange={onTargetVersionChange}
        onPrecheck={(version) => {
          setSelectVersionOpen(false);
          onTargetVersionChange?.(version);
          openPrecheck(version, CLUSTER_CHANNEL);
        }}
        onUpdate={(version) => {
          markClusterUpdateStarted();
          setUpdateStarted(true);
          writeTargetVersion(version);
          setSelectVersionOpen(false);
          startClusterUpdateDemo(version);
        }}
      />
      ) : null}
    </>
  );
}
