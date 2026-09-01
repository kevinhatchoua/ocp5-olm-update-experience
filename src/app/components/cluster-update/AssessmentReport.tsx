import { Link } from "react-router";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CodeBlock,
  CodeBlockCode,
  Content,
  Flex,
  Label,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import RhUiAiInfoIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-ai-info-icon";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import { useChat } from "../../contexts/ChatContext";
import { OcsNamedResourceDataView, PlainTableHeader } from "../dataView/OcsPrototypeListTable";
import { NotRecommendedLabel } from "./ActiveUpdatePlansTable";
import {
  ASSESSMENT_OLM_OPERATORS,
  CLUSTER_CONDITIONS_BLOCKER_COMMAND,
  MINOR_READINESS_CHECKS,
  OLM_OPERATORS_WARNING_COMMAND,
  OPERATOR_HEALTH_WARNING_COMMAND,
  PDB_DRAIN_WARNING_COMMAND,
  type OlmOperatorRow,
  type ReadinessCheckStatus,
} from "../../constants/agenticUpdateRuns";
import { CLUSTER_BLOCKER_MESSAGE, CLUSTER_BLOCKER_SECRET } from "../../constants/clusterVersionDemo";

function readinessIcon(status: ReadinessCheckStatus) {
  if (status === "fail") return <ExclamationCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />;
  if (status === "warn") return <ExclamationTriangleIcon color="var(--pf-t--global--icon--color--status--warning--default)" />;
  return <CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" />;
}

function readinessLabelColor(status: ReadinessCheckStatus): "red" | "orange" | "green" {
  if (status === "fail") return "red";
  if (status === "warn") return "orange";
  return "green";
}

function readinessCheckName(row: (typeof MINOR_READINESS_CHECKS)[number]) {
  return row.check;
}

function olmName(row: OlmOperatorRow) {
  return row.name;
}

/** Full AI assessment report (readiness + remediations + OLM operators). */
export function AssessmentReport({ showLightSpeedActions = true }: { showLightSpeedActions?: boolean }) {
  const isGlass = usePatternFlyGlassActive();
  const { setIsOpen, setContext } = useChat();

  const openRemediation = () => {
    setContext("ols-preflight-remediation");
    setIsOpen(true);
  };

  const applyRemediation = () => {
    setContext("ols-preflight-apply-remediation");
    setIsOpen(true);
  };

  const lightSpeedActions = showLightSpeedActions ? (
    <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
      <Button
        variant="primary"
        size="sm"
        icon={<RhUiAiInfoIcon aria-hidden />}
        onClick={openRemediation}
        data-test="drill-down-lightspeed"
      >
        Learn more with AI
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={applyRemediation}
        data-test="apply-recommended-remediation"
      >
        Apply Recommended Remediation
      </Button>
    </Flex>
  ) : null;

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} data-test="assessment-report">
      <Card isGlass={isGlass} aria-label="AI Assessment">
        <CardHeader>
          <CardTitle>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
              AI Assessment
              <NotRecommendedLabel />
            </Flex>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card isGlass={isGlass}>
        <CardHeader>
          <CardTitle>Readiness Checks</CardTitle>
        </CardHeader>
        <CardBody>
          <OcsNamedResourceDataView
            ouiaId="readiness-checks-data-view"
            ariaLabel="Readiness checks"
            itemsLabel="checks"
            items={MINOR_READINESS_CHECKS}
            getName={readinessCheckName}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Check">
                      <PlainTableHeader label="Check" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Details">
                      <PlainTableHeader label="Details" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row) => (
                    <Tr key={row.check}>
                      <Td dataLabel="Check">{row.check}</Td>
                      <Td dataLabel="Status">
                        <Flex gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsCenter" }}>
                          {readinessIcon(row.status)}
                          <Label color={readinessLabelColor(row.status)} isCompact>
                            {row.status}
                          </Label>
                        </Flex>
                      </Td>
                      <Td dataLabel="Details">{row.details}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
        </CardBody>
      </Card>

      <Alert isInline variant="danger" title="Blocker: Cluster Conditions">
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <Content component="p">
            The update is blocked because ClusterVersion is not Upgradeable. {CLUSTER_BLOCKER_MESSAGE}. Restore
            the AWS root credentials secret ({CLUSTER_BLOCKER_SECRET}) before continuing.
          </Content>
          <Content component="p">
            <strong>Prerequisite</strong>
          </Content>
          <Content component="p">
            Confirm the secret exists and wait until the cloud-credential operator reports Upgradeable=True.
          </Content>
          <CodeBlock>
            <CodeBlockCode>{CLUSTER_CONDITIONS_BLOCKER_COMMAND}</CodeBlockCode>
          </CodeBlock>
          {lightSpeedActions}
        </Flex>
      </Alert>

      <Alert isInline variant="warning" title="Warning: Operator Health">
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <Content component="p">
            The machine-config operator is degraded and cloud-credential reports upgrade gating issues. Operator
            health must stabilize before a safe update.
          </Content>
          <Content component="p">
            <strong>Prerequisite</strong>
          </Content>
          <Content component="p">Confirm operators are no longer degraded before Approve &amp; Start Update.</Content>
          <CodeBlock>
            <CodeBlockCode>{OPERATOR_HEALTH_WARNING_COMMAND}</CodeBlockCode>
          </CodeBlock>
          {showLightSpeedActions ? (
            <Flex>
              <Button variant="secondary" size="sm" icon={<RhUiAiInfoIcon aria-hidden />} onClick={openRemediation}>
                Learn more with AI
              </Button>
            </Flex>
          ) : null}
        </Flex>
      </Alert>

      <Alert isInline variant="warning" title="Warning: PDB Drain">
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <Content component="p">
            The kube-apiserver guard PDB has disruptionsAllowed=0 with minAvailable=2/2. Control plane PDBs
            commonly serialize disruption during upgrades; this is not by itself a stop condition, but it can
            prolong node draining and should be watched during execution.
          </Content>
          <Content component="p">
            <strong>Prerequisite</strong>
          </Content>
          <Content component="p">
            No pre-change is required if this is the expected control-plane guard PDB, but upgrade execution
            should monitor master drain progress and apiserver availability.
          </Content>
          <CodeBlock>
            <CodeBlockCode>{PDB_DRAIN_WARNING_COMMAND}</CodeBlockCode>
          </CodeBlock>
        </Flex>
      </Alert>

      <Alert isInline variant="warning" title="Warning: OLM Operator Lifecycle">
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <Content component="p">
            Installed operators are at their latest versions, but compatibility for OCP 5.0 could not be confirmed
            for several packages (including openshift-cert-manager-operator, rhbk-operator, and dns-operator).
            Missing lifecycle data increases upgrade risk and requires human validation.
          </Content>
          <Content component="p">
            <strong>Prerequisite</strong>
          </Content>
          <Content component="p">
            Validate each installed operator&apos;s support statement for OCP 5.0. For Red Hat operators, move to
            a channel/version explicitly certified for OCP 5.0 if available.
          </Content>
          <CodeBlock>
            <CodeBlockCode>{OLM_OPERATORS_WARNING_COMMAND}</CodeBlockCode>
          </CodeBlock>
          <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
            {showLightSpeedActions ? (
              <Button variant="secondary" size="sm" icon={<RhUiAiInfoIcon aria-hidden />} onClick={openRemediation}>
                Learn more with AI
              </Button>
            ) : null}
            <Button
              variant="link"
              isInline
              component={(props) => <Link {...props} to="/ecosystem/installed-operators" />}
            >
              View installed Operators
            </Button>
          </Flex>
        </Flex>
      </Alert>

      <Card isGlass={isGlass}>
        <CardHeader>
          <CardTitle>OLM Operators</CardTitle>
        </CardHeader>
        <CardBody>
          <OcsNamedResourceDataView
            ouiaId="olm-operators-assessment-data-view"
            ariaLabel="OLM Operators"
            itemsLabel="operators"
            items={ASSESSMENT_OLM_OPERATORS}
            getName={olmName}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Operator">
                      <PlainTableHeader label="Operator" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Channel">
                      <PlainTableHeader label="Channel" />
                    </Th>
                    <Th dataLabel="Compatible">
                      <PlainTableHeader label="Compatible" />
                    </Th>
                    <Th dataLabel="Lifecycle">
                      <PlainTableHeader label="Lifecycle" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row) => (
                    <Tr key={row.name}>
                      <Td dataLabel="Operator">{row.name}</Td>
                      <Td dataLabel="Version">{row.version}</Td>
                      <Td dataLabel="Channel">{row.channel}</Td>
                      <Td dataLabel="Compatible">
                        <Flex gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsCenter" }}>
                          <TimesCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />
                          <Label color="red" isCompact>
                            No
                          </Label>
                        </Flex>
                      </Td>
                      <Td dataLabel="Lifecycle">{row.lifecycle}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
        </CardBody>
      </Card>
    </Flex>
  );
}

/** @deprecated Prefer AssessmentReport */
export function UpdatesPlanResults() {
  return <AssessmentReport />;
}
