import { parseTopologyLightspeedContext } from "./topologyLightspeed";

export type TopologyLightspeedReport = {
  content: string;
  tools?: string[];
  sources?: Array<{ title: string; href: string }>;
  suggestions?: string[];
};

const HUMAN_IN_LOOP =
  "\n\n**Important:** I recommend changes for you to review. I will not apply networking changes automatically — verify each step before you run it on the cluster.";

export function getTopologyLightspeedResponse(context: string): TopologyLightspeedReport | null {
  const parsed = parseTopologyLightspeedContext(context);
  if (!parsed) return null;

  switch (parsed.scenario) {
    case "mtu":
      return getMtuDiagnosisResponse(parsed.segments);
    case "bond":
      return getBondDiagnosisResponse(parsed.segments);
    case "config-failed":
      return getConfigFailedResponse(parsed.segments);
    case "observe":
      return getObserveAnalysisResponse(parsed.segments);
    case "create":
      return getCreateResourceResponse(parsed.segments);
    case "delete-impact":
      return getDeleteImpactResponse(parsed.segments);
    case "unhealthy-overview":
      return getUnhealthyOverviewResponse();
    case "yaml-review":
      return getYamlReviewResponse(parsed.segments);
    case "general":
      return getGeneralTopologyResponse();
    default:
      return null;
  }
}

function getMtuDiagnosisResponse(segments: string[]): TopologyLightspeedReport {
  const resourceLabel = segments[1] ?? "interface";
  const workerLabel = segments[2] ?? "worker";
  const mismatchCount = segments[3] ?? "several";

  return {
    content:
      `**MTU mismatch analysis — ${resourceLabel} on ${workerLabel}**\n\n` +
      `I reviewed the topology view and NNCP/nmstate signals for this host.\n\n` +
      `**What I found**\n` +
      `• **${resourceLabel}** is advertising a different MTU than **${mismatchCount}** assigned network(s).\n` +
      `• Mismatched MTU is a common cause of silent packet loss, especially on overlay/UDN paths and storage migration networks.\n` +
      `• On bare metal clusters, MTU changes often require coordinated updates across **MachineConfigPool**, **bond/VLAN members**, and **logical networks** — a manual, high-risk workflow.\n\n` +
      `**Likely root causes (ranked)**\n` +
      `1. NNCP applied a host MTU that does not match the UDN/CUDN definition.\n` +
      `2. Only part of the path was updated (e.g., bond updated, VLAN child left at 1500).\n` +
      `3. A network was attached to this worker before MTU was aligned cluster-wide.\n\n` +
      `**Recommended plan (review before applying)**\n` +
      `1. List every interface in the traffic path (NIC → bond → bridge → OVS port).\n` +
      `2. Confirm the target MTU from each network's spec and physical switch settings.\n` +
      `3. Draft a single NNCP change set and validate on one worker MCP first.\n` +
      `4. Roll out worker-by-worker; watch for NNCP \`Degraded\` and packet drop metrics in **Observe**.\n\n` +
      `**Verification commands**\n` +
      `\`oc get nncp,nns -A\` · \`nmcli dev show ${resourceLabel}\` · compare against UDN MTU in YAML` +
      HUMAN_IN_LOOP,
    tools: ["topology-inspector", "nncp-status", "nns-interfaces"],
    sources: [
      { title: "Updating MTU in OpenShift", href: "https://docs.openshift.com" },
      { title: "NodeNetworkConfigurationPolicy", href: "https://docs.openshift.com" },
    ],
    suggestions: [
      "Draft NNCP YAML to align MTU",
      "Which workers are affected?",
      "What is the safest rollout order?",
    ],
  };
}

function getBondDiagnosisResponse(segments: string[]): TopologyLightspeedReport {
  const bondLabel = segments[0] ?? "bond0";
  const workerLabel = segments[1] ?? "worker";

  return {
    content:
      `**Bond health analysis — ${bondLabel} on ${workerLabel}**\n\n` +
      `**Summary**\n` +
      `The topology marks this bond as **degraded**. One or more members are not in an active LACP or operational state.\n\n` +
      `**What I checked**\n` +
      `• Member link state and LACP negotiation\n` +
      `• NNCP reconcile status for each slave interface\n` +
      `• Recent events on the node network configuration operator\n\n` +
      `**Common causes**\n` +
      `• Cable/transceiver issue on a single NIC (active-backup may still show degraded if the preferred slave is down).\n` +
      `• LACP misconfiguration on the upstream switch for 802.3ad bonds.\n` +
      `• Partial NNCP apply — one slave updated, peer still \`Failed\`.\n\n` +
      `**Suggested next steps**\n` +
      `1. Open the bond member interfaces in the topology and compare status side-by-side.\n` +
      `2. On the node: \`nmcli device status\` and \`cat /proc/net/bonding/${bondLabel}\`.\n` +
      `3. If a member is failed, isolate whether it is physical link or NMState config.\n` +
      `4. Only after verification, update NNCP — avoid bouncing both slaves at once on production VLANs.` +
      HUMAN_IN_LOOP,
    tools: ["topology-inspector", "bond-status", "node-events"],
    suggestions: [
      "Show LACP details for each member",
      "Compare with a healthy worker bond",
      "Draft a safe NNCP fix",
    ],
  };
}

