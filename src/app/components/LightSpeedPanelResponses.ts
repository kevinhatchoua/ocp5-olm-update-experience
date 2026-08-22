import {
  CLUSTER_BLOCKER_MESSAGE,
  CLUSTER_BLOCKER_SECRET,
  CLUSTER_CHANNEL,
  CLUSTER_CURRENT_VERSION,
  CLUSTER_PATCH_VERSION,
} from "../constants/clusterVersionDemo";

export function getUpdateStatusResponse(): {
  content: string;
  tools: string[];
  sources: Array<{ title: string; href: string }>;
} {
  return {
    content:
      `**Summary**\n\n` +
      `**Root cause analysis** Based on the ClusterVersion data:\n` +
      `• **Current version:** ${CLUSTER_CURRENT_VERSION}\n` +
      `• **Target version:** ${CLUSTER_CURRENT_VERSION}\n` +
      `• **Failure type:** No active ClusterVersion failure. Condition type='Failing' has status='False', so the cluster version is **not failing**.\n\n` +
      `**Specific error:** No Failing=True message exists on ClusterVersion. The actual upgrade gate is separate: condition type='Upgradeable' has status='False' with message: '**${CLUSTER_BLOCKER_MESSAGE}**'.\n\n` +
      `**Component analysis**\n` +
      `• **Failed ClusterOperators:** 1 problematic operator: **machine-config**\n` +
      `  • Condition type='Available' has status='True' → available\n` +
      `  • Condition type='Degraded' has status='True' → degraded\n` +
      `  • Condition type='Progressing' has status='False' → not actively progressing\n` +
      `• **Operator error details:** machine-config controller logs show repeated errors:\n` +
      `  • "could not find the requested rhel-10 default stream in the list of OSImageStreams [rhel-9]"\n` +
      `  • "reading manifest ... in image-registry.openshift-image-registry.svc:5000/openshift-lightspeed/cvo-patched: authentication required"\n` +
      `  • User-friendly: the machine-config controller is trying to build OS image stream metadata, but the payload lookup is failing due to **registry authentication** and **missing expected RHEL 10 stream metadata**.\n` +
      `• **Stuck ClusterOperators:** None observed. No ClusterOperator was returned with Progressing=True and an error message.\n` +
      `• **Affected services:** Upgrade readiness is impacted. Cluster service health is otherwise mostly intact because ClusterVersion is Available=True and machine-config remains Available=True.\n\n` +
      `**Failed upgrade context**\n` +
      `• **Target version:** ${CLUSTER_CURRENT_VERSION}\n` +
      `• **Release information:** No desired release URL was present in ClusterVersion status.desired. Available update metadata exists for **${CLUSTER_PATCH_VERSION}** and **5.1.0**.\n` +
      `• **Upgrade path:** ${CLUSTER_CURRENT_VERSION} → ${CLUSTER_CURRENT_VERSION} (no version change)\n` +
      `• **Target availability:** The current target is already installed. In \`availableUpdates\`, only **${CLUSTER_PATCH_VERSION}** and **5.1.0** were listed.\n\n` +
      `**Historical failure analysis**\n` +
      `• **Previous attempts:** ClusterVersion history shows **3 completed entries**, all for **${CLUSTER_CURRENT_VERSION}**\n` +
      `• **Failure pattern:** No failed upgrade attempts are recorded in ClusterVersion history\n` +
      `• **Last successful upgrade:** ${CLUSTER_CURRENT_VERSION} completed at **2026-08-18T23:12:36Z**\n` +
      `• **Cluster stability:** Upgrade history does **not** show a failed rollout; the current issue is a **post-upgrade degraded operator / future upgrade blocker**, not a failed version transition\n\n` +
      `**Update service health**\n` +
      `• **Service configuration:** Custom upstream graph is configured\n` +
      `• **Cincinnati status:** condition type \`RetrievedUpdates\` has status \`True\`\n` +
      `• **Last update check:** **2026-08-18T22:55:44Z**\n` +
      `• **Available updates:** **${CLUSTER_PATCH_VERSION}** and **5.1.0**\n` +
      `• **Connectivity issues:** No Cincinnati problems. The **machine-config controller’s payload/OS image stream access** is the source of connectivity/auth issues.\n\n` +
      `**Failure events timeline (Last hour)**\n` +
      `• **Event summary:** No clear Warning/Error sequence was found for the upgrade failure.\n` +
      `• **Timeline of key events:**\n` +
      `  • machine-config events show repeated **FeatureGatesInitialized**\n` +
      `  • nodes were marked **NodeDone**\n` +
      `  • updates completed and nodes were **Uncordon**ed\n` +
      `• In alerts/logs, the relevant signals are: **ClusterOperatorDegraded(machine-config)** and **TargetDown(machine-config-controller)**\n\n` +
      `**Investigation steps**\n` +
      `1. Verify missing parent credentials (\`${CLUSTER_BLOCKER_SECRET}\`).\n` +
      `2. Inspect machine-config controller logs for **authentication required** and missing rhel-10 stream errors.\n` +
      `3. Collect cluster diagnostics using \`oc adm must-gather\`.\n\n` +
      `**Recovery actions (Conservative Approach)**\n` +
      `• Treat the issue as an **upgrade gate + degraded machine-config reconciliation**, not a failed upgrade.\n` +
      `• After restoring credentials, monitor \`Upgradeable\` and \`Degraded\`.\n` +
      `• Escalate to support if the issue persists.\n\n` +
      `**TL;DR**\n` +
      `• **Failure type:** No active ClusterVersion failure; actual blocker is **Upgradeable=False** with '**${CLUSTER_BLOCKER_MESSAGE}**'\n` +
      `• **Data completeness:** **Partial** — ClusterVersion, ClusterOperators, MCPs, alerts, and one critical operator log were retrieved; events were too broad to fully reconstruct a precise warning timeline, and full node output was truncated\n` +
      `• **Target version:** ${CLUSTER_CURRENT_VERSION}; available updates listed are **${CLUSTER_PATCH_VERSION}** and **5.1.0**\n` +
      `• **Root cause:** **Moderate confidence:** this is **not a failed upgrade rollout**. The main issues are **upgrade blocked by missing AWS parent credentials secret** and **machine-config operator degraded** with log evidence of **payload registry authentication failure** and **missing rhel-10 OS image stream metadata**\n` +
      `• **Failed components:** 1 failed/degraded ClusterOperator: **machine-config**\n` +
      `• **Error messages:**\n` +
      `  • **${CLUSTER_BLOCKER_MESSAGE}**\n` +
      `  • **could not find the requested rhel-10 default stream in the list of OSImageStreams [rhel-9]**\n` +
      `  • **authentication required** when reading the payload manifest from the internal registry\n` +
      `• **Event summary:** No strong machine-config failure event chain was found in the sampled event results; visible machine-config events were mostly normal completion events.\n` +
      `• **Alert status:** Relevant active alerts: **ClusterOperatorDegraded(machine-config)** and **TargetDown(machine-config-controller)**.\n` +
      `• **Historical pattern:** **No recurring failed upgrade** pattern in ClusterVersion history; all recorded attempts completed.\n` +
      `• **Last success:** **${CLUSTER_CURRENT_VERSION}** completed successfully at **2026-08-18T23:12:36Z**.\n` +
      `• **Update service:** Custom upstream is working; \`RetrievedUpdates=True\`.\n` +
      `• **Node issues:** No NotReady node was confirmed in retrieved data; MCP readiness suggests **6/6 nodes updated/ready**.\n` +
      `• **Infrastructure problems:** No broad infrastructure outage was proven; issue is localized to upgrade gating and machine-config reconciliation.\n` +
      `• **MCP Issues:** **0** degraded MachineConfigPools; master and worker pools both show Updated=True, Updating=False, Degraded=False.\n` +
      `• **Escalation:** Contact Red Hat support if restoring \`${CLUSTER_BLOCKER_SECRET}\` does not clear \`Upgradeable=False\` or if machine-config remains degraded with the same payload/OSImageStream errors.\n` +
      `• **Recovery time:** Likely **short** once credentials and payload access issues are corrected; longer if the release payload metadata is inconsistent.\n` +
      `• **Next steps:** Restore/verify \`${CLUSTER_BLOCKER_SECRET}\`, then recheck ClusterVersion \`Upgradeable\` and machine-config \`Degraded\`; if machine-config still logs payload auth or missing \`rhel-10\` stream errors, gather must-gather data and escalate`,
    tools: ["pods_log", "events_list", "resources_list", "search_openshift_docs"],
    sources: [
      {
        title: "Scalability and performance - OpenShift Container Platform",
        href: "https://docs.openshift.com/container-platform/4.22/scalability_and_performance/index.html",
      },
      {
        title: "Updating clusters - OpenShift Container Platform",
        href: "https://docs.openshift.com/container-platform/4.22/updating/index.html",
      },
      {
        title: "Gathering data about your cluster",
        href: "https://docs.openshift.com/container-platform/4.22/support/gathering-cluster-data.html",
      },
      {
        title: "Troubleshooting Operator issues",
        href: "https://docs.openshift.com/container-platform/4.22/support/troubleshooting/troubleshooting-operator-issues.html",
      },
      {
        title: "Machine Config Operator",
        href: "https://docs.openshift.com/container-platform/4.22/post_installation_configuration/machine-configuration-tasks.html",
      },
    ],
  };
}

export function getClusterSettingsPrecheckResponse(
  targetVersion = CLUSTER_PATCH_VERSION,
  targetChannel = CLUSTER_CHANNEL,
): {
  content: string;
  suggestions: string[];
} {
  return {
    content:
      `**Pre-flight AI Validation for Upgrade to OCP ${targetVersion} (${targetChannel})**\n\n` +
      `**Mode:** ValidationMode — this assessment does **not** start a cluster update.\n\n` +
      `**Current version:** ${CLUSTER_CURRENT_VERSION} · **Channel:** ${targetChannel}\n` +
      `**Target version:** ${targetVersion}\n\n` +
      `**Cincinnati health:** Custom upstream configured; healthy update retrieval.\n` +
      `**Upgrade blocked:** Yes\n` +
      `**Upgrade blockers:** Parent credentials secret must be restored prior to upgrade: \`${CLUSTER_BLOCKER_SECRET}\`.\n` +
      `**ClusterVersion:** Upgradeable=False · ReleaseAccepted=False · RetrievedUpdates=True\n` +
      `**Unhealthy ClusterOperators:** console (Unmanaged), machine-config (Degraded)\n` +
      `**Degraded MCPs:** 0 · **NotReady nodes:** 0 · **Resource pressure:** None\n` +
      `**Active alerts:** ClusterNotUpgradeable, ClusterOperatorDegraded\n\n` +
      `**Recommendation:** Blocked — resolve issues before Approve & Start Update.\n\n` +
      `**Next steps:**\n` +
      `1. Restore \`${CLUSTER_BLOCKER_SECRET}\`.\n` +
      `2. Re-check Upgradeable and ReleaseAccepted.\n` +
      `3. Use **Learn more with AI** or **Apply Recommended Remediation** from the pre-flight summary.\n\n` +
      `_Always review AI-generated content prior to use. Cluster status.phase remains Ready — not Updating._`,
    suggestions: [
      "How do I restore aws-creds?",
      "Apply recommended remediation",
      "Why is 5.1 blocked?",
      "Open Cluster Update",
    ],
  };
}

export function getPreflightRemediationResponse(): {
  content: string;
  suggestions: string[];
} {
  return {
    content:
      `**LightSpeed diagnostic breakdown**\n\n` +
      `**Blocker:** \`${CLUSTER_BLOCKER_SECRET}\` missing → ClusterVersion Upgradeable=False.\n\n` +
      `**Impact:** Pre-flight for the selected target remains failed until credentials are restored. No update has been started.\n\n` +
      `**Recommended remediation playbook:**\n` +
      `1. \`oc get secret aws-creds -n kube-system\`\n` +
      `2. Restore from installer credentials or cloud-credential operator.\n` +
      `3. Watch \`oc get clusterversion\` until Upgradeable=True.\n` +
      `4. Re-run **Run Pre-Flight Check** on Cluster Update.\n\n` +
      `Use **Apply Recommended Remediation** to simulate the automated fix script in this prototype.`,
    suggestions: ["Apply recommended remediation", "Re-run pre-flight", "Open Cluster Update"],
  };
}

export function getApplyRemediationResponse(): {
  content: string;
  suggestions: string[];
} {
  return {
    content:
      `**Applying recommended remediation (prototype)**\n\n` +
      `• Verified playbook target: restore \`${CLUSTER_BLOCKER_SECRET}\`\n` +
      `• Simulated secret restore… done\n` +
      `• Rechecking ClusterVersion conditions… Upgradeable still gated until you re-run pre-flight\n\n` +
      `**Next:** Return to **Plan & pre-flight**, confirm target version, and run pre-flight again before Approve & Start Update.`,
    suggestions: ["Open Cluster Update", "Re-run pre-flight", "Update status"],
  };
}

