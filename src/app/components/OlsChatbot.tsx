import { useState, useEffect, useRef, useCallback } from "react";
import { css } from "@patternfly/react-styles";
import displayStyles from "@patternfly/react-styles/css/utilities/Display/display.mjs";
import flexStyles from "@patternfly/react-styles/css/utilities/Flex/flex.mjs";
import sizingStyles from "@patternfly/react-styles/css/utilities/Sizing/sizing.mjs";
import spacingStyles from "@patternfly/react-styles/css/utilities/Spacing/spacing.mjs";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text.mjs";
import { OpenShiftLightspeedIcon } from "./lightspeed/OpenShiftLightspeedIcon";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Bookmark,
  Volume2,
  Paperclip,
} from "@/lib/pfIcons";
import {
  Button,
  Card,
  CardBody,
  Content,
  Divider,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Label,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { LightspeedHeaderNotice, LightspeedAiMessageFooter } from "./lightspeed/LightspeedLegalCopy";

type ChatAction = {
  label: string;
  variant: "primary" | "secondary" | "link";
  actionId: string;
};

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  actions?: ChatAction[];
};

function installedOperatorsPrecheckSummary(version: string, channel: string): string {
  return (
    `**Installed Operators — pre-check**\n\n` +
    `**Target:** ${version} · **Channel:** ${channel}\n\n` +
    `**OLM v0 (Subscriptions)**\n` +
    `Updates **4** · Blocking **2** · Up to date **1**\n\n` +
    `**OLM v1 (extensions)**\n` +
    `Healthy **1** · Pending **1**\n\n` +
    `_Operator names, checks, and steps → **Detail analysis**_`
  );
}

function installedOperatorsPrecheckDetail(version: string, channel: string): string {
  return (
    `**Detailed analysis**\n\n` +
    `**Cluster target:** ${version} · **Channel:** ${channel}\n\n` +
    `**OLM v0 (Subscriptions)**\n` +
    `• **Update available** — Abot Operator-v3.0.0, Airflow Helm Operator, Ansible Automation Platform, Bare Metal Event Relay\n` +
    `• **Required before some cluster updates** — Abot Operator-v3.0.0, Airflow Helm Operator\n` +
    `• **Up to date** — Camel K Operator\n\n` +
    `**OLM v1 (cluster extensions)**\n` +
    `• **Healthy** — OpenShift GitOps (cluster extension)\n` +
    `• **Conditions pending** — Sample observability bundle (discovery still settling)\n\n` +
    `**Checks performed**\n` +
    `• Subscription / extension status vs. target version\n` +
    `• Support and end-of-life signals (as shown in the table)\n` +
    `• Alignment with **Cluster Update** readiness for the same target\n\n` +
    `**Next steps**\n` +
    `1. Approve updates for operators that block your cluster plan (row actions, or select **two or more** then **Approve update**).\n` +
    `2. Resolve **Incompatible** operators before go-live.\n` +
    `3. Open **Cluster Update** when catalog and platform both look clear.\n\n` +
    `Ask about update order, risk, or a specific operator in the list.`
  );
}

