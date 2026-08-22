import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FormGroup,
  Label,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Title,
} from "@patternfly/react-core";
import RedoIcon from "@patternfly/react-icons/dist/esm/icons/redo-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import {
  CLUSTER_ANALYSIS_FAILED_MESSAGE,
  CLUSTER_CURRENT_VERSION,
  CLUSTER_PATCH_VERSION,
} from "../../constants/clusterVersionDemo";

type AnalysisState = "failed" | "running" | "ready";

const UPDATE_PATHS = [
  { value: "5.0.1-patch-failed", label: `${CLUSTER_PATCH_VERSION} - Patch (Failed)`, failed: true },
  { value: "5.0.1-patch", label: `${CLUSTER_PATCH_VERSION} - Patch`, failed: false },
] as const;

export function UpdatesPlanAnalysisCard({
  onUpdate,
}: {
  onUpdate: (version: string) => void;
}) {
  const isGlass = usePatternFlyGlassActive();
  const [pathOpen, setPathOpen] = useState(false);
  const [pathId, setPathId] = useState<string>(UPDATE_PATHS[0].value);
  const [analysis, setAnalysis] = useState<AnalysisState>("failed");
  const [generatedAt] = useState(() =>
    new Date("2026-08-18T05:07:00").toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  );
  const [expanded, setExpanded] = useState(true);

  const selectedPath = UPDATE_PATHS.find((p) => p.value === pathId) ?? UPDATE_PATHS[0];
  const isFailed = analysis === "failed" || selectedPath.failed;

  const reanalyze = () => {
    setAnalysis("running");
    window.setTimeout(() => {
      setPathId("5.0.1-patch");
      setAnalysis("ready");
    }, 1400);
  };

  return (
    <Card isGlass={isGlass}>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <FormGroup label="Select Update Path" fieldId="cluster-update-path">
            <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
              <Select
                id="cluster-update-path"
                isOpen={pathOpen}
                selected={pathId}
                onSelect={(_e, value) => {
                  const next = String(value);
                  setPathId(next);
                  setPathOpen(false);
                  setAnalysis(next.endsWith("failed") ? "failed" : "ready");
                }}
                onOpenChange={setPathOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setPathOpen((o) => !o)}
                    isExpanded={pathOpen}
                    style={{ minWidth: "16rem" }}
                  >
                    {selectedPath.label}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {UPDATE_PATHS.map((p) => (
                    <SelectOption key={p.value} value={p.value}>
                      {p.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
              {isFailed && analysis !== "running" ? (
                <Label color="red" icon={<TimesCircleIcon />} isCompact>
                  Failed
                </Label>
              ) : null}
            </Flex>
          </FormGroup>

          <Card id="update-to-version-card" isExpanded={expanded} isCompact isGlass={isGlass}>
            <CardHeader
              onExpand={() => setExpanded((v) => !v)}
              actions={{
                actions: (
                  <Button
                    variant="link"
                    isInline
                    icon={analysis === "running" ? <Spinner size="sm" /> : <RedoIcon />}
                    isDisabled={analysis === "running"}
                    onClick={reanalyze}
                  >
                    Re-analyze
                  </Button>
                ),
              }}
            >
              <CardTitle>
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <Title headingLevel="h2" size="md">
                    Update to {CLUSTER_PATCH_VERSION}
                  </Title>
                  {isFailed && analysis !== "running" ? (
                    <Label color="red" icon={<TimesCircleIcon />} isCompact>
                      Failed
                    </Label>
                  ) : null}
                </Flex>
              </CardTitle>
            </CardHeader>
            <CardExpandableContent>
              <CardBody>
                <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                  <Content component="p">
                    <strong>Generated:</strong> {generatedAt}
                  </Content>
                  <Flex
                    gap={{ default: "gapMd" }}
                    alignItems={{ default: "alignItemsCenter" }}
                    flexWrap={{ default: "wrap" }}
                  >
                    <Content component="p">
                      <strong>Proposed Update:</strong> {CLUSTER_CURRENT_VERSION} → {CLUSTER_PATCH_VERSION}
                    </Content>
                    <Button
                      variant="primary"
                      isDisabled={isFailed || analysis === "running"}
                      onClick={() => onUpdate(CLUSTER_PATCH_VERSION)}
                    >
                      Update
                    </Button>
                  </Flex>
                  {analysis === "running" ? (
                    <Alert isInline variant="info" title="Analysis in progress">
                      <Content component="p">Waiting for the analysis agent sandbox…</Content>
                    </Alert>
                  ) : null}
                  {analysis === "failed" ? (
                    <Alert isInline variant="danger" title="Analysis failed">
                      <Content component="p">{CLUSTER_ANALYSIS_FAILED_MESSAGE}</Content>
                    </Alert>
                  ) : null}
                </Flex>
              </CardBody>
            </CardExpandableContent>
          </Card>
        </Flex>
      </CardBody>
    </Card>
  );
}