function getConfigFailedResponse(segments: string[]): TopologyLightspeedReport {
  const label = segments[0] ?? "resource";
  const status = segments[1] ?? "failed";

  return {
    content:
      `**Configuration ${status} — ${label}**\n\n` +
      `You should not need to dig through raw object YAML to understand a failure. Here is a plain-language diagnosis based on NNCP/nmstate signals:\n\n` +
      `**Observed**\n` +
      `• NodeNetworkConfigurationPolicy reports **${status}** for **${label}**.\n` +
      `• Desired state from NNCP does not match NodeNetworkState on one or more selected nodes.\n\n` +
      `**Typical failure messages**\n` +
      `• \`verification error: configuration failed\` — invalid nmstate schema or conflicting interface name.\n` +
      `• \`policy is not progressing\` — selector matches no nodes or MCP drain blocked apply.\n` +
      `• \`failed to execute\` — bridge/port already exists with different parameters.\n\n` +
      `**What I recommend**\n` +
      `1. Open **View YAML** from Actions and compare desired vs. current NNCP sections.\n` +
      `2. Check \`oc get nns <node> -o yaml\` for the failing interface stanza.\n` +
      `3. Fix the policy, apply, and watch topology status return to **Configured**.\n` +
      `4. Use **Observe** metrics (drops/errors) after reconcile to confirm traffic is healthy.` +
      HUMAN_IN_LOOP,
    tools: ["nncp-describe", "nns-diff", "nmstate-verify"],
    suggestions: [
      "Explain the nmstate error in plain language",
      "Is it safe to retry this NNCP?",
      "Which nodes are affected?",
    ],
  };
}

function getObserveAnalysisResponse(segments: string[]): TopologyLightspeedReport {
  const label = segments[0] ?? "interface";

  return {
    content:
      `**Observe analysis — ${label}**\n\n` +
      `Based on recent metrics for this object (prototype data):\n\n` +
      `| Signal | Status | Note |\n` +
      `| --- | --- | --- |\n` +
      `| Throughput | Stable | No sudden collapse in the last hour |\n` +
      `| RX/TX errors | Elevated | Small error counter increase — worth watching |\n` +
      `| Drops | Warning | Possible MTU or policy mismatch upstream |\n\n` +
      `**Interpretation**\n` +
      `Elevated drops with stable throughput often point to **MTU mismatch** or **microbursts** on a shared bond — consistent with what administrators report on large bare-metal clusters.\n\n` +
      `**Next checks**\n` +
      `• Compare interface MTU with attached UDN/CUDN MTU in the topology.\n` +
      `• If this is a bond slave, check whether only one member carries traffic.\n` +
      `• Correlate with NNCP events around the time errors began.` +
      HUMAN_IN_LOOP,
    tools: ["metrics-query", "topology-path-trace"],
    suggestions: [
      "Correlate drops with MTU warnings",
      "Trace path to the workload",
      "What changed in the last 24h?",
    ],
  };
}

function getCreateResourceResponse(segments: string[]): TopologyLightspeedReport {
  const resourceType = segments[0] ?? "network resource";

  const guides: Record<string, string> = {
    nncp: "NodeNetworkConfigurationPolicy — host bridges, bonds, VLANs, and interface MTU on selected nodes.",
    udn: "UserDefinedNetwork — namespace-scoped logical network for workloads and NAD attachments.",
    cudn: "ClusterUserDefinedNetwork — cluster-wide logical network shared across namespaces.",
    nad: "NetworkAttachmentDefinition — Multus attachment for pods/VMs to secondary networks.",
    nnc: "Node network configuration wizard — provision bridges and physical mapping on workers.",
  };

  const guide = guides[resourceType] ?? guides.nncp;

  return {
    content:
      `**Create ${resourceType.toUpperCase()} with AI assistance**\n\n` +
      `**What you're creating**\n${guide}\n\n` +
      `**How I can help (without applying changes)**\n` +
      `• Draft YAML from your topology selection (worker, bridge, VLAN, MTU).\n` +
      `• Explain field-by-field before you save or \`oc apply\`.\n` +
      `• Flag risky combinations (MTU change + bond reshape on production MCP).\n\n` +
      `**Suggested workflow**\n` +
      `1. Tell me the worker(s), interface names, and target network.\n` +
      `2. I generate a draft manifest for review in **View YAML**.\n` +
      `3. You apply manually or through your GitOps pipeline after validation.\n\n` +
      `Ask me to draft a policy for your current topology selection.` +
      HUMAN_IN_LOOP,
    tools: ["yaml-draft", "topology-context"],
    suggestions: [
      "Draft NNCP for this bridge",
      "Explain UDN vs CUDN for my use case",
      "What fields are required for VLAN tagging?",
    ],
  };
}

function getDeleteImpactResponse(segments: string[]): TopologyLightspeedReport {
  const label = segments[0] ?? "resource";
  const kind = segments[1] ?? "network";

  return {
    content:
      `**Impact analysis — deleting ${label}**\n\n` +
      `**Resource type:** ${kind}\n\n` +
      `**Potential impact**\n` +
      `• **Workloads:** VMs or pods using a NAD backed by this network may lose connectivity or fail to start.\n` +
      `• **Nodes:** Host interfaces may remain configured until NNCP is reconciled — deletion from topology does not always remove host state.\n` +
      `• **Storage / migration:** Secondary networks used for live migration are high blast-radius targets.\n\n` +
      `**Before you delete**\n` +
      `1. List attachments from the **Resources** tab and virtualization workloads on this network.\n` +
      `2. Confirm no critical VMs use this NAD/UDN.\n` +
      `3. Prefer cordon/drain or detach workloads first on production clusters.\n\n` +
      `I can help you build a safer decommission checklist — I will not delete resources for you.` +
      HUMAN_IN_LOOP,
    tools: ["attachment-scan", "vm-nad-map"],
    suggestions: [
      "List VMs attached to this network",
      "Safer decommission steps",
      "Draft a migration plan",
    ],
  };
}

function getUnhealthyOverviewResponse(): TopologyLightspeedReport {
  return {
    content:
      `**Unhealthy resources — topology overview**\n\n` +
      `You're filtering the topology to **Unhealthy** resources. I can help prioritize what to fix first.\n\n` +
      `**Typical categories in this view**\n` +
      `• **Configuration pending/failed** — NNCP not fully applied on one or more nodes.\n` +
      `• **Bond degraded** — one or more slaves down or LACP not active.\n` +
      `• **MTU mismatch** — host MTU does not match assigned logical network MTU.\n\n` +
      `**Suggested triage order**\n` +
      `1. Failed configurations on production worker MCPs.\n` +
      `2. Bonds carrying storage or migration VLANs.\n` +
      `3. MTU mismatches on networks with active workloads.\n\n` +
      `Select a specific node or resource and use **Diagnose with LightSpeed** for a focused analysis.` +
      HUMAN_IN_LOOP,
    tools: ["topology-filter", "health-summary"],
    suggestions: [
      "What failed most recently?",
      "Which issues affect VMs?",
      "Help me plan an MTU remediation",
    ],
  };
}

function getYamlReviewResponse(segments: string[]): TopologyLightspeedReport {
  const label = segments[0] ?? "resource";

  return {
    content:
      `**YAML review — ${label}**\n\n` +
      `Open **View YAML** from Actions to compare your edits with what I suggest.\n\n` +
      `**I can help you**\n` +
      `• Explain each stanza in plain language.\n` +
      `• Spot conflicts with other NNCPs on the same node.\n` +
      `• Suggest safer sequencing for MTU or bond changes.\n\n` +
      `Paste a snippet or ask about a specific field — I'll review before you apply.` +
      HUMAN_IN_LOOP,
    suggestions: [
      "Explain this NNCP spec",
      "Is this MTU change safe to roll out?",
      "Highlight conflicts with other policies",
    ],
  };
}

function getGeneralTopologyResponse(): TopologyLightspeedReport {
  return {
    content:
      `**Networking topology assistance**\n\n` +
      `I can help you troubleshoot and plan changes from the cluster networking topology view:\n\n` +
      `• Diagnose **failed NNCP**, **bond**, and **MTU mismatch** alerts\n` +
      `• Interpret **Observe** metrics for an interface or network\n` +
      `• Draft **NNCP / UDN / NAD** YAML for review (not auto-applied)\n` +
      `• Assess **delete impact** on workloads before destructive changes\n\n` +
      `Select a resource with a health warning and use **Diagnose with LightSpeed**, or ask a question here.` +
      HUMAN_IN_LOOP,
    suggestions: [
      "Help me troubleshoot a failed interface",
      "Explain MTU rollout best practices",
      "Draft NNCP for a new bridge",
    ],
  };
}
