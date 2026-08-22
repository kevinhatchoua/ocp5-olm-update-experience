import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  Label,
  Spinner,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import RedoIcon from "@patternfly/react-icons/dist/esm/icons/redo-icon";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  ActiveUpdatePlansTable,
  AnalysisPhaseLabel,
  NotRecommendedLabel,
} from "../../components/cluster-update/ActiveUpdatePlansTable";
import { AssessmentReport } from "../../components/cluster-update/AssessmentReport";
import { ClusterSettingsUpdatePanel } from "../../components/cluster-update/ClusterSettingsUpdatePanel";
import {
  AGENTIC_UPDATE_RUNS,
  agenticRunPath,
  type AgenticAnalysisPhase,
} from "../../constants/agenticUpdateRuns";
import { useChat } from "../../contexts/ChatContext";
import { useClusterUpdateDemoVariant } from "../../contexts/ClusterUpdateDemoContext";
import {
  CLUSTER_CURRENT_VERSION,
  CLUSTER_CURRENT_VERSION_PROPOSED,
  CLUSTER_MINOR_BLOCKED,
  CLUSTER_PATCH_VERSION,
} from "../../constants/clusterVersionDemo";
import { isUpdateActivelyRunning, readTargetVersion } from "../../lib/clusterUpdateWorkflow";
import {
  PRECHECK_CANCELLED_EVENT,
  PRECHECK_FINISHED_EVENT,
  finishPrecheckPlan,
  readUpdatePlans,
  startPrecheckPlan,
  useUpdatePlans,
} from "../../lib/updatePlansStore";

type AnalysisUi = "hidden" | "analyzing" | "complete";

const ANALYSIS_DURATION_MS = 3500;

function analysisSandboxFor(targetVersion: string) {
  const from = CLUSTER_CURRENT_VERSION.replace(/\./g, "-");
  const to = targetVersion.replace(/\./g, "-");
  return `ls-analysis-ota-${from}-to-${to}`;
}