// Comprehensive AI response handler for OpenShift LightSpeed
export function getAIResponse(userInput: string, currentPath?: string): { 
  content: string; 
  action?: any; 
  actions?: any[]; 
  suggestions?: string[];
  tools?: string[];
  sources?: Array<{ title: string; href: string }>;
} {
  const lowerInput = userInput.toLowerCase();
  const path = (currentPath || '').toLowerCase();

  const asksUpdatePrecheck =
    lowerInput.includes("update cluster") ||
    lowerInput.includes("precheck") ||
    lowerInput.includes("pre-check") ||
    lowerInput.includes("update status") ||
    lowerInput.includes("upgrade blocked") ||
    lowerInput.includes("clusternotupgradeable");

  if (
    asksUpdatePrecheck &&
    (path.includes("/cluster-settings") || path.includes("/cluster-update") || path === "/" || path === "")
  ) {
    const report = getUpdateStatusResponse();
    return {
      content: report.content,
      tools: report.tools,
      sources: report.sources,
      suggestions: ["How do I restore aws-creds?", "Why is 5.1 blocked?", "Open Cluster Update"],
    };
  }
  
  if (
    lowerInput.includes("restore") &&
    (lowerInput.includes("aws-creds") || lowerInput.includes("credentials secret"))
  ) {
    return {
      content:
        `**Restore parent credentials**\n\n` +
        `The blocker is \`${CLUSTER_BLOCKER_SECRET}\`. Until that secret is restored, ClusterVersion stays Upgradeable=False and 5.1 remains blocked.\n\n` +
        `**Typical path (AWS):**\n` +
        `1. Confirm the secret is missing or empty: \`oc get secret aws-creds -n kube-system\`\n` +
        `2. Restore it from your installer credentials or cloud-credential operator.\n` +
        `3. Re-check ClusterVersion conditions, then use **Update status** on Cluster Settings.\n\n` +
        `Patch ${CLUSTER_PATCH_VERSION} may still be listed, but **Release not accepted** until payload verification succeeds.\n\n` +
        `_I cannot restore the secret from this chat. This is a guidance-only step._`,
      suggestions: ["Update status", "Open Cluster Update", "Why is 5.1 blocked?"],
    };
  }

  if (lowerInput.includes("5.1 blocked") || lowerInput.includes("why is 5.1")) {
    return {
      content:
        `**Why 5.1 is blocked**\n\n` +
        `Your cluster can continue to install **5.0** patches. The minor update to **5.1** is blocked because ClusterVersion is not Upgradeable: ${CLUSTER_BLOCKER_MESSAGE}\n\n` +
        `The Overview **ClusterNotUpgradeable** insight and Cluster Settings **AI assessment** are the same condition.`,
      suggestions: ["How do I restore aws-creds?", "Can I still install 5.0.1?", "Update status"],
    };
  }

  if (lowerInput.includes("5.0.1") || lowerInput.includes("install 5.0")) {
    return {
      content:
        `**Patch ${CLUSTER_PATCH_VERSION}**\n\n` +
        `5.0 patches remain in scope while 5.1 is blocked. On Cluster Settings, **Select a version** lists ${CLUSTER_PATCH_VERSION} as recommended.\n\n` +
        `Current status is still **Release not accepted** until payload verification succeeds. Use **Precheck your cluster with AI** before you start an update — updates are irreversible.`,
      suggestions: ["Update status", "Open Cluster Update", "How do I restore aws-creds?"],
    };
  }
  // Respond dynamically based on current page + user query
  
  // --- OBSERVE PAGE ---
  if (path.includes('/observe')) {
    if (lowerInput.includes('critical alert') || lowerInput.includes('explain the critical')) {
      return {
        content: `🚨 **Critical Alerts Analysis**\n\nI've analyzed your current alerts and here's what needs attention:\n\n**⚠️ Alert 1: KubePodCrashLooping**\n• **Severity:** Warning\n• **Namespace:** openshift-monitoring\n• **Details:** Pod \`prometheus-adapter-6b8f7d5c9-k2x8m\` has restarted 4 times in the last hour\n• **Impact:** Metrics collection may be intermittent\n• **Recommended action:** Check pod logs for OOM or configuration issues\n\n**🔴 Alert 2: ClusterOperatorDegraded**\n• **Severity:** Critical\n• **Details:** The \`machine-config\` operator is reporting degraded status\n• **Impact:** Node configuration changes may not be applied\n• **Recommended action:** Run \`oc describe co machine-config\` to see the specific error\n\n**📊 Alert 3: HighMemoryPressure**\n• **Severity:** Warning\n• **Node:** worker-node-03\n• **Details:** Memory utilization at 92% for the last 15 minutes\n• **Impact:** Pods may be evicted if pressure continues\n• **Recommended action:** Consider scaling horizontally or increasing node resources\n\n**Next Steps:**\n1. Address the machine-config operator issue first (highest impact)\n2. Investigate the memory pressure on worker-node-03\n3. The pod crash loop may resolve after fixing the operator`,
        suggestions: [
          'Help me fix the machine-config operator',
          'How do I check memory pressure on a node?',
          'Set up alert routing to Slack',
          'Show me alert history for this week'
        ]
      };
    }
    
    if (lowerInput.includes('cpu') && (lowerInput.includes('high') || lowerInput.includes('usage'))) {
      return {
        content: `📈 **CPU Usage Analysis**\n\nI've looked at your CPU trends and here's what's happening:\n\n**Current state:** 72% cluster-wide average (up 8% from last hour)\n\n**🔍 Top CPU consumers right now:**\n• \`nginx-deployment\` (prod-frontend) — 850m CPU ↑ Spiking\n• \`prometheus-k8s\` (openshift-monitoring) — 620m CPU → Steady\n• \`etl-processor\` (data-pipeline) — 580m CPU ↑ Growing\n• \`api-gateway\` (prod-api) — 440m CPU → Normal\n\n**🧠 Analysis:**\n• The \`nginx-deployment\` is the main driver — handling 3x normal traffic\n• The \`etl-processor\` has been climbing for 30 minutes (likely a batch job)\n• Other workloads are within normal range\n\n**💡 Recommendations:**\n1. **Short-term:** The nginx spike looks traffic-related — enable auto-scaling\n2. **Medium-term:** The ETL processor should finish soon; monitor for completion\n3. **Long-term:** If CPU regularly exceeds 70%, consider adding worker nodes`,
        suggestions: [
          'Set up auto-scaling for nginx',
          'Show CPU trends for the past 24 hours',
          'Which nodes have the most CPU pressure?',
          'Configure CPU usage alerts'
        ]
      };
    }
    
    if (lowerInput.includes('optimize') && lowerInput.includes('resource')) {
      return {
        content: `⚡ **Resource Optimization Recommendations**\n\nI've analyzed your cluster utilization patterns:\n\n**🎯 Quick Wins:**\n\n**1. Over-provisioned deployments:**\n• \`logging-collector\` requests 500m CPU but averages 80m → **Reduce to 200m**\n• \`cache-service\` requests 2Gi memory but peaks at 800Mi → **Reduce to 1Gi**\n• **Savings:** ~1.2 CPU cores and 3.5Gi memory freed\n\n**2. Idle workloads:**\n• \`staging-api\` — zero traffic for 5 days → **Scale to 0**\n• \`test-runner-cron\` — last ran 2 weeks ago → **Verify if needed**\n\n**3. Right-sizing nodes:**\n• Workers average 45% CPU / 62% memory — could consolidate\n\n**📊 Projected impact:**\n• CPU: 72% → ~55%\n• Memory: 75% → ~60%\n• Defer adding new nodes by 2-3 months`,
        suggestions: [
          'Help me right-size logging-collector',
          'How do I set up VPA?',
          'Show me idle workloads',
          'Estimate cost savings'
        ]
      };
    }
    
    if (lowerInput.includes('custom alert') || (lowerInput.includes('set up') && lowerInput.includes('alert'))) {
      return {
        content: `🔔 **Setting Up Custom Alerts**\n\n**Via Console:**\n1. Go to **Observe** → **Alerting** → **Alerting Rules**\n2. Click **Create Alerting Rule**\n3. Define your PromQL expression, severity, and duration\n\n**Example — CPU > 80% for 10 minutes:**\n\`\`\`yaml\napiVersion: monitoring.coreos.com/v1\nkind: PrometheusRule\nmetadata:\n  name: custom-cpu-alert\n  namespace: openshift-monitoring\nspec:\n  groups:\n  - name: custom.rules\n    rules:\n    - alert: HighCPUUsage\n      expr: cluster:cpu_usage:ratio > 0.8\n      for: 10m\n      labels:\n        severity: warning\n\`\`\`\n\n**Popular alert templates:**\n• 🔴 Pod crash looping — catches unstable deployments\n• 💾 PVC near capacity — warns before storage fills\n• 🌐 High error rate — detects service degradation\n• ⏱️ Slow response times — catches performance issues\n\nDescribe what you want to monitor and I'll generate the rule!`,
        suggestions: [
          'Create a PVC capacity alert',
          'Alert me when pods crash loop',
          'Route alerts to Slack',
          'Show active alerting rules'
        ]
      };
    }
    
    if (lowerInput.includes('machine-config') || lowerInput.includes('fix the machine')) {
      return {
        content: `🔧 **Fixing the machine-config Operator**\n\nLet me walk you through diagnosing and resolving this:\n\n**Step 1: Check the operator status**\n\`\`\`bash\noc describe co machine-config\n\`\`\`\n\nLook for the \`Message\` field under \`Conditions\` — it tells you exactly what's wrong.\n\n**Step 2: Common causes & fixes:**\n\n**1️⃣ MachineConfigPool stuck updating:**\n\`\`\`bash\noc get mcp\n\`\`\`\nIf a pool shows \`UPDATING: True\` for a long time, a node may be stuck draining.\n• **Fix:** Check the stuck node: \`oc describe node <node-name>\`\n• Look for pods with PodDisruptionBudgets preventing drain\n\n**2️⃣ Certificate issues:**\n• Machine-config-server certificates may need rotation\n• **Fix:** \`oc delete secret machine-config-server-tls -n openshift-machine-config-operator\`\n• The operator will regenerate it automatically\n\n**3️⃣ Configuration drift:**\n• A MachineConfig was manually edited or corrupted\n• **Fix:** \`oc get mc\` and check for unexpected configs\n\n**Want me to run diagnostics?** Share the output of \`oc describe co machine-config\` and I'll pinpoint the issue!`,
        suggestions: [
          'Check MachineConfigPool status',
          'How do I force a node to uncordon?',
          'Show machine-config operator logs',
          'What is a MachineConfig?'
        ]
      };
    }
    
    if (lowerInput.includes('memory pressure') || lowerInput.includes('check memory')) {
      return {
        content: `💾 **Memory Pressure on worker-node-03**\n\nHere's what I can see:\n\n**Current state:**\n• Memory usage: 92% (14.7Gi / 16Gi)\n• Swap: Disabled (standard for OpenShift)\n• Eviction threshold: 100Mi remaining\n• **Risk:** Pods will be evicted when available memory drops below 100Mi\n\n**🔍 Top memory consumers on this node:**\n• \`elasticsearch-data-0\` — 4.2Gi (the biggest consumer)\n• \`data-processor-batch\` — 3.8Gi\n• \`api-gateway-5c9d8f\` — 1.2Gi\n• System pods — 2.1Gi\n• Other workloads — 3.4Gi\n\n**💡 Immediate options:**\n1. **Move elasticsearch-data-0** to a less loaded node using pod anti-affinity\n2. **Scale down** the data-processor if it's a batch job that can wait\n3. **Cordon the node** to prevent new pods from scheduling\n\n\`\`\`bash\noc adm cordon worker-node-03\n\`\`\`\n\nThis prevents new pods from landing on this node while you redistribute.`,
        suggestions: [
          'Cordon worker-node-03',
          'Move elasticsearch to another node',
          'Set up memory pressure alerts',
          'Add a new worker node'
        ]
      };
    }
    
    if (lowerInput.includes('alert history') || lowerInput.includes('alert') && lowerInput.includes('week')) {
      return {
        content: `📊 **Alert History — Last 7 Days**\n\n**Summary:**\n• Total alerts fired: 18\n• Critical: 2 | Warning: 11 | Info: 5\n\n**🔴 Critical alerts:**\n• **ClusterOperatorDegraded** (machine-config) — Active since 3h ago\n• **etcdHighCommitDurations** — Fired Tuesday, resolved after 45min\n\n**⚠️ Warning trends:**\n• **KubePodCrashLooping** — 4 occurrences (prometheus-adapter keeps restarting)\n• **HighMemoryPressure** — 3 occurrences on worker-node-03 (recurring pattern)\n• **KubePersistentVolumeUsageCritical** — 2 occurrences (postgres PVC growing)\n• **TargetDown** — 2 occurrences (brief monitoring gaps)\n\n**📈 Pattern analysis:**\n• Memory pressure on worker-3 is a recurring issue — it's been alerting every 2-3 days\n• The prometheus-adapter crashes correlate with high monitoring load\n• Your postgres PVC alerts are increasing in frequency (growing data)\n\n**Recommendations:**\n1. Address worker-3 memory (recurring)\n2. Fix prometheus-adapter (4 events this week)\n3. Expand postgres PVC before it fills up`,
        suggestions: [
          'Fix worker-3 memory issues',
          'Increase prometheus-adapter resources',
          'Expand the postgres PVC',
          'Set up PagerDuty integration'
        ]
      };
    }
  }
  
  // --- WORKLOADS PAGE ---
  if (path.includes('/workloads')) {
    if (lowerInput.includes('pod') && lowerInput.includes('pending')) {
      return {
        content: `⏳ **Investigating Pending Pods**\n\nI found **1 pod** currently in pending state:\n\n**Pod:** \`data-processor-batch-7f8d9-xk2mn\`\n• **Namespace:** data-pipeline\n• **Pending since:** 12 minutes ago\n• **Reason:** Insufficient memory\n\n**🔍 What's happening:**\nThis pod requests 4Gi memory, but the most available on any node is 3.2Gi.\n\n**✅ Options to resolve:**\n\n**1. Reduce memory request:**\n\`\`\`bash\noc edit deployment data-processor-batch -n data-pipeline\n# Change resources.requests.memory to 2Gi\n\`\`\`\n\n**2. Free up memory** — \`staging-api\` is idle, using 1.5Gi → scale to 0\n\n**3. Add a worker node** — current nodes at 75% memory average\n\nWhich approach would you like to try?`,
        suggestions: [
          'Scale down the staging-api',
          'How do I add a worker node?',
          'Show memory usage per node',
          'What other pods are resource-heavy?'
        ]
      };
    }
    
    if (lowerInput.includes('restart') || lowerInput.includes('explain pod restart')) {
      return {
        content: `🔄 **Pod Restart Analysis (last 24h)**\n\n• \`prometheus-adapter-6b8f7d\` — **4 restarts** — OOMKilled\n• \`api-gateway-5c9d8f\` — **2 restarts** — Liveness probe failed\n• \`cache-redis-0\` — **1 restart** — Node maintenance\n\n**🧠 Assessment:**\n• **prometheus-adapter** — Most concerning. Increase memory limit from 256Mi to 512Mi\n• **api-gateway** — Probe failures under load. Increase timeout from 3s to 10s\n• **cache-redis** — Normal, scheduled maintenance ✅\n\n**Recommended actions:**\n1. Increase prometheus-adapter memory (quick fix)\n2. Adjust api-gateway probe timeout\n3. No action needed for redis`,
        suggestions: [
          'Fix prometheus-adapter memory',
          'Adjust api-gateway probe settings',
          'Show historical restart trends',
          'What are healthy restart thresholds?'
        ]
      };
    }
    
    if (lowerInput.includes('scale') && lowerInput.includes('deployment')) {
      return {
        content: `📊 **Scaling Recommendations**\n\nBased on current traffic and resource patterns:\n\n**↑ Scale UP:**\n• \`nginx-deployment\` (prod-frontend) — 3 replicas, CPU at 85%. **Recommend: 5**\n• \`api-gateway\` (prod-api) — Probe failures. **Recommend: 4** (from 2)\n\n**↓ Scale DOWN:**\n• \`staging-api\` — 2 replicas, zero traffic for 5 days. **Recommend: 0**\n• \`test-worker\` — 3 replicas, 5% CPU average. **Recommend: 1**\n\n**🤖 Auto-scaling suggestion:**\n\`\`\`bash\noc autoscale deployment nginx-deployment \\\n  --min=3 --max=8 --cpu-percent=70 \\\n  -n prod-frontend\n\`\`\`\n\nWant me to help set this up?`,
        suggestions: [
          'Set up HPA for nginx-deployment',
          'Scale down staging-api to 0',
          'Show resource usage per deployment',
          'What are PodDisruptionBudgets?'
        ]
      };
    }
    
    if (lowerInput.includes('troubleshoot') || lowerInput.includes('failed workload')) {
      return {
        content: `🔍 **Failed Workload Analysis**\n\n**❌ Failing Pods:**\n• \`data-processor-batch-xk2mn\` — Pending (insufficient memory)\n• \`prometheus-adapter-k2x8m\` — CrashLoopBackOff (OOMKilled)\n\n**⚠️ Degraded Deployments:**\n• \`api-gateway\` — 1 of 2 pods restarting intermittently\n\n**Recommended fixes:**\n1. **data-processor:** Reduce memory request or add a node\n2. **prometheus-adapter:** Increase memory limit to 512Mi\n3. **api-gateway:** Adjust probe and scale to 4 replicas\n\nWant me to walk through fixing any of these?`,
        suggestions: [
          'Fix the prometheus-adapter',
          'Help with the pending pod',
          'Scale up api-gateway',
          'Show all pod statuses'
        ]
      };
    }
  }
  
  // --- NETWORKING PAGE ---
  if (path.includes('/networking')) {
    if (lowerInput.includes('troubleshoot') && lowerInput.includes('network') || lowerInput.includes('troubleshoot') && lowerInput.includes('connect')) {
      return {
        content: `🔍 **Network Troubleshooting**\n\n**✅ Healthy:**\n• Cluster DNS: Operational\n• SDN/OVN-Kubernetes: Healthy\n• Ingress Controller: Running (2 replicas)\n\n**⚠️ Issues Detected:**\n\n**1. Route \`api-external\` returning 503 errors**\n• Since: ~45 minutes ago\n• **Cause:** Backend pods overwhelmed or restarting\n• **Fix:** Scale up api-gateway pods\n\n**2. NetworkPolicy blocking \`staging\` namespace**\n• Preventing Prometheus from scraping metrics\n• **Fix:** Add ingress rule for \`openshift-monitoring\`\n\nWant me to help fix either of these?`,
        suggestions: [
          'Fix the api-external route',
          'Update the staging NetworkPolicy',
          'How do I debug DNS issues?',
          'Explain OVN-Kubernetes'
        ]
      };
    }
    
    if (lowerInput.includes('network polic')) {
      return {
        content: `🛡️ **Network Policies in Your Cluster**\n\nNetwork Policies control which pods can communicate.\n\n**📋 Active policies:**\n• \`default-deny-ingress\` (staging) — Blocks all incoming by default\n• \`allow-from-frontend\` (prod-api) — Allows frontend pod traffic\n• \`allow-monitoring\` (prod-*) — Allows Prometheus scraping\n\n**⚠️ Issue:** \`staging\` has deny-all but no monitoring exception.\n\n**Fix:**\n\`\`\`yaml\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-monitoring\n  namespace: staging\nspec:\n  ingress:\n  - from:\n    - namespaceSelector:\n        matchLabels:\n          name: openshift-monitoring\n    ports:\n    - port: 9090\n\`\`\``,
        suggestions: [
          'Apply the monitoring fix',
          'Show all NetworkPolicies',
          'Best practices for NetworkPolicies',
          'Test pod-to-pod connectivity'
        ]
      };
    }
  }
  
  // --- STORAGE PAGE ---
  if (path.includes('/storage')) {
    if (lowerInput.includes('storage class') || lowerInput.includes('explain storage')) {
      return {
        content: `💾 **Your Storage Classes**\n\n• **gp3-encrypted** ⭐ Default — AWS EBS gp3, encrypted, fast — 1.8Ti across 12 PVCs\n• **standard** — AWS EBS gp2, moderate speed — 400Gi across 5 PVCs\n• **io2-high-perf** — AWS EBS io2, very fast — 300Gi across 2 PVCs\n\n**💡 Recommendations:**\n• Databases → io2-high-perf\n• App data → gp3-encrypted\n• Logs & backups → standard\n\n**⚠️ Heads up:** PVC \`postgres-data-0\` in \`prod-db\` is at 87% capacity!`,
        suggestions: [
          'Expand the postgres PVC',
          'Compare storage class costs',
          'Show PVCs near capacity',
          'Create a volume snapshot'
        ]
      };
    }
    
    if (lowerInput.includes('expand') && lowerInput.includes('volume')) {
      return {
        content: `📈 **Volume Expansion**\n\n**⚠️ PVC at risk:** \`postgres-data-0\` in \`prod-db\`\n• Current: 50Gi — Used: 43.5Gi (87%)\n• Growth rate: ~2Gi/week → **Full in ~3 weeks**\n\n**To expand:**\n1. **Storage** → **PersistentVolumeClaims**\n2. Find \`postgres-data-0\` → **Actions** → **Expand PVC**\n3. Set to **100Gi** → Click **Expand**\n\n**Via CLI:**\n\`\`\`bash\noc patch pvc postgres-data-0 -n prod-db \\\n  -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'\n\`\`\`\n\n**No downtime required** for gp3-encrypted! Filesystem expands automatically. 🎉`,
        suggestions: [
          'Show all PVCs near capacity',
          'Set up PVC usage alerts',
          'What if expansion fails?',
          'How much will 100Gi cost?'
        ]
      };
    }
    
    if (lowerInput.includes('bound') || lowerInput.includes('what does bound')) {
      return {
        content: `📎 **PVC Status: "Bound" Explained**\n\nWhen a PVC shows **Bound**, it means:\n\n✅ A PersistentVolume (PV) has been successfully matched and attached to this claim. Your pod can use this storage!\n\n**All PVC statuses:**\n• **Pending** — Waiting for a matching PV (check StorageClass and capacity)\n• **Bound** — Successfully paired with a PV ✅\n• **Lost** — The PV it was bound to has been deleted ❌\n\n**Your cluster:** All 19 PVCs are currently Bound — looking healthy!`,
        suggestions: [
          'Show PVCs by status',
          'What happens if a PV is deleted?',
          'How do I create a new PVC?',
          'Explain dynamic provisioning'
        ]
      };
    }
  }
  
  // --- BUILDS PAGE ---
  if (path.includes('/builds')) {
    if ((lowerInput.includes('troubleshoot') || lowerInput.includes('failed')) && !lowerInput.includes('build strateg')) {
      return {
        content: `🔍 **Build Issues — Last 24 Hours**\n\n**❌ Failed:**\n\n**1. \`frontend-app-build-47\`** (2h ago)\n• Reason: OOMKilled during \`npm install\`\n• Fix: Increase build memory from 512Mi to 1Gi\n\n**2. \`api-service-build-23\`** (6h ago)\n• Reason: Git clone auth error — token expired\n• Fix: Update Git source secret\n\n**✅ Successful: 12 builds** (avg 3m 42s)\n\nWant me to help fix either?`,
        suggestions: [
          'Fix the frontend build memory',
          'Update the Git source secret',
          'Show build time trends',
          'Set up build notifications'
        ]
      };
    }
    
    if (lowerInput.includes('image stream') || lowerInput.includes('imagestream')) {
      return {
        content: `🏷️ **ImageStreams Explained**\n\nImageStreams are OpenShift's way of tracking container images — think of them as smart bookmarks for your images!\n\n**What they do:**\n• Track image tags (like \`latest\`, \`v1.2\`, \`production\`)\n• Detect when an image changes and trigger rebuilds/redeployments\n• Abstract away registry URLs (internal or external)\n\n**Your ImageStreams:**\n• \`frontend-app\` — 3 tags (latest, staging, production)\n• \`api-service\` — 2 tags (latest, production)\n• \`worker-image\` — 1 tag (latest)\n\n**Why use them?**\n• Push a new image → deployment auto-updates\n• Easy rollback by switching tags\n• Works across internal and external registries`,
        suggestions: [
          'How do I create an ImageStream?',
          'Trigger rebuild on image change',
          'Show ImageStream tag history',
          'Import external image'
        ]
      };
    }
  }
  
  // --- COMPUTE PAGE ---
  if (path.includes('/compute')) {
    if (lowerInput.includes('node detail') || lowerInput.includes('show node')) {
      return {
        content: `🖥️ **Node Health Summary**\n\n**Control Plane (3):** All healthy ✅\n• master-0: CPU 35%, Memory 58%\n• master-1: CPU 32%, Memory 55%\n• master-2: CPU 38%, Memory 61%\n\n**Workers (5):**\n• worker-0: ✅ CPU 62%, Memory 71%\n• worker-1: ✅ CPU 58%, Memory 68%\n• worker-2: ✅ CPU 45%, Memory 55%\n• worker-3: ⚠️ CPU 78%, **Memory 92%**\n• worker-4: ✅ CPU 51%, Memory 63%\n\n**⚠️** worker-3 needs attention — consider draining or adding a 6th worker.`,
        suggestions: [
          'Drain workloads from worker-3',
          'Add a new worker node',
          'Set up node auto-scaling',
          'Explain pod anti-affinity'
        ]
      };
    }
    
    if (lowerInput.includes('add') && lowerInput.includes('node')) {
      return {
        content: `➕ **Adding a Worker Node**\n\n**Scale your MachineSet:**\n1. **Compute** → **MachineSets**\n2. \`cluster-worker-us-east-1a\` → **Actions** → **Edit Machine count** → 6\n\n**Via CLI:**\n\`\`\`bash\noc scale machineset cluster-worker-us-east-1a \\\n  --replicas=6 -n openshift-machine-api\n\`\`\`\n\n⏱️ Ready in ~5-8 minutes | 💰 ~$140/month (m5.xlarge)\n\n**Better long-term:** Set up ClusterAutoscaler for automatic scaling!`,
        suggestions: [
          'Set up ClusterAutoscaler',
          'What instance type should I use?',
          'Show MachineSet config',
          'How do I remove a node later?'
        ]
      };
    }
    
    if (lowerInput.includes('resource') && lowerInput.includes('avail')) {
      return {
        content: `📊 **Cluster Resource Availability**\n\n**Total (8 nodes):** 32 vCPUs (45% free) | 128Gi memory (38% free) | 1,740 pod slots\n\n**Per-node:**\n• worker-0: 1.5 cores / 4.6Gi free\n• worker-1: 1.7 cores / 5.1Gi free\n• worker-2: 2.2 cores / 7.2Gi free\n• worker-3: 0.9 cores / **1.3Gi free** ⚠️\n• worker-4: 2.0 cores / 5.9Gi free\n\n**⚠️ Bottleneck:** worker-3 — pods needing >1.3Gi memory will go Pending.`,
        suggestions: [
          'Add a new worker node',
          'Redistribute from worker-3',
          'Set up resource quotas',
          'Configure pod priority classes'
        ]
      };
    }
    
    if (lowerInput.includes('explain') && lowerInput.includes('node health')) {
      return {
        content: `❤️ **Understanding Node Health**\n\nOpenShift monitors several conditions on each node:\n\n**✅ Ready** — Node is healthy and accepting pods (this is what you want!)\n**❌ NotReady** — Node has a problem and can't run pods\n**⚠️ SchedulingDisabled** — Node is cordoned (no new pods, existing ones keep running)\n\n**What OpenShift checks:**\n• **Memory pressure** — Is the node running out of RAM?\n• **Disk pressure** — Is storage full?\n• **PID pressure** — Too many processes?\n• **Network unavailable** — Can the node communicate?\n• **Kubelet health** — Is the node agent running?\n\n**Your cluster:** All 8 nodes are Ready, though worker-3 is approaching memory pressure threshold.\n\n**Pro tip:** Set up alerts for node conditions so you know before a node goes NotReady!`,
        suggestions: [
          'Show node conditions detail',
          'Set up node health alerts',
          'What happens when a node goes NotReady?',
          'How do I drain a node?'
        ]
      };
    }
  }
  
  // --- HOME/DASHBOARD ---
  if (path === '/' || path === '') {
    if (lowerInput.includes('retrieval') && lowerInput.includes('alert')) {
      return {
        content: `⚠️ **Retrieval Updates Alert**\n\nThis is about the **Insights Operator** — it gathers anonymous cluster health data for Red Hat.\n\n**What's happening:** Can't reach the Red Hat API endpoint.\n\n**Impact:** Low — cluster works normally. No proactive Red Hat recommendations.\n\n**Common causes:**\n• Proxy blocking outbound HTTPS\n• Network policy restricting \`openshift-insights\` egress\n• Temporary API issues\n\n**To resolve:**\n1. Check outbound access\n2. Verify proxy: \`oc get proxy cluster -o yaml\`\n3. If air-gapped, disable this alert safely`,
        suggestions: [
          'Check proxy settings',
          'How do I disable this alert?',
          'Show all active alerts',
          'What is the Insights Operator?'
        ]
      };
    }
    
    if (lowerInput.includes('check') && lowerInput.includes('update')) {
      return {
        content: `🔄 **Cluster Update Status**\n\n**Current version:** OpenShift 4.21.8\n**Available update:** OpenShift 4.22.0 (stable channel)\n\n**Before updating:**\n1. ✅ Cluster health is good\n2. ⚠️ 2 operators need updates first (Ansible Automation Platform, Elasticsearch)\n3. ⚠️ 1 alert to review (machine-config operator degraded)\n\n**Recommended approach:**\n1. Fix the machine-config operator issue\n2. Update Ansible Automation Platform (10 min)\n3. Update Elasticsearch (5 min)\n4. Run preflight validation\n5. Start cluster update (~2 hours)\n\nWant to start with the operator updates?`,
        suggestions: [
          'Go to Cluster Update page',
          'Update operators first',
          'Assess readiness',
          'What are the risks?'
        ]
      };
    }
  }
  
  // --- INSTALLED SOFTWARE / ECOSYSTEM ---
  if (path.includes('/installed') || path.includes('/ecosystem')) {
    if (lowerInput.includes('compatibility') || lowerInput.includes('compatible')) {
      return {
        content: `🔍 **Operator Compatibility for OpenShift 4.22.0**\n\n**✅ Compatible (3):**\n• Red Hat OpenShift GitOps v1.12.0\n• Cert Manager v1.14.0\n• Red Hat OpenShift Pipelines v1.15.0\n\n**⚠️ Update before cluster update (2):**\n• **Ansible Automation Platform** v3.1.0 → v3.2.0\n• **Elasticsearch (ECK)** v2.11.0 → v2.12.1\n\n**📋 Update order:**\n1. Elasticsearch first (5 min)\n2. Ansible Automation Platform (10 min)\n3. Then cluster update — zero compatibility issues!`,
        suggestions: [
          'Update Elasticsearch now',
          'Update Ansible Automation Platform',
          'What if I skip operator updates?',
          'Show compatibility matrix'
        ]
      };
    }
    
    if (lowerInput.includes('which') && lowerInput.includes('need') && lowerInput.includes('update')) {
      return {
        content: `📦 **Operators Needing Updates**\n\n**🔴 Recommended before cluster update:**\n\n**1. Ansible Automation Platform** v3.1.0 → v3.2.0\n• Compatibility fixes for 4.22 | Risk if skipped: automation controller disconnect | ~10 min\n\n**2. Elasticsearch (ECK)** v2.11.0 → v2.12.1\n• Log ingestion fix for node drain | Risk if skipped: log gaps | ~5 min\n\n**🟡 Optional:**\n• GitOps v1.12.0 → v1.12.1 (patch)\n• Pipelines v1.15.0 → v1.15.2 (bug fixes)\n\nUpdate the first two before your cluster update.`,
        suggestions: [
          'Update all recommended',
          'Start with Ansible',
          'Show release notes',
          'Schedule for maintenance'
        ]
      };
    }
    
    if (lowerInput.includes('recommend') && lowerInput.includes('monitor')) {
      return {
        content: `📊 **Recommended Monitoring Operators**\n\nHere are the best options for enhanced monitoring:\n\n**1. Prometheus (already built-in)** ✅\n• OpenShift comes with a pre-configured Prometheus stack\n• Handles cluster and user workload monitoring\n\n**2. Grafana Operator** ⭐ Recommended\n• Rich dashboarding on top of Prometheus\n• Custom dashboards for your applications\n• Alert visualization\n\n**3. Elasticsearch / OpenShift Logging**\n• Centralized log aggregation\n• Search and analyze across all pods\n• You already have ECK installed!\n\n**4. Jaeger / OpenTelemetry**\n• Distributed tracing for microservices\n• Find performance bottlenecks\n• Visualize request flows\n\nWant me to help install any of these?`,
        suggestions: [
          'Install Grafana Operator',
          'Set up OpenTelemetry',
          'How do I create Grafana dashboards?',
          'Configure user workload monitoring'
        ]
      };
    }
  }
  
  // --- ADMINISTRATION ---
  if (path.includes('/administration')) {
    if (lowerInput.includes('cluster setting') || lowerInput.includes('show cluster setting')) {
      return {
        content: `⚙️ **Cluster Settings**\n\n• **Name:** production-east-1 | **Version:** 4.21.8 | **Platform:** AWS us-east-1\n• **Channel:** stable-4.22 (update available!)\n• **OAuth:** GitHub identity provider\n• **RBAC:** 12 ClusterRoles, 8 bindings\n• **Certificates:** Auto-managed, valid 26 months\n• **SDN:** OVN-Kubernetes\n• **Capacity:** 3 control plane + 5 workers (20 vCPUs, 80Gi)`,
        suggestions: [
          'Update to OpenShift 4.22',
          'Review RBAC configurations',
          'Check certificate expiry',
          'Show audit log settings'
        ]
      };
    }
    
    if (lowerInput.includes('check') && lowerInput.includes('update')) {
      return {
        content: `🔄 **Update Readiness Assessment**\n\n**Target:** OpenShift 4.22.0 (available on stable channel)\n\n**Checklist:**\n✅ Cluster health: Good\n✅ etcd: Healthy\n⚠️ Operators: 2 need updates first\n⚠️ Alerts: 1 active (machine-config degraded)\n✅ API compatibility: No deprecated APIs in use\n✅ Storage: Sufficient for update\n\n**Recommended sequence:**\n1. Resolve machine-config operator issue\n2. Update Ansible Automation Platform + Elasticsearch\n3. Run preflight validation\n4. Start cluster update\n\n**Estimated total time:** ~2.5 hours (including operator updates)`,
        suggestions: [
          'Assess readiness',
          'Fix machine-config operator',
          'Update operators first',
          'Start the update'
        ]
      };
    }
  }
  
  // --- HELM PAGE ---
  if (path.includes('/helm')) {
    if (lowerInput.includes('helm') || lowerInput.includes('chart') || lowerInput.includes('release')) {
      return {
        content: `⎈ **Helm Releases**\n\n**📦 Installed:**\n• \`redis-cache\` v7.2.4 (prod-cache) — ✅ Deployed\n• \`nginx-ingress\` v4.9.0 (ingress-nginx) — ✅ Deployed\n• \`grafana\` v7.0.8 (monitoring) — ✅ Deployed\n\n**⚠️ Updates available:**\n• redis-cache → v7.2.5 (security patch)\n• grafana → v7.3.0 (new features)\n\nI can help update releases, check history, or troubleshoot.`,
        suggestions: [
          'Update redis-cache',
          'Show grafana release history',
          'How do I rollback a release?',
          'Browse available charts'
        ]
      };
    }
  }

  // ========== DEEP FOLLOW-UP CHAINS (cross-page) ==========
  // These handle follow-up suggestions from context-aware responses
  // They work regardless of which page the user is on
  
  // -- Observe follow-ups --
  if (lowerInput.includes('cordon worker') || lowerInput.includes('cordon node')) {
    return {
      content: `🔒 **Cordoning worker-node-03**\n\nHere's what will happen and what to do:\n\n**Step 1: Cordon the node** (prevents new pods)\n\`\`\`bash\noc adm cordon worker-node-03\n\`\`\`\n\n**What this does:**\n• Marks the node as **SchedulingDisabled**\n• Existing pods keep running (no disruption!)\n• No NEW pods will be scheduled here\n\n**Step 2: Drain if needed** (moves existing pods)\n\`\`\`bash\noc adm drain worker-node-03 \\\n  --ignore-daemonsets \\\n  --delete-emptydir-data \\\n  --force\n\`\`\`\n\n**⚠️ Important:** Draining will evict all pods. Make sure your apps have multiple replicas so there's no downtime!\n\n**Step 3: Fix the issue** (add memory, fix the workload, etc.)\n\n**Step 4: Uncordon when ready**\n\`\`\`bash\noc adm uncordon worker-node-03\n\`\`\`\n\nThe node will accept pods again. 🎉\n\n**Current status:** worker-node-03 has 31 pods and 92% memory. Cordoning will prevent the situation from getting worse while you plan next steps.`,
      suggestions: [
        'Drain worker-node-03 now',
        'Which pods can I safely evict?',
        'Add a new worker node instead',
        'Show me what pods are on worker-3'
      ]
    };
  }
  
  if (lowerInput.includes('drain worker') || lowerInput.includes('drain node')) {
    return {
      content: `💧 **Draining worker-node-03**\n\nI'll walk you through this carefully:\n\n**Pre-drain checklist:**\n✅ Other nodes have capacity for displaced pods\n✅ Apps have multiple replicas (most do)\n⚠️ \`elasticsearch-data-0\` is a StatefulSet — needs special handling\n\n**Safe drain command:**\n\`\`\`bash\noc adm drain worker-node-03 \\\n  --ignore-daemonsets \\\n  --delete-emptydir-data \\\n  --pod-selector='app!=elasticsearch' \\\n  --timeout=300s\n\`\`\`\n\n**Why I excluded elasticsearch:** It's a StatefulSet with persistent data. Moving it requires:\n1. Scale down the StatefulSet\n2. Wait for graceful shutdown\n3. Let the scheduler place it on another node\n4. It will reattach its PersistentVolume\n\n**What happens during drain:**\n• Pods are gracefully terminated (they get SIGTERM)\n• Kubernetes reschedules them on other nodes\n• Services continue working (if you have replicas)\n• Takes about 2-5 minutes\n\n**After draining:** The node will have only DaemonSet pods left. You can then uncordon it, add memory, or remove it.`,
      suggestions: [
        'Move elasticsearch safely',
        'Uncordon the node after fixing',
        'How do I add memory to a node?',
        'Show pod distribution across nodes'
      ]
    };
  }
  
  if (lowerInput.includes('move elasticsearch') || lowerInput.includes('move elastic')) {
    return {
      content: `📦 **Moving Elasticsearch to Another Node**\n\nSince elasticsearch-data-0 is a StatefulSet with persistent storage, we need to be careful:\n\n**Step 1: Check which node has capacity**\n\`\`\`bash\noc get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.allocatable.cpu,MEM:.status.allocatable.memory\n\`\`\`\n\nBest candidate: **worker-2** (45% CPU, 55% memory — plenty of room)\n\n**Step 2: Add a node anti-affinity to avoid worker-3**\n\`\`\`bash\noc edit statefulset elasticsearch-data -n logging\n\`\`\`\n\nAdd under \`spec.template.spec\`:\n\`\`\`yaml\naffinity:\n  nodeAffinity:\n    requiredDuringSchedulingIgnoredDuringExecution:\n      nodeSelectorTerms:\n      - matchExpressions:\n        - key: kubernetes.io/hostname\n          operator: NotIn\n          values:\n          - worker-node-03\n\`\`\`\n\n**Step 3: Delete the pod (it will reschedule)**\n\`\`\`bash\noc delete pod elasticsearch-data-0 -n logging\n\`\`\`\n\nThe StatefulSet controller will recreate it on an eligible node, and it will reattach its PersistentVolume automatically.\n\n**⏱️ Estimated time:** 3-5 minutes for the pod to be fully running on the new node.\n\n**⚠️ During the move:** Logging may have a brief gap (2-3 min). Other elasticsearch replicas (if any) will continue serving queries.`,
      suggestions: [
        'Verify elasticsearch is healthy after move',
        'Remove the node affinity later?',
        'Show elasticsearch cluster health',
        'Set up log buffering during moves'
      ]
    };
  }
  
  if (lowerInput.includes('alert') && lowerInput.includes('slack') || lowerInput.includes('route') && lowerInput.includes('slack')) {
    return {
      content: `📱 **Setting Up Alert Routing to Slack**\n\nGreat idea! Here's how to get alerts in your Slack channel:\n\n**Step 1: Create a Slack webhook**\n1. Go to your Slack workspace → **Apps** → **Incoming Webhooks**\n2. Click **Add to Slack**\n3. Choose a channel (e.g., #ops-alerts)\n4. Copy the webhook URL\n\n**Step 2: Create an AlertManager secret**\n\`\`\`yaml\napiVersion: v1\nkind: Secret\nmetadata:\n  name: alertmanager-main\n  namespace: openshift-monitoring\nstringData:\n  alertmanager.yaml: |\n    receivers:\n    - name: slack-notifications\n      slack_configs:\n      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'\n        channel: '#ops-alerts'\n        title: '{{ .GroupLabels.alertname }}'\n        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'\n        send_resolved: true\n    route:\n      receiver: slack-notifications\n      group_by: ['alertname', 'namespace']\n      group_wait: 30s\n      group_interval: 5m\n      repeat_interval: 4h\n\`\`\`\n\n**Step 3: Apply it**\n\`\`\`bash\noc apply -f alertmanager-config.yaml\n\`\`\`\n\n**Pro tips:**\n• Use \`send_resolved: true\` to get notified when alerts clear ✅\n• Set \`repeat_interval\` to avoid alert fatigue\n• Route critical alerts to a separate channel for visibility\n• Test with a low-severity alert first!`,
      suggestions: [
        'Route only critical alerts to Slack',
        'Set up PagerDuty integration instead',
        'How do I test alert routing?',
        'Show current AlertManager config'
      ]
    };
  }
  
  if (lowerInput.includes('pagerduty')) {
    return {
      content: `📟 **PagerDuty Integration**\n\nPagerDuty is great for critical alerts that need immediate attention:\n\n**Step 1: Get your PagerDuty integration key**\n1. In PagerDuty → **Services** → **+ New Service**\n2. Name: "OpenShift Production"\n3. Integration: **Events API v2**\n4. Copy the **Integration Key**\n\n**Step 2: Configure AlertManager**\n\`\`\`yaml\nreceivers:\n- name: pagerduty-critical\n  pagerduty_configs:\n  - service_key: 'YOUR_INTEGRATION_KEY'\n    severity: '{{ .GroupLabels.severity }}'\n    description: '{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}'\nroute:\n  receiver: default\n  routes:\n  - match:\n      severity: critical\n    receiver: pagerduty-critical\n  - match:\n      severity: warning\n    receiver: slack-notifications\n\`\`\`\n\n**This setup routes:**\n• 🔴 **Critical** alerts → PagerDuty (pages on-call)\n• ⚠️ **Warning** alerts → Slack (team awareness)\n• ℹ️ **Info** alerts → Default (logged only)\n\nThis tiered approach prevents alert fatigue while ensuring critical issues get immediate attention!`,
      suggestions: [
        'Set up on-call rotation',
        'Configure alert severity levels',
        'Test the PagerDuty integration',
        'Show current alert routing'
      ]
    };
  }
  
  if (lowerInput.includes('auto-scaling') && lowerInput.includes('nginx') || lowerInput.includes('auto-scaling for nginx') || lowerInput.includes('hpa') && lowerInput.includes('nginx')) {
    return {
      content: `🤖 **Setting Up Auto-Scaling for nginx-deployment**\n\nLet's configure an HPA so nginx scales automatically:\n\n**Quick setup via CLI:**\n\`\`\`bash\noc autoscale deployment nginx-deployment \\\n  --min=3 \\\n  --max=8 \\\n  --cpu-percent=70 \\\n  -n prod-frontend\n\`\`\`\n\n**Or with more control via YAML:**\n\`\`\`yaml\napiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: nginx-hpa\n  namespace: prod-frontend\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: nginx-deployment\n  minReplicas: 3\n  maxReplicas: 8\n  metrics:\n  - type: Resource\n    resource:\n      name: cpu\n      target:\n        type: Utilization\n        averageUtilization: 70\n  - type: Resource\n    resource:\n      name: memory\n      target:\n        type: Utilization\n        averageUtilization: 80\n  behavior:\n    scaleDown:\n      stabilizationWindowSeconds: 300\n      policies:\n      - type: Pods\n        value: 1\n        periodSeconds: 60\n    scaleUp:\n      stabilizationWindowSeconds: 30\n      policies:\n      - type: Pods\n        value: 2\n        periodSeconds: 60\n\`\`\`\n\n**What this does:**\n• Keeps minimum 3 pods running\n• Scales up to 8 when CPU > 70% or Memory > 80%\n• Scales up quickly (2 pods per minute) for traffic spikes\n• Scales down slowly (1 pod per minute, waits 5 min) to avoid flapping\n\n**Based on current traffic:** nginx would likely scale to 5 pods right now, then drop back to 3 when the spike ends. 📉`,
      suggestions: [
        'Apply this HPA now',
        'How do I monitor HPA decisions?',
        'Set up HPA for api-gateway too',
        'What if I need to scale beyond 8?'
      ]
    };
  }
  
  // -- Workloads follow-ups --
  if (lowerInput.includes('scale down') && lowerInput.includes('staging')) {
    return {
      content: `📉 **Scaling Down staging-api**\n\nSince it's had zero traffic for 5 days, scaling to 0 is safe:\n\n**Scale to 0:**\n\`\`\`bash\noc scale deployment staging-api --replicas=0 -n staging\n\`\`\`\n\n**What happens:**\n• All staging-api pods are gracefully terminated\n• The Deployment object stays (easy to scale back up)\n• Frees up **1.5Gi memory** and **200m CPU** per pod\n• PersistentVolumes (if any) remain bound\n\n**To bring it back when needed:**\n\`\`\`bash\noc scale deployment staging-api --replicas=2 -n staging\n\`\`\`\n\n**💡 Pro tip:** Consider setting up a CronJob to auto-scale staging environments down at night and back up in the morning:\n\`\`\`bash\n# Scale down at 8pm\noc create cronjob staging-down \\\n  --schedule="0 20 * * *" \\\n  --image=bitnami/kubectl \\\n  -- kubectl scale deploy staging-api --replicas=0 -n staging\n\`\`\`\n\nThis alone could free enough memory for the pending data-processor pod! 🎉`,
      suggestions: [
        'Set up scheduled scaling',
        'Check if the pending pod resolves',
        'Show me other idle workloads',
        'What about the test-worker?'
      ]
    };
  }
  
  if (lowerInput.includes('fix') && lowerInput.includes('prometheus-adapter') || lowerInput.includes('increase prometheus-adapter')) {
    return {
      content: `🔧 **Fixing prometheus-adapter OOMKilled**\n\nThe prometheus-adapter keeps crashing because it runs out of memory. Let's fix it:\n\n**Step 1: Check current limits**\n\`\`\`bash\noc get deployment prometheus-adapter \\\n  -n openshift-monitoring \\\n  -o jsonpath='{.spec.template.spec.containers[0].resources}'\n\`\`\`\n\nCurrent: 256Mi limit (too low for your cluster size)\n\n**Step 2: Increase the memory limit**\n\`\`\`bash\noc patch deployment prometheus-adapter \\\n  -n openshift-monitoring \\\n  --type='json' \\\n  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/resources/limits/memory", "value": "512Mi"}, {"op": "replace", "path": "/spec/template/spec/containers/0/resources/requests/memory", "value": "256Mi"}]'\n\`\`\`\n\n**Step 3: Verify the fix**\n\`\`\`bash\n# Watch the pod restart with new limits\noc get pods -n openshift-monitoring -w | grep prometheus-adapter\n\`\`\`\n\n**Expected result:**\n• Pod restarts with 512Mi limit\n• No more OOMKilled events\n• Metrics API responds faster\n• Custom metrics (for HPAs) work reliably\n\n**⏱️ Takes effect:** Immediately after the patch — the pod will restart once with the new limits.\n\n**Why this happened:** As your cluster grows, prometheus-adapter needs more memory to cache metrics. 256Mi is the default but undersized for clusters with 50+ pods.`,
      suggestions: [
        'Verify the fix worked',
        'What does prometheus-adapter do?',
        'Are there other pods that need more memory?',
        'Set up alerts for OOMKilled events'
      ]
    };
  }
  
  if (lowerInput.includes('adjust') && lowerInput.includes('api-gateway') && lowerInput.includes('probe') || lowerInput.includes('adjust') && lowerInput.includes('probe') && lowerInput.includes('setting')) {
    return {
      content: `🩺 **Adjusting api-gateway Liveness Probe**\n\nThe api-gateway probe is failing under load because the timeout is too aggressive:\n\n**Current config:** 3s timeout, 3 failure threshold\n**Problem:** Under heavy load, the app takes >3s to respond to health checks\n\n**Fix — update the probe settings:**\n\`\`\`bash\noc patch deployment api-gateway -n prod-api \\\n  --type='json' \\\n  -p='[\n    {"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/timeoutSeconds", "value": 10},\n    {"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/failureThreshold", "value": 5},\n    {"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/periodSeconds", "value": 15}\n  ]'\n\`\`\`\n\n**What this changes:**\n• **Timeout:** 3s → 10s (gives the app more time to respond)\n• **Failure threshold:** 3 → 5 (5 consecutive failures before restart)\n• **Period:** 10s → 15s (checks less frequently under load)\n\n**Net effect:** The app gets 50 seconds of grace (5 failures × 10s timeout) instead of 9 seconds. Much more forgiving during traffic spikes!\n\n**Also consider:** Adding a readiness probe if one isn't set:\n\`\`\`yaml\nreadinessProbe:\n  httpGet:\n    path: /healthz\n    port: 8080\n  initialDelaySeconds: 5\n  periodSeconds: 10\n\`\`\`\n\nThis removes the pod from the Service during slow periods instead of killing it.`,
      suggestions: [
        'Apply the probe changes',
        'What is the difference between liveness and readiness?',
        'Scale up api-gateway to 4 replicas',
        'Monitor api-gateway after the fix'
      ]
    };
  }
  
  if (lowerInput.includes('memory usage per node') || lowerInput.includes('memory') && lowerInput.includes('per node')) {
    return {
      content: `💾 **Memory Usage Per Node**\n\n**Control Plane:**\n• master-0: 9.3Gi / 16Gi (58%) ✅\n• master-1: 8.8Gi / 16Gi (55%) ✅\n• master-2: 9.8Gi / 16Gi (61%) ✅\n\n**Workers:**\n• worker-0: 11.4Gi / 16Gi (71%) ✅\n• worker-1: 10.9Gi / 16Gi (68%) ✅\n• worker-2: 8.8Gi / 16Gi (55%) ✅ ← Most headroom\n• worker-3: **14.7Gi / 16Gi (92%)** ⚠️ ← Critical\n• worker-4: 10.1Gi / 16Gi (63%) ✅\n\n**📊 Analysis:**\n• Total cluster memory: 128Gi\n• Used: 93.8Gi (73%)\n• Available: 34.2Gi (27%)\n• worker-3 accounts for 15% of total usage but has only 8% free\n\n**🎯 Recommendation:**\nRedistribute from worker-3 to worker-2 (most available). Moving elasticsearch-data-0 (4.2Gi) alone would bring worker-3 down to 66%.`,
      suggestions: [
        'Move elasticsearch to worker-2',
        'Add a 6th worker node',
        'Set up memory alerts per node',
        'Show CPU usage per node'
      ]
    };
  }
  
  if (lowerInput.includes('resource-heavy') || lowerInput.includes('resource heavy') || lowerInput.includes('what other pods')) {
    return {
      content: `🏋️ **Top Resource-Heavy Pods**\n\nHere are the biggest resource consumers in your cluster:\n\n**By Memory:**\n1. \`elasticsearch-data-0\` — 4.2Gi (logging)\n2. \`data-processor-batch\` — 4.0Gi requested (pending!)\n3. \`prometheus-k8s-0\` — 3.1Gi (monitoring)\n4. \`api-gateway\` — 1.2Gi × 2 replicas (prod-api)\n5. \`redis-cache-0\` — 1.0Gi (prod-cache)\n\n**By CPU:**\n1. \`nginx-deployment\` — 850m (spiking!)\n2. \`prometheus-k8s-0\` — 620m (monitoring)\n3. \`etl-processor\` — 580m (batch job)\n4. \`api-gateway\` — 440m × 2 (prod-api)\n5. \`elasticsearch-data-0\` — 350m (logging)\n\n**💡 Optimization opportunities:**\n• \`logging-collector\` requests 500m but uses 80m — **over-provisioned**\n• \`cache-service\` requests 2Gi but peaks at 800Mi — **over-provisioned**\n• \`staging-api\` uses resources with zero traffic — **can be scaled to 0**`,
      suggestions: [
        'Right-size the logging-collector',
        'Right-size the cache-service',
        'Scale down staging-api',
        'Set up resource recommendations (VPA)'
      ]
    };
  }
  
  if (lowerInput.includes('right-size') && lowerInput.includes('logging') || lowerInput.includes('right-size logging')) {
    return {
      content: `📏 **Right-sizing logging-collector**\n\nThis deployment is over-provisioned — let's fix it:\n\n**Current vs Actual usage:**\n• CPU request: 500m → Avg usage: 80m (16% utilization!)\n• CPU limit: 1000m → Peak usage: 150m\n• Memory request: 512Mi → Avg usage: 180Mi\n• Memory limit: 1Gi → Peak usage: 320Mi\n\n**Recommended settings:**\n\`\`\`bash\noc set resources deployment logging-collector \\\n  -n openshift-logging \\\n  --requests=cpu=100m,memory=200Mi \\\n  --limits=cpu=300m,memory=512Mi\n\`\`\`\n\n**Savings per pod:**\n• CPU: 400m freed (500m → 100m request)\n• Memory: 312Mi freed (512Mi → 200Mi request)\n\n**With 5 replicas, total savings:**\n• CPU: 2.0 cores freed! 🎉\n• Memory: 1.5Gi freed!\n\n**⚠️ Safety margin:** I've kept the limits at 2-3x the peak usage to handle spikes. The requests match the 90th percentile.`,
      suggestions: [
        'Apply these changes',
        'Right-size cache-service too',
        'Set up VPA for automatic right-sizing',
        'Show total cluster savings after all changes'
      ]
    };
  }
  
  // -- Networking follow-ups --
  if (lowerInput.includes('fix') && lowerInput.includes('api-external') || lowerInput.includes('fix the api-external')) {
    return {
      content: `🔧 **Fixing api-external Route 503 Errors**\n\nThe route is returning 503 because backend pods can't handle the load. Let's fix this:\n\n**Step 1: Check backend pod health**\n\`\`\`bash\noc get pods -n prod-api -l app=api-gateway\n\`\`\`\n\n**What I see:** 1 of 2 pods is restarting (liveness probe failures under load)\n\n**Step 2: Scale up to handle traffic**\n\`\`\`bash\noc scale deployment api-gateway --replicas=4 -n prod-api\n\`\`\`\n\n**Step 3: Fix the liveness probe** (prevents future crashes)\n\`\`\`bash\noc patch deployment api-gateway -n prod-api \\\n  --type='json' \\\n  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/timeoutSeconds", "value": 10}]'\n\`\`\`\n\n**Step 4: Verify the route recovers**\n\`\`\`bash\ncurl -I https://api-external-prod-api.apps.cluster.example.com/health\n\`\`\`\n\nExpected: HTTP 200 within 30 seconds of scaling up.\n\n**Root cause:** 2 replicas isn't enough for current traffic. With 4 replicas and a more forgiving probe, this should be stable. Consider setting up an HPA for automatic scaling!`,
      suggestions: [
        'Set up HPA for api-gateway',
        'Monitor the route health',
        'What caused the traffic increase?',
        'Set up a Route health check'
      ]
    };
  }
  
  if (lowerInput.includes('update') && lowerInput.includes('staging') && lowerInput.includes('networkpolicy') || lowerInput.includes('apply the monitoring fix')) {
    return {
      content: `✅ **Applying the Monitoring NetworkPolicy Fix**\n\nLet me create the policy that allows Prometheus to scrape the staging namespace:\n\n**Apply this NetworkPolicy:**\n\`\`\`bash\ncat <<EOF | oc apply -f -\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-monitoring\n  namespace: staging\nspec:\n  podSelector: {}\n  ingress:\n  - from:\n    - namespaceSelector:\n        matchLabels:\n          network.openshift.io/policy-group: monitoring\n    ports:\n    - protocol: TCP\n      port: 9090\n    - protocol: TCP\n      port: 8080\n    - protocol: TCP\n      port: 8443\n  policyTypes:\n  - Ingress\nEOF\n\`\`\`\n\n**Verify it works:**\n\`\`\`bash\n# Check if Prometheus targets show staging pods\noc exec -n openshift-monitoring prometheus-k8s-0 \\\n  -- curl -s localhost:9090/api/v1/targets | grep staging\n\`\`\`\n\n**Result:** Within 60 seconds, Prometheus should start scraping staging pods again. You'll see metrics flowing in the Observe dashboard! 📊`,
      suggestions: [
        'Verify Prometheus can scrape staging',
        'Show all NetworkPolicies in staging',
        'Best practices for namespace isolation',
        'Set up network monitoring alerts'
      ]
    };
  }
  
  if (lowerInput.includes('debug dns') || lowerInput.includes('dns issue')) {
    return {
      content: `🔍 **Debugging DNS Issues**\n\nDNS is the backbone of service discovery. Let's troubleshoot:\n\n**Step 1: Test DNS from inside a pod**\n\`\`\`bash\n# Start a debug pod\noc run dns-test --rm -it --image=busybox -- sh\n\n# Inside the pod:\nnslookup kubernetes.default\nnslookup my-service.my-namespace.svc.cluster.local\n\`\`\`\n\n**Step 2: Check CoreDNS pods**\n\`\`\`bash\noc get pods -n openshift-dns\noc logs -n openshift-dns -l dns.operator.openshift.io/daemonset-dns=default\n\`\`\`\n\n**Step 3: Check DNS operator**\n\`\`\`bash\noc get co dns\noc describe dns.operator/default\n\`\`\`\n\n**Common DNS issues:**\n\n**1. Slow DNS resolution:**\n• Check if CoreDNS pods are overloaded\n• Look for high query rates: \`oc top pods -n openshift-dns\`\n• Fix: Add \`dnsConfig\` with \`ndots: 2\` to reduce lookups\n\n**2. DNS not resolving external names:**\n• Check upstream DNS servers\n• Verify network policies allow DNS traffic (port 53)\n• Check \`oc get configmap dns-default -n openshift-dns\`\n\n**3. Service discovery failing:**\n• Verify the Service exists: \`oc get svc -n <namespace>\`\n• Check endpoints: \`oc get endpoints <service-name>\`\n• Make sure pods have the right labels\n\n**Your cluster:** DNS is currently healthy ✅ but let me know if you're seeing a specific error!`,
      suggestions: [
        'My service can\'t resolve another service',
        'DNS is slow, how to optimize?',
        'Check CoreDNS performance',
        'Explain DNS in OpenShift'
      ]
    };
  }
  
  // -- Storage follow-ups --
  if (lowerInput.includes('pvcs near capacity') || lowerInput.includes('pvc') && lowerInput.includes('near capacity') || lowerInput.includes('show all pvcs')) {
    return {
      content: `📊 **PVCs Near Capacity**\n\n**⚠️ Needs attention (>80% used):**\n• \`postgres-data-0\` (prod-db) — **87%** used (43.5Gi / 50Gi) — Growing ~2Gi/week\n• \`elasticsearch-data-0\` (logging) — **82%** used (82Gi / 100Gi) — Growing ~5Gi/week\n\n**🟡 Watch list (60-80% used):**\n• \`grafana-storage\` (monitoring) — **71%** used (7.1Gi / 10Gi)\n• \`redis-aof-0\` (prod-cache) — **65%** used (6.5Gi / 10Gi)\n\n**✅ Healthy (<60% used):**\n• \`prometheus-data-0\` — 45% (45Gi / 100Gi)\n• \`app-uploads\` — 38% (3.8Gi / 10Gi)\n• 12 other PVCs all below 40%\n\n**📈 Estimated time to full:**\n• postgres-data-0: **~3 weeks** ⚠️\n• elasticsearch-data-0: **~3.5 weeks** ⚠️\n• grafana-storage: ~2 months\n• redis-aof-0: ~3 months\n\n**💡 Recommendation:** Expand postgres and elasticsearch PVCs now to avoid emergency situations.`,
      suggestions: [
        'Expand postgres-data-0 to 100Gi',
        'Expand elasticsearch-data-0 to 200Gi',
        'Set up PVC capacity alerts',
        'Enable log rotation for elasticsearch'
      ]
    };
  }
  
  if (lowerInput.includes('pvc') && lowerInput.includes('usage alert') || lowerInput.includes('capacity alert')) {
    return {
      content: `🔔 **Setting Up PVC Capacity Alerts**\n\nLet's create alerts that warn you before volumes fill up:\n\n**PrometheusRule for PVC alerts:**\n\`\`\`yaml\napiVersion: monitoring.coreos.com/v1\nkind: PrometheusRule\nmetadata:\n  name: pvc-capacity-alerts\n  namespace: openshift-monitoring\nspec:\n  groups:\n  - name: pvc-alerts\n    rules:\n    - alert: PVCUsageWarning\n      expr: |\n        kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.75\n      for: 15m\n      labels:\n        severity: warning\n      annotations:\n        summary: \"PVC {{ $labels.persistentvolumeclaim }} in {{ $labels.namespace }} is above 75%\"\n    - alert: PVCUsageCritical\n      expr: |\n        kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.90\n      for: 5m\n      labels:\n        severity: critical\n      annotations:\n        summary: \"PVC {{ $labels.persistentvolumeclaim }} in {{ $labels.namespace }} is above 90%!\"\n\`\`\`\n\n**This creates two levels:**\n• ⚠️ **Warning at 75%** — 15 min sustained — gives you time to plan\n• 🔴 **Critical at 90%** — 5 min sustained — expand immediately!\n\nWith your current growth rates, these alerts would give you 1-2 weeks notice before a PVC fills up.`,
      suggestions: [
        'Apply these PVC alerts',
        'Route critical PVC alerts to Slack',
        'Set up automatic PVC expansion',
        'Show current alert rules'
      ]
    };
  }
  
  if (lowerInput.includes('volume snapshot') || lowerInput.includes('create a volume snapshot')) {
    return {
      content: `📸 **Volume Snapshots**\n\nVolume snapshots let you create point-in-time backups of your PVCs!\n\n**Create a snapshot:**\n\`\`\`yaml\napiVersion: snapshot.storage.k8s.io/v1\nkind: VolumeSnapshot\nmetadata:\n  name: postgres-backup-2026-03-18\n  namespace: prod-db\nspec:\n  volumeSnapshotClassName: csi-aws-vsc\n  source:\n    persistentVolumeClaimName: postgres-data-0\n\`\`\`\n\n**Apply it:**\n\`\`\`bash\noc apply -f snapshot.yaml\n\`\`\`\n\n**Check status:**\n\`\`\`bash\noc get volumesnapshot -n prod-db\n\`\`\`\n\n**Restore from snapshot:**\n\`\`\`yaml\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: postgres-data-restored\nspec:\n  storageClassName: gp3-encrypted\n  dataSource:\n    name: postgres-backup-2026-03-18\n    kind: VolumeSnapshot\n    apiGroup: snapshot.storage.k8s.io\n  accessModes:\n  - ReadWriteOnce\n  resources:\n    requests:\n      storage: 100Gi\n\`\`\`\n\n**💡 Pro tips:**\n• Take snapshots before major changes (updates, migrations)\n• Snapshots are incremental — they don't copy all data each time\n• On AWS EBS, snapshots are stored in S3 (cheap! ~$0.05/GB/month)\n• Set up automated snapshots with a CronJob`,
      suggestions: [
        'Set up automated daily snapshots',
        'How much do snapshots cost?',
        'Restore a specific snapshot',
        'Delete old snapshots'
      ]
    };
  }
  
  // -- Builds follow-ups --
  if (lowerInput.includes('fix') && lowerInput.includes('frontend') && lowerInput.includes('build') && lowerInput.includes('memory')) {
    return {
      content: `🔧 **Fixing frontend-app Build Memory**\n\nThe build is OOMKilled during \`npm install\` — Node.js builds can be memory-hungry!\n\n**Fix — increase build resources:**\n\`\`\`bash\noc patch buildconfig frontend-app -n prod-frontend \\\n  --type='json' \\\n  -p='[{"op": "add", "path": "/spec/resources", "value": {"limits": {"memory": "2Gi", "cpu": "1"}, "requests": {"memory": "1Gi", "cpu": "500m"}}}]'\n\`\`\`\n\n**Why 2Gi?** npm install creates a dependency tree in memory. For projects with 200+ dependencies, 512Mi is often too small. 2Gi gives plenty of headroom.\n\n**Trigger a new build to test:**\n\`\`\`bash\noc start-build frontend-app -n prod-frontend --follow\n\`\`\`\n\n**Additional optimizations:**\n• Add \`.npmrc\` with \`maxsockets=3\` to reduce memory during downloads\n• Use \`npm ci\` instead of \`npm install\` (faster, less memory)\n• Add a \`.dockerignore\` to exclude node_modules from the build context\n\n**Expected result:** Build completes in ~3 minutes without OOM. ✅`,
      suggestions: [
        'Trigger the build now',
        'Set up build caching',
        'Monitor build resource usage',
        'Optimize the Dockerfile'
      ]
    };
  }
  
  if (lowerInput.includes('update') && lowerInput.includes('git') && lowerInput.includes('secret') || lowerInput.includes('git source secret')) {
    return {
      content: `🔑 **Updating Git Source Secret**\n\nThe api-service build's Git token has expired. Let's refresh it:\n\n**Step 1: Create a new personal access token**\n1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens**\n2. Click **Generate new token (classic)**\n3. Select scope: \`repo\` (full repository access)\n4. Copy the token\n\n**Step 2: Update the secret in OpenShift**\n\`\`\`bash\n# Delete the old secret\noc delete secret git-credentials -n prod-api\n\n# Create a new one\noc create secret generic git-credentials \\\n  --from-literal=username=your-github-username \\\n  --from-literal=password=ghp_YOUR_NEW_TOKEN \\\n  --type=kubernetes.io/basic-auth \\\n  -n prod-api\n\n# Link it to the builder service account\noc secrets link builder git-credentials -n prod-api\n\`\`\`\n\n**Step 3: Trigger a new build**\n\`\`\`bash\noc start-build api-service -n prod-api --follow\n\`\`\`\n\n**💡 Better approach for the future:** Use a GitHub App token instead of a personal access token — they don't expire and have better security controls!\n\n**⚠️ Security note:** Never hardcode tokens in BuildConfigs. Always use Secrets!`,
      suggestions: [
        'Trigger the build now',
        'Set up GitHub App authentication',
        'How do I use deploy keys instead?',
        'Set token expiry reminders'
      ]
    };
  }
  
  // -- Compute follow-ups --
  if (lowerInput.includes('clusterautoscaler') || lowerInput.includes('cluster autoscaler') || lowerInput.includes('cluster auto-scaler')) {
    return {
      content: `🤖 **Setting Up ClusterAutoscaler**\n\nThis will automatically add/remove worker nodes based on demand!\n\n**Step 1: Create ClusterAutoscaler**\n\`\`\`yaml\napiVersion: autoscaling.openshift.io/v1\nkind: ClusterAutoscaler\nmetadata:\n  name: default\nspec:\n  podPriorityThreshold: -10\n  resourceLimits:\n    maxNodesTotal: 10\n    cores:\n      min: 8\n      max: 40\n    memory:\n      min: 32\n      max: 160\n  scaleDown:\n    enabled: true\n    delayAfterAdd: 10m\n    delayAfterDelete: 5m\n    unneededTime: 10m\n\`\`\`\n\n**Step 2: Create MachineAutoscaler** (per MachineSet)\n\`\`\`yaml\napiVersion: autoscaling.openshift.io/v1beta1\nkind: MachineAutoscaler\nmetadata:\n  name: worker-us-east-1a\n  namespace: openshift-machine-api\nspec:\n  minReplicas: 3\n  maxReplicas: 8\n  scaleTargetRef:\n    apiVersion: machine.openshift.io/v1beta1\n    kind: MachineSet\n    name: cluster-worker-us-east-1a\n\`\`\`\n\n**How it works:**\n• 📈 **Scale up:** When pods can't be scheduled (like your pending data-processor!), a new node is automatically added\n• 📉 **Scale down:** When a node is underutilized for 10+ minutes, workloads are moved and the node is removed\n• 💰 **Cost savings:** You only pay for nodes when you need them!\n\n**For your cluster:** This would have automatically added a node for the pending data-processor pod!`,
      suggestions: [
        'Apply these autoscaler configs',
        'How fast does it scale up?',
        'Set cost limits on auto-scaling',
        'What triggers scale-down?'
      ]
    };
  }
  
  if (lowerInput.includes('pod anti-affinity') || lowerInput.includes('anti-affinity')) {
    return {
      content: `🧲 **Pod Anti-Affinity Explained**\n\nAnti-affinity tells Kubernetes: "Don't put these pods on the same node!"\n\n**Why use it:**\n• **High availability:** Spread replicas across nodes so one node failure doesn't kill your app\n• **Resource balancing:** Prevent all heavy pods from landing on one node\n• **Compliance:** Keep certain workloads separated\n\n**Example — spread api-gateway across nodes:**\n\`\`\`yaml\nspec:\n  template:\n    spec:\n      affinity:\n        podAntiAffinity:\n          preferredDuringSchedulingIgnoredDuringExecution:\n          - weight: 100\n            podAffinityTerm:\n              labelSelector:\n                matchExpressions:\n                - key: app\n                  operator: In\n                  values:\n                  - api-gateway\n              topologyKey: kubernetes.io/hostname\n\`\`\`\n\n**Two modes:**\n• **preferred** — "Try to spread, but it's okay if you can't" (flexible)\n• **required** — "MUST spread or pod stays Pending" (strict)\n\n**For your cluster:** Using \`preferred\` anti-affinity on api-gateway would ensure the 4 replicas spread across different workers, so if worker-3 has issues, 3 replicas keep running on other nodes.\n\n**💡 Pro tip:** Always use \`preferred\` unless you have strict compliance requirements. \`required\` can cause scheduling failures when nodes are limited!`,
      suggestions: [
        'Apply anti-affinity to api-gateway',
        'Explain node affinity vs pod affinity',
        'Spread elasticsearch across nodes',
        'What is topology spread constraints?'
      ]
    };
  }
  
  if (lowerInput.includes('redistribute') && lowerInput.includes('worker') || lowerInput.includes('redistribute from worker')) {
    return {
      content: `🔄 **Redistributing Workloads from worker-3**\n\nLet's move the heaviest workloads to nodes with more capacity:\n\n**Plan:**\n\n**1. Move \`elasticsearch-data-0\` (4.2Gi) → worker-2**\n• worker-2 has 7.2Gi free — plenty of room\n• Add node anti-affinity and delete the pod\n\n**2. Move \`data-processor-batch\` (3.8Gi) → worker-2 or worker-4**\n• This pod is actually pending! Once we free memory, it can schedule elsewhere\n\n**3. Let api-gateway replicas spread naturally**\n• Set pod anti-affinity so replicas don't cluster\n\n**Execution:**\n\`\`\`bash\n# Step 1: Cordon worker-3 (no new pods)\noc adm cordon worker-node-03\n\n# Step 2: Move elasticsearch (see previous instructions)\noc delete pod elasticsearch-data-0 -n logging\n\n# Step 3: Wait for it to reschedule (~3 min)\noc get pods -n logging -w\n\n# Step 4: Verify memory improved\noc describe node worker-node-03 | grep -A5 'Allocated'\n\`\`\`\n\n**Expected result after redistribution:**\n• worker-3: 92% → ~60% memory\n• worker-2: 55% → ~80% memory\n• Pending pods can now schedule\n\n**Step 5: Uncordon when balanced**\n\`\`\`bash\noc adm uncordon worker-node-03\n\`\`\``,
      suggestions: [
        'Start the redistribution',
        'Will this cause downtime?',
        'Monitor the redistribution',
        'Set up automatic balancing (descheduler)'
      ]
    };
  }
  
  // -- MachineConfig follow-ups --
  if (lowerInput.includes('machineconfigpool') || lowerInput.includes('machine config pool') || lowerInput.includes('mcp status')) {
    return {
      content: `📋 **MachineConfigPool Status**\n\n\`\`\`bash\noc get mcp\n\`\`\`\n\n**NAME             CONFIG                          UPDATED   UPDATING   DEGRADED**\n• \`master\`         rendered-master-abc123          True      False      False ✅\n• \`worker\`         rendered-worker-def456          True      **True**   False ⚠️\n\n**🔍 The worker pool is stuck updating!**\n\n**What I found:**\n• **1 node is not updated** — worker-node-03 is stuck\n• **Reason:** A pod with a PodDisruptionBudget is preventing the node from draining\n• **Pod:** \`elasticsearch-data-0\` in namespace \`logging\` — PDB requires minAvailable: 1\n\n**Why this matters:**\n• The machine-config operator is trying to apply a new config to worker-3\n• But it can't drain the node because elasticsearch's PDB blocks it\n• This causes the operator to report "degraded"\n\n**Fix options:**\n1. **Temporarily relax the PDB** — set minAvailable to 0, let the drain complete, then restore\n2. **Scale up elasticsearch** — add a second replica so PDB is satisfied during drain\n3. **Force the drain** — last resort, may cause brief log loss\n\n\`\`\`bash\n# Option 1: Temporarily patch PDB\noc patch pdb elasticsearch-pdb -n logging \\\\\n  --type='json' \\\\\n  -p='[{"op": "replace", "path": "/spec/minAvailable", "value": 0}]'\n\n# Wait for drain to complete, then restore\noc patch pdb elasticsearch-pdb -n logging \\\\\n  --type='json' \\\\\n  -p='[{"op": "replace", "path": "/spec/minAvailable", "value": 1}]'\n\`\`\``,
      suggestions: [
        'Relax the PDB temporarily',
        'Scale up elasticsearch instead',
        'What happens if I force the drain?',
        'Will this fix the machine-config operator?'
      ]
    };
  }
  
  if (lowerInput.includes('what is a machineconfig') || lowerInput.includes('what is machineconfig') || lowerInput.includes('explain machineconfig')) {
    return {
      content: `⚙️ **What is a MachineConfig?**\n\nA MachineConfig is how OpenShift manages the **operating system configuration** of your nodes.\n\n**Think of it as:** A blueprint for how each node's OS should be configured — files, services, kernel parameters, etc.\n\n**What it controls:**\n• **System files** — /etc/chrony.conf, /etc/sysctl.d/*, etc.\n• **Systemd units** — Custom services running on the node\n• **Kernel arguments** — Boot parameters\n• **SSH keys** — Authorized keys for node access\n• **Container runtime** — CRI-O configuration\n\n**How it works:**\n1. You create/modify a MachineConfig\n2. The **Machine Config Operator (MCO)** detects the change\n3. MCO renders a new configuration for the affected pool (master/worker)\n4. Nodes are updated **one at a time** (rolling update)\n5. Each node: cordoned → drained → rebooted → uncordoned\n\n**⚠️ Be careful!** MachineConfig changes cause node reboots. Always test in non-production first!`,
      suggestions: [
        'Show current MachineConfigs',
        'How do I add a custom sysctl?',
        'What is the Machine Config Operator?',
        'How do I rollback a MachineConfig?'
      ]
    };
  }
  
  if (lowerInput.includes('machine-config operator log') || lowerInput.includes('show machine-config') && lowerInput.includes('log')) {
    return {
      content: `📜 **Machine-Config Operator Logs**\n\n**Check the operator pod:**\n\`\`\`bash\noc logs -n openshift-machine-config-operator \\\\\n  -l k8s-app=machine-config-operator \\\\\n  --tail=50\n\`\`\`\n\n**Check the controller:**\n\`\`\`bash\noc logs -n openshift-machine-config-operator \\\\\n  -l k8s-app=machine-config-controller \\\\\n  --tail=50\n\`\`\`\n\n**Check the daemon on a specific node:**\n\`\`\`bash\noc logs -n openshift-machine-config-operator \\\\\n  -l k8s-app=machine-config-daemon \\\\\n  --field-selector spec.nodeName=worker-node-03 \\\\\n  --tail=50\n\`\`\`\n\n**What to look for:**\n• \`error\` or \`failed\` messages — root cause indicators\n• \`drain\` related messages — node drain issues\n• \`certificate\` messages — TLS/cert problems\n• \`render\` messages — config rendering errors\n\n**Common log patterns:**\n• "node worker-node-03 is not draining" → PDB blocking drain\n• "certificate expired" → Need cert rotation\n• "unexpected config" → Manual changes detected`,
      suggestions: [
        'Fix the drain issue on worker-3',
        'How do I rotate certificates?',
        'Check all operator logs at once',
        'Set up log forwarding'
      ]
    };
  }
  
  if (lowerInput.includes('force') && lowerInput.includes('uncordon') || lowerInput.includes('how do i') && lowerInput.includes('uncordon')) {
    return {
      content: `🔓 **Uncordoning a Node**\n\nUncordoning re-enables scheduling on a node:\n\n**Simple uncordon:**\n\`\`\`bash\noc adm uncordon worker-node-03\n\`\`\`\n\n**Verify it worked:**\n\`\`\`bash\noc get node worker-node-03\n\`\`\`\n\nThe \`STATUS\` should change from \`Ready,SchedulingDisabled\` to just \`Ready\`.\n\n**What happens after uncordoning:**\n• New pods can be scheduled on this node again\n• Existing pods are NOT moved back (Kubernetes doesn't rebalance automatically)\n• The node rejoins the schedulable pool\n\n**Want to rebalance?** Use the Descheduler operator to automatically redistribute pods across nodes.\n\n**⚠️ Before uncordoning:** Make sure the issue that caused you to cordon it is resolved!`,
      suggestions: [
        'Set up the Descheduler',
        'Show pod distribution across nodes',
        'Verify node health before uncordoning',
        'What if the node is still unhealthy?'
      ]
    };
  }
  
  if (lowerInput.includes('descheduler') || lowerInput.includes('automatic balancing') || lowerInput.includes('auto balance') || lowerInput.includes('rebalance')) {
    return {
      content: `⚖️ **Descheduler — Automatic Pod Rebalancing**\n\nThe Descheduler periodically evicts pods so the scheduler can place them more optimally.\n\n**Install via Operator:**\n1. Go to **Ecosystem** → **Software Catalog**\n2. Search for "Kube Descheduler"\n3. Install it\n\n**Configure a DeschedulerPolicy:**\n\`\`\`yaml\napiVersion: operator.openshift.io/v1\nkind: KubeDescheduler\nmetadata:\n  name: cluster\n  namespace: openshift-kube-descheduler-operator\nspec:\n  deschedulingIntervalSeconds: 3600\n  profiles:\n  - AffinityAndTaints\n  - TopologyAndDuplicates\n  - LifecycleAndUtilization\n\`\`\`\n\n**What each profile does:**\n• **AffinityAndTaints** — Evicts pods violating affinity/anti-affinity rules\n• **TopologyAndDuplicates** — Evicts duplicate pods on the same node\n• **LifecycleAndUtilization** — Moves pods from overutilized to underutilized nodes\n\n**For your cluster:** The LifecycleAndUtilization profile would help move pods away from worker-3 (92% memory) to worker-2 (55% memory).\n\n**⚠️ Safety:** The descheduler respects PodDisruptionBudgets, so it won't break your availability guarantees!`,
      suggestions: [
        'Install the Descheduler operator',
        'How often should it run?',
        'Will it disrupt my running pods?',
        'Show current pod distribution'
      ]
    };
  }
  
  if (lowerInput.includes('vpa') || lowerInput.includes('vertical pod autoscaler') || lowerInput.includes('automatic right-sizing')) {
    return {
      content: `📐 **Vertical Pod Autoscaler (VPA)**\n\nVPA automatically adjusts pod resource requests and limits based on actual usage!\n\n**Install the VPA Operator:**\n1. Go to **Ecosystem** → **Software Catalog**\n2. Search for "VerticalPodAutoscaler"\n3. Install it\n\n**Create a VPA for a deployment:**\n\`\`\`yaml\napiVersion: autoscaling.k8s.io/v1\nkind: VerticalPodAutoscaler\nmetadata:\n  name: logging-collector-vpa\n  namespace: openshift-logging\nspec:\n  targetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: logging-collector\n  updatePolicy:\n    updateMode: "Auto"\n  resourcePolicy:\n    containerPolicies:\n    - containerName: '*'\n      minAllowed:\n        cpu: 50m\n        memory: 100Mi\n      maxAllowed:\n        cpu: 1\n        memory: 2Gi\n\`\`\`\n\n**Update modes:**\n• **Off** — Only shows recommendations (safe for production!)\n• **Initial** — Sets resources only when pods are created\n• **Auto** — Actively adjusts (restarts pods to apply changes)\n\n**My recommendation:** Start with **"Off"** mode to see what VPA suggests, then switch to "Auto" for non-critical workloads.\n\n**Projected savings: ~2 CPU cores + 3.5Gi memory** 🎉`,
      suggestions: [
        'Set up VPA in recommendation mode',
        'Can I use VPA and HPA together?',
        'Show VPA recommendations for all deployments',
        'What are the risks of auto-mode?'
      ]
    };
  }
  
  if (lowerInput.includes('pods on worker') || lowerInput.includes('what pods are on') || lowerInput.includes('show me what pods')) {
    return {
      content: `📋 **Pods on worker-node-03**\n\n**🔴 Heavy consumers:**\n• \`elasticsearch-data-0\` (logging) — 4.2Gi memory\n• \`data-processor-batch-7f8d9\` (data-pipeline) — 3.8Gi memory\n• \`api-gateway-5c9d8f-abc\` (prod-api) — 1.2Gi memory\n\n**🟡 Medium consumers:**\n• \`nginx-deployment-xyz\` (prod-frontend) — 512Mi\n• \`redis-cache-0\` (prod-cache) — 1.0Gi\n• \`grafana-7d8f9-xxx\` (monitoring) — 256Mi\n\n**🟢 System/DaemonSet pods (can't be moved):**\n• \`node-exporter\` — 50Mi\n• \`ovnkube-node\` — 300Mi\n• \`machine-config-daemon\` — 100Mi\n• \`multus\` — 80Mi\n• 21 other small pods (~1.5Gi total)\n\n**Summary:**\n• Moveable workloads: ~10.7Gi\n• System pods (fixed): ~2.1Gi\n• Total: ~14.7Gi / 16Gi (92%)\n\n**Best candidates to move:**\n1. elasticsearch-data-0 (4.2Gi) → worker-2\n2. data-processor-batch (3.8Gi) → any node with capacity\n3. api-gateway replica → spread with anti-affinity`,
      suggestions: [
        'Move elasticsearch to worker-2',
        'Drain worker-node-03',
        'Show pod distribution across all nodes',
        'Which pods have the most restarts?'
      ]
    };
  }
  
  if (lowerInput.includes('cpu') && lowerInput.includes('per node') || lowerInput.includes('cpu usage per node')) {
    return {
      content: `📊 **CPU Usage Per Node**\n\n**Control Plane:**\n• master-0: 1.4 / 4 cores (35%) ✅\n• master-1: 1.3 / 4 cores (32%) ✅\n• master-2: 1.5 / 4 cores (38%) ✅\n\n**Workers:**\n• worker-0: 2.5 / 4 cores (62%) ✅\n• worker-1: 2.3 / 4 cores (58%) ✅\n• worker-2: 1.8 / 4 cores (45%) ✅ ← Most headroom\n• worker-3: 3.1 / 4 cores (78%) ⚠️ ← High\n• worker-4: 2.0 / 4 cores (51%) ✅\n\n**Cluster totals:**\n• Total capacity: 32 cores\n• Used: 15.9 cores (50%)\n• Available: 16.1 cores (50%)\n\n**📈 Trend:** CPU usage has been climbing ~5% per week due to growing traffic.\n\n**Recommendation:** worker-3 is hot on both CPU (78%) and memory (92%). Redistribute or add a 6th worker.`,
      suggestions: [
        'Add a 6th worker node',
        'Redistribute from worker-3',
        'Set up CPU usage alerts',
        'Which pods use the most CPU?'
      ]
    };
  }
  
  if (lowerInput.includes('pod distribution') || lowerInput.includes('distribution across')) {
    return {
      content: `📊 **Pod Distribution Across Nodes**\n\n**Node                  Pods    CPU     Memory**\n• master-0              28      35%     58%\n• master-1              27      32%     55%\n• master-2              29      38%     61%\n• worker-0              38      62%     71%\n• worker-1              35      58%     68%\n• worker-2              29      45%     55%  ✅ Most capacity\n• worker-3              31      78%     92%  ⚠️ Overloaded\n• worker-4              33      51%     63%\n\n**Total: 250 pods across 8 nodes**\n\n**⚠️ Imbalance detected:**\nworker-3 has similar pod count but much higher resource usage. The issue isn't pod count — it's that elasticsearch (4.2Gi) and data-processor (3.8Gi) are both on worker-3.\n\n**💡 Fix:** Move 1-2 heavy pods from worker-3 to worker-2, and the cluster will be well-balanced.`,
      suggestions: [
        'Rebalance heavy pods',
        'Set up the Descheduler',
        'Add pod anti-affinity rules',
        'Show resource requests vs actual usage'
      ]
    };
  }
  
  if (lowerInput.includes('will this fix') && lowerInput.includes('machine-config') || lowerInput.includes('fix the machine-config operator')) {
    return {
      content: `✅ **Yes! Here's the chain of events:**\n\n**Root cause → Fix path:**\n\n1. **PDB blocks drain** → Relax PDB or scale up elasticsearch\n2. **Node drains successfully** → worker-3 gets updated\n3. **MachineConfigPool completes** → worker pool shows UPDATED: True\n4. **machine-config operator** → Reports healthy, no longer degraded!\n\n**After fixing:**\n\`\`\`bash\n# Verify the operator is no longer degraded\noc get co machine-config\n\`\`\`\n\n**Expected output:**\n\`\`\`\nNAME             VERSION   AVAILABLE   PROGRESSING   DEGRADED\nmachine-config   4.21.8    True        False         False\n\`\`\`\n\n**Timeline:**\n• PDB fix: 30 seconds\n• Node drain: 2-5 minutes\n• Node reboot + rejoin: 5-8 minutes\n• Operator recovery: 1-2 minutes\n• **Total: ~10-15 minutes**\n\nAfter this, your cluster will have zero degraded operators — perfect for starting the cluster update! 🎯`,
      suggestions: [
        'Fix it now — relax the PDB',
        'Check if everything is healthy after',
        'Proceed to cluster update',
        'Assess readiness again'
      ]
    };
  }
  
  if (lowerInput.includes('log forwarding') || lowerInput.includes('set up log') && lowerInput.includes('forward')) {
    return {
      content: `📤 **Setting Up Log Forwarding**\n\nSend your cluster logs to an external system for long-term storage and analysis!\n\n**Using the ClusterLogForwarder:**\n\`\`\`yaml\napiVersion: logging.openshift.io/v1\nkind: ClusterLogForwarder\nmetadata:\n  name: instance\n  namespace: openshift-logging\nspec:\n  outputs:\n  - name: splunk-logs\n    type: splunk\n    url: https://splunk.example.com:8088\n    secret:\n      name: splunk-secret\n  - name: elasticsearch-external\n    type: elasticsearch\n    url: https://es.example.com:9200\n  pipelines:\n  - name: app-logs\n    inputRefs:\n    - application\n    outputRefs:\n    - splunk-logs\n  - name: infra-logs\n    inputRefs:\n    - infrastructure\n    - audit\n    outputRefs:\n    - elasticsearch-external\n\`\`\`\n\n**Supported destinations:**\n• Elasticsearch / OpenSearch\n• Splunk\n• Fluentd\n• Kafka\n• Amazon CloudWatch\n• Google Cloud Logging\n• Azure Monitor\n• Syslog\n• HTTP (generic webhook)\n\n**💡 Best practice:** Forward infrastructure + audit logs externally for compliance, keep application logs local for developer access.`,
      suggestions: [
        'Forward logs to Splunk',
        'Set up Kafka log pipeline',
        'Filter logs before forwarding',
        'How much does log storage cost?'
      ]
    };
  }
  
  if (lowerInput.includes('rotate certificate') || lowerInput.includes('cert rotation') || lowerInput.includes('how do i rotate')) {
    return {
      content: `🔐 **Certificate Rotation in OpenShift**\n\nOpenShift automatically manages most certificates, but sometimes manual intervention is needed.\n\n**Auto-managed certificates:**\n• API server certificates ✅\n• kubelet certificates ✅\n• etcd peer certificates ✅\n• Service serving certificates ✅\n\n**Check certificate status:**\n\`\`\`bash\n# Check all certificate expiry\noc get secret -A -o json | jq -r '\n  .items[] | select(.type == "kubernetes.io/tls") |\n  .metadata.namespace + "/" + .metadata.name\n'\n\`\`\`\n\n**Force rotation of machine-config-server certs:**\n\`\`\`bash\n# Delete the secret — it will be auto-regenerated\noc delete secret machine-config-server-tls \\\\\n  -n openshift-machine-config-operator\n\`\`\`\n\n**For kubelet certificates:**\n\`\`\`bash\n# Approve pending CSRs\noc get csr | grep Pending\noc adm certificate approve <csr-name>\n\`\`\`\n\n**⏱️ Auto-rotation schedule:**\n• Most certs rotate automatically 30 days before expiry\n• The operator handles it — you usually don't need to do anything\n• Check: \`oc get co kube-apiserver\` for cert-related issues`,
      suggestions: [
        'Check certificate expiry dates',
        'Approve pending CSRs',
        'What if a certificate already expired?',
        'Set up certificate monitoring'
      ]
    };
  }
  
  // -- Ecosystem / Operator follow-ups --
  if (lowerInput.includes('update elasticsearch') || lowerInput.includes('update elastic')) {
    return {
      content: `📦 **Updating Elasticsearch (ECK) to v2.12.1**\n\nThis is a straightforward operator update:\n\n**Via Console (recommended):**\n1. Go to **Installed Operators** (or **Installed Software**)\n2. Find **Elasticsearch (ECK)** operator\n3. Click on it → **Subscription** tab\n4. You'll see "Update available: v2.12.1"\n5. Click **Approve** (if manual approval) or it auto-updates\n\n**Via CLI:**\n\`\`\`bash\noc patch subscription elasticsearch-eck \\\n  -n openshift-operators \\\n  --type='json' \\\n  -p='[{"op": "replace", "path": "/spec/channel", "value": "stable-2.12"}]'\n\`\`\`\n\n**What the v2.12.1 update includes:**\n• Fixed log ingestion issue during node drain (directly impacts cluster updates!)\n• Memory optimization for large indices\n• Security patches\n\n**⏱️ Update time:** ~5 minutes\n• The operator pod restarts\n• Elasticsearch pods do a rolling restart (one at a time)\n• No data loss, minimal log gap (30 seconds max)\n\n**✅ After update:** Verify with \`oc get elasticsearch -A\` — status should show "green".`,
      suggestions: [
        'Verify elasticsearch health after update',
        'Now update Ansible Automation Platform',
        'Show all operator update status',
        'Proceed to cluster update'
      ]
    };
  }
  
  if (lowerInput.includes('skip operator update') || lowerInput.includes('what if i skip')) {
    return {
      content: `⚠️ **Risks of Skipping Operator Updates Before Cluster Update**\n\nI'd recommend updating them, but here's what could happen if you don't:\n\n**Ansible Automation Platform (v3.1.0 → v3.2.0):**\n• **Risk level:** MEDIUM ⚠️\n• **What could happen:** The automation controller may lose connection to the cluster API during the update\n• **Impact:** Automated workflows would pause until you manually update post-cluster-update\n• **Recovery:** Update the operator after cluster update completes (adds ~15 min to total process)\n\n**Elasticsearch (ECK) (v2.11.0 → v2.12.1):**\n• **Risk level:** LOW-MEDIUM ⚠️\n• **What could happen:** Log ingestion may pause during node drain phases\n• **Impact:** ~5-10 minute log gaps per node (you have 8 nodes, so potentially 40-80 min of gaps total)\n• **Recovery:** Logs aren't lost permanently — they buffer and catch up eventually\n\n**The cluster update itself will still succeed** — these are about graceful handling during the process.\n\n**My recommendation:**\n• **Elasticsearch:** Take the 5 minutes to update. The log gap fix is worth it.\n• **Ansible:** If you don't have critical automations running during the update window, you can skip and update after.\n\n**Bottom line:** Neither will BREAK your cluster, but updating first gives you a smoother experience.`,
      suggestions: [
        'Update both operators now',
        'Update just Elasticsearch',
        'Skip both and proceed to cluster update',
        'Schedule updates for after cluster update'
      ]
    };
  }
  
  // -- General follow-ups that work from any page --
  if (lowerInput.includes('check operator health') || lowerInput.includes('operator health')) {
    return {
      content: `📦 **Operator Health Check**\n\n**Cluster Operators (34 total):**\n✅ 32 operators Available and not Degraded\n⚠️ 1 operator Degraded: **machine-config** (MachineConfigPool stuck)\n✅ 1 operator Progressing: **kube-apiserver** (normal rotation)\n\n**Installed Operators (5 total):**\n✅ Red Hat OpenShift GitOps — Succeeded\n✅ Cert Manager — Succeeded\n✅ Red Hat OpenShift Pipelines — Succeeded\n⚠️ Ansible Automation Platform — Succeeded (update available: v3.2.0)\n⚠️ Elasticsearch (ECK) — Succeeded (update available: v2.12.1)\n\n**Summary:** Everything is running, but 2 operators have updates available and the machine-config operator needs attention.`,
      suggestions: [
        'Fix the machine-config operator',
        'Update Ansible and Elasticsearch',
        'What does the kube-apiserver progressing mean?',
        'Show detailed operator logs'
      ]
    };
  }
  
  if (lowerInput.includes('storage breakdown') || lowerInput.includes('show me storage')) {
    return {
      content: `💾 **Storage Breakdown**\n\n**Total provisioned:** 2.53Ti across 19 PVCs\n\n**By StorageClass:**\n• gp3-encrypted: 1.8Ti (71%) — 12 PVCs\n• standard: 400Gi (15%) — 5 PVCs\n• io2-high-perf: 300Gi (12%) — 2 PVCs\n\n**By Namespace:**\n• logging: 100Gi (elasticsearch data + indices)\n• prod-db: 50Gi (PostgreSQL + Redis)\n• monitoring: 110Gi (Prometheus + Grafana)\n• prod-frontend: 20Gi (uploads, assets)\n• Other: 33Gi\n\n**Top consumers:**\n1. \`prometheus-data-0\` — 100Gi (monitoring)\n2. \`elasticsearch-data-0\` — 100Gi (logging)\n3. \`postgres-data-0\` — 50Gi (prod-db)\n\n**⚠️ Attention needed:**\n• postgres-data-0 at 87% capacity\n• elasticsearch-data-0 at 82% capacity`,
      suggestions: [
        'Expand the critical PVCs',
        'How can I reduce storage usage?',
        'Set up storage cost alerts',
        'Show storage growth trends'
      ]
    };
  }
  
  if (lowerInput.includes('liveness') && lowerInput.includes('readiness') || lowerInput.includes('difference between liveness and readiness')) {
    return {
      content: `🩺 **Liveness vs Readiness Probes**\n\nThink of these as two different questions Kubernetes asks your app:\n\n**Liveness Probe: "Are you alive?"**\n• If **NO** → Kubernetes **kills and restarts** the pod\n• Purpose: Detect deadlocks, infinite loops, zombie processes\n• Action: Pod restart (nuclear option! 💥)\n\n**Readiness Probe: "Can you serve traffic?"**\n• If **NO** → Kubernetes **removes from Service** (no traffic sent)\n• Purpose: Detect temporary issues (loading data, warming cache)\n• Action: Stop sending traffic, but don't kill the pod\n\n**When to use which:**\n\n| Scenario | Liveness | Readiness |\n|----------|----------|----------|\n| App is deadlocked | ✅ Catches this | ❌ Won't help |\n| App is starting up | ❌ Might kill too early | ✅ Waits until ready |\n| App is overloaded | ❌ Restarting won't help! | ✅ Removes from LB |\n| Database is down | ❌ Restarting app won't fix DB | ✅ Stops traffic |\n\n**For your api-gateway:** The liveness probe is killing pods when they're overloaded. This is the wrong behavior! You want a readiness probe to remove traffic, not a restart.\n\n**Best practice:** Always use BOTH, with readiness being more sensitive than liveness.`,
      suggestions: [
        'Add a readiness probe to api-gateway',
        'What about startup probes?',
        'Show probe configurations across all deployments',
        'Best practices for probe design'
      ]
    };
  }
  
  if (lowerInput.includes('poddisruptionbudget') || lowerInput.includes('pod disruption budget') || lowerInput.includes('what are pdb')) {
    return {
      content: `🛡️ **PodDisruptionBudgets (PDBs)**\n\nPDBs protect your apps during voluntary disruptions (node drains, updates, maintenance).\n\n**What they do:**\nThey tell Kubernetes: "You MUST keep at least X pods running during disruptions!"\n\n**Example:**\n\`\`\`yaml\napiVersion: policy/v1\nkind: PodDisruptionBudget\nmetadata:\n  name: api-gateway-pdb\n  namespace: prod-api\nspec:\n  minAvailable: 2  # At least 2 pods must stay running\n  selector:\n    matchLabels:\n      app: api-gateway\n\`\`\`\n\n**Or use maxUnavailable:**\n\`\`\`yaml\nspec:\n  maxUnavailable: 1  # At most 1 pod can be down at a time\n\`\`\`\n\n**When it matters:**\n• During cluster updates (nodes drain one at a time)\n• When you manually drain a node\n• During maintenance windows\n\n**For your cluster update to 4.22.0:**\nYour production apps should have PDBs so the rolling update doesn't take them all down at once!\n\n**Recommended PDBs:**\n• api-gateway: \`minAvailable: 2\`\n• nginx-deployment: \`minAvailable: 2\`\n• Any StatefulSet: \`maxUnavailable: 1\``,
      suggestions: [
        'Create PDBs for my production apps',
        'Will PDBs slow down the cluster update?',
        'Show existing PDBs',
        'What about non-production workloads?'
      ]
    };
  }

  // ========== BUILD QUESTIONS ==========
  if (lowerInput.includes('trigger') && lowerInput.includes('build')) {
    return {
      content: `🏗️ **Triggering a new build in OpenShift**\n\nThere are a few ways to kick off a build! Let me walk you through them:\n\n**1️⃣ Via the Web Console (easiest!):**\n• Go to **Builds** → **BuildConfigs**\n• Find your BuildConfig and click it\n• Click the **"Start Build"** button in the top right\n• Watch the magic happen! ✨\n\n**2️⃣ Using the CLI:**\n\`\`\`\noc start-build <buildconfig-name>\n\`\`\`\n\n**3️⃣ Automatically with webhooks:**\n• GitHub/GitLab pushes can auto-trigger builds\n• Go to your BuildConfig → **Webhooks** tab\n• Copy the webhook URL and add it to your Git repo\n\n**4️⃣ From a Pipeline:**\n• If you're using Tekton/OpenShift Pipelines\n• The pipeline can trigger builds as part of CI/CD\n\n**Pro tip:** You can also trigger builds when an ImageStreamTag changes. It's like saying "rebuild whenever my base image updates!" 🔄`,
      suggestions: [
        'How do I set up a webhook?',
        'Explain BuildConfig strategies',
        'Troubleshoot failed builds',
        'What are ImageStreamTags?'
      ]
    };
  }
  
  if (lowerInput.includes('failed build') || (lowerInput.includes('troubleshoot') && lowerInput.includes('build'))) {
    return {
      content: `🔍 **Troubleshooting Failed Builds**\n\nBuilds failing? Don't worry, let's figure it out!\n\n**First, check the logs:**\n• Go to **Builds** → **Builds** (not BuildConfigs)\n• Click on the failed build\n• Check the **Logs** tab - this is where the gold is! 💰\n\n**Common culprits:**\n\n**1️⃣ Source code issues:**\n✗ Git repo not accessible (check credentials)\n✗ Wrong branch or tag specified\n✗ Missing files (like package.json for Node.js builds)\n\n**2️⃣ Build strategy problems:**\n✗ Dockerfile syntax errors\n✗ Missing dependencies in base image\n✗ Build timeout (default is 10 minutes)\n\n**3️⃣ Resource constraints:**\n✗ Not enough memory for build (Java builds are hungry! 🍔)\n✗ CPU limits too low\n✗ Storage issues\n\n**4️⃣ Registry issues:**\n✗ Can't push to internal registry\n✗ Authentication problems\n\n**Quick fixes:**\n• Increase timeout: Edit BuildConfig → \`spec.completionDeadlineSeconds\`\n• Bump resources: Add \`resources.limits.memory: 2Gi\`\n• Check secrets: Make sure pull/push secrets are configured\n\nWant me to help with a specific error? Just share what you're seeing! 👀`,
      suggestions: [
        'How do I increase build timeout?',
        'Explain build strategies',
        'My build runs out of memory',
        'Check registry access'
      ]
    };
  }
  
  if (lowerInput.includes('buildconfig') || lowerInput.includes('build config') || lowerInput.includes('build strateg')) {
    return {
      content: `📋 **BuildConfigs Explained**\n\nThink of a BuildConfig as a "recipe" for how to build your container images!\n\n**What it defines:**\n• **Source:** Where your code lives (Git, binary, Dockerfile, etc.)\n• **Strategy:** HOW to build (Docker, Source-to-Image, custom)\n• **Output:** Where to push the final image\n• **Triggers:** What causes a rebuild (webhook, image change, config change)\n\n**The 3 Build Strategies:**\n\n**1️⃣ Docker Build:**\n• You provide a Dockerfile\n• OpenShift builds it (just like \`docker build\`)\n• Most flexible! 🎨\n\n**2️⃣ Source-to-Image (S2I):**\n• You provide source code\n• OpenShift picks the right builder image (Node.js, Python, Java, etc.)\n• Automagically creates a runnable container! ✨\n• Great for developers who don't want to deal with Dockerfiles\n\n**3️⃣ Custom Build:**\n• For advanced use cases\n• You control the entire build process\n\n**Example BuildConfig:**\n\`\`\`yaml\napiVersion: build.openshift.io/v1\nkind: BuildConfig\nmetadata:\n  name: my-app\nspec:\n  source:\n    git:\n      uri: https://github.com/myorg/myapp\n  strategy:\n    dockerStrategy:\n      dockerfilePath: Dockerfile\n  output:\n    to:\n      kind: ImageStreamTag\n      name: my-app:latest\n\`\`\`\n\nPretty straightforward, right? 😊`,
      suggestions: [
        'What is Source-to-Image?',
        'How do I create a BuildConfig?',
        'Trigger a new build',
        'Explain ImageStreams'
      ]
    };
  }
  
  if (lowerInput.includes('webhook')) {
    return {
      content: `🔗 **Setting Up Build Webhooks**\n\nWebhooks = Automatic builds when you push code! Let's set it up:\n\n**Step 1: Get the webhook URL**\n• Go to **Builds** → **BuildConfigs**\n• Click your BuildConfig\n• Go to **Webhooks** tab\n• Copy the **GitHub** or **Generic** webhook URL\n\n**Step 2: Add to GitHub/GitLab**\n\n**For GitHub:**\n1. Go to your repo → **Settings** → **Webhooks**\n2. Click **Add webhook**\n3. Paste the URL\n4. Content type: **application/json**\n5. Secret: (copy from OpenShift webhook config)\n6. Events: **Just the push event**\n7. Click **Add webhook**\n\n**For GitLab:**\n1. Go to repo → **Settings** → **Webhooks**\n2. Paste URL\n3. Trigger: **Push events**\n4. Add webhook\n\n**Step 3: Test it!**\n• Make a commit and push\n• Watch the build automatically start! 🎉\n\n**Troubleshooting:**\n✗ **Webhook fails:** Check that OpenShift router is accessible from internet\n✗ **401/403 errors:** Verify the secret matches\n✗ **Build doesn't trigger:** Check the webhook's "Recent Deliveries" in GitHub\n\nPro tip: Use branch filters in your BuildConfig to only build specific branches!`,
      suggestions: [
        'How do I filter by branch?',
        'Trigger a build manually',
        'View recent builds'
      ]
    };
  }
  
  // ========== OPERATOR QUESTIONS ==========
  if ((lowerInput.includes('operator') && lowerInput.includes('update')) || 
      (lowerInput.includes('operator') && lowerInput.includes('upgrade'))) {
    return {
      content: `📦 **Updating Operators - The Smart Way**\n\nOperator updates are usually smooth sailing! Here's how it works:\n\n**🔍 Check what needs updating:**\n• Go to **Ecosystem** → **Installed Operators** (or **Administration** → **Installed Operators**)\n• Look for operators with the ⚠️ warning icon\n• These have updates available!\n\n**✅ How to approve updates:**\n\n**Automatic (recommended for most):**\n• Operators with "Automatic" approval just... update themselves! 🎉\n• You'll see a notification when it happens\n• Usually takes 5-10 minutes\n\n**Manual approval:**\n1. Click on the operator\n2. Go to the **Subscription** tab\n3. You'll see "Update available" with an **Approve** button\n4. Click **Approve** → Update begins!\n5. Monitor the status until it shows "Succeeded"\n\n**⚡ Batch update (update multiple at once):**\n• Navigate to **Installed Operators**\n• Filter by "Update available"\n• Select multiple operators\n• Use the **Actions** dropdown → **Approve all updates**\n\n**🤔 Before updating:**\n• Check if it's compatible with your cluster version\n• Read the release notes (there's a link on the update screen)\n• Make sure the operator isn't critical to running workloads (or schedule a maintenance window)\n\n**Pro tip:** Some operators (like etcd, console, authentication) are cluster-critical. OpenShift is smart enough to update these carefully, but still - maybe don't do it during Black Friday! 😅`,
      suggestions: [
        'Which operators are cluster-critical?',
        'Can I rollback an operator update?',
        'Show operator compatibility',
        'What happens if an update fails?'
      ]
    };
  }
  
  if (lowerInput.includes('install') && lowerInput.includes('operator')) {
    return {
      content: `📦 **Installing an Operator**\n\nOperators are like apps for your cluster - they add superpowers! ⚡\n\n**Step-by-step installation:**\n\n**1️⃣ Browse the catalog:**\n• Go to **Ecosystem** → **OperatorHub**\n• Use the search or browse by category\n• Click on an operator to see details\n\n**2️⃣ Review and install:**\n• Read what it does (some are complex!)\n• Check requirements and permissions\n• Click **Install**\n\n**3️⃣ Configure the installation:**\n• **Update channel:** Pick stable, fast, or preview (stick with stable unless you're adventurous 🎢)\n• **Installation mode:**\n  - **All namespaces:** Operator can manage resources cluster-wide\n  - **Specific namespace:** Limits operator to one namespace (more secure)\n• **Approval strategy:**\n  - **Automatic:** Updates install automatically (convenient)\n  - **Manual:** You approve each update (more control)\n\n**4️⃣ Wait for it:**\n• Installation takes 1-3 minutes usually\n• You'll see it appear in **Installed Operators**\n• Status should show "Succeeded" ✅\n\n**5️⃣ Create instances:**\n• Most operators need you to create a CR (Custom Resource)\n• Like installing a database operator, then creating a database\n• Go to the operator → **Provided APIs** tab → **Create instance**\n\n**Popular operators to try:**\n• **Cert Manager** - Automatic SSL certificates 🔒\n• **Prometheus** - Monitoring and alerting 📊\n• **Elasticsearch** - Log aggregation and search 🔍\n• **Tekton Pipelines** - CI/CD pipelines ⚙️\n\nWant me to recommend operators for a specific use case? Just ask! 😊`,
      suggestions: [
        'Recommend operators for monitoring',
        'What is a Custom Resource?',
        'How do I uninstall an operator?',
        'Explain update channels'
      ]
    };
  }
  
  // ========== CLUSTER UPDATE QUESTIONS ==========
  if (lowerInput.includes('how long') && (lowerInput.includes('update') || lowerInput.includes('upgrade'))) {
    return {
      content: `⏱️ **Cluster Update Timeline**\n\nGreat question! Here's what to expect:\n\n**Typical update time: 2-4 hours** ⏰\n\nBut it varies based on:\n\n**1️⃣ Cluster size:**\n• 3 control plane + 3 workers: ~2 hours\n• 3 control plane + 10 workers: ~3-4 hours\n• 3 control plane + 50 workers: ~6-8 hours (big cluster!)\n\n**2️⃣ What's updating:**\n• Minor version (4.21 → 4.22): Standard timeline\n• Patch (4.22.0 → 4.22.1): Faster, 1-2 hours\n• Major version (4.x → 5.0): Plan for longer, 4-6 hours\n\n**3️⃣ Update strategy:**\n• **Rolling update (default):** One node at a time, slower but SAFE\n• **Parallel (worker nodes):** Multiple workers at once, faster but riskier\n\n**The update process:**\n📊 **Pre-checks:** 5-10 minutes\n🎛️ **Control plane update:** 30-60 minutes (this is the critical part!)\n💻 **Worker nodes:** 1-3 hours (depends on how many)\n✅ **Verification:** 10-15 minutes\n\n**What happens during the update:**\n• Control plane nodes update first (one at a time)\n• Your cluster stays available! The other control plane nodes keep running 💪\n• Worker nodes update next (workloads get rescheduled automatically)\n• Pods might restart, but most apps handle this gracefully\n\n**Pro tips:**\n• Schedule during low-traffic hours\n• Your workloads should be resilient (multiple replicas!)\n• The update can be paused if issues arise\n• You can watch real-time progress in the console!\n\n**For your current cluster:** Based on the pre-check, I estimate **2 hours 12 minutes** for the update to 4.22.0. Not bad! 😊`,
      suggestions: [
        'What happens if the update fails?',
        'Can I pause an in-progress update?',
        'How do I minimize downtime?',
        'Start the update'
      ]
    };
  }
  
  if (lowerInput.includes('risk') || (lowerInput.includes('what') && lowerInput.includes('wrong')) || lowerInput.includes('fail')) {
    return {
      content: `⚠️ **Cluster Update Risks - The Honest Truth**\n\nOkay, let's talk risks. I'll be real with you! 💯\n\n**😌 The good news:**\n• OpenShift updates are REALLY well-tested\n• The process is automated and battle-hardened\n• Thousands of clusters update successfully every day\n• We run pre-checks to catch issues before they happen\n• Updates can be paused or rolled back if needed\n\n**🤔 The potential risks:**\n\n**1️⃣ Application compatibility:**\n• Your apps might use deprecated APIs\n• **Mitigation:** Pre-checks warn you! We scan for this\n• **Impact:** Apps might break or need updates\n• **Likelihood:** LOW if pre-check passes ✅\n\n**2️⃣ Operator incompatibility:**\n• Some operators might not support the new version\n• **Mitigation:** Update operators first!\n• **Impact:** Operator-managed workloads could have issues\n• **Likelihood:** MEDIUM if operators are outdated ⚠️\n\n**3️⃣ Custom configurations:**\n• If you've heavily customized the cluster, edge cases can occur\n• **Mitigation:** Test in a dev/staging cluster first\n• **Impact:** Varies widely\n• **Likelihood:** LOW for standard configs ✅\n\n**4️⃣ Network disruption:**\n• Brief network blips during node updates\n• **Mitigation:** Use multiple replicas and PodDisruptionBudgets\n• **Impact:** Temporary connection issues (seconds, not minutes)\n• **Likelihood:** MEDIUM but short-lived ⚠️\n\n**5️⃣ Storage issues:**\n• Persistent volume problems (rare but possible)\n• **Mitigation:** Ensure storage backend is healthy\n• **Impact:** Could affect stateful apps\n• **Likelihood:** LOW if storage is healthy ✅\n\n**6️⃣ The dreaded "stuck update":**\n• Update hangs on a node or component\n• **Mitigation:** Monitoring! We watch it closely\n• **Impact:** Delays completion, requires intervention\n• **Likelihood:** LOW (~2-3% of updates) ⚠️\n\n**🛡️ How we protect you:**\n• Pre-checks catch 80% of potential issues\n• Control plane nodes update one at a time (high availability maintained)\n• Worker nodes drain gracefully (workloads move first)\n• Updates can be paused mid-flight\n• Rollback is possible (though rarely needed)\n\n**📊 Real talk - success rate:**\n• ~97% of updates complete without any issues\n• ~2% have minor hiccups (easily resolved)\n• ~1% need intervention (but cluster stays up!)\n\n**My recommendation:** Run the pre-check (which we did!), update your operators first, schedule during low-traffic, and you'll be golden! 🌟\n\nWant to see the pre-check results for YOUR cluster? I can walk you through them!`,
      suggestions: [
        'Show pre-check results',
        'How do I rollback if needed?',
        'What are PodDisruptionBudgets?',
        'Start the update'
      ]
    };
  }
  
  // ========== NETWORKING QUESTIONS ==========
  if (lowerInput.includes('service') && lowerInput.includes('route') && lowerInput.includes('differ')) {
    return {
      content: `🌐 **Service vs Route - The Networking Duo**\n\nGreat question! These work together but do different things:\n\n**🔷 Service (Layer 4 - TCP/UDP):**\n• **What:** Internal load balancer for your pods\n• **Scope:** Inside the cluster only\n• **IP:** Gets a ClusterIP (like 10.96.0.50)\n• **Think of it as:** A stable endpoint for pods that come and go\n\n**Example:**\n\`\`\`yaml\nkind: Service\nmetadata:\n  name: my-app\nspec:\n  selector:\n    app: my-app\n  ports:\n  - port: 8080\n    targetPort: 8080\n\`\`\`\n\n**When to use:**\n• Communication between services inside the cluster\n• Database access from your app\n• Internal APIs\n\n---\n\n**🔶 Route (Layer 7 - HTTP/HTTPS):**\n• **What:** External access via hostname/URL\n• **Scope:** Outside the cluster (public internet or internal network)\n• **URL:** Gets a hostname (like myapp.apps.cluster.com)\n• **Think of it as:** Your app's front door 🚪\n\n**Example:**\n\`\`\`yaml\nkind: Route\nmetadata:\n  name: my-app\nspec:\n  to:\n    kind: Service\n    name: my-app\n  tls:\n    termination: edge\n\`\`\`\n\n**When to use:**\n• Web applications users access\n• APIs that external services call\n• Anything that needs a URL\n\n---\n\n**🔗 How they work together:**\n\`\`\`\nInternet → Route (myapp.apps.cluster.com) → Service (ClusterIP) → Pods\n\`\`\`\n\n**TL;DR:**\n• **Service:** Internal traffic, IP-based, always needed\n• **Route:** External traffic, hostname-based, optional (only if you need external access)\n\n**Analogy time! 🏢**\n• Service = Internal phone extension (dial 8080 to reach accounting)\n• Route = Public phone number with a nice 1-800 number\n\nMake sense? 😊`,
      suggestions: [
        'How do I create a Route?',
        'What is TLS termination?',
        'Expose a service externally',
        'Troubleshoot network connectivity'
      ]
    };
  }
  
  if (lowerInput.includes('expose') && lowerInput.includes('service')) {
    return {
      content: `🌍 **Exposing a Service Externally**\n\nWant the world to access your app? Here's how!\n\n**🎯 Method 1: Create a Route (recommended for HTTP/HTTPS)**\n\n**Via the Console:**\n1. Go to **Networking** → **Services**\n2. Find your service and click it\n3. Click **Create Route** button\n4. Fill in:\n   • **Name:** my-app-route\n   • **Hostname:** (optional, auto-generated if blank)\n   • **Path:** / (or /api, /app, etc.)\n   • **Service:** Already selected\n   • **Target Port:** Pick the right port\n   • **TLS:** Enable for HTTPS (you should! 🔒)\n5. Click **Create**\n6. You'll get a URL like: \`my-app-route-myproject.apps.cluster.example.com\`\n\n**Via CLI:**\n\`\`\`bash\noc expose service my-app\n# Or with TLS:\noc create route edge my-app --service=my-app\n\`\`\`\n\n---\n\n**🎯 Method 2: LoadBalancer Service (for non-HTTP, like databases)**\n\nEdit your service:\n\`\`\`yaml\nkind: Service\nspec:\n  type: LoadBalancer  # Change from ClusterIP\n  ports:\n  - port: 5432\n\`\`\`\n\n⚠️ **Note:** This only works if your cluster is on a cloud provider (AWS, Azure, GCP) that supports LoadBalancers!\n\n---\n\n**🎯 Method 3: NodePort (not recommended, but possible)**\n\n\`\`\`yaml\nkind: Service\nspec:\n  type: NodePort\n  ports:\n  - port: 8080\n    nodePort: 30080  # Access via <node-ip>:30080\n\`\`\`\n\n**When to use:**\n• Testing/development\n• When LoadBalancer isn't available\n• When you REALLY need a specific port\n\n**Why it's not great:**\n• You have to remember the port number\n• No automatic load balancing\n• Security implications (opening ports on nodes)\n\n---\n\n**🔒 Security tips:**\n• Always use TLS/HTTPS for Routes\n• Use Network Policies to restrict who can access your service\n• Consider OAuth/Authentication for sensitive apps\n• Don't expose databases directly (use a proxy or VPN instead)\n\nWant me to help you expose a specific service? Just tell me what you're trying to do! 😊`,
      suggestions: [
        'What is TLS termination?',
        'Set up OAuth authentication',
        'What are Network Policies?',
        'Troubleshoot route not working'
      ]
    };
  }
  
  // ========== STORAGE QUESTIONS ==========
  if (lowerInput.includes('storage class') || lowerInput.includes('storageclass')) {
    return {
      content: `💾 **Storage Classes Explained**\n\nThink of StorageClasses as "tiers" of storage - like economy, business, and first class! ✈️\n\n**What is a StorageClass?**\nA template that describes the "type" of storage you want:\n• Speed (SSD vs HDD)\n• Redundancy (replicated or not)\n• Features (encryption, snapshots, etc.)\n• Provider (AWS EBS, Azure Disk, Ceph, NFS, etc.)\n\n**📋 Common StorageClasses in your cluster:**\n\n**1️⃣ gp3-encrypted (General Purpose SSD - Encrypted):**\n• **Type:** AWS EBS gp3 volumes\n• **Speed:** Fast! ⚡ (good IOPS)\n• **Encrypted:** Yes 🔒\n• **Use for:** Most applications, databases\n• **Cost:** $$ (moderate)\n\n**2️⃣ standard:**\n• **Type:** Usually magnetic HDD or slower SSD\n• **Speed:** Moderate 🐢\n• **Encrypted:** Depends\n• **Use for:** Logs, backups, non-critical data\n• **Cost:** $ (cheap!)\n\n**3️⃣ high-performance / io2:**\n• **Type:** Super fast SSD (NVMe or provisioned IOPS)\n• **Speed:** VERY FAST 🚀\n• **Encrypted:** Usually yes\n• **Use for:** Databases, high-traffic apps, analytics\n• **Cost:** $$$ (expensive!)\n\n---\n\n**🔍 How to use a StorageClass:**\n\nWhen creating a PersistentVolumeClaim (PVC):\n\n\`\`\`yaml\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: my-data\nspec:\n  storageClassName: gp3-encrypted  # 👈 Specify here!\n  accessModes:\n  - ReadWriteOnce\n  resources:\n    requests:\n      storage: 10Gi\n\`\`\`\n\n**Don't specify one?** It'll use the **default** StorageClass (usually marked with \`(default)\` in the list).\n\n---\n\n**🎛️ Which one should I use?**\n\n**For databases (PostgreSQL, MySQL, MongoDB):**\n→ **gp3-encrypted** or **high-performance**\n\n**For web app persistent storage:**\n→ **gp3-encrypted**\n\n**For logs, caches, temporary data:**\n→ **standard**\n\n**For analytics, Elasticsearch, heavy I/O:**\n→ **high-performance**\n\n---\n\n**💡 Pro tips:**\n• You can't change StorageClass after creating a PVC (pick wisely!)\n• Faster storage = more $$$, so don't over-provision\n• Use **encrypted** StorageClasses for any sensitive data\n• Some StorageClasses support **volume snapshots** - super handy for backups! 📸\n\nWant to see the StorageClasses available in your cluster? Just ask! 😊`,
      suggestions: [
        'Show available StorageClasses',
        'How do I expand a volume?',
        'What are volume snapshots?',
        'Create a new PVC'
      ]
    };
  }
  
  if (lowerInput.includes('expand') && lowerInput.includes('volume')) {
    return {
      content: `📈 **Expanding a Persistent Volume**\n\nRunning out of space? No problem! Here's how to expand:\n\n**✅ Prerequisites:**\n• Your StorageClass must support volume expansion (most do!)\n• The volume must be in "Bound" status\n• The PVC must allow resizing (\`allowVolumeExpansion: true\`)\n\n**🔧 Steps to expand:**\n\n**Method 1: Via the Console (easiest)**\n1. Go to **Storage** → **PersistentVolumeClaims**\n2. Find your PVC and click it\n3. Click **Actions** → **Expand PVC**\n4. Enter the new size (must be larger than current!)\n5. Click **Expand**\n\n**Method 2: Edit the PVC directly**\n\`\`\`bash\noc edit pvc my-data-pvc\n\`\`\`\n\nChange the storage size to a larger value.\n\n**Method 3: Patch command**\n\`\`\`bash\noc patch pvc my-data-pvc -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'\n\`\`\`\n\n---\n\n**⏱️ What happens next:**\n\n**For most cloud providers (AWS, Azure, GCP):**\n1. The underlying disk expands automatically (1-5 minutes)\n2. The filesystem resizes automatically\n3. Your pod might need a restart (depends on the CSI driver)\n4. **Done!** 🎉\n\n**⚠️ Important notes:**\n\n**Can I shrink a volume?**\n❌ **Nope!** Volume expansion is one-way only. You can only make it BIGGER.\n\n**Does it cause downtime?**\n• **Usually NO!** Most modern storage systems support online expansion\n• Some old storage types might need a pod restart\n\nNeed help checking which volumes are running out of space? I can help with that! 📊`,
      suggestions: [
        'Show volumes running out of space',
        'What is a PersistentVolume?',
        'Create a new PVC',
        'Explain StorageClasses'
      ]
    };
  }
  
  // ========== WORKLOAD QUESTIONS ==========
  if (lowerInput.includes('pod') && lowerInput.includes('pending')) {
    return {
      content: `⏳ **Troubleshooting Pending Pods**\n\n"Pending" means the pod is waiting for something. Let's figure out what!\n\n**🔍 First, check why it's pending:**\n\n\`\`\`bash\noc describe pod <pod-name>\n\`\`\`\n\nLook at the **Events** section at the bottom. This is the detective work! 🕵️\n\n---\n\n**Common causes & fixes:**\n\n**1️⃣ "Insufficient CPU" or "Insufficient memory"**\n❌ **Problem:** Not enough resources on any node\n\n✅ **Fix:**\n• Reduce the pod's resource requests\n• Add more nodes to the cluster\n• Delete unnecessary pods to free up resources\n\n---\n\n**2️⃣ "0/5 nodes available: pod has unbound immediate PersistentVolumeClaims"**\n❌ **Problem:** Waiting for storage (PVC not bound)\n\n✅ **Fix:**\n• Check if PVC exists: \`oc get pvc\`\n• Check PVC status: \`oc describe pvc <pvc-name>\`\n• Make sure you have a working StorageClass\n\n---\n\n**3️⃣ "node(s) didn't match node selector"**\n❌ **Problem:** Pod wants a specific node, but none match\n\n✅ **Fix:**\n• Check your pod's nodeSelector or nodeAffinity\n• Make sure nodes are labeled correctly\n\n---\n\n**4️⃣ "node(s) had taints that the pod didn't tolerate"**\n❌ **Problem:** Nodes are "tainted" and pod doesn't have the right "toleration"\n\n✅ **Fix:**\n• Add a toleration to your pod spec\n• Or remove the taint from nodes\n\n---\n\n**5️⃣ Image pull errors**\n❌ **Problem:** Can't download the container image\n\n✅ **Fix:**\n• Check if the image name is correct\n• Verify image registry credentials (pull secrets)\n• Make sure the image actually exists\n\n---\n\n**💡 Pro tip:**\n\nIf a pod has been pending for more than a few minutes, it's not going to magically fix itself. Something needs to change!\n\nWant me to help debug a specific pending pod? Share the \`describe\` output and I'll analyze it! 🔍`,
      suggestions: [
        'How do I add more nodes?',
        'Explain resource requests vs limits',
        'What are taints and tolerations?',
        'Check cluster resource usage'
      ]
    };
  }
  
  if (lowerInput.includes('scale') && lowerInput.includes('deployment')) {
    return {
      content: `📊 **Scaling Deployments**\n\nWant more pods? Fewer pods? Here's how to scale like a pro!\n\n**🎚️ Method 1: Quick scale via Console**\n1. Go to **Workloads** → **Deployments**\n2. Find your deployment\n3. Look for the pod count (e.g., "3 pods")\n4. Click the **↑** or **↓** arrows to scale up/down\n5. Done! Watch the pods spin up 🎉\n\n---\n\n**🎚️ Method 2: CLI (my favorite! 😄)**\n\n**Scale to a specific number:**\n\`\`\`bash\noc scale deployment my-app --replicas=5\n\`\`\`\n\n**Scale to zero (stop all pods):**\n\`\`\`bash\noc scale deployment my-app --replicas=0\n\`\`\`\n\n---\n\n**🤖 Auto-scaling (even better!)**\n\nWhy manually scale when you can automate? Meet the **HorizontalPodAutoscaler (HPA)**!\n\n**Create an HPA:**\n\`\`\`bash\noc autoscale deployment my-app \\\n  --min=2 \\\n  --max=10 \\\n  --cpu-percent=70\n\`\`\`\n\nThis says:\n• Keep at least 2 pods running\n• Never exceed 10 pods\n• Add pods when CPU hits 70%\n• Remove pods when CPU drops\n\n**SMART!** 🧠\n\n---\n\n**📏 How many replicas should I have?**\n\n**Production apps:**\n• **Minimum 2-3** replicas (for high availability)\n• More if you have high traffic\n\n**Dev/test environments:**\n• 1 replica is fine (saves resources)\n\n**Background workers:**\n• Scale based on queue depth\n• Can be 0 when no work to do\n\n---\n\n**⚡ Scaling best practices:**\n\n✅ **Do:**\n• Use HPAs for auto-scaling\n• Set appropriate resource requests/limits\n• Monitor performance as you scale\n\n❌ **Don't:**\n• Scale to zero if you need fast response times\n• Over-scale (wasting resources = wasting money 💸)\n• Forget about downstream dependencies\n\nWant to set up auto-scaling for your apps? I can guide you! 😊`,
      suggestions: [
        'Set up auto-scaling (HPA)',
        'What are PodDisruptionBudgets?',
        'Explain resource requests and limits',
        'Monitor application performance'
      ]
    };
  }
  
  if (lowerInput.includes('restart') && lowerInput.includes('pod')) {
    return {
      content: `🔄 **Pod Restarts - What's Happening?**\n\nSeeing pod restarts? Let's figure out if it's normal or a problem!\n\n**📊 Check restart count:**\n\`\`\`bash\noc get pods\n\`\`\`\n\nLook at the **RESTARTS** column.\n\n---\n\n**🟢 Normal restart reasons:**\n\n**1️⃣ Liveness probe failures (then recovery)**\n• App was temporarily unresponsive\n• Kubernetes restarted it (working as designed!)\n• If it stabilizes, you're fine ✅\n\n**2️⃣ OOMKilled (Out Of Memory)**\n• Pod used too much memory\n• Kubernetes killed it to protect the node\n• **Fix:** Increase memory limits or optimize your app\n\n**3️⃣ CrashLoopBackOff**\n• App crashes immediately on start\n• Kubernetes keeps trying to restart it\n• **Fix:** Check logs! There's a bug in your app\n\n---\n\n**🔍 How to investigate:**\n\n**Check recent logs:**\n\`\`\`bash\noc logs <pod-name>\n\`\`\`\n\n**Check logs from previous crashed container:**\n\`\`\`bash\noc logs <pod-name> --previous\n\`\`\`\n\n**Check events:**\n\`\`\`bash\noc describe pod <pod-name>\n\`\`\`\n\n---\n\n**🚨 When to worry:**\n• Restart count keeps climbing rapidly\n• CrashLoopBackOff state\n• OOMKilled every few minutes\n\n**😌 When NOT to worry:**\n• 1-2 restarts after deployment (sometimes apps hiccup on start)\n• Occasional restarts (like once a week) on long-running pods\n• Restarts during cluster maintenance\n\n---\n\n**💡 Common fixes:**\n\n**For OOMKilled:**\n• Increase memory limits\n• Check for memory leaks in your app\n\n**For CrashLoopBackOff:**\n• Check application logs\n• Verify environment variables\n• Check if dependencies (DB, cache) are available\n\n**For frequent liveness probe failures:**\n• Increase probe timeout\n• Make sure app starts quickly enough\n• Fix the actual health check endpoint\n\nWant me to help analyze specific pod restart issues? Share the pod name! 🔍`,
      suggestions: [
        'What are liveness probes?',
        'How do I check pod logs?',
        'Explain CrashLoopBackOff',
        'Increase pod memory limits'
      ]
    };
  }
  
  // ========== GENERAL/FALLBACK ==========
  if (lowerInput.includes('operator') && !lowerInput.includes('update') && !lowerInput.includes('install')) {
    return {
      content: `📦 **Operators - The App Store for Kubernetes**\n\nOperators are like specialized robots that manage complex applications for you!\n\n**What's an Operator?**\nA piece of software that:\n• Installs and configures applications\n• Handles updates automatically\n• Manages backups, scaling, and maintenance\n• Fixes issues without you lifting a finger\n\n**Think of it like:**\n• You want a database? Install the PostgreSQL operator\n• It creates the database, handles backups, manages failover\n• You just say "I want a database" and it handles the rest! 🪄\n\n**Common tasks:**\n• **Install an operator** - Add new capabilities to your cluster\n• **Update operators** - Keep them current\n• **Manage operator instances** - Create/configure the apps they provide\n\nWhat would you like to do with operators?`,
      suggestions: [
        'Install an operator',
        'Update operators',
        'List installed operators',
        'What operators do I need?'
      ]
    };
  }
  
  if (lowerInput.includes('health') || lowerInput.includes('status')) {
    return {
      content: `🏥 **Cluster Health Check Complete!**\n\n**Overall Status:** Healthy 💚\n\n**Node Health:**\n✅ 3 control plane nodes - All healthy\n✅ 5 worker nodes - All healthy\n\n**Resource Utilization:**\n• CPU: 45% average\n• Memory: 62% average\n• Storage: 78% used\n\n**Critical Services:**\n✅ API Server: Responding\n✅ etcd: Healthy & performant\n✅ DNS: Operational\n\nYour cluster is looking good! 🎉`,
      suggestions: [
        'Show detailed node status',
        'Check operator health',
        'Assess readiness',
        'View alerts'
      ]
    };
  }
  
  if (lowerInput.includes('update') && lowerInput.includes('cluster')) {
    return {
      content: `🔄 **Cluster Update Assistant**\n\nI'm here to help with your OpenShift update! I can:\n\n• Assess cluster readiness and compatibility\n• Explain update process and timeline\n• Guide you through each step\n• Help with operator updates\n• Troubleshoot any issues\n\nWhat would you like to know?`,
      suggestions: [
        'Assess readiness',
        'How long will it take?',
        'What are the risks?',
        'Start the update'
      ]
    };
  }
  
  return {
    content: `I'm OpenShift LightSpeed, your AI assistant! I can help with:\n\n🔄 **Updates & Maintenance:**\n• Cluster updates\n• Operator management\n• Pre-checks\n\n💚 **Health & Monitoring:**\n• Cluster status\n• Resource usage\n• Troubleshooting\n\n🏗️ **Builds & CI/CD:**\n• BuildConfigs and strategies\n• Triggering builds\n• Webhooks and automation\n\n🌐 **Networking:**\n• Services and Routes\n• Exposing applications\n• Network policies\n\n💾 **Storage:**\n• PersistentVolumes and Claims\n• StorageClasses\n• Volume management\n\n⚙️ **Workloads:**\n• Pods, Deployments, StatefulSets\n• Scaling and auto-scaling\n• Troubleshooting\n\nWhat would you like to know?`,
    suggestions: [
      'Show cluster health',
      'Check for updates',
      'How do I trigger a build?',
      'Explain Services vs Routes'
    ]
  };
}
