import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Star, Shield, Bug, Zap } from "@/lib/pfIcons";

const versionData: Record<string, any> = {
  "5.1.10": {
    recommended: true, risk: "Low Risk", riskColor: "#3e8635", date: "Mar 22, 2026",
    riskAssessment: {
      breakingChanges: { text: "None detected", color: "#3e8635" },
      deprecatedAPIs: { text: "1 minor, non-blocking", color: "#c58c00" },
      knownIssues: { text: "0 open", color: "#3e8635" },
      errata: "2 security, 3 bug fix, 1 enhancement",
    },
    highlights: [
      { type: "FEATURE", color: "#0066cc", text: "OVN-Kubernetes dual-stack gateway improvements" },
      { type: "FEATURE", color: "#0066cc", text: "Node health check operator GPU workload awareness" },
      { type: "FEATURE", color: "#0066cc", text: "AI workload scheduling hints for InferenceService pods" },
      { type: "FEATURE", color: "#0066cc", text: "Console cluster update experience with agent-based path" },
      { type: "SECURITY", color: "#c9190b", text: "CVE-2026-1234 containerd privilege escalation fix" },
      { type: "SECURITY", color: "#c9190b", text: "CVE-2026-5678 etcd TLS certificate validation hardening" },
      { type: "BUG FIX", color: "#6753ac", text: "Fixed intermittent node NotReady during pod eviction" },
      { type: "BUG FIX", color: "#6753ac", text: "Resolved PVC resize stuck for Ceph RBD" },
      { type: "BUG FIX", color: "#6753ac", text: "MachineConfigPool rollout respects maxUnavailable" },
    ],
  },
  "5.1.9": {
    recommended: false, risk: "Low Risk", riskColor: "#3e8635", date: "Mar 16, 2026",
    riskAssessment: {
      breakingChanges: { text: "None detected", color: "#3e8635" },
      deprecatedAPIs: { text: "None", color: "#3e8635" },
      knownIssues: { text: "0 open", color: "#3e8635" },
      errata: "1 security, 2 bug fix",
    },
    highlights: [
      { type: "FEATURE", color: "#0066cc", text: "Enhanced monitoring dashboard for GPU nodes" },
      { type: "FEATURE", color: "#0066cc", text: "Improved cluster autoscaler scaling decisions" },
      { type: "SECURITY", color: "#c9190b", text: "CVE-2026-2345 kube-apiserver RBAC bypass fix" },
      { type: "BUG FIX", color: "#6753ac", text: "Fixed OVN pod network connectivity after node reboot" },
      { type: "BUG FIX", color: "#6753ac", text: "Resolved etcd defrag timeout on large clusters" },
    ],
  },
};

const defaultVersion = {
  recommended: false, risk: "Low Risk", riskColor: "#3e8635", date: "Mar 2026",
  riskAssessment: {
    breakingChanges: { text: "None detected", color: "#3e8635" },
    deprecatedAPIs: { text: "None", color: "#3e8635" },
    knownIssues: { text: "0 open", color: "#3e8635" },
    errata: "1 bug fix",
  },
  highlights: [
    { type: "BUG FIX", color: "#6753ac", text: "General stability improvements" },
  ],
};

export default function VersionDetailPage() {
  const { version } = useParams();
  const navigate = useNavigate();
  const data = versionData[version || ""] || defaultVersion;

  const iconMap: Record<string, typeof Zap> = {
    "FEATURE": Zap,
    "SECURITY": Shield,
    "BUG FIX": Bug,
  };

  return (
    <div className="ocs-app-page-outer ocs-app-page-outer--end-3xl">
      <Link to="/administration/cluster-update" className="flex items-center gap-[6px] text-[#0066cc] dark:text-[#4dabf7] text-[14px] no-underline hover:underline mb-[16px] font-['Red_Hat_Text:Regular',sans-serif]">
        <ArrowLeft className="size-[16px]" /> Back to Cluster Update
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-[8px]">
        <h1 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[28px]">
          OpenShift {version}
        </h1>
        <button
          onClick={() => {
            localStorage.setItem("clusterUpdateInProgress", JSON.stringify({ version, startedAt: Date.now() }));
            navigate("/administration/cluster-update");
          }}
          className="bg-[#0066cc] hover:bg-[#004080] text-white border-0 px-[20px] py-[10px] rounded-[8px] cursor-pointer text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-semibold transition-colors"
        >
          Update to this version
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-[10px] mb-[24px]">
        {data.recommended && (
          <span className="flex items-center gap-[4px] bg-[#e7f1fa] dark:bg-[rgba(43,154,243,0.15)] text-[#0066cc] dark:text-[#4dabf7] text-[12px] px-[10px] py-[4px] rounded-[4px] font-semibold">
            <Star className="size-[12px]" /> Recommended
          </span>
        )}
        <span className="text-[12px] px-[10px] py-[4px] rounded-[4px] font-semibold" style={{
          backgroundColor: data.riskColor === "#3e8635" ? "rgba(62,134,53,0.1)" : "rgba(197,140,0,0.1)",
          color: data.riskColor,
        }}>
          {data.risk}
        </span>
        <span className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif]">
          Released {data.date}
        </span>
      </div>

      {/* Risk Assessment Card */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px] mb-[24px]">
        <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px] mb-[16px]">Risk Assessment</h2>
        <div className="grid grid-cols-2 gap-x-[48px] gap-y-[16px]">
          <div>
            <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Breaking changes</p>
            <p className="text-[14px] font-['Red_Hat_Text:Regular',sans-serif]" style={{ color: data.riskAssessment.breakingChanges.color }}>
              {data.riskAssessment.breakingChanges.text}
            </p>
          </div>
          <div>
            <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Deprecated APIs</p>
            <p className="text-[14px] font-['Red_Hat_Text:Regular',sans-serif]" style={{ color: data.riskAssessment.deprecatedAPIs.color }}>
              {data.riskAssessment.deprecatedAPIs.text}
            </p>
          </div>
          <div>
            <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Known issues</p>
            <p className="text-[14px] font-['Red_Hat_Text:Regular',sans-serif]" style={{ color: data.riskAssessment.knownIssues.color }}>
              {data.riskAssessment.knownIssues.text}
            </p>
          </div>
          <div>
            <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Errata advisories</p>
            <p className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Text:Regular',sans-serif]">{data.riskAssessment.errata}</p>
          </div>
        </div>
      </div>

      {/* Release Highlights Card */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px]">
        <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px] mb-[16px]">Release Highlights</h2>
        <div className="flex flex-col gap-[12px]">
          {data.highlights.map((item: any, i: number) => {
            const Icon = iconMap[item.type] || Zap;
            return (
              <div key={i} className="flex items-start gap-[12px] py-[8px] border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] last:border-0">
                <span className="text-[11px] px-[8px] py-[2px] rounded-[4px] font-semibold whitespace-nowrap shrink-0 mt-[2px]" style={{
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                }}>
                  <Icon className="size-[10px] inline mr-[4px] -mt-[1px]" />
                  {item.type}
                </span>
                <p className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Text:Regular',sans-serif]">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}