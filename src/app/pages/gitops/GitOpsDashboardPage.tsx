import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  Gallery,
  GalleryItem,
  Grid,
  GridItem,
  Label,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import {
  ARGO_INSTANCES,
  GITOPS_ALL_INSTANCES,
  GITOPS_APPLICATION_SETS,
  GITOPS_ROLLOUTS,
  applicationSetsForInstance,
  applicationsForInstance,
  appProjectsForInstance,
  dashboardMetricsForInstance,
  gitopsDetailPath,
  recentOperationsForInstance,
} from "./gitopsData";
import GitOpsInstancePicker, { useGitOpsInstance } from "./GitOpsInstancePicker";
import { HealthStatus, ResourceName } from "./gitopsShared";

function Donut({
  percent,
  label,
  countLabel,
}: {
  percent: number;
  label: string;
  countLabel: string;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <Flex direction={{ default: "column" }} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--pf-t--global--border--color--default)" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="var(--pf-t--global--color--status--success--default)"
          strokeWidth="10"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
        />
        <text
          x="55"
          y="52"
          textAnchor="middle"
          fill="currentColor"
          fontSize="16"
          fontWeight={600}
        >
          {percent}%
        </text>
        <text x="55" y="70" textAnchor="middle" fill="currentColor" fontSize="11">
          {label}
        </text>
      </svg>
      <Content component="small">{countLabel}</Content>
    </Flex>
  );
}

const RECONCILE_SERIES = [
  { t: "0h", v: 8 },
  { t: "4h", v: 14 },
  { t: "8h", v: 11 },
  { t: "12h", v: 18 },
  { t: "16h", v: 16 },
  { t: "20h", v: 19 },
  { t: "24h", v: 17 },
];