function UpdatesPlanTab() {
  const isGlass = usePatternFlyGlassActive();
  const navigate = useNavigate();
  const { setIsOpen } = useChat();
  const { startClusterUpdateDemo, clusterUpdateDemoResetEpoch } = useClusterUpdateDemoVariant();
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetVersion, setTargetVersion] = useState(
    () => readTargetVersion() || CLUSTER_PATCH_VERSION,
  );
  const [expanded, setExpanded] = useState(true);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [analysisUi, setAnalysisUi] = useState<AnalysisUi>("hidden");
  const [autoPrecheck] = useState(() => searchParams.get("precheck") === "1");
  const updateInProgress = isUpdateActivelyRunning();
  void clusterUpdateDemoResetEpoch;

  const plans = useUpdatePlans();
  const selected =
    AGENTIC_UPDATE_RUNS.find((run) => run.targetVersion === targetVersion) ?? AGENTIC_UPDATE_RUNS[0];
  const sandbox = selected.targetVersion === targetVersion ? selected.sandbox : analysisSandboxFor(targetVersion);
  const latestPlan = plans.find((run) => run.targetVersion === targetVersion);
  const displayPhase: AgenticAnalysisPhase =
    analysisUi === "analyzing"
      ? "Analyzing"
      : latestPlan?.phase && latestPlan.phase !== "Analyzing"
        ? latestPlan.phase
        : analysisUi === "complete"
          ? "Failed"
          : "Analyzing";
  const updateBlocked = targetVersion === CLUSTER_MINOR_BLOCKED;

  useEffect(() => {
    if (analysisUi !== "analyzing") return undefined;
    const timer = window.setTimeout(() => {
      const analyzing = readUpdatePlans().find((run) => run.phase === "Analyzing");
      if (analyzing) finishPrecheckPlan(analyzing.id, "failed");
      setAnalysisUi("complete");
    }, ANALYSIS_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [analysisUi]);

  useEffect(() => {
    const onFinished = () => setAnalysisUi("complete");
    const onCancelled = () => setAnalysisUi("hidden");
    window.addEventListener(PRECHECK_FINISHED_EVENT, onFinished);
    window.addEventListener(PRECHECK_CANCELLED_EVENT, onCancelled);
    return () => {
      window.removeEventListener(PRECHECK_FINISHED_EVENT, onFinished);
      window.removeEventListener(PRECHECK_CANCELLED_EVENT, onCancelled);
    };
  }, []);

  useEffect(() => {
    if (!autoPrecheck) return;
    setSearchParams({}, { replace: true });
  }, [autoPrecheck, setSearchParams]);

  const startPrecheckAnalysis = () => {
    setAnalysisUi("analyzing");
    setExpanded(true);
  };

  const reanalyse = () => {
    setIsReanalysing(true);
    startPrecheckPlan(targetVersion);
    setAnalysisUi("analyzing");
    window.setTimeout(() => setIsReanalysing(false), 400);
  };

  const cancelPrecheck = () => {
    const analyzing = readUpdatePlans().find((run) => run.phase === "Analyzing");
    if (analyzing) finishPrecheckPlan(analyzing.id, "cancelled");
    setIsOpen(false);
    setAnalysisUi("hidden");
  };

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="pf-v6-u-pt-lg">
      <ClusterSettingsUpdatePanel
        showAiAssessment={false}
        autoStartPrecheck={autoPrecheck}
        onViewClusterOperators={() =>
          navigate("/administration/cluster-settings?tab=cluster-operators")
        }
        onTargetVersionChange={setTargetVersion}
        onPrecheckStarted={startPrecheckAnalysis}
      />

      {analysisUi !== "hidden" && !updateInProgress ? (
        <Card id="update-to-version-card" isExpanded={expanded} isGlass={isGlass}>
            <CardHeader
              onExpand={() => setExpanded((value) => !value)}
              toggleButtonProps={{
                id: "update-to-version-toggle",
                "aria-label": expanded
                  ? `Collapse update to ${targetVersion}`
                  : `Expand update to ${targetVersion}`,
              }}
              actions={{
                actions: (
                  <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }}>
                    {analysisUi === "complete" ? (
                      <Button
                        variant="primary"
                        isDisabled={updateBlocked}
                        onClick={() => startClusterUpdateDemo(targetVersion)}
                      >
                        Update
                      </Button>
                    ) : null}
                    <Button
                      variant="link"
                      isInline
                      icon={isReanalysing || analysisUi === "analyzing" ? <Spinner size="sm" /> : <RedoIcon />}
                      isDisabled={analysisUi === "analyzing"}
                      onClick={reanalyse}
                    >
                      Re-analyze
                    </Button>
                  </Flex>
                ),
              }}
            >
              <CardTitle>
                <Flex
                  gap={{ default: "gapSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                  flexWrap={{ default: "wrap" }}
                >
                  <Title headingLevel="h2" size="md">
                    Update to {targetVersion}
                  </Title>
                  <AnalysisPhaseLabel phase={displayPhase} />
                  {analysisUi === "complete" && latestPlan?.recommendation === "not-recommended" ? (
                    <NotRecommendedLabel />
                  ) : null}
                </Flex>
              </CardTitle>
            </CardHeader>
            <CardExpandableContent>
              <CardBody>
                <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                    <Content component="p">Generated</Content>
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                      {analysisUi === "analyzing" ? <ClockIcon aria-hidden /> : null}
                      <Content component="p">
                        {analysisUi === "analyzing" ? "Just now" : selected.generatedAt}
                      </Content>
                    </Flex>
                  </Flex>
                  <Flex
                    gap={{ default: "gapMd" }}
                    alignItems={{ default: "alignItemsCenter" }}
                    flexWrap={{ default: "wrap" }}
                  >
                    <Content component="p">
                      <strong>Proposed Update:</strong> {CLUSTER_CURRENT_VERSION_PROPOSED} →{" "}
                      {targetVersion}
                    </Content>
                    <AnalysisPhaseLabel phase={displayPhase} />
                  </Flex>
                  {analysisUi === "analyzing" ? (
                    <div className="ocs-analysis-agent-status">
                      <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsFlexStart" }}>
                        <Spinner size="md" aria-label="AI agent analysing cluster readiness" />
                        <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                          <Content component="p">
                            <strong>AI agent is analysing cluster readiness...</strong>
                          </Content>
                          <Content component="p">
                            Sandbox: {sandbox} —{" "}
                            <Button
                              variant="link"
                              isInline
                              component={(props) => (
                                <Link {...props} to={`${agenticRunPath(latestPlan?.id ?? selected.id)}?logs=1`} />
                              )}
                            >
                              View pod logs
                            </Button>
                            {" · "}
                            <Button variant="link" isInline onClick={cancelPrecheck}>
                              Cancel precheck
                            </Button>
                          </Content>
                        </Flex>
                      </Flex>
                    </div>
                  ) : (
                    <AssessmentReport />
                  )}
                </Flex>
              </CardBody>
            </CardExpandableContent>
          </Card>
      ) : null}
    </Flex>
  );
}

export default function ClusterUpdatePage() {
  const [activeTab, setActiveTab] = useState<"update" | "update-plans">("update");

  return (
    <div className="ocs-app-page-outer flex-1 min-w-0 min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Administration", path: "/administration/cluster-update" },
          { label: "Cluster Update" },
        ]}
      >
        <Content className="mb-6">
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
          >
            <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }}>
              <h1 id="main-title">Cluster Update</h1>
              <Label color="orange" isCompact>
                Tech preview
              </Label>
            </Flex>
            <FavoriteButton name="Cluster Update" path="/administration/cluster-update" />
          </Flex>
          <p>
            Select a version, run AI precheck from Cluster Settings or the version modal, then review the
            assessment report. Use <strong>Update plans</strong> for agentic runs.
          </p>
        </Content>

        <Tabs
          id="cluster-update-page-tabs"
          className="ocs-overview-tabs"
          aria-label="Cluster update"
          activeKey={activeTab}
          onSelect={(_event, eventKey) => {
            if (eventKey === "update" || eventKey === "update-plans") {
              setActiveTab(eventKey);
            }
          }}
        >
          <Tab eventKey="update" title={<TabTitleText>Update</TabTitleText>}>
            <UpdatesPlanTab />
          </Tab>
          <Tab eventKey="update-plans" title={<TabTitleText>Update plans</TabTitleText>}>
            <div className="pf-v6-u-pt-lg">
              <ActiveUpdatePlansTable />
            </div>
          </Tab>
        </Tabs>
      </Breadcrumbs>
    </div>
  );
}
