import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Alert,
  Button,
  Content,
  Flex,
  Icon,
  Title,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { CheckCircle, Loader2, Clock, Sparkles } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import AgentExecutionLogsPanel, {
  PLATFORM_CLUSTER_OPERATORS,
} from "../../components/cluster-update/AgentExecutionLogsPanel";

type TabKey = "update-plan" | "active-update-plans" | "update-history";

type RowStatus = "Updating" | "Updated" | "Pending";

interface OperatorRowModel {
  name: string;
  version: string;
  compatibility: "compatible" | "incompatible";
  lastUpdated: string;
}

interface WorkerPoolModel {
  pool: string;
  baseVersion: string;
  compatibility: "compatible" | "incompatible";
}

function poolName(pool: { pool: string }) {
  return pool.pool;
}

function namedRow(row: { name: string }) {
  return row.name;
}

const OPERATORS_BASE: OperatorRowModel[] = [
  { name: "Abot Operator-v3.0.0", version: "3.2.5", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Airflow Helm Operator", version: "3.5", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Ansible Automation Platform", version: "3.25", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Bare Metal Event Relay", version: "1.2.0", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
  { name: "Camel K Operator", version: "2.1.0", compatibility: "compatible", lastUpdated: "Feb 13, 2026, 10:28 AM" },
];

const WORKER_POOLS_BASE: WorkerPoolModel[] = [
  { pool: "worker-east", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-west", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-central", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-north", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-south", baseVersion: "5.0.0", compatibility: "compatible" },
];

/** Maps overall phase % to per-row status so tables stay aligned with progress bars. */
function slotStatus(index: number, rowCount: number, pct: number): RowStatus {
  if (rowCount <= 0) return "Pending";
  const seg = 100 / rowCount;
  if (pct >= (index + 1) * seg) return "Updated";
  if (pct > index * seg) return "Updating";
  return index === 0 ? "Updating" : "Pending";
}

/** Time to keep Agent logs visible with final completion lines before navigating to the success screen. */
const COMPLETION_NAV_DELAY_MS = 4000;

export default function ClusterUpdateInProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const version = (location.state as any)?.version || "5.1.10";
  const [activeTab, setActiveTab] = useState<TabKey>("update-plan");

  const [progress, setProgress] = useState({ op: 0, cp: 0, wn: 0 });
  const [showLogsPanel, setShowLogsPanel] = useState(false);
  const completionNavTimeoutRef = useRef<number | null>(null);

  const operatorProgress = progress.op;
  const controlProgress = progress.cp;
  const workerProgress = progress.wn;

  useEffect(() => {
    localStorage.setItem("clusterUpdateInProgress", JSON.stringify({ version, startedAt: Date.now() }));
  }, [version]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((s) => {
        const cp = Math.min(100, s.cp + 1.5);
        const op = Math.min(100, s.op + 0.8);
        const wn = cp > 40 ? Math.min(100, s.wn + 0.35) : s.wn;
        return { cp, op, wn };
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (operatorProgress < 100 || controlProgress < 100 || workerProgress < 100) return;
    if (completionNavTimeoutRef.current != null) return;

    localStorage.removeItem("clusterUpdateInProgress");
    setShowLogsPanel(true);

    completionNavTimeoutRef.current = window.setTimeout(() => {
      completionNavTimeoutRef.current = null;
      navigate("/administration/cluster-update/complete", { state: { version } });
    }, COMPLETION_NAV_DELAY_MS);

    return () => {
      if (completionNavTimeoutRef.current != null) {
        window.clearTimeout(completionNavTimeoutRef.current);
        completionNavTimeoutRef.current = null;
      }
    };
  }, [operatorProgress, controlProgress, workerProgress, navigate, version]);

  const opPct = Math.round(operatorProgress);
  const cpPct = Math.round(controlProgress);
  const wnPct = Math.round(workerProgress);

  const operatorRows = OPERATORS_BASE.map((op, i) => ({
    ...op,
    status: slotStatus(i, OPERATORS_BASE.length, operatorProgress),
  }));

  const workerRows = WORKER_POOLS_BASE.map((pool, i) => ({
    ...pool,
    status: slotStatus(i, WORKER_POOLS_BASE.length, workerProgress),
  }));

  const clusterOperatorRows = PLATFORM_CLUSTER_OPERATORS.map((name, i) => ({
    name,
    status: slotStatus(i, PLATFORM_CLUSTER_OPERATORS.length, controlProgress),
  }));

  const updateFullyComplete = operatorProgress >= 100 && controlProgress >= 100 && workerProgress >= 100;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "update-plan", label: "Update plan" },
    { key: "active-update-plans", label: "Active update plans" },
    { key: "update-history", label: "Update history" },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ocs-app-page-outer ocs-app-page-outer--end-3xl">
      <Breadcrumbs items={[
        { label: "Administration", path: "/administration/cluster-update" },
        { label: "Cluster Update" },
      ]}>

      <h1 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[28px] mb-[16px]">
        Cluster Update
      </h1>

      <div className="border-b border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] mb-[24px] flex gap-[0px]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "update-plan") return;
              navigate("/administration/cluster-update", { state: { tab: tab.key } });
            }}
            className={`px-[20px] py-[12px] text-[14px] font-['Red_Hat_Text:Regular',sans-serif] border-0 bg-transparent cursor-pointer transition-colors relative ${
              activeTab === tab.key
                ? "text-[#151515] dark:text-white font-medium"
                : "text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0066cc] dark:bg-[#4dabf7] rounded-t-[2px]" />
            )}
          </button>
        ))}
      </div>

      <div className="mb-[var(--pf-t--global--spacer--lg)]">
        <Alert variant="info" isInline title="Estimated update time 2 hours 12 minutes">
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Content component="p" style={{ margin: 0 }}>
              This is a rough estimate and will vary based on resource availability and usage. After launch, this update
              runs to completion; pause, resume, and abort are not available.
            </Content>
            <div>
              <Button
                variant="primary"
                icon={<Sparkles aria-hidden className="ocs-ai-sparkle-cta-icon" />}
                onClick={() => setShowLogsPanel(true)}
              >
                View agent logs
              </Button>
            </div>
          </Flex>
        </Alert>
      </div>

      {/* Cluster ID */}
      <div className="mb-[24px]">
        <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Cluster ID</p>
        <p className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Mono:Regular',sans-serif]">b86leae3-b06c-4ab2-8fa7-54b89a2bf4b2</p>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-3 gap-[24px] mb-[32px]">
        <ProgressSection label="Installed operators" percentage={opPct} />
        <ProgressSection label="Cluster operators" percentage={cpPct} />
        <ProgressSection label="Worker nodes" percentage={wnPct} />
      </div>

      <section className="ocs-pod-details__section">
            <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
              Worker nodes on this cluster
            </Title>

          <OcsNamedResourceDataView
            ouiaId="in-progress-workers-data-view"
            ariaLabel="Worker nodes on this cluster"
            itemsLabel="worker pools"
            items={workerRows}
            getName={poolName}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Pool">
                      <PlainTableHeader label="Pool" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((pool) => (
                    <Tr key={pool.pool}>
                      <Td dataLabel="Pool">
                        <Content component="span" style={{ fontWeight: 600 }}>
                          {pool.pool}
                        </Content>
                      </Td>
                      <Td dataLabel="Status">
                        {pool.status === "Updating" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible"
                              aria-hidden
                            >
                              <span className="inline-flex origin-center scale-[0.2]">
                                <Icon>
                                  <Loader2 className="text-[var(--pf-t--global--palette--blue-50)]" aria-hidden />
                                </Icon>
                              </span>
                            </span>
                            Updating
                          </Flex>
                        ) : pool.status === "Updated" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Updated
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="warning">
                              <Clock aria-hidden />
                            </Icon>
                            Pending
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Version">
                        <Content component="small">
                          <code>{pool.status === "Updated" ? version : pool.baseVersion}</code>
                        </Content>
                      </Td>
                      <Td dataLabel="Cluster compatibility">
                        {pool.compatibility === "compatible" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Compatible
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            Incompatible
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Actions" isActionCell>
                        <Button variant="plain" aria-label={`Actions for pool ${pool.pool}`} icon={<EllipsisVIcon />} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
      </section>

      <section className="ocs-pod-details__section">
            <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
              Cluster operators
            </Title>

          <OcsNamedResourceDataView
            ouiaId="in-progress-cluster-operators-data-view"
            ariaLabel="Cluster operators"
            itemsLabel="cluster operators"
            items={clusterOperatorRows}
            getName={namedRow}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row) => (
                    <Tr key={row.name}>
                      <Td dataLabel="Name">
                        <Content component="span" style={{ fontWeight: 600 }}>
                          {row.name}
                        </Content>
                      </Td>
                      <Td dataLabel="Status">
                        {row.status === "Updating" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible"
                              aria-hidden
                            >
                              <span className="inline-flex origin-center scale-[0.2]">
                                <Icon>
                                  <Loader2 className="text-[var(--pf-t--global--palette--blue-50)]" aria-hidden />
                                </Icon>
                              </span>
                            </span>
                            Updating
                          </Flex>
                        ) : row.status === "Updated" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Updated
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="warning">
                              <Clock aria-hidden />
                            </Icon>
                            Pending
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Version">
                        <Content component="small">
                          <code>{row.status === "Updated" ? version : "5.0.0"}</code>
                        </Content>
                      </Td>
                      <Td dataLabel="Cluster compatibility">
                        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                          <Icon status="success">
                            <CheckCircle aria-hidden />
                          </Icon>
                          Compatible
                        </Flex>
                      </Td>
                      <Td dataLabel="Actions" isActionCell>
                        <Button variant="plain" aria-label={`Actions for cluster operator ${row.name}`} icon={<EllipsisVIcon />} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
      </section>

      <section className="ocs-pod-details__section">
            <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
              Installed operators
            </Title>

          <OcsNamedResourceDataView
            ouiaId="in-progress-installed-operators-data-view"
            ariaLabel="Installed operators"
            itemsLabel="operators"
            items={operatorRows}
            getName={namedRow}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                    <Th dataLabel="Last updated">
                      <PlainTableHeader label="Last updated" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((op) => (
                    <Tr key={op.name}>
                      <Td dataLabel="Name">
                        <Content component="span" style={{ fontWeight: 600 }}>
                          {op.name}
                        </Content>
                      </Td>
                      <Td dataLabel="Status">
                        {op.status === "Updating" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible"
                              aria-hidden
                            >
                              <span className="inline-flex origin-center scale-[0.2]">
                                <Icon>
                                  <Loader2 className="text-[var(--pf-t--global--palette--blue-50)]" aria-hidden />
                                </Icon>
                              </span>
                            </span>
                            Updating
                          </Flex>
                        ) : op.status === "Updated" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Updated
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="warning">
                              <Clock aria-hidden />
                            </Icon>
                            Pending
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Version">
                        <Content component="small">
                          <code>{op.version}</code>
                        </Content>
                      </Td>
                      <Td dataLabel="Cluster compatibility">
                        {op.compatibility === "compatible" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Compatible
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            Incompatible
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Last updated">{op.lastUpdated}</Td>
                      <Td dataLabel="Actions" isActionCell>
                        <Button variant="plain" aria-label={`Actions for ${op.name}`} icon={<EllipsisVIcon />} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
      </section>

      </Breadcrumbs>

      <AgentExecutionLogsPanel
        isOpen={showLogsPanel}
        version={version}
        onClose={() => setShowLogsPanel(false)}
        releaseCompletionLogLines={updateFullyComplete}
        dashboardProgress={{
          operatorPct: operatorProgress,
          controlPct: controlProgress,
          workerPct: workerProgress,
        }}
      />
    </div>
  );
}

function ProgressSection({ label, percentage }: { label: string; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[8px]">
        <span className="text-[#0066cc] dark:text-[#4dabf7] text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-medium">
          {label}
        </span>
        <span className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-medium">{percentage}%</span>
      </div>
      <div className="h-[8px] bg-[#e0e0e0] dark:bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0066cc] rounded-full transition-all duration-500"
          style={{ width: `${Math.max(percentage, percentage > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