export function OlsChatbot({
  isOpen,
  children,
  context,
  selectedVersion,
  selectedChannel,
  onClose,
  onAction,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  context: string;
  selectedVersion: string;
  selectedChannel: string;
  onClose: () => void;
  onAction: (actionId: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (context === "installed-operators-precheck") {
      return [
        {
          role: "assistant",
          text: installedOperatorsPrecheckSummary(selectedVersion, selectedChannel),
          actions: [
            { label: "Detail analysis", variant: "secondary", actionId: "io-precheck-detail" },
            { label: "Open Cluster Update", variant: "primary", actionId: "view-plan" },
          ],
        },
      ];
    }

    const initial: ChatMessage[] = [
      {
        role: "assistant",
        text: `Hello! I'm OpenShift Lightspeed, your AI assistant for cluster operations.\n\nI can see your cluster is currently on version **5.0.0** using the **${selectedChannel}** channel, and you're considering an update to **${selectedVersion}**.\n\nPre-checks and status updates cover **platform operators** and **Software Catalog (OLM) operators** together—one holistic view as those experiences converge on the dashboard.`,
      },
    ];
    if (context === "recommendations") {
      initial.push({
        role: "assistant",
        text: `Based on your cluster's workload profile and update history, here are my recommendations:\n\n• **Recommended version**: ${selectedVersion} — Low risk with strong community adoption\n• **Best update window**: Weekdays 2:00-4:00 AM UTC based on your traffic patterns\n• **Pre-update actions**: Update cluster-logging operator to v6.5+ before proceeding\n• **Estimated downtime**: ~2 minutes for API server restart`,
      });
    } else if (context === "agent-config") {
      initial.push({
        role: "assistant",
        text: "I can help you configure the agent-based update strategy. The agent will:\n\n• **Analyze workload patterns** to find optimal update windows\n• **Assess readiness** automatically before each update (platform + catalog operators)\n• **Coordinate operator updates** in the correct dependency order across cluster and OLM\n• **Monitor rollout health** and trigger automatic rollback if issues are detected\n\nWould you like to configure the update schedule, set rollback thresholds, or review the current agent policy?",
      });
    } else if (context === "agent-monitor") {
      initial.push({
        role: "assistant",
        text: "The update agent is currently monitoring your cluster. Here's what I can help with:\n\n• View the current agent status and decision log\n• Explain why the agent chose a specific update window\n• Review rollback criteria and thresholds\n• Adjust agent behavior for upcoming maintenance windows\n\nWhat would you like to know?",
      });
    } else if (context === "agent-precheck" || context === "ai-precheck") {
      initial.push({
        role: "assistant",
        text: `Running AI-powered pre-check for update to **${selectedVersion}**...\n\n**Holistic scope (consolidated AI)**\nPre-checks and status updates now cover **OpenShift platform operators** and **Software Catalog (OLM / Installed Software) operators** together—one assessment aligned with the converged dashboard experience.\n\n**Pre-checks from Target Release Payload (${selectedVersion})**\nThese checks are shipped with the target release payload and validate cluster readiness against version-specific requirements.\n\n✅ **ClusterVersionUpgradeable** — ClusterVersion conditions permit update\n✅ **ClusterOperatorDegraded** — No cluster operators are degraded\n✅ **ClusterOperatorAvailable** — All cluster operators are available\n✅ **MachineConfigPoolDraining** — MachineConfigPools can drain nodes safely\n⚠️ **PodDisruptionBudgetAtLimit** — 1 PDB at maxUnavailable=0, pod eviction may stall\n❌ **DeprecatedAPIInUse** — 3 resources using rbac.authorization.k8s.io/v1beta1, migrate to v1\n\n**Cluster Health Pre-checks**\n✅ **Node Status** — 6/6 nodes Ready\n✅ **Storage Health** — 85% available, all PVs bound\n✅ **Network Health** — OVN verified, no packet loss\n✅ **Certificates** — Valid for >90 days\n✅ **etcd** — Quorum established\n\n⚠️ **Operator compatibility (platform + catalog)** — Issues span both layers:\n• **Catalog:** cluster-logging v6.4.3 (max OCP 5.0) → Update to v6.5.1+\n• **Catalog:** elasticsearch-operator v5.7.2 (max OCP 5.0) → Update to v5.8.0+\n\n**Recommended next steps:**\n1. Migrate deprecated rbac.authorization.k8s.io/v1beta1 resources to v1\n2. Review PodDisruptionBudget settings to avoid eviction stalls during rolling update\n3. Update the incompatible catalog operators from **Installed Software**\n4. Re-run the pre-check to confirm platform and catalog are clear\n5. Approve the update plan to proceed`,
      });
    } else if (context === "compatibility-analysis") {
      initial.push({
        role: "assistant",
        text: `I've analyzed the compatibility profile for updating to **${selectedVersion}** on the **${selectedChannel}** channel. Here's what I found:\n\n**Operator Issues:**\n• **Cluster Logging v6.4.3** — max supported OCP is 5.0. You need v6.5.1+ before updating.\n• **Elasticsearch Operator v5.7.2** — max supported OCP is 5.0. Update to v5.8.0+.\n• **OLM v4.21.0** — recommended to update to v4.22.0 for full 5.1 support.\n\n**API Deprecations:**\n• \`flowcontrol.apiserver.k8s.io/v1beta2\` — migrate to \`v1\` before 5.2.\n\n**Recommendation:** Update the 2 incompatible operators first, then approve the update plan. I can generate a step-by-step remediation runbook if needed.`,
      });
    } else if (context === "agent-start") {
      initial.push({
        role: "assistant",
        text: `Starting AI-managed update to **${selectedVersion}**...\n\n**Agent Status:** Active\n**Current Phase:** Generating update plan\n\n📋 **Actions completed:**\n1. ✅ Cluster health verified — all components healthy\n2. ✅ Pre-checks passed (6/6)\n3. ✅ Compatibility analysis complete — 2 issues found\n4. ⏳ Awaiting plan approval\n\n**Next step:** Review the proposed update plan below and approve to proceed. The agent will execute the update during the optimal window.\n\nI'll keep you updated on progress. You can pause or cancel the agent at any time from the status bar above.`,
      });
    } else if (context === "agent-paused") {
      initial.push({
        role: "assistant",
        text: `⏸️ **Agent paused** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Status:** The update agent has been paused. No further actions will be taken until you resume.\n\n**State preserved:**\n• Update plan: Pending approval\n• Target version: ${selectedVersion}\n• Scheduled window: Wed Apr 2, 02:00–05:00 UTC\n\n**Actions available:**\n• **Resume** — Continue from where the agent left off\n• **Cancel** — Discard the plan and stop the agent\n\nThe scheduled execution window will be skipped while paused.`,
      });
    } else if (context === "agent-resumed") {
      initial.push({
        role: "assistant",
        text: `▶️ **Agent resumed** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Status:** The update agent is active again and will continue processing.\n\n**Current state:**\n• Update plan: Pending approval\n• Target: 5.0.0 → ${selectedVersion}\n• Next scheduled window: Wed Apr 2, 02:00–05:00 UTC\n\nThe agent will proceed with the update plan once approved. I'll notify you of any status changes.`,
      });
    } else if (context === "agent-cancelled") {
      initial.push({
        role: "assistant",
        text: `🛑 **Update cancelled** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Status:** The update agent has been stopped and the update plan has been discarded.\n\n**What was cleared:**\n• Proposed update plan\n• Accepted risks\n• Scheduled execution window\n\n**To start a new update:**\n1. Click "Start update with AI" to begin a fresh update session\n2. Or use "Update pre-check with AI" to run checks first\n\nYour cluster remains on version **5.0.0**. No changes were made.`,
      });
    } else if (context === "update-executing") {
      initial.push({
        role: "assistant",
        text: `🚀 **Update started** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Target:** 5.0.0 → ${selectedVersion}\n**Strategy:** Rolling update with automatic rollback\n\n**Current progress:**\n1. ✅ Pre-checks passed\n2. ✅ Operator updates initiated\n3. ⏳ Control plane nodes updating...\n4. ⏳ Worker nodes pending\n\n**Live monitoring active.** I'll alert you if any health check degrades.\n\n• API Server: Healthy\n• etcd: Healthy\n• Ingress: Healthy\n\nEstimated completion: ~1h 45m. The cluster remains operational during the rolling update.`,
      });
    } else if (context === "update-completed") {
      initial.push({
        role: "assistant",
        text: `✅ **Update complete!** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Cluster version:** ${selectedVersion}\n**Duration:** 1h 38m\n\n**Post-update verification:**\n✅ API server responding\n✅ All 6 nodes Ready\n✅ All cluster operators available\n✅ No degraded operators\n✅ Ingress healthy\n✅ Workloads stable\n\n**Operators updated:**\n• Cluster Logging: 6.4.3 → 6.5.1\n• Elasticsearch Operator: 5.7.2 → 5.8.0\n• OLM: 4.21.0 → 4.22.0\n\nYour cluster is now running **${selectedVersion}**. All health checks passed. You can view the full update log in the Update History tab.`,
      });
    } else if (context === "update-failed") {
      initial.push({
        role: "assistant",
        text: `❌ **Update failed** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Error:** Node master-2 failed to drain\n**Root cause:** Pod prometheus-k8s-0 has local storage and exceeded the 300s eviction timeout.\n\n**Cluster state:**\n• 2/3 control plane nodes updated\n• 0/3 worker nodes updated\n• Cluster is in a **partially updated** state\n\n**Recommended actions:**\n1. **Retry** — I can attempt to force-drain master-2 (will delete the local storage pod)\n2. **Rollback** — Revert all nodes to 5.0.0 (~30 min)\n3. **Manual fix** — Delete the blocking pod manually, then retry\n\nWould you like me to diagnose the blocking pod and suggest a fix?`,
      });
    } else if (context === "update-rollback") {
      initial.push({
        role: "assistant",
        text: `⏪ **Rollback initiated** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Reverting:** ${selectedVersion} → 5.0.0\n\n**Rollback plan:**\n1. ⏳ Reverting control plane nodes (3 nodes)\n2. ⏳ Restoring operator versions\n3. ⏳ Verifying cluster health\n\n**Estimated time:** ~30 minutes\n\nThe cluster will remain operational during rollback. I'll verify all health checks pass after completion.`,
      });
    } else if (context === "rollback-complete") {
      initial.push({
        role: "assistant",
        text: `✅ **Rollback complete** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Cluster version:** 5.0.0 (restored)\n\n**Verification:**\n✅ All 6 nodes on version 5.0.0\n✅ Operator versions restored\n✅ Cluster health verified\n✅ No degraded components\n\nYour cluster has been safely reverted. To attempt the update again:\n1. Resolve the drain issue on master-2\n2. Click "Start update with AI" when ready\n\nWould you like help troubleshooting the original failure?`,
      });
    } else if (context === "update-retry") {
      initial.push({
        role: "assistant",
        text: `🔄 **Retrying update** at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\n\n**Target:** 5.0.0 → ${selectedVersion}\n\n**Changes from previous attempt:**\n• Increased drain timeout to 600s\n• Added force-drain for pods with local storage\n• Skipping already-updated nodes where safe\n\n**Progress:**\n1. ✅ master-0 — already on ${selectedVersion}\n2. ✅ master-1 — already on ${selectedVersion}\n3. ⏳ master-2 — retrying drain...\n4. ⏳ Workers pending\n\nMonitoring closely. I'll alert you immediately if the same issue recurs.`,
      });
    }
    const lastMsg = initial[initial.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
      const contextActions: Record<string, ChatAction[]> = {
        "agent-precheck": [],
        "ai-precheck": [],
        "agent-start": [{ label: "Review update plan", variant: "primary", actionId: "view-plan" }],
        "compatibility-analysis": [{ label: "Generate remediation plan", variant: "secondary", actionId: "remediation" }],
        "agent-config": [{ label: "Review configuration", variant: "secondary", actionId: "view-plan" }],
        "agent-monitor": [{ label: "View update plan", variant: "primary", actionId: "view-plan" }],
        "update-completed": [{ label: "View update history", variant: "primary", actionId: "view-history" }],
        "update-failed": [{ label: "View troubleshooting", variant: "link", actionId: "view-plan" }],
        "agent-paused": [{ label: "View update plan", variant: "secondary", actionId: "view-plan" }],
        "agent-cancelled": [{ label: "View update plan", variant: "primary", actionId: "view-plan" }],
        recommendations: [{ label: "View update plan", variant: "secondary", actionId: "view-plan" }],
      };
      if (contextActions[context]) {
        lastMsg.actions = contextActions[context];
      }
    }
    return initial;
  });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleAssistantAction = useCallback(
    (action: ChatAction) => {
      if (action.actionId === "io-precheck-detail") {
        setMessages((prev) => {
          if (prev.some((m) => m.role === "assistant" && m.text.startsWith("**Detailed analysis**"))) {
            return prev;
          }
          const withoutDetailButton = prev.map((m) =>
            m.role === "assistant" && m.actions?.some((a) => a.actionId === "io-precheck-detail")
              ? { ...m, actions: (m.actions ?? []).filter((a) => a.actionId !== "io-precheck-detail") }
              : m
          );
          return [
            ...withoutDetailButton,
            {
              role: "assistant",
              text: installedOperatorsPrecheckDetail(selectedVersion, selectedChannel),
              actions: [{ label: "Open Cluster Update", variant: "primary", actionId: "view-plan" }],
            },
          ];
        });
        return;
      }
      onAction(action.actionId);
    },
    [onAction, selectedChannel, selectedVersion]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    const lowerMsg = userMsg.toLowerCase();
    setTimeout(() => {
      let response: ChatMessage;
      if (lowerMsg.includes("operator") || lowerMsg.includes("compatibility") || lowerMsg.includes("blocked")) {
        response = {
          role: "assistant",
          text: "Based on my analysis, you have **2 operators** that need updating before proceeding:\n\n• **Cluster Logging v6.4.3** → Update to v6.5.1+\n• **Elasticsearch Operator v5.7.2** → Update to v5.8.0+\n\nI recommend updating these operators before approving the update plan. You can accept the known risks from the alert banner in the Available Updates section.",
          actions: [{ label: "Review update plan", variant: "primary", actionId: "view-plan" }],
        };
      } else if (lowerMsg.includes("approve") || lowerMsg.includes("plan")) {
        response = {
          role: "assistant",
          text: "The update plan is pending your approval. Here's a summary:\n\n• **Target:** 5.0.0 → 5.1.10\n• **Pre-check:** 6/6 passed\n• **Compatibility:** 2 blocking issues\n• **Schedule:** Wed Apr 2, 02:00–05:00 UTC\n\nYou can approve the plan from the decision bar below the update plan, or accept the known risks to proceed despite the incompatibilities.",
          actions: [{ label: "Review update plan", variant: "primary", actionId: "view-plan" }],
        };
      } else if (lowerMsg.includes("schedule") || lowerMsg.includes("window") || lowerMsg.includes("when")) {
        response = {
          role: "assistant",
          text: "Based on your cluster's workload patterns, I recommend:\n\n• **Optimal window:** Wed Apr 2, 02:00–05:00 UTC\n• **Estimated duration:** 1h 45m\n• **Risk level:** Low\n\nThis window was selected because your cluster shows the lowest traffic during this period. You can adjust preferences in Agent Configuration → Scheduling.",
        };
      } else if (lowerMsg.includes("rollback") || lowerMsg.includes("revert")) {
        response = {
          role: "assistant",
          text: "Automatic rollback is currently **enabled**. If health checks fail within 30 minutes of update completion, the agent will automatically revert to version 5.0.0.\n\n**Rollback details:**\n• Estimated time: ~30 minutes\n• All nodes will be reverted\n• Operator versions will be restored\n\nYou can configure this in Agent Configuration → Automatic Actions.",
        };
      } else if (lowerMsg.includes("history") || lowerMsg.includes("previous") || lowerMsg.includes("past")) {
        response = {
          role: "assistant",
          text: "Your cluster has 6 previous updates on record:\n\n• **5.0.0** — Completed (Agent, 1h 48m)\n• **4.18.6** — Completed (Agent, auto-approved)\n• **4.18.4** — Completed (Manual, 1h 15m)\n• **4.17.9** — Failed (Agent, auto-rollback)\n• **4.17.8** — Rejected (pre-check failures)\n\nWould you like details on any specific update?",
          actions: [{ label: "View full history", variant: "primary", actionId: "view-history" }],
        };
      } else if (lowerMsg.includes("risk") || lowerMsg.includes("safe")) {
        response = {
          role: "assistant",
          text: "**Risk assessment for 5.0.0 → 5.1.10:**\n\n• **Overall risk:** Low (based on community adoption and test coverage)\n• **Blocking issues:** 2 incompatible operators\n• **API deprecations:** 1 warning (non-blocking)\n• **Custom resources:** No incompatibilities found\n\nThe 2 blocking operators can be updated beforehand, or you can accept the risks and proceed. The agent will attempt automatic mitigation during the update if enabled.",
        };
      } else {
        response = {
          role: "assistant",
          text: "I can help you with your cluster update. Here's what I can assist with:\n\n• **Operator compatibility** — Check which operators need updating (platform + catalog)\n• **Update plan** — Review the proposed update path\n• **Scheduling** — Optimal update window analysis\n• **Risk assessment** — Evaluate update risks\n• **History** — Review past updates\n\nWhat would you like to know more about?",
          actions: [
            { label: "View update plan", variant: "primary", actionId: "view-plan" },
            { label: "View history", variant: "secondary", actionId: "view-history" },
          ],
        };
      }
      setMessages((prev) => [...prev, response]);
    }, 1200);
  };

  return (
    <Drawer
      isExpanded={isOpen}
      isInline
      position="end"
      style={{ flex: "1 1 0%", minHeight: 0, minWidth: 0, alignSelf: "stretch" }}
    >
      <DrawerContent
        panelContent={
          <DrawerPanelContent
            className="ols-chatbot-panel"
            defaultSize="400px"
            minSize="280px"
            maxSize="560px"
          >
            <DrawerHead>
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <OpenShiftLightspeedIcon size={32} />
                <Title headingLevel="h2" size="md">
                  Red Hat OpenShift Lightspeed
                </Title>
              </Flex>
              <DrawerActions>
                <DrawerCloseButton onClose={onClose} aria-label="Close assistant" />
              </DrawerActions>
            </DrawerHead>
            <DrawerPanelBody hasNoPadding>
              <Flex direction={{ default: "column" }} style={{ height: "100%", minHeight: 0 }}>
                <div style={{ flexShrink: 0, paddingInline: "var(--pf-t--global--spacer--md)", paddingBlockStart: "var(--pf-t--global--spacer--sm)" }}>
                  <LightspeedHeaderNotice />
                </div>
                <FlexItem grow={{ default: "grow" }} style={{ minHeight: 0, overflow: "auto" }}>
                  <div role="log" aria-live="polite" style={{ padding: "var(--pf-t--global--spacer--md)" }}>
                    {messages.map((msg, i) => (
                      <div key={i} style={{ marginBottom: "var(--pf-t--global--spacer--lg)" }}>
                        {msg.role === "user" ? (
                          <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Content component="small" style={{ fontWeight: 600 }}>
                                User
                              </Content>
                              <Content component="small">
                                {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </Content>
                            </Flex>
                            <Content
                              style={{
                                alignSelf: "flex-start",
                                maxWidth: "90%",
                                padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
                                borderRadius: "var(--pf-t--global--border--radius--pill)",
                                background: "var(--pf-t--global--palette--blue-500)",
                                color: "var(--pf-t--global--palette--white)",
                              }}
                            >
                              {msg.text}
                            </Content>
                          </Flex>
                        ) : (
                          <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Content component="small" style={{ fontWeight: 600 }}>
                                OpenShift LightSpeed
                              </Content>
                              <Label isCompact color="grey">
                                AI
                              </Label>
                              <Content component="small">
                                {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </Content>
                            </Flex>
                            <Content style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {msg.text.split("**").map((part, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j}>{part}</strong>
                                ) : (
                                  <span key={j}>{part}</span>
                                )
                              )}
                            </Content>
                            <LightspeedAiMessageFooter />
                            {msg.actions && msg.actions.length > 0 ? (
                              <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "flexWrapWrap" }}>
                                {msg.actions.map((action, k) => (
                                  <Button
                                    key={k}
                                    variant={
                                      action.variant === "primary"
                                        ? "primary"
                                        : action.variant === "secondary"
                                          ? "secondary"
                                          : "link"
                                    }
                                    isInline={action.variant === "link"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssistantAction(action);
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </Flex>
                            ) : null}
                            <Flex gap={{ default: "gapXs" }}>
                              <Button variant="plain" aria-label="Thumbs up" icon={<ThumbsUp />} />
                              <Button variant="plain" aria-label="Thumbs down" icon={<ThumbsDown />} />
                              <Button variant="plain" aria-label="Copy" icon={<Copy />} />
                              <Button variant="plain" aria-label="Bookmark" icon={<Bookmark />} />
                              <Button variant="plain" aria-label="Read aloud" icon={<Volume2 />} />
                            </Flex>
                          </Flex>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </FlexItem>
                <Divider />
                <div style={{ padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)" }}>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    <FlexItem grow={{ default: "grow" }}>
                      <TextInput
                        aria-label="Message"
                        placeholder="Send a message..."
                        value={input}
                        onChange={(_e, v) => setInput(v)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      />
                    </FlexItem>
                    <Button variant="plain" aria-label="Attach file" icon={<Paperclip />} />
                    <Button
                      variant="plain"
                      aria-label="Send"
                      icon={<Send />}
                      onClick={sendMessage}
                      isDisabled={!input.trim()}
                    />
                  </Flex>
                </div>
              </Flex>
            </DrawerPanelBody>
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody hasPadding={false}>
          {children}
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
}
