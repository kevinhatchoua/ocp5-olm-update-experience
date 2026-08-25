import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  FormGroup,
  Gallery,
  GalleryItem,
  Label,
  Progress,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { useToast } from "../../contexts/ToastContext";
import { GITOPS_DASHBOARD_METRICS, gitopsDetailPath } from "./gitopsData";
import GitOpsInstancePicker, { useGitOpsInstance } from "./GitOpsInstancePicker";
import { ResourceName } from "./gitopsShared";

function sparklineText(values: number[]) {
  return values.map((v) => `${v}%`).join(" · ");
}

export default function GitOpsDashboardPage() {
  const { pushToast } = useToast();
  const { instance } = useGitOpsInstance();
  const [prevInstance, setPrevInstance] = useState(instance);
  const metrics = GITOPS_DASHBOARD_METRICS;

  useEffect(() => {
    pushToast({
      variant: "info",
      title: "Prototype scopes lists to selected Argo CD instance",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast once on mount
  }, []);

  useEffect(() => {
    if (instance !== prevInstance) {
      setPrevInstance(instance);
      pushToast({
        variant: "info",
        title: "Prototype scopes lists to selected Argo CD instance",
      });
    }
  }, [instance, prevInstance, pushToast]);

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Overview", path: "/gitops/overview" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                Overview
              </Title>
              <FavoriteButton name="GitOps Overview" path="/gitops/overview" />
            </Flex>
            <FormGroup label="Argo CD instance" fieldId="gitops-instance-picker">
              <GitOpsInstancePicker />
            </FormGroup>
          </Flex>

          <Content component="p" className="pf-v6-u-color-200">
            Fleet sync and health for the selected Argo CD instance (GITOPS-10917 / HPUX-2073). Instance
            picker scopes this overview — manage instances on{" "}
            <Link to="/gitops/argocd">Argo CD</Link> (HPUX-1941), do not replace that list here.
          </Content>

          <Gallery hasGutter minWidths={{ default: "160px" }}>
            {[
              { label: "Synced", value: metrics.synced, color: "green" as const },
              { label: "Out of sync", value: metrics.outOfSync, color: "orange" as const },
              { label: "Healthy", value: metrics.healthy, color: "green" as const },
              { label: "Degraded", value: metrics.degraded, color: "red" as const },
              { label: "Progressing", value: metrics.progressing, color: "blue" as const },
            ].map((card) => (
              <GalleryItem key={card.label}>
                <Card isCompact>
                  <CardTitle>{card.label}</CardTitle>
                  <CardBody>
                    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                      <Title headingLevel="h2" size="xl">
                        {card.value}
                      </Title>
                      <Label color={card.color} isCompact>
                        {card.label}
                      </Label>
                    </Flex>
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>

          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Title headingLevel="h2" size="lg">
              Sync & reconciliation
            </Title>
            <Progress
              value={metrics.syncSuccessRate}
              title={`Sync success rate (${metrics.syncSuccessRate}%)`}
              measureLocation="outside"
            />
            <Content component="small" className="pf-v6-u-color-200">
              Sync sparkline (24h): {sparklineText(metrics.sparklineSync)}
            </Content>
            <Progress
              value={Math.min(100, Math.round((metrics.reconciliations24h / 200) * 100))}
              title={`Reconciliations (24h): ${metrics.reconciliations24h}`}
              measureLocation="outside"
            />
            <Content component="small" className="pf-v6-u-color-200">
              Reconcile sparkline: {sparklineText(metrics.sparklineReconcile)} · Git fetch failures:{" "}
              {metrics.gitFetchFailures}
            </Content>
          </Flex>

          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Title headingLevel="h2" size="lg">
              Needs attention
            </Title>
            <OcsPrototypeListTable ariaLabel="Applications needing attention">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Namespace">
                    <PlainTableHeader label="Namespace" />
                  </Th>
                  <Th dataLabel="Reason">
                    <PlainTableHeader label="Reason" />
                  </Th>
                  <Th dataLabel="Severity">
                    <PlainTableHeader label="Severity" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {metrics.needsAttention.length === 0 ? (
                  <Tr>
                    <Td colSpan={4}>No applications need attention.</Td>
                  </Tr>
                ) : (
                  metrics.needsAttention.map((row) => {
                    const href = gitopsDetailPath("applications", row.ns, row.name);
                    return (
                      <Tr key={`${row.ns}/${row.name}`}>
                        <Td dataLabel="Name">
                          <ResourceName kind="Application" name={row.name} to={href} />
                        </Td>
                        <Td dataLabel="Namespace">
                          <ResourceName kind="Namespace" name={row.ns} />
                        </Td>
                        <Td dataLabel="Reason">{row.reason}</Td>
                        <Td dataLabel="Severity">
                          <Label
                            color={
                              row.severity === "danger"
                                ? "red"
                                : row.severity === "warning"
                                  ? "orange"
                                  : "blue"
                            }
                            isCompact
                          >
                            {row.severity}
                          </Label>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </OcsPrototypeListTable>
            <Content component="small" className="pf-v6-u-color-200">
              Linked names open Application detail stubs. See also{" "}
              <Link to="/gitops/applications">Applications</Link>.
            </Content>
          </Flex>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
