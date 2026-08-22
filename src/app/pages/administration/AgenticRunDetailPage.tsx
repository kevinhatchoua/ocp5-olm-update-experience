import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
  Content,
  Divider,
  ExpandableSection,
  Flex,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { AssessmentReport } from "../../components/cluster-update/AssessmentReport";
import { LIGHTSPEED_AUTONOMOUS_FEATURES_DISCLAIMER } from "../../components/lightspeed/LightspeedLegalCopy";
import {
  AGENTIC_RUNS_LIST_PATH,
  agenticRunPath,
  analysisLogLines,
  analysisRequestPrompt,
  clusterReadinessJson,
  getAgenticUpdateRun,
  type AgenticUpdateRun,
} from "../../constants/agenticUpdateRuns";
import { CLUSTER_CURRENT_VERSION } from "../../constants/clusterVersionDemo";
import { downloadUpdatePlanReport } from "../../lib/updatePlansStore";

function downloadPlan(run: AgenticUpdateRun) {
  downloadUpdatePlanReport(run);
}

function AgenticRunDetailsContent({
  run,
  logsOpen,
  setLogsOpen,
  optionOpen,
  setOptionOpen,
}: {
  run: AgenticUpdateRun;
  logsOpen: boolean;
  setLogsOpen: (open: boolean) => void;
  optionOpen: boolean;
  setOptionOpen: (open: boolean) => void;
}) {
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="pf-v6-u-pt-lg">
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
        <Title headingLevel="h2" size="lg">
          Agentic run details
        </Title>
        <Alert isInline variant="custom" customIcon={<InfoCircleIcon />} title={LIGHTSPEED_AUTONOMOUS_FEATURES_DISCLAIMER} />
      </Flex>

      <section className="ocs-pod-details__section" aria-label="Analysis request">
        <Flex
          gap={{ default: "gapSm" }}
          alignItems={{ default: "alignItemsCenter" }}
          className="ocs-pod-details__section-title"
        >
          <Title headingLevel="h2" size="lg">
            Analysis request
          </Title>
          <Tooltip content="Instructions sent to the analysis agent">
            <Button variant="plain" icon={<InfoCircleIcon />} aria-label="Analysis request information" />
          </Tooltip>
        </Flex>
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <CodeBlock className="ocs-agentic-run__code">
            <CodeBlockCode>{analysisRequestPrompt()}</CodeBlockCode>
          </CodeBlock>
          <Divider />
          <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
            <Content component="p">Current version: OCP {CLUSTER_CURRENT_VERSION}</Content>
            <Content component="p">Target version: OCP {run.targetVersion}</Content>
            <Content component="p">Channel: {run.channel}</Content>
            <Content component="p">Update type: {run.updateType}</Content>
            <Content component="p">Update path: {run.updatePath}</Content>
            <Content component="p">
              Other recommended versions available: {run.otherRecommended}{" "}
              <Button
                variant="link"
                isInline
                component="a"
                href="https://access.redhat.com/errata/"
                target="_blank"
                rel="noopener noreferrer"
              >
                errata
              </Button>
            </Content>
          </Flex>
          <Title headingLevel="h3" size="md">
            Cluster Readiness Data
          </Title>
          <CodeBlock className="ocs-agentic-run__code">
            <CodeBlockCode>{clusterReadinessJson(run)}</CodeBlockCode>
          </CodeBlock>
          <ExpandableSection
            toggleText="View Analysis logs"
            isExpanded={logsOpen}
            onToggle={(_event, next) => setLogsOpen(next)}
          >
            <CodeBlock className="ocs-agentic-run__code">
              <CodeBlockCode>{analysisLogLines(run)}</CodeBlockCode>
            </CodeBlock>
          </ExpandableSection>
        </Flex>
      </section>

      <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
        <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
          <Title headingLevel="h2" size="lg">
            Remediation hub
          </Title>
          <Label isCompact>AI-generated</Label>
        </Flex>
        <Content component="p">Created Just now</Content>
      </Flex>

      <ExpandableSection
        toggleText="Selected option"
        isExpanded={optionOpen}
        onToggle={(_event, next) => setOptionOpen(next)}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Content component="p">
            <strong>{run.selectedOption}</strong>
          </Content>
          <Button variant="link" isInline icon={<DownloadIcon />} onClick={() => downloadPlan(run)}>
            Download plan
          </Button>
        </Flex>
      </ExpandableSection>
    </Flex>
  );
}

export default function AgenticRunDetailPage() {
  const { runId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const decodedId = decodeURIComponent(runId);
  const run = getAgenticUpdateRun(decodedId);
  const [logsOpen, setLogsOpen] = useState(searchParams.get("logs") === "1");
  const [optionOpen, setOptionOpen] = useState(true);
  const initialTab = searchParams.get("tab") === "report" ? "report" : "details";
  const [activeTab, setActiveTab] = useState<"details" | "report">(initialTab);

  if (!run) {
    return (
      <div className="ocs-app-page-outer flex-1 min-w-0 min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Agentic runs", path: AGENTIC_RUNS_LIST_PATH },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            Agentic run not found
          </Title>
          <Button
            variant="link"
            component={(props) => <Link {...props} to={AGENTIC_RUNS_LIST_PATH} />}
            className="pf-v6-u-mt-md"
          >
            Back to Agentic runs
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = agenticRunPath(run.id);

  return (
    <div className="ocs-app-page-outer flex-1 min-w-0 min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Agentic runs", path: AGENTIC_RUNS_LIST_PATH },
          { label: run.id },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsFlexStart" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                <Label color="blue" isCompact className="ocs-resource-label">
                  AR
                </Label>
                <Title headingLevel="h1" size="2xl" id="main-title">
                  {run.id}
                </Title>
                <Label color="orange" isCompact>
                  Dev preview
                </Label>
              </Flex>
              <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                <Label
                  color={
                    run.status === "Completed"
                      ? "green"
                      : run.status === "Failed"
                        ? "red"
                        : run.status === "Cancelled"
                          ? "grey"
                          : "blue"
                  }
                  isCompact
                >
                  {run.status}
                </Label>
                <Label isCompact>Trigger domain: {run.triggerDomain}</Label>
              </Flex>
              <Content component="p">Created {run.created}</Content>
            </Flex>
            <FavoriteButton name={run.id} path={detailPath} />
          </Flex>

          <Tabs
            id="agentic-run-detail-tabs"
            className="ocs-overview-tabs"
            aria-label="Agentic run"
            activeKey={activeTab}
            onSelect={(_event, eventKey) => {
              if (eventKey === "details" || eventKey === "report") {
                setActiveTab(eventKey);
              }
            }}
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
              <AgenticRunDetailsContent
                run={run}
                logsOpen={logsOpen}
                setLogsOpen={setLogsOpen}
                optionOpen={optionOpen}
                setOptionOpen={setOptionOpen}
              />
            </Tab>
            <Tab eventKey="report" title={<TabTitleText>Report</TabTitleText>}>
              <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-pt-lg">
                <Flex
                  gap={{ default: "gapSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                  flexWrap={{ default: "wrap" }}
                >
                  <Title headingLevel="h2" size="lg">
                    Update to {run.targetVersion}
                  </Title>
                  <Label color="green" isCompact>
                    Analyzed
                  </Label>
                  {run.recommendation === "not-recommended" ? (
                    <Label color="red" isCompact>
                      NOT RECOMMENDED
                    </Label>
                  ) : null}
                </Flex>
                <Content component="p">
                  Proposed update: {CLUSTER_CURRENT_VERSION} → {run.targetVersion} · Generated {run.generatedAt}
                </Content>
                <AssessmentReport />
              </Flex>
            </Tab>
          </Tabs>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