export default function GitOpsDashboardPage() {
  const navigate = useNavigate();
  const { instance, setInstance } = useGitOpsInstance();
  const apps = applicationsForInstance(instance);
  const metrics = dashboardMetricsForInstance(instance);
  const projects = appProjectsForInstance(instance);
  const appSets = applicationSetsForInstance(instance);
  const operations = recentOperationsForInstance(instance);
  const instances =
    instance === GITOPS_ALL_INSTANCES
      ? ARGO_INSTANCES
      : ARGO_INSTANCES.filter((a) => `${a.ns}/${a.name}` === instance);
  const totalApps = apps.length;
  const syncedPct = totalApps === 0 ? 100 : metrics.syncSuccessRate;
  const healthyPct = totalApps === 0 ? 100 : Math.round((metrics.healthy / totalApps) * 100);
  const connected = instances.filter((i) => i.clusterConnectivity.startsWith("1")).length;

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
                GitOps Overview
              </Title>
              <FavoriteButton name="GitOps Overview" path="/gitops/overview" />
            </Flex>
            <GitOpsInstancePicker instance={instance} setInstance={setInstance} />
          </Flex>

          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapLg" }}
          >
            <Flex gap={{ default: "gapXl" }} flexWrap={{ default: "wrap" }}>
              <div>
                <Title headingLevel="h2" size="2xl">
                  {totalApps}
                </Title>
                <Content component="small">Applications</Content>
              </div>
              <div>
                <Title headingLevel="h2" size="xl">
                  {syncedPct}% Synced
                </Title>
                <Content component="small">Sync status</Content>
              </div>
              <div>
                <Title headingLevel="h2" size="xl">
                  {healthyPct}% Healthy
                </Title>
                <Content component="small">Health status</Content>
              </div>
              <div>
                <Title headingLevel="h2" size="xl">
                  {metrics.needsAttention.length}
                </Title>
                <Content component="small">Needs attention</Content>
              </div>
            </Flex>
            <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <ButtonLink to="/gitops/applicationsets">{appSets.length} AppSets</ButtonLink>
              <ButtonLink to="/gitops/appprojects">{projects.length} Projects</ButtonLink>
              <ButtonLink to="/gitops/argocd">{instances.length} Instances</ButtonLink>
            </Flex>
          </Flex>

          <Grid hasGutter>
            <GridItem md={4}>
              <Card isFullHeight>
                <CardTitle>Sync status</CardTitle>
                <CardBody>
                  <Donut percent={syncedPct} label="Synced" countLabel={`${metrics.synced}/${totalApps || 0} Synced`} />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={4}>
              <Card isFullHeight>
                <CardTitle>Health status</CardTitle>
                <CardBody>
                  <Donut
                    percent={healthyPct}
                    label="Healthy"
                    countLabel={`${metrics.healthy}/${totalApps || 0} Healthy`}
                  />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={4}>
              <Card isFullHeight>
                <CardTitle>Operational metrics</CardTitle>
                <CardBody>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                    <MetricRow label="Sync success rate" value={`${syncedPct}%`} />
                    <MetricRow label="Failed syncs (24h)" value={String(metrics.gitFetchFailures)} tone="success" />
                    <MetricRow
                      label="Reconciliations (1h)"
                      value={<Label color="blue" isCompact>{Math.max(8, Math.round(metrics.reconciliations24h / 8))}</Label>}
                    />
                    <MetricRow
                      label="Cluster connectivity"
                      value={
                        <Label color={connected === instances.length ? "green" : "orange"} isCompact>
                          {connected}/{instances.length || 0}
                        </Label>
                      }
                    />
                    <MetricRow label="Repo queue" value="0" tone="success" />
                    <MetricRow label="Git fetch failures (24h)" value={String(metrics.gitFetchFailures)} />
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={6}>
              <Card isFullHeight>
                <CardTitle>Sync activity (24h)</CardTitle>
                <CardBody>
                  {metrics.outOfSync === 0 && operations.every((o) => o.phase === "Succeeded") ? (
                    <Content component="p" className="pf-v6-u-color-200">
                      No sync operations in the last 24 hours.
                    </Content>
                  ) : (
                    <Content component="p">
                      {metrics.outOfSync} application{metrics.outOfSync === 1 ? "" : "s"} currently out of sync.
                    </Content>
                  )}
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={6}>
              <Card isFullHeight>
                <CardTitle>Reconciliation activity (24h)</CardTitle>
                <CardBody>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={RECONCILE_SERIES}>
                        <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 24]} tick={{ fontSize: 11 }} width={32} />
                        <Tooltip />
                        <Line type="monotone" dataKey="v" stroke="var(--pf-t--global--color--brand--default)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Title headingLevel="h2" size="lg">
              Recent operations
            </Title>
            <OcsPrototypeListTable ariaLabel="Recent GitOps operations">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Phase">
                    <PlainTableHeader label="Phase" />
                  </Th>
                  <Th dataLabel="Message">
                    <PlainTableHeader label="Message" />
                  </Th>
                  <Th dataLabel="Finished">
                    <PlainTableHeader label="Finished" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {operations.length === 0 ? (
                  <Tr>
                    <Td colSpan={4}>No recent operations.</Td>
                  </Tr>
                ) : (
                  operations.map((op) => (
                    <Tr
                      key={`${op.ns}/${op.name}`}
                      onClick={() => navigate(gitopsDetailPath("applications", op.ns, op.name))}
                    >
                      <Td dataLabel="Name">
                        <ResourceName
                          kind="Application"
                          name={op.name}
                          to={gitopsDetailPath("applications", op.ns, op.name)}
                        />
                      </Td>
                      <Td dataLabel="Phase">
                        <Label color={op.phase === "Succeeded" ? "green" : op.phase === "Failed" ? "red" : "blue"} isCompact>
                          {op.phase}
                        </Label>
                      </Td>
                      <Td dataLabel="Message">{op.message}</Td>
                      <Td dataLabel="Finished">{op.finished}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </Flex>

          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Title headingLevel="h2" size="lg">
              Applications ({apps.length})
            </Title>
            <OcsPrototypeListTable ariaLabel="Applications on this instance">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Project">
                    <PlainTableHeader label="Project" />
                  </Th>
                  <Th dataLabel="Sync status">
                    <PlainTableHeader label="Sync status" />
                  </Th>
                  <Th dataLabel="Health">
                    <PlainTableHeader label="Health" />
                  </Th>
                  <Th dataLabel="Destination">
                    <PlainTableHeader label="Destination" />
                  </Th>
                  <Th dataLabel="Last reconciled">
                    <PlainTableHeader label="Last reconciled" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {apps.map((app) => {
                  const href = gitopsDetailPath("applications", app.ns, app.name);
                  const project = projects.find((p) => p.name === app.project && p.ns === app.ns);
                  const projectHref = project
                    ? gitopsDetailPath("appprojects", project.ns, project.name)
                    : "/gitops/appprojects";
                  return (
                    <Tr key={`${app.ns}/${app.name}`} onClick={() => navigate(href)}>
                      <Td dataLabel="Name">
                        <ResourceName kind="Application" name={app.name} to={href} />
                      </Td>
                      <Td dataLabel="Project">
                        <ButtonLink to={projectHref}>{app.project}</ButtonLink>
                      </Td>
                      <Td dataLabel="Sync status">
                        <HealthStatus status={app.sync} />
                      </Td>
                      <Td dataLabel="Health">
                        <HealthStatus status={app.health} />
                      </Td>
                      <Td dataLabel="Destination">{app.destination}</Td>
                      <Td dataLabel="Last reconciled">{app.lastReconciled}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </OcsPrototypeListTable>
          </Flex>

          <Title headingLevel="h2" size="lg">
            Infrastructure
          </Title>
          <Gallery hasGutter minWidths={{ default: "220px" }}>
            <GalleryItem>
              <Card isClickable onClick={() => navigate("/gitops/settings")}>
                <CardTitle>GitOps Operator</CardTitle>
                <CardBody>
                  <Label color="green" isCompact>
                    Available
                  </Label>
                  <Content component="p" className="pf-v6-u-mt-sm">
                    {ARGO_INSTANCES.length} instances registered. Open Settings.
                  </Content>
                </CardBody>
              </Card>
            </GalleryItem>
            <GalleryItem>
              <Card isClickable onClick={() => navigate("/gitops/rollouts")}>
                <CardTitle>Rollout Managers</CardTitle>
                <CardBody>
                  <Content component="p">{GITOPS_ROLLOUTS.length} rollouts across this cluster.</Content>
                </CardBody>
              </Card>
            </GalleryItem>
            <GalleryItem>
              <Card isClickable onClick={() => navigate("/gitops/applicationsets")}>
                <CardTitle>ApplicationSets</CardTitle>
                <CardBody>
                  <Content component="p">{GITOPS_APPLICATION_SETS.length} generators managing tenant apps.</Content>
                </CardBody>
              </Card>
            </GalleryItem>
          </Gallery>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

function ButtonLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="pf-v6-c-button pf-m-link pf-m-inline" onClick={(e) => e.stopPropagation()}>
      {children}
    </Link>
  );
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "success";
}) {
  return (
    <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} gap={{ default: "gapMd" }}>
      <Content component="small">{label}</Content>
      {typeof value === "string" ? (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapXs" }}>
          {tone === "success" ? <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" /> : null}
          <strong>{value}</strong>
        </Flex>
      ) : (
        value
      )}
    </Flex>
  );
}
