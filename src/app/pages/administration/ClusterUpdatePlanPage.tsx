import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link, useLocation } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  ActionList,
  ActionListItem,
  Alert,
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Content,
  DatePicker,
  Divider,
  Dropdown,
  DropdownItem,
  ExpandableSection,
  Flex,
  FlexItem,
  FormGroup,
  FormSelect,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Icon,
  Label,
  List,
  ListItem,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Panel,
  PanelMain,
  PanelMainBody,
  Popover,
  Progress,
  Radio,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Switch,
  Tab,
  Tabs,
  TabTitleText,
  TimePicker,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import {
  AiExperienceIcon,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
  X,
  Loader2,
  Shield,
  Settings,
  RotateCcw,
  Play,
  Pause,
  Calendar,
  Bell,
  Clock,
  User,
  Zap,
  Eye,
  RefreshCw,
  Check,
} from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsNamedResourceDataView,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../../components/dataView/OcsPrototypeListTable";
import { AiAssessmentSection } from "../../components/AiAssessmentSection";
import { OlsChatbot } from "../../components/OlsChatbot";
import { AiGeneratedPlanMarker, AI_GENERATED_PLAN_HEADING } from "../../components/lightspeed/LightspeedLegalCopy";
import { useClusterUpdateDemoVariant } from "../../contexts/ClusterUpdateDemoContext";
import { UpdatesPlanAnalysisCard } from "../../components/cluster-update/UpdatesPlanAnalysisCard";
import { CLUSTER_CURRENT_VERSION } from "../../constants/clusterVersionDemo";

/** Disclosure (displaySize lg) — strip secondary panel chrome inside glass surfaces; see cluster-update-layout.css */
function clusterExpandablePlainClass(isGlass: boolean): string | undefined {
  return isGlass ? "ocp-cluster-expandable--plain" : undefined;
}

type TabKey = "update-plan" | "active-update-plans" | "update-history";

export type RiskResolution = {
  type: "update-operator" | "wait-for-fix" | "update-z-stream" | "accept-only";
  description: string;
  actionAvailable?: boolean;
};

export type RiskSource = "cincinnati" | "preflight" | "cluster";

export type OperatorIssue = {
  name: string;
  message: string;
  slug: string;
  severity: "critical" | "warning";
  url?: string;
  resolution?: RiskResolution;
  source?: RiskSource;
};

export type VersionEntry = {
  version: string;
  recommended: boolean;
  risk: string;
  riskColor: string;
  features: number;
  bugFixes: number;
  date: string;
  operatorIssues?: OperatorIssue[];
};

export type VersionGroup = {
  label: string;
  versions: VersionEntry[];
};


/* ─── Channel-specific version data ─── */
export const channelVersions: Record<string, { groups: VersionGroup[]; banner?: { title: string; description: string; link: string } }> = {
  "fast-5.1": {
    banner: {
      title: "OpenShift 5.1 is available!",
      description: "Includes OVN network improvements, enhanced node management, and AI workload scheduling.",
      link: "See what's new in 5.1",
    },
    groups: [
      {
        label: "5.1",
        versions: [
          {
            version: "5.1.10", recommended: true, risk: "Low Risk", riskColor: "#3e8635", features: 4, bugFixes: 12, date: "Mar 22, 2026",
          },
          { version: "5.1.9", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 2, bugFixes: 8, date: "Mar 16, 2026",
            operatorIssues: [
              { name: "ClusterLoggingMaxVersion", slug: "ClusterLoggingMaxVersion", severity: "critical", message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html", resolution: { type: "update-operator", description: "Update cluster-logging operator from v6.4.3 to v6.5.1+.", actionAvailable: true } },
            ],
          },
          { version: "5.1.8", recommended: false, risk: "Medium Risk", riskColor: "#c58c00", features: 3, bugFixes: 15, date: "Mar 8, 2026",
            operatorIssues: [
              { name: "ClusterLoggingMaxVersion", slug: "ClusterLoggingMaxVersion", severity: "critical", message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html", resolution: { type: "update-operator", description: "Update cluster-logging operator from v6.4.3 to v6.5.1+.", actionAvailable: true } },
              { name: "OLMIncompatible", slug: "OLMIncompatible", severity: "critical", message: "Incompatible operator-lifecycle-manager version detected. OLM 4.21.0 does not support 5.1 workload APIs. Update to 4.22.0 or higher.", url: "https://docs.openshift.com/container-platform/latest/operators/admin/olm-upgrading-operators.html", resolution: { type: "update-operator", description: "Update OLM from v4.21.0 to v4.22.0+.", actionAvailable: true } },
              { name: "CloudCredentialIAMUpdate", slug: "CloudCredentialIAMUpdate", severity: "warning", message: "cloudcredential.operator.openshift.io/cluster object needs updating before update. See Manually Creating IAM.", resolution: { type: "accept-only", description: "No automated fix. Manually update IAM configuration per documentation, then accept this risk." } },
            ],
          },
          { version: "5.1.7", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 1, bugFixes: 6, date: "Feb 28, 2026",
            operatorIssues: [
              { name: "ClusterLoggingMaxVersion", slug: "ClusterLoggingMaxVersion", severity: "critical", message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html", resolution: { type: "update-operator", description: "Update cluster-logging operator from v6.4.3 to v6.5.1+.", actionAvailable: true } },
            ],
          },
          { version: "5.1.6", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 2, bugFixes: 9, date: "Feb 18, 2026",
            operatorIssues: [
              { name: "ClusterLoggingMaxVersion", slug: "ClusterLoggingMaxVersion", severity: "critical", message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html", resolution: { type: "update-operator", description: "Update cluster-logging operator from v6.4.3 to v6.5.1+.", actionAvailable: true } },
            ],
          },
          { version: "5.1.5", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 1, bugFixes: 4, date: "Feb 8, 2026",
            operatorIssues: [
              { name: "ClusterLoggingMaxVersion", slug: "ClusterLoggingMaxVersion", severity: "critical", message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html", resolution: { type: "update-operator", description: "Update cluster-logging operator from v6.4.3 to v6.5.1+.", actionAvailable: true } },
            ],
          },
          { version: "5.1.4", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 5, date: "Jan 28, 2026",
            operatorIssues: [
              { name: "ClusterLoggingMaxVersion", slug: "ClusterLoggingMaxVersion", severity: "critical", message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html", resolution: { type: "update-operator", description: "Update cluster-logging operator from v6.4.3 to v6.5.1+.", actionAvailable: true } },
            ],
          },
          { version: "5.1.3", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 3, date: "Jan 18, 2026",
            operatorIssues: [
              { name: "ClusterLoggingMaxVersion", slug: "ClusterLoggingMaxVersion", severity: "critical", message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html", resolution: { type: "update-operator", description: "Update cluster-logging operator from v6.4.3 to v6.5.1+.", actionAvailable: true } },
            ],
          },
        ],
      },
      {
        label: "5.0",
        versions: [
          { version: "5.0.8", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 6, date: "Mar 18, 2026" },
          { version: "5.0.7", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 4, date: "Mar 10, 2026" },
          { version: "5.0.5", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 5, date: "Feb 14, 2026" },
          { version: "5.0.4", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 3, date: "Jan 28, 2026" },
          { version: "5.0.3", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 7, date: "Jan 14, 2026" },
          { version: "5.0.2", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 2, date: "Dec 20, 2025" },
          { version: "5.0.1", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 4, date: "Dec 5, 2025" },
        ],
      },
      {
        label: "4.18",
        versions: [
          { version: "4.18.12", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 3, date: "Nov 20, 2025" },
          { version: "4.18.10", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 5, date: "Nov 5, 2025" },
          { version: "4.18.8", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 4, date: "Oct 22, 2025" },
          { version: "4.18.6", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 6, date: "Oct 8, 2025" },
        ],
      },
    ],
  },
  "stable-5.1": {
    banner: { title: "OpenShift 5.1 is available!", description: "Stable channel releases are production-ready and fully tested.", link: "See what's new in 5.1" },
    groups: [
      { label: "5.1", versions: [
          { version: "5.1.9", recommended: true, risk: "Low Risk", riskColor: "#3e8635", features: 2, bugFixes: 8, date: "Mar 16, 2026", operatorIssues: [{ name: "cluster-logging", slug: "cluster-logging-6.4.3-max-ocp-5.0", severity: "critical" as const, message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html" }] },
          { version: "5.1.7", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 1, bugFixes: 10, date: "Feb 28, 2026", operatorIssues: [{ name: "cluster-logging", slug: "cluster-logging-6.4.3-max-ocp-5.0", severity: "critical" as const, message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html" }] },
        ] },
      { label: "5.0", versions: [
          { version: "5.0.8", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 6, date: "Mar 18, 2026" },
          { version: "5.0.6", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 3, date: "Feb 20, 2026" },
          { version: "5.0.4", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 3, date: "Jan 28, 2026" },
          { version: "5.0.2", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 2, date: "Dec 20, 2025" },
        ] },
      { label: "4.18", versions: [
          { version: "4.18.12", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 3, date: "Nov 20, 2025" },
          { version: "4.18.10", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 5, date: "Nov 5, 2025" },
          { version: "4.18.8", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 4, date: "Oct 22, 2025" },
        ] },
    ],
  },
  "candidate-5.1": {
    groups: [{ label: "5.1", versions: [
          { version: "5.1.11-rc.2", recommended: false, risk: "High Risk", riskColor: "#c9190b", features: 6, bugFixes: 3, date: "Mar 28, 2026", operatorIssues: [{ name: "cluster-logging", slug: "cluster-logging-6.4.3-max-ocp-5.0", severity: "critical" as const, message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html" }, { name: "operator-lifecycle-manager", slug: "olm-candidate-compat", severity: "warning" as const, message: "Candidate channel versions may have incompatible operator dependencies. Review release notes carefully.", url: "https://docs.openshift.com/container-platform/latest/updating/understanding_updates/understanding-update-channels-releases.html" }] },
          { version: "5.1.11-rc.1", recommended: false, risk: "High Risk", riskColor: "#c9190b", features: 5, bugFixes: 2, date: "Mar 25, 2026", operatorIssues: [{ name: "cluster-logging", slug: "cluster-logging-6.4.3-max-ocp-5.0", severity: "critical" as const, message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html" }] },
          { version: "5.1.10", recommended: true, risk: "Low Risk", riskColor: "#3e8635", features: 4, bugFixes: 12, date: "Mar 22, 2026", operatorIssues: [{ name: "cluster-logging", slug: "cluster-logging-6.4.3-max-ocp-5.0", severity: "critical" as const, message: "openshift-logging/cluster-logging v6.4.3 maximum supported OCP version is 5.0. Update to v6.5+ before updating.", url: "https://docs.openshift.com/container-platform/latest/logging/cluster-logging-upgrading.html" }] },
        ] }],
  },
  "eus-5.0": {
    groups: [{ label: "5.0 EUS", versions: [
          { version: "5.0.8", recommended: true, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 6, date: "Mar 18, 2026" },
          { version: "5.0.7", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 4, date: "Mar 10, 2026" },
          { version: "5.0.6", recommended: false, risk: "Low Risk", riskColor: "#3e8635", features: 0, bugFixes: 3, date: "Feb 20, 2026" },
        ] }],
  },
};

type InstalledOperator = {
  name: string;
  namespace: string;
  version: string;
  channel: string;
  source: string;
  status: "Running" | "Degraded" | "Pending";
  autoUpdate: boolean;
  clusterCompatibility: "Compatible" | "Incompatible" | "Unknown";
  compatibilityMessage?: string;
  support: "Full" | "Limited" | "Community" | "Self-support";
  supportEndDate?: string;
  supportBadge?: string;
  supportBadgeType?: "success" | "danger" | "warning";
  updateAvailable?: string;
  maxOcpVersion?: string;
  lastUpdated?: string;
  managedNamespaces?: string[];
  /** OLM v1 extension required before cluster update (matches Installed Operators catalog). */
  requiredBeforeClusterUpdate?: boolean;
};

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function getOperatorCompatibility(op: InstalledOperator, targetVersion: string): { compatibility: "Compatible" | "Incompatible" | "Unknown"; message?: string } {
  if (op.status === "Degraded") return { compatibility: "Unknown", message: op.compatibilityMessage || "Operator is degraded. Compatibility cannot be determined until the operator is healthy." };
  if (!op.maxOcpVersion) return { compatibility: "Compatible" };
  const targetMajorMinor = targetVersion.split(".").slice(0, 2).join(".");
  if (compareVersions(op.maxOcpVersion, targetMajorMinor) < 0) {
    return { compatibility: "Incompatible", message: `Max supported OCP version is ${op.maxOcpVersion}. ${op.updateAvailable ? `Update to v${op.updateAvailable}+ before updating cluster.` : "Update operator before updating cluster."}` };
  }
  return { compatibility: "Compatible" };
}

const installedOperators: InstalledOperator[] = [
  { name: "Cluster Logging", namespace: "openshift-logging", version: "6.5.1", channel: "stable-6.5", source: "redhat-operators", status: "Running", autoUpdate: false, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Nov 13, 2028", supportBadge: "2 years", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Jan 8, 2026, 3:12 PM", managedNamespaces: ["openshift-logging"] },
  { name: "Elasticsearch Operator", namespace: "openshift-operators-redhat", version: "5.8.0", channel: "stable-5.8", source: "redhat-operators", status: "Running", autoUpdate: false, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "May 10, 2028", supportBadge: "2 years, 1 month", supportBadgeType: "success", maxOcpVersion: "5.1", lastUpdated: "Feb 12, 2026, 4:32 AM", managedNamespaces: ["openshift-operators-redhat", "openshift-logging"] },
  { name: "Cloud Credential Operator", namespace: "openshift-cloud-credential-operator", version: "5.0.0", channel: "stable", source: "Built-in", status: "Running", autoUpdate: true, clusterCompatibility: "Compatible", compatibilityMessage: "IAM configuration may need updating before cluster update.", support: "Full", supportEndDate: "Jun 15, 2028", supportBadge: "2 years, 2 months", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 1, 2026, 3:48 AM", managedNamespaces: ["openshift-cloud-credential-operator"] },
  { name: "Operator Lifecycle Manager", namespace: "openshift-operator-lifecycle-manager", version: "4.22.0", channel: "stable", source: "Built-in", status: "Running", autoUpdate: false, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Mar 20, 2027", supportBadge: "11 months", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 1, 2026, 3:48 AM", managedNamespaces: ["openshift-operator-lifecycle-manager", "openshift-marketplace"] },
  { name: "Cert Manager", namespace: "cert-manager-operator", version: "1.14.0", channel: "stable-v1", source: "redhat-operators", status: "Running", autoUpdate: true, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Sep 1, 2027", supportBadge: "1 year, 5 months", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 18, 2026, 2:05 AM", managedNamespaces: ["cert-manager", "cert-manager-operator"] },
  { name: "OpenShift DNS", namespace: "openshift-dns-operator", version: "5.0.0", channel: "stable", source: "Built-in", status: "Running", autoUpdate: true, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Jun 15, 2028", supportBadge: "2 years, 2 months", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 1, 2026, 3:48 AM", managedNamespaces: ["openshift-dns", "openshift-dns-operator"] },
  { name: "Ingress Operator", namespace: "openshift-ingress-operator", version: "5.0.0", channel: "stable", source: "Built-in", status: "Running", autoUpdate: true, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Jun 15, 2028", supportBadge: "2 years, 2 months", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 1, 2026, 3:48 AM", managedNamespaces: ["openshift-ingress", "openshift-ingress-operator"] },
  { name: "Machine Config Operator", namespace: "openshift-machine-config-operator", version: "5.0.0", channel: "stable", source: "Built-in", status: "Running", autoUpdate: true, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Jun 15, 2028", supportBadge: "2 years, 2 months", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 1, 2026, 3:48 AM", managedNamespaces: ["openshift-machine-config-operator"] },
  { name: "Monitoring Stack", namespace: "openshift-monitoring", version: "5.0.0", channel: "stable", source: "Built-in", status: "Running", autoUpdate: true, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Jun 15, 2028", supportBadge: "2 years, 2 months", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 1, 2026, 3:48 AM", managedNamespaces: ["openshift-monitoring", "openshift-user-workload-monitoring"] },
  { name: "Service Mesh", namespace: "openshift-operators", version: "2.5.1", channel: "stable", source: "redhat-operators", status: "Degraded", autoUpdate: false, clusterCompatibility: "Unknown", compatibilityMessage: "Operator is degraded. Compatibility cannot be determined until the operator is healthy.", support: "Limited", supportEndDate: "Dec 1, 2026", supportBadge: "8 months", supportBadgeType: "warning", updateAvailable: "2.6.0", lastUpdated: "Nov 5, 2025, 10:22 AM", managedNamespaces: ["istio-system", "openshift-operators"] },
  { name: "Web Terminal", namespace: "openshift-operators", version: "1.9.0", channel: "fast", source: "redhat-operators", status: "Running", autoUpdate: true, clusterCompatibility: "Compatible", support: "Community", supportEndDate: "Apr 30, 2028", supportBadge: "2 years", supportBadgeType: "success", maxOcpVersion: "5.2", lastUpdated: "Mar 22, 2026, 6:00 AM", managedNamespaces: ["openshift-terminal"] },
  { name: "Kiali Operator", namespace: "openshift-operators", version: "1.73.0", channel: "stable", source: "redhat-operators", status: "Running", autoUpdate: false, clusterCompatibility: "Compatible", support: "Full", supportEndDate: "Jan 15, 2028", supportBadge: "1 year, 9 months", supportBadgeType: "success", updateAvailable: "1.76.0", maxOcpVersion: "5.1", lastUpdated: "Dec 20, 2025, 9:15 AM", managedNamespaces: ["kiali-operator", "istio-system"] },
];

type UpdateHistoryEntry = {
  version: string;
  status: "Completed" | "Failed" | "Rejected";
  method: "Manual" | "Agent";
  decision: "Approved" | "Auto-approved" | "Rejected" | "N/A";
  initiatedBy: string;
  startedAt: string;
  completedAt: string;
  duration: string;
  preCheck: { passed: number; failed: number; total: number };
  compatSummary?: string;
};

const updateHistory: UpdateHistoryEntry[] = [
  { version: "5.0.0", status: "Completed", method: "Agent", decision: "Approved", initiatedBy: "admin@example.com", startedAt: "Mar 1, 2026 02:00 UTC", completedAt: "Mar 1, 2026 03:48 UTC", duration: "1h 48m", preCheck: { passed: 6, failed: 0, total: 6 }, compatSummary: "All operators compatible. No API deprecations detected." },
  { version: "4.18.6", status: "Completed", method: "Agent", decision: "Auto-approved", initiatedBy: "cluster-update-agent", startedAt: "Feb 12, 2026 03:00 UTC", completedAt: "Feb 12, 2026 04:32 UTC", duration: "1h 32m", preCheck: { passed: 6, failed: 0, total: 6 }, compatSummary: "Z-stream update — all checks passed automatically." },
  { version: "4.18.4", status: "Completed", method: "Manual", decision: "N/A", initiatedBy: "admin@example.com", startedAt: "Jan 22, 2026 02:00 UTC", completedAt: "Jan 22, 2026 03:15 UTC", duration: "1h 15m", preCheck: { passed: 5, failed: 1, total: 6 }, compatSummary: "cluster-logging operator warning (non-blocking)." },
  { version: "4.18.2", status: "Completed", method: "Manual", decision: "N/A", initiatedBy: "devops-team@example.com", startedAt: "Dec 15, 2025 03:00 UTC", completedAt: "Dec 15, 2025 04:22 UTC", duration: "1h 22m", preCheck: { passed: 6, failed: 0, total: 6 } },
  { version: "4.17.9", status: "Failed", method: "Agent", decision: "Auto-approved", initiatedBy: "cluster-update-agent", startedAt: "Nov 28, 2025 02:00 UTC", completedAt: "Nov 28, 2025 02:45 UTC", duration: "45m", preCheck: { passed: 4, failed: 2, total: 6 }, compatSummary: "Operator compatibility check failed. Automatic rollback triggered." },
  { version: "4.17.8", status: "Rejected", method: "Agent", decision: "Rejected", initiatedBy: "admin@example.com", startedAt: "Nov 20, 2025 02:00 UTC", completedAt: "Nov 20, 2025 02:02 UTC", duration: "2m", preCheck: { passed: 3, failed: 3, total: 6 }, compatSummary: "Multiple operator incompatibilities. 2 deprecated APIs in use. Admin rejected update plan." },
];


export default function ClusterUpdatePlanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isGlass = usePatternFlyGlassActive();

  useEffect(() => {
    /** User chose another Cluster Update tab from the in-progress page — allow viewing those tabs instead of forcing redirect. */
    const tabFromNav = (location.state as { tab?: TabKey } | null)?.tab;
    if (tabFromNav === "active-update-plans" || tabFromNav === "update-history") {
      return;
    }
    const stored = localStorage.getItem("clusterUpdateInProgress");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        navigate("/administration/cluster-update/in-progress", { state: { version: data.version }, replace: true });
      } catch { /* ignore */ }
    }
  }, [navigate, location.state]);

  const [selectedChannel, setSelectedChannel] = useState("fast-5.1");
  const [activeTab, setActiveTab] = useState<TabKey>("update-plan");
  const [selectedVersion, setSelectedVersion] = useState<string>("5.1.10");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "5.1": true });
  
  const { demoVariant, clusterUpdateDemoResetEpoch } = useClusterUpdateDemoVariant();
  const [updateMode, setUpdateMode] = useState<"manual" | "agent">(
    () => (demoVariant === "agent-only" ? "agent" : "manual")
  );
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotContext, setChatbotContext] = useState("");

  const [operators, setOperators] = useState<InstalledOperator[]>(() => [...installedOperators]);
  const [agentTabResetKey, setAgentTabResetKey] = useState(0);
  const lastAppliedResetEpochRef = useRef(-1);

  useEffect(() => {
    if (clusterUpdateDemoResetEpoch < 1) return;
    if (lastAppliedResetEpochRef.current === clusterUpdateDemoResetEpoch) return;
    lastAppliedResetEpochRef.current = clusterUpdateDemoResetEpoch;

    setSelectedVersion("5.1.10");
    setSelectedChannel("fast-5.1");
    setOperators([...installedOperators]);
    setExpandedGroups({ "5.1": true });
    setActiveTab("update-plan");
    setAgentTabResetKey((k) => k + 1);
    setUpdateMode(demoVariant === "agent-only" ? "agent" : "manual");
  }, [clusterUpdateDemoResetEpoch, demoVariant]);

  useEffect(() => {
    if (location.state?.updatedOperator) {
      const { updatedOperator, newVersion } = location.state as { updatedOperator: string; newVersion: string };
      setOperators(prev => prev.map(op => {
        if (op.name === updatedOperator && op.updateAvailable) {
          const oldMajorMinor = op.version.split(".").slice(0, 2).join(".");
          const newMajorMinor = (newVersion || op.updateAvailable).split(".").slice(0, 2).join(".");
          const updatedChannel = op.channel.includes(oldMajorMinor)
            ? op.channel.replace(oldMajorMinor, newMajorMinor)
            : op.channel;
          return {
            ...op,
            version: newVersion || op.updateAvailable,
            channel: updatedChannel,
            updateAvailable: undefined,
            maxOcpVersion: "5.2",
          };
        }
        return op;
      }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const tab = (location.state as { tab?: TabKey } | null)?.tab;
    if (tab === "update-plan" || tab === "update-history" || tab === "active-update-plans") {
      setActiveTab(tab);
    }
  }, [location.state]);

  const channelData = channelVersions[selectedChannel] ?? channelVersions["fast-5.1"];

  const handleChannelChange = (channel: string) => {
    setSelectedChannel(channel);
    const data = channelVersions[channel];
    if (data) {
      const firstGroup = data.groups[0];
      const newExpanded: Record<string, boolean> = {};
      for (const g of data.groups) {
        newExpanded[g.label] = !!firstGroup && g.label === firstGroup.label;
      }
      if (firstGroup) {
        const rec = firstGroup.versions.find((v) => v.recommended);
        setSelectedVersion(rec ? rec.version : firstGroup.versions[0]?.version ?? "");
      }
      setExpandedGroups(newExpanded);
    }
  };

  useEffect(() => {
    setUpdateMode(demoVariant === "agent-only" ? "agent" : "manual");
  }, [demoVariant]);

  const openChatbot = useCallback((context: string) => {
    setChatbotContext(context);
    setChatbotOpen(true);
  }, []);


  const handleChatAction = useCallback((actionId: string) => {
    switch (actionId) {
      case "view-history":
        setActiveTab("update-history");
        break;
      case "view-plan":
        setActiveTab("update-plan");
        break;
      default:
        break;
    }
  }, []);

  return (
    <div className="flex h-full relative min-w-0">
      <OlsChatbot
        isOpen={chatbotOpen}
        context={chatbotContext}
        selectedVersion={selectedVersion}
        selectedChannel={selectedChannel}
        onClose={() => setChatbotOpen(false)}
        onAction={handleChatAction}
      >
      <div className="ocs-app-page-outer flex-1 min-w-0 min-h-0 overflow-y-auto">
      <Breadcrumbs items={[
        { label: "Administration", path: "/administration/cluster-update" },
        { label: "Cluster Update" },
      ]}>
      <Content className="mb-6">
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          justifyContent={{ default: "justifyContentSpaceBetween" }}
        >
          <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }}>
            <h1 id="main-title">Cluster Update</h1>
            <Label color="orange" isCompact>
              Tech preview
            </Label>
          </Flex>
          <FavoriteButton name="Cluster Update" path="/administration/cluster-update" />
        </Flex>
        <p>
          Review available versions, assess operator compatibility, and plan your update to newer OpenShift
          releases. Use <strong>Updates plan</strong> to prepare or start an update and{" "}
          <strong>Active update plans</strong> for in-flight work.
        </p>
      </Content>

      <Tabs
        id="cluster-update-page-tabs"
        aria-label="Cluster update"
        activeKey={activeTab}
        onSelect={(_event, eventKey) => {
          if (eventKey === "update-plan" || eventKey === "active-update-plans" || eventKey === "update-history") {
            setActiveTab(eventKey);
          }
        }}
      >
        <Tab eventKey="update-plan" title={<TabTitleText>Updates plan</TabTitleText>}>
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <UpdatesPlanAnalysisCard
            onUpdate={(version) => {
              navigate("/administration/cluster-update/in-progress", { state: { version } });
            }}
          />
          {/* Update Method — hidden in agent-only demo variant */}
          {demoVariant === "manual-and-agent" && (
            <Card
              component="div"
              isGlass={isGlass}
              style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
            >
              <CardHeader>
                <Title headingLevel="h2" size="xl">
                  Update Method
                </Title>
              </CardHeader>
              <CardBody>
                <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                  <Content component="p">Choose how cluster updates are managed.</Content>
                  <FormGroup
                    fieldId="cluster-update-method"
                    role="radiogroup"
                    aria-label="Cluster update method"
                  >
                    <Grid hasGutter>
                      <GridItem span={12} md={6}>
                        <Card
                          id="cluster-update-card-manual"
                          isCompact
                          isFullHeight
                          isSelectable
                          isSelected={updateMode === "manual"}
                        >
                          <CardHeader
                            selectableActions={{
                              variant: "single",
                              name: "cluster-update-method",
                              selectableActionId: "cluster-update-method-manual",
                              selectableActionAriaLabel: "Manual update method",
                              onChange: (_event, checked) => {
                                if (checked) setUpdateMode("manual");
                              },
                            }}
                          >
                            <CardTitle>
                              <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                                <Icon size="lg" iconSize="lg">
                                  <Settings aria-hidden />
                                </Icon>
                                <Title headingLevel="h4" size="md">
                                  Manual updates
                                </Title>
                              </Flex>
                            </CardTitle>
                          </CardHeader>
                          <CardBody>
                            <Content component="p">
                              Review available updates, assess risks, and initiate updates yourself. Full control over timing and
                              version selection.
                            </Content>
                          </CardBody>
                        </Card>
                      </GridItem>
                      <GridItem span={12} md={6}>
                        <Card
                          id="cluster-update-card-agent"
                          isCompact
                          isFullHeight
                          isSelectable
                          isSelected={updateMode === "agent"}
                        >
                          <CardHeader
                            selectableActions={{
                              variant: "single",
                              name: "cluster-update-method",
                              selectableActionId: "cluster-update-method-agent",
                              selectableActionAriaLabel: "Agent-based update method",
                              onChange: (_event, checked) => {
                                if (checked) setUpdateMode("agent");
                              },
                            }}
                          >
                            <CardTitle>
                              <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                                <AiExperienceIcon aria-hidden className="ocs-cluster-update-method-agent-icon" />
                                <Title headingLevel="h4" size="md">
                                  Agent-based updates
                                </Title>
                              </Flex>
                            </CardTitle>
                          </CardHeader>
                          <CardBody>
                            <Content component="p">
                              An AI agent handles pre-flight checks, scheduling, coordinated platform and catalog operator updates,
                              and rollback automatically. Pre-checks and status span both layers holistically. You approve plans
                              before execution.
                            </Content>
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                  </FormGroup>
                </Flex>
              </CardBody>
            </Card>
          )}

          {demoVariant === "manual-and-agent" && updateMode === "manual" ? (
            <>
              <AiAssessmentSection
                openChatbot={openChatbot}
                selectedVersion={selectedVersion}
                clusterUpdateDemoVariant={demoVariant}
              />

              <AvailableUpdatesSection
                channelData={channelData}
                expandedGroups={expandedGroups}
                setExpandedGroups={setExpandedGroups}
                selectedVersion={selectedVersion}
                setSelectedVersion={setSelectedVersion}
                navigate={navigate}
                setActiveTab={setActiveTab}
                openChatbot={openChatbot}
                selectedChannel={selectedChannel}
                handleChannelChange={handleChannelChange}
              />

              <InstalledOperatorsSection selectedVersion={selectedVersion} operators={operators} navigate={navigate} />

              <WorkerNodesSection targetClusterVersion={selectedVersion} />
            </>
          ) : (
            <UpdateAgentTab
              key={agentTabResetKey}
              openChatbot={openChatbot}
              selectedVersion={selectedVersion}
              onSelectedVersionChange={setSelectedVersion}
              selectedChannel={selectedChannel}
              channelGroups={channelData.groups}
            />
          )}
          </Flex>
        </Tab>

        <Tab eventKey="active-update-plans" title={<TabTitleText>Active update plans</TabTitleText>}>
          <ActiveUpdatePlansTab />
        </Tab>

        <Tab eventKey="update-history" title={<TabTitleText>Update history</TabTitleText>}>
          <UpdateHistoryTab />
        </Tab>
      </Tabs>
      </Breadcrumbs>

      </div>
      </OlsChatbot>

    </div>
  );
}

/* ─── Toggle Switch ─── */
function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={onChange} disabled={disabled}
      className={`relative w-[36px] h-[20px] rounded-full border-0 cursor-pointer transition-colors shrink-0 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${enabled ? "bg-[#0066cc]" : "bg-[#8a8d90]"}`}>
      <div className={`absolute top-[2px] size-[16px] rounded-full bg-white transition-transform ${enabled ? "left-[18px]" : "left-[2px]"}`} />
    </button>
  );
}

/* ─── Agent Mode Panel ─── */
function AgentModePanel({ openChatbot, setActiveTab, navigate }: { openChatbot: (ctx: string) => void; setActiveTab: (tab: TabKey) => void; navigate: ReturnType<typeof useNavigate> }) {
  const [agentStatus, setAgentStatus] = useState<"idle" | "active" | "paused" | "updating" | "completed" | "failed" | "rolling-back">("idle");
  const [configTab, setConfigTab] = useState<"actions" | "compliance" | "scheduling" | "notifications">("actions");

  const [autoPreCheck, setAutoPreCheck] = useState(true);
  const [autoRollback, setAutoRollback] = useState(true);
  const [autoOperatorUpdate, setAutoOperatorUpdate] = useState(false);
  const [autoRiskMitigation, setAutoRiskMitigation] = useState(true);

  const [windowDay, setWindowDay] = useState("weekdays");
  const [windowStart, setWindowStart] = useState("02:00");
  const [windowEnd, setWindowEnd] = useState("05:00");
  const [windowTz, setWindowTz] = useState("UTC");
  const [minNodesUp, setMinNodesUp] = useState("2");
  const [maxUnavailablePercent, setMaxUnavailablePercent] = useState("10");
  const [requireApproval, setRequireApproval] = useState(true);

  const [scheduleMode, setScheduleMode] = useState<"optimal" | "fixed" | "custom">("optimal");
  const [fixedDate, setFixedDate] = useState("2026-04-02");
  const [fixedTime, setFixedTime] = useState("02:00");

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySlack, setNotifySlack] = useState(false);
  const [notifyOnPlan, setNotifyOnPlan] = useState(true);
  const [notifyOnStart, setNotifyOnStart] = useState(true);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);

  const [planDecision, setPlanDecision] = useState<"pending" | "approved" | "rejected" | null>("pending");
  const [showRiskAcceptModal, setShowRiskAcceptModal] = useState(false);
  const [acceptedSlugs, setAcceptedSlugs] = useState<Set<string>>(new Set());
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [showRollbackModal, setShowRollbackModal] = useState(false);

  const updateNodes = [
    { name: "master-0", role: "control-plane", status: "done" as const },
    { name: "master-1", role: "control-plane", status: "done" as const },
    { name: "master-2", role: "control-plane", status: "in-progress" as const },
    { name: "worker-0", role: "worker", status: "pending" as const },
    { name: "worker-1", role: "worker", status: "pending" as const },
    { name: "worker-2", role: "worker", status: "pending" as const },
  ];

  const updateOperators = [
    { name: "Cluster Logging", from: "6.4.3", to: "6.5.1", status: "done" as const },
    { name: "Elasticsearch Operator", from: "5.7.2", to: "5.8.0", status: "in-progress" as const },
    { name: "Operator Lifecycle Manager", from: "4.21.0", to: "4.22.0", status: "pending" as const },
  ];

  const postUpdateChecks = [
    { label: "API server responding", status: "pass" as const },
    { label: "All nodes Ready", status: "pass" as const },
    { label: "Cluster operators available", status: "pass" as const },
    { label: "No degraded operators", status: "pass" as const },
    { label: "Ingress healthy", status: "pass" as const },
    { label: "Workloads stable", status: "pass" as const },
  ];

  useEffect(() => {
    if (agentStatus === "updating" || agentStatus === "rolling-back") {
      const timer = setInterval(() => {
        setUpdateProgress((prev) => {
          if (prev >= 100) { clearInterval(timer); return 100; }
          return prev + 1;
        });
      }, 300);
      return () => clearInterval(timer);
    }
  }, [agentStatus]);

  const startUpdate = () => {
    localStorage.setItem("clusterUpdateInProgress", JSON.stringify({ version: "5.1.10", startedAt: Date.now() }));
    navigate("/administration/cluster-update/in-progress", { state: { version: "5.1.10" } });
  };

  const simulateComplete = () => {
    setAgentStatus("completed");
    openChatbot("update-completed");
  };

  const simulateFailure = () => {
    setAgentStatus("failed");
    openChatbot("update-failed");
  };

  const startRollback = () => {
    setShowRollbackModal(false);
    setAgentStatus("rolling-back");
    setUpdateProgress(0);
    openChatbot("update-rollback");
  };

  const agentPreChecks = [
    { label: "Cluster Health", status: "pass" as const, detail: "All cluster components reporting healthy" },
    { label: "Node Status", status: "pass" as const, detail: "6/6 nodes Ready, schedulable" },
    { label: "Storage Health", status: "pass" as const, detail: "85% capacity available, all PVs bound" },
    { label: "Network Health", status: "pass" as const, detail: "SDN/OVN connectivity verified, no packet loss" },
    { label: "Certificate Validity", status: "pass" as const, detail: "All certificates valid for >90 days" },
    { label: "etcd Health", status: "pass" as const, detail: "Quorum established, all members healthy" },
  ];

  const compatAnalysis = {
    operators: [
      { name: "Cluster Logging", category: "Platform" as const, slug: null, currentVersion: "6.5.1", status: "compatible" as const, maxOCP: "5.2", action: null, docUrl: null },
      { name: "Elasticsearch Operator", category: "Catalog" as const, slug: null, currentVersion: "5.8.0", status: "compatible" as const, maxOCP: "5.1", action: null, docUrl: null },
      { name: "Cert Manager", category: "Catalog" as const, slug: null, currentVersion: "1.14.0", status: "compatible" as const, maxOCP: "5.2", action: null, docUrl: null },
      { name: "Ansible Automation Platform", category: "Catalog" as const, slug: null, currentVersion: "3.1.0", status: "compatible" as const, maxOCP: "5.1", action: null, docUrl: null },
      { name: "Operator Lifecycle Manager", category: "Platform" as const, slug: null, currentVersion: "4.22.0", status: "compatible" as const, maxOCP: "5.2", action: null, docUrl: null },
    ],
    apiDeprecations: [] as { api: string; replacement: string; severity: "warning"; docUrl: string }[],
    crIncompatibilities: [] as { resource: string; detail: string }[],
  };

  const scheduledExecution = {
    optimalWindow: "Wed Apr 2, 2026 02:00–05:00 UTC",
    estimatedDuration: "1h 45m",
    riskLevel: "Low" as const,
    rollbackStrategy: autoRollback ? "Automatic — revert within 30 minutes if health checks fail" : "Manual — operator must initiate rollback",
  };

  const configTabs = [
    { key: "actions" as const, label: "Automatic actions", icon: Zap },
    { key: "compliance" as const, label: "Compliance & policy", icon: Shield },
    { key: "scheduling" as const, label: "Scheduling", icon: Calendar },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  const incompatibleOps = compatAnalysis.operators.filter(o => o.status === "incompatible");
  const warningOps = compatAnalysis.operators.filter(o => o.status === "warning");

  return (
    <div className="space-y-[16px] mb-[16px]">
      {/* Agent Status Bar */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[20px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <div className={`size-[10px] rounded-full ${
              agentStatus === "active" || agentStatus === "updating" ? "bg-[#3e8635] animate-pulse" :
              agentStatus === "paused" ? "bg-[#c58c00]" :
              agentStatus === "completed" ? "bg-[#3e8635]" :
              agentStatus === "failed" ? "bg-[#c9190b]" :
              agentStatus === "rolling-back" ? "bg-[#c58c00] animate-pulse" :
              "bg-[#8a8d90]"
            }`} />
            <AiExperienceIcon className="size-[20px] text-[#151515] dark:text-[#e8e8e8]" aria-hidden />
            <span className="text-[15px] font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white">
              {agentStatus === "active" ? "Update Agent Active" :
               agentStatus === "paused" ? "Update Agent Paused" :
               agentStatus === "updating" ? "Updating Cluster" :
               agentStatus === "completed" ? "Update Complete" :
               agentStatus === "failed" ? "Update Failed" :
               agentStatus === "rolling-back" ? "Rolling Back" :
               "Update Agent Ready"}
            </span>
            {(agentStatus === "active" || agentStatus === "updating") && (
              <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">
                Target: <span className="font-['Red_Hat_Mono:Regular',sans-serif] text-[#151515] dark:text-white">5.1.10</span>
                {agentStatus === "updating" && <> &middot; <span className="font-['Red_Hat_Mono:Regular',sans-serif] text-[#151515] dark:text-white">{updateProgress}%</span></>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-[8px]">
            {agentStatus === "idle" && (
              <>
                <button onClick={() => openChatbot("agent-precheck")}
                  className="flex items-center gap-[6px] bg-transparent text-[#0066cc] dark:text-[#4dabf7] text-[13px] px-[12px] py-[6px] rounded-[999px] border border-[#0066cc] dark:border-[#4dabf7] cursor-pointer hover:bg-[#0066cc]/5 transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                  Update pre-check with AI <Sparkles className="size-[13px]" />
                </button>
                <button onClick={() => { setAgentStatus("active"); openChatbot("agent-start"); }} className="flex items-center gap-[6px] bg-[#0066cc] hover:bg-[#004080] text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                  Start update with AI <Sparkles className="size-[13px]" />
                </button>
              </>
            )}
            {agentStatus === "active" && (
              <>
                <button onClick={() => setShowPauseModal(true)} className="flex items-center gap-[6px] bg-transparent text-[#151515] dark:text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                  <Pause className="size-[13px]" /> Pause agent
                </button>
                <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-[6px] bg-transparent text-[#151515] dark:text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                  Cancel update
                </button>
              </>
            )}
            {agentStatus === "paused" && (
              <>
                <button onClick={() => { setAgentStatus("active"); openChatbot("agent-resumed"); }} className="flex items-center gap-[6px] bg-[#0066cc] hover:bg-[#004080] text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                  <Play className="size-[13px]" /> Resume agent
                </button>
                <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-[6px] bg-transparent text-[#151515] dark:text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                  Cancel update
                </button>
              </>
            )}
            {agentStatus === "updating" && (
              <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] flex items-center gap-[6px]">
                <Loader2 className="size-[14px] animate-spin text-[#0066cc]" /> Update in progress&hellip;
              </span>
            )}
            {agentStatus === "completed" && (
              <button onClick={() => { setAgentStatus("idle"); setPlanDecision("pending"); }} className="flex items-center gap-[6px] bg-[#0066cc] hover:bg-[#004080] text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Done
              </button>
            )}
            {agentStatus === "failed" && (
              <>
                <button onClick={() => setShowRollbackModal(true)} className="flex items-center gap-[6px] bg-transparent text-[#151515] dark:text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                  <RotateCcw className="size-[13px]" /> Rollback
                </button>
                <button onClick={() => { setAgentStatus("updating"); setUpdateProgress(0); openChatbot("update-retry"); }} className="flex items-center gap-[6px] bg-[#0066cc] hover:bg-[#004080] text-white text-[13px] px-[14px] py-[6px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                  <RefreshCw className="size-[13px]" /> Retry update
                </button>
              </>
            )}
            {agentStatus === "rolling-back" && (
              <span className="text-[12px] text-[#c58c00] font-['Red_Hat_Text:Regular',sans-serif] flex items-center gap-[6px]">
                <Loader2 className="size-[14px] animate-spin" /> Rolling back to 5.0.0&hellip;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Agent Configuration — Tabbed */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px] mb-[16px]">
        <div className="flex items-center justify-between mb-[4px]">
          <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px]">Agent Configuration</h2>
          <button onClick={() => openChatbot("agent-config")}
            className="flex items-center gap-[6px] bg-transparent text-[#0066cc] dark:text-[#4dabf7] text-[12px] px-[10px] py-[5px] rounded-[999px] border border-[#0066cc] dark:border-[#4dabf7] cursor-pointer hover:bg-[#0066cc]/5 transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
            AI setup assistant <Sparkles className="size-[12px]" />
          </button>
        </div>

        <div className="flex border-b border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] mb-[16px]">
          {configTabs.map((t) => (
            <button key={t.key} onClick={() => setConfigTab(t.key)}
              className={`flex items-center gap-[6px] px-[16px] py-[10px] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] border-0 bg-transparent cursor-pointer transition-colors relative ${configTab === t.key ? "text-[#151515] dark:text-white font-medium" : "text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"}`}>
              <t.icon className="size-[14px]" />
              {t.label}
              {configTab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0066cc] dark:bg-[#4dabf7]" />}
            </button>
          ))}
        </div>

        <div>
          {/* Automatic Actions */}
          {configTab === "actions" && (
            <div className="space-y-[12px]">
              <div className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[16px] py-[12px]">
                <div>
                  <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium">Automatic pre-checks</p>
                  <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Run all health and compatibility checks before each update attempt</p>
                </div>
                <Toggle enabled={autoPreCheck} onChange={() => setAutoPreCheck(!autoPreCheck)} />
              </div>
              <div className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[16px] py-[12px]">
                <div>
                  <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium">Automatic rollback on failure</p>
                  <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Revert to previous version if health checks fail within 30 minutes of update completion</p>
                </div>
                <Toggle enabled={autoRollback} onChange={() => setAutoRollback(!autoRollback)} />
              </div>
              <div className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[16px] py-[12px]">
                <div>
                  <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium">Automatic risk mitigation</p>
                  <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Agent attempts to resolve known risks (e.g., drain failing nodes) before proceeding</p>
                </div>
                <Toggle enabled={autoRiskMitigation} onChange={() => setAutoRiskMitigation(!autoRiskMitigation)} />
              </div>
              <div className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[16px] py-[12px]">
                <div>
                  <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium">Automatic operator updates</p>
                  <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Update dependent operators to compatible versions before cluster update</p>
                </div>
                <Toggle enabled={autoOperatorUpdate} onChange={() => setAutoOperatorUpdate(!autoOperatorUpdate)} />
              </div>
            </div>
          )}

          {/* Compliance & Policy */}
          {configTab === "compliance" && (
            <div className="space-y-[16px]">
              <div>
                <h3 className="text-[14px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[12px]">Optimal Update Window</h3>
                <div className="grid grid-cols-4 gap-[12px]">
                  <div>
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Days</label>
                    <select value={windowDay} onChange={(e) => setWindowDay(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[7px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] cursor-pointer">
                      <option value="weekdays">Weekdays</option>
                      <option value="weekends">Weekends</option>
                      <option value="any">Any day</option>
                      <option value="tue-thu">Tue–Thu</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Start time</label>
                    <input type="time" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[7px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]" />
                  </div>
                  <div>
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">End time</label>
                    <input type="time" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[7px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]" />
                  </div>
                  <div>
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Timezone</label>
                    <select value={windowTz} onChange={(e) => setWindowTz(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[7px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] cursor-pointer">
                      <option value="UTC">UTC</option>
                      <option value="US/Eastern">US/Eastern</option>
                      <option value="US/Pacific">US/Pacific</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[16px]">
                <h3 className="text-[14px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[12px]">Compliance Rules</h3>
                <div className="grid grid-cols-2 gap-[12px]">
                  <div className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Minimum nodes available during z-stream updates</label>
                    <select value={minNodesUp} onChange={(e) => setMinNodesUp(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[6px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] cursor-pointer">
                      <option value="1">At least 1 node</option>
                      <option value="2">At least 2 nodes</option>
                      <option value="3">At least 3 nodes</option>
                      <option value="50%">At least 50% of nodes</option>
                    </select>
                  </div>
                  <div className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Max unavailable nodes (percentage)</label>
                    <select value={maxUnavailablePercent} onChange={(e) => setMaxUnavailablePercent(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[6px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] cursor-pointer">
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                      <option value="25">25%</option>
                      <option value="33">33%</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px] mt-[12px]">
                  <div>
                    <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium">Require explicit approval for minor version updates</p>
                    <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Z-stream updates may auto-approve if all checks pass; minor updates always require admin approval</p>
                  </div>
                  <Toggle enabled={requireApproval} onChange={() => setRequireApproval(!requireApproval)} />
                </div>
              </div>
            </div>
          )}

          {/* Scheduling */}
          {configTab === "scheduling" && (
            <div className="space-y-[16px]">
              <div className="space-y-[8px]">
                {(["optimal", "fixed", "custom"] as const).map((mode) => (
                  <button key={mode} onClick={() => setScheduleMode(mode)}
                    className={`flex items-start gap-[12px] w-full text-left rounded-[8px] p-[14px] border transition-colors cursor-pointer bg-transparent ${scheduleMode === mode ? "border-[#0066cc] dark:border-[#4dabf7] bg-[#e7f1fa]/30 dark:bg-[rgba(43,154,243,0.04)]" : "border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] hover:border-[#8a8d90]"}`}>
                    <div className={`mt-[2px] size-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${scheduleMode === mode ? "border-[#0066cc] dark:border-[#4dabf7]" : "border-[#8a8d90]"}`}>
                      {scheduleMode === mode && <div className="size-[10px] rounded-full bg-[#0066cc] dark:bg-[#4dabf7]" />}
                    </div>
                    <div>
                      <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                        {mode === "optimal" ? "AI-recommended optimal window" : mode === "fixed" ? "Fixed schedule" : "Custom time slot"}
                      </p>
                      <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mt-[2px]">
                        {mode === "optimal" ? "Agent analyzes workload patterns, traffic, and resource utilization to select the lowest-impact window" : mode === "fixed" ? "Specify an exact date and time for the next update" : "Define recurring time slots and let the agent pick within them"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {scheduleMode === "fixed" && (
                <div className="grid grid-cols-2 gap-[12px] mt-[8px]">
                  <div>
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Date</label>
                    <input type="date" value={fixedDate} onChange={(e) => setFixedDate(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[7px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]" />
                  </div>
                  <div>
                    <label className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Time ({windowTz})</label>
                    <input type="time" value={fixedTime} onChange={(e) => setFixedTime(e.target.value)} className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[7px] text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {configTab === "notifications" && (
            <div className="space-y-[16px]">
              <div>
                <h3 className="text-[14px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[10px]">Notification Channels</h3>
                <div className="grid grid-cols-2 gap-[12px]">
                  <div className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                    <span className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">Email notifications</span>
                    <Toggle enabled={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
                  </div>
                  <div className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                    <span className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">Slack / Webhook</span>
                    <Toggle enabled={notifySlack} onChange={() => setNotifySlack(!notifySlack)} />
                  </div>
                </div>
              </div>
              <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[16px]">
                <h3 className="text-[14px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[10px]">Alert Events</h3>
                <div className="grid grid-cols-2 gap-[8px]">
                  {[
                    { label: "Update plan generated", state: notifyOnPlan, toggle: () => setNotifyOnPlan(!notifyOnPlan) },
                    { label: "Update started", state: notifyOnStart, toggle: () => setNotifyOnStart(!notifyOnStart) },
                    { label: "Update completed", state: notifyOnComplete, toggle: () => setNotifyOnComplete(!notifyOnComplete) },
                    { label: "Update failed / rollback triggered", state: notifyOnFailure, toggle: () => setNotifyOnFailure(!notifyOnFailure) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                      <span className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">{item.label}</span>
                      <Toggle enabled={item.state} onChange={item.toggle} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Proposed Update Plan */}
      {(agentStatus === "active" || agentStatus === "paused") && (
        <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px] mb-[16px]">
          <div className="flex items-center justify-between mb-[4px]">
            <div className="flex items-center gap-[10px]">
              <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px]">Agent&apos;s Proposed Update Plan</h2>
              {planDecision === "pending" && <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-[#e7f1fa] text-[#0066cc] font-semibold font-['Red_Hat_Text:Regular',sans-serif]">Pending approval</span>}
              {planDecision === "approved" && <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-[rgba(62,134,53,0.1)] text-[#3e8635] font-semibold font-['Red_Hat_Text:Regular',sans-serif]">Approved</span>}
              {planDecision === "rejected" && <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-[rgba(201,25,11,0.1)] text-[#c9190b] font-semibold font-['Red_Hat_Text:Regular',sans-serif]">Rejected</span>}
            </div>
            <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Generated Mar 30, 2026 02:15 UTC</span>
          </div>
          <AiGeneratedPlanMarker className="mb-[16px]" />

          <div className="space-y-[20px]">
            {/* Pre-Checks Module */}
            <div>
              <div className="flex items-center gap-[8px] mb-[12px]">
                <Shield className="size-[16px] text-[#3e8635]" />
                <h3 className="text-[15px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">Pre-Checks</h3>
                <span className="text-[12px] text-[#3e8635] font-semibold px-[8px] py-[1px] rounded-full bg-[rgba(62,134,53,0.1)] font-['Red_Hat_Text:Regular',sans-serif]">
                  {agentPreChecks.filter(c => c.status === "pass").length}/{agentPreChecks.length} passed
                </span>
              </div>
              <div className="grid grid-cols-3 gap-[8px]">
                {agentPreChecks.map((check) => (
                  <div key={check.label} className="flex items-start gap-[8px] bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[12px] py-[10px]">
                    <CheckCircle className="size-[14px] text-[#3e8635] shrink-0 mt-[1px]" />
                    <div>
                      <p className="text-[13px] text-[#151515] dark:text-white font-medium font-['Red_Hat_Text:Regular',sans-serif]">{check.label}</p>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mt-[2px]">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compatibility Analysis Module */}
            <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[20px]">
              <div className="flex items-center justify-between mb-[12px]">
                <div className="flex items-center gap-[8px]">
                  <Eye className="size-[16px] text-[#c58c00]" />
                  <h3 className="text-[15px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">Compatibility Analysis</h3>
                  {incompatibleOps.length > 0 && (
                    <span className="text-[12px] text-[#c9190b] font-semibold px-[8px] py-[1px] rounded-full bg-[rgba(201,25,11,0.1)] font-['Red_Hat_Text:Regular',sans-serif]">
                      {incompatibleOps.length} issue{incompatibleOps.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button onClick={() => openChatbot("compatibility-analysis")}
                  className="flex items-center gap-[6px] bg-transparent text-[#0066cc] dark:text-[#4dabf7] text-[12px] px-[10px] py-[5px] rounded-[999px] border border-[#0066cc] dark:border-[#4dabf7] cursor-pointer hover:bg-[#0066cc]/5 transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                  AI compatibility check <Sparkles className="size-[12px]" />
                </button>
              </div>

              {/* Operator Compatibility — table chrome aligned with Update history tab */}
              <div className="mb-[12px]">
                <p className="text-[12px] text-[#6a6e73] dark:text-[#8a8d90] font-['Red_Hat_Text:Regular',sans-serif] mb-[8px] font-medium">Operator compatibility status</p>
                <div className="border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] rounded-[8px] overflow-hidden">
                  <div className="grid grid-cols-[1fr_65px_80px_60px_80px_1fr_100px] gap-[8px] px-[16px] py-[10px] text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] border-b border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)]">
                    <span>Operator</span><span>Type</span><span>Version</span><span>Max OCP</span><span>Status</span><span>Required action</span><span>Resolution</span>
                  </div>
                  {compatAnalysis.operators.map((op) => (
                    <div key={op.name} className={`grid grid-cols-[1fr_65px_80px_60px_80px_1fr_100px] gap-[8px] items-center px-[16px] py-[12px] border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] last:border-0 transition-colors hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] ${op.status === "incompatible" ? "bg-[rgba(201,25,11,0.02)]" : ""}`}>
                      <span className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">{op.name}</span>
                      <span className={`text-[10px] px-[4px] py-[1px] rounded-[3px] font-semibold w-fit font-['Red_Hat_Text:Regular',sans-serif] ${op.category === "Platform" ? "bg-[rgba(94,64,190,0.1)] text-[#5e40be]" : "bg-[rgba(0,102,204,0.1)] text-[#0066cc]"}`}>
                        {op.category}
                      </span>
                      <span className="text-[12px] font-['Red_Hat_Mono:Regular',sans-serif] text-[#151515] dark:text-white">{op.currentVersion}</span>
                      <span className="text-[12px] font-['Red_Hat_Mono:Regular',sans-serif] text-[#4d4d4d] dark:text-[#b0b0b0]">{op.maxOCP}</span>
                      <span>
                        {op.status === "compatible" && <span className="flex items-center gap-[3px] text-[11px] text-[#3e8635] font-semibold"><CheckCircle className="size-[10px]" /> OK</span>}
                        {op.status === "incompatible" && <span className="flex items-center gap-[3px] text-[11px] text-[#c9190b] font-semibold"><AlertCircle className="size-[10px]" /> Blocked</span>}
                        {op.status === "warning" && <span className="flex items-center gap-[3px] text-[11px] text-[#c58c00] font-semibold"><AlertTriangle className="size-[10px]" /> Warn</span>}
                      </span>
                      <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">{op.action ?? "—"}</span>
                      <span>
                        {op.action ? (
                          <div className="flex items-center gap-[6px]">
                            {op.docUrl && (
                              <a href={op.docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-[4px] text-[#0066cc] dark:text-[#4dabf7] text-[11px] no-underline hover:underline font-['Red_Hat_Text:Regular',sans-serif]">
                                View docs <ExternalLink className="size-[11px]" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#3e8635]">No action needed</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Deprecations */}
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[8px] font-semibold uppercase tracking-wide">API Deprecations</p>
                  {compatAnalysis.apiDeprecations.length > 0 ? (
                    <div className="space-y-[6px]">
                      {compatAnalysis.apiDeprecations.map((dep, i) => (
                        <div key={i} className="bg-[#fdf7e7] dark:bg-[rgba(197,140,0,0.06)] rounded-[999px] px-[12px] py-[8px] border border-[#c58c00]/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-[6px]">
                              <AlertTriangle className="size-[12px] text-[#c58c00] shrink-0" />
                              <span className="text-[12px] font-['Red_Hat_Mono:Regular',sans-serif] text-[#151515] dark:text-white">{dep.api}</span>
                            </div>
                            {dep.docUrl && (
                              <a href={dep.docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-[3px] text-[#0066cc] dark:text-[#4dabf7] text-[10px] no-underline hover:underline font-['Red_Hat_Text:Regular',sans-serif]">
                                How to fix <ExternalLink className="size-[9px]" />
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mt-[4px] ml-[18px]">
                            Replace with <span className="font-['Red_Hat_Mono:Regular',sans-serif] text-[#151515] dark:text-white">{dep.replacement}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-[6px] text-[12px] text-[#3e8635] font-['Red_Hat_Text:Regular',sans-serif]">
                      <CheckCircle className="size-[12px]" /> No deprecated APIs detected
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[8px] font-semibold uppercase tracking-wide">Custom Resource Incompatibilities</p>
                  {compatAnalysis.crIncompatibilities.length > 0 ? (
                    <div className="space-y-[6px]">
                      {compatAnalysis.crIncompatibilities.map((cr, i) => (
                        <div key={i} className="bg-[rgba(201,25,11,0.04)] rounded-[999px] px-[12px] py-[8px] border border-[#c9190b]/20">
                          <span className="text-[12px] font-['Red_Hat_Mono:Regular',sans-serif] text-[#c9190b]">{cr.resource}</span>
                          <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mt-[2px]">{cr.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-[6px] text-[12px] text-[#3e8635] font-['Red_Hat_Text:Regular',sans-serif]">
                      <CheckCircle className="size-[12px]" /> No CR incompatibilities found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scheduled Execution Module */}
            <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[20px]">
              <div className="flex items-center gap-[8px] mb-[12px]">
                <Clock className="size-[16px] text-[#0066cc]" />
                <h3 className="text-[15px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">Scheduled Execution</h3>
              </div>
              <div className="grid grid-cols-4 gap-[12px]">
                <div className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                  <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px]">Optimal Window</p>
                  <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif] font-medium">{scheduledExecution.optimalWindow}</p>
                </div>
                <div className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                  <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px]">Estimated Duration</p>
                  <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif] font-medium">{scheduledExecution.estimatedDuration}</p>
                </div>
                <div className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                  <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px]">Risk Level</p>
                  <span className={`text-[12px] px-[8px] py-[2px] rounded-[4px] font-semibold ${scheduledExecution.riskLevel === "Low" ? "bg-[rgba(62,134,53,0.1)] text-[#3e8635]" : scheduledExecution.riskLevel === "Medium" ? "bg-[rgba(197,140,0,0.1)] text-[#c58c00]" : "bg-[rgba(201,25,11,0.1)] text-[#c9190b]"}`}>
                    {scheduledExecution.riskLevel} Risk
                  </span>
                </div>
                <div className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                  <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px]">Rollback Strategy</p>
                  <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">{autoRollback ? "Automatic" : "Manual"}</p>
                </div>
              </div>
              <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mt-[8px]">
                {scheduledExecution.rollbackStrategy}
              </p>
            </div>

            {/* Decision Bar */}
            <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[20px]">
              {incompatibleOps.length > 0 && (
                <div className="flex items-start gap-[8px] bg-[#fdf7e7] dark:bg-[rgba(197,140,0,0.06)] rounded-[8px] px-[14px] py-[10px] mb-[14px] border border-[#c58c00]/30">
                  <AlertTriangle className="size-[14px] text-[#c58c00] shrink-0 mt-[2px]" />
                  <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">
                    <span className="font-semibold">{incompatibleOps.length} blocking issue{incompatibleOps.length !== 1 ? "s" : ""}</span> must be resolved before approving, or you can accept the risks and proceed.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">
                  Target: <span className="font-['Red_Hat_Mono:Regular',sans-serif] text-[#151515] dark:text-white font-medium">5.0.0 → 5.1.10</span>
                </p>
                <div className="flex items-center gap-[10px]">
                  {incompatibleOps.length > 0 ? (
                    <>
                      <button onClick={() => setShowRiskAcceptModal(true)}
                        className="text-[14px] px-[16px] py-[8px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] bg-transparent text-[#151515] dark:text-white cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                        Accept risks &amp; approve
                      </button>
                      <div className="relative group">
                        <button disabled
                          className="text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium bg-[#d2d2d2] text-[#6a6e73] cursor-not-allowed">
                          Approve plan
                        </button>
                        <div className="absolute bottom-full right-0 mb-[6px] hidden group-hover:block z-10">
                          <div className="bg-[#151515] text-white text-[11px] px-[10px] py-[6px] rounded-[999px] shadow-lg whitespace-nowrap font-['Red_Hat_Text:Regular',sans-serif]">
                            Resolve {incompatibleOps.length} blocking issue{incompatibleOps.length !== 1 ? "s" : ""} to approve
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    planDecision === "approved" ? (
                      <button onClick={startUpdate}
                        className="text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium bg-[#0066cc] hover:bg-[#004080] text-white flex items-center gap-[6px]">
                        <Play className="size-[14px]" /> Start update
                      </button>
                    ) : (
                      <button onClick={() => setPlanDecision("approved")}
                        className="text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium bg-[#0066cc] hover:bg-[#004080] text-white">
                        Approve plan
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress Panel */}
      {(agentStatus === "updating" || agentStatus === "rolling-back") && (
        <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] overflow-hidden">
          <div className="px-[24px] py-[16px] border-b border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] bg-[#fafafa] dark:bg-[rgba(255,255,255,0.02)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <Loader2 className={`size-[18px] animate-spin ${agentStatus === "rolling-back" ? "text-[#c58c00]" : "text-[#0066cc]"}`} />
                <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px]">
                  {agentStatus === "rolling-back" ? "Rolling Back to 5.0.0" : "Updating to 5.1.10"}
                </h2>
              </div>
              <div className="flex items-center gap-[12px]">
                <span className="text-[13px] font-['Red_Hat_Mono:Regular',sans-serif] text-[#151515] dark:text-white font-medium">{updateProgress}%</span>
                <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">
                  Est. remaining: {Math.max(0, Math.round((100 - updateProgress) * 0.6))}m
                </span>
              </div>
            </div>
            <div className="mt-[12px] h-[6px] bg-[#e0e0e0] dark:bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${agentStatus === "rolling-back" ? "bg-[#c58c00]" : "bg-[#0066cc]"}`} style={{ width: `${updateProgress}%` }} />
            </div>
          </div>

          <div className="p-[24px] space-y-[20px]">
            {/* Node Rollout */}
            <div>
              <div className="flex items-center gap-[8px] mb-[12px]">
                <Shield className="size-[16px] text-[#0066cc]" />
                <h3 className="text-[15px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">
                  {agentStatus === "rolling-back" ? "Node rollback" : "Node rollout"}
                </h3>
                <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">
                  {updateNodes.filter(n => n.status === "done").length}/{updateNodes.length} complete
                </span>
              </div>
              <div className="grid grid-cols-3 gap-[8px]">
                {updateNodes.map((node) => (
                  <div key={node.name} className="flex items-center gap-[8px] bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[12px] py-[10px]">
                    {node.status === "done" && <CheckCircle className="size-[14px] text-[#3e8635] shrink-0" />}
                    {node.status === "in-progress" && <Loader2 className="size-[14px] text-[#0066cc] animate-spin shrink-0" />}
                    {node.status === "pending" && <Clock className="size-[14px] text-[#8a8d90] shrink-0" />}
                    <div>
                      <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">{node.name}</p>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">{node.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator Updates */}
            {agentStatus !== "rolling-back" && (
              <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[20px]">
                <div className="flex items-center gap-[8px] mb-[12px]">
                  <Settings className="size-[16px] text-[#6753ac]" />
                  <h3 className="text-[15px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">Operator updates</h3>
                  <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">
                    {updateOperators.filter(o => o.status === "done").length}/{updateOperators.length} complete
                  </span>
                </div>
                <div className="space-y-[6px]">
                  {updateOperators.map((op) => (
                    <div key={op.name} className="flex items-center justify-between bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px]">
                      <div className="flex items-center gap-[10px]">
                        {op.status === "done" && <CheckCircle className="size-[14px] text-[#3e8635]" />}
                        {op.status === "in-progress" && <Loader2 className="size-[14px] text-[#0066cc] animate-spin" />}
                        {op.status === "pending" && <Clock className="size-[14px] text-[#8a8d90]" />}
                        <span className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium">{op.name}</span>
                      </div>
                      <span className="text-[12px] font-['Red_Hat_Mono:Regular',sans-serif] text-[#4d4d4d] dark:text-[#b0b0b0]">{op.from} → {op.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Health */}
            <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[20px]">
              <div className="flex items-center gap-[8px] mb-[12px]">
                <Eye className="size-[16px] text-[#3e8635]" />
                <h3 className="text-[15px] font-semibold text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">Live health monitoring</h3>
              </div>
              <div className="grid grid-cols-4 gap-[8px]">
                {[
                  { label: "API Server", value: "Healthy", ok: true },
                  { label: "etcd", value: "Healthy", ok: true },
                  { label: "Ingress", value: "Healthy", ok: true },
                  { label: "Node Pressure", value: "None", ok: true },
                ].map((h) => (
                  <div key={h.label} className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[12px] py-[8px]">
                    <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">{h.label}</p>
                    <p className={`text-[12px] font-semibold font-['Red_Hat_Text:Regular',sans-serif] flex items-center gap-[4px] ${h.ok ? "text-[#3e8635]" : "text-[#c9190b]"}`}>
                      {h.ok ? <CheckCircle className="size-[10px]" /> : <AlertCircle className="size-[10px]" />} {h.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulate actions for demo */}
            <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-[16px] flex items-center gap-[10px]">
              <span className="text-[11px] text-[#8a8d90] font-['Red_Hat_Text:Regular',sans-serif] italic">Demo:</span>
              {agentStatus === "updating" && (
                <>
                  <button onClick={simulateComplete} className="text-[11px] px-[10px] py-[4px] rounded-[4px] border border-[#3e8635] text-[#3e8635] bg-transparent cursor-pointer hover:bg-[rgba(62,134,53,0.05)] font-['Red_Hat_Text:Regular',sans-serif]">Simulate success</button>
                  <button onClick={simulateFailure} className="text-[11px] px-[10px] py-[4px] rounded-[4px] border border-[#c9190b] text-[#c9190b] bg-transparent cursor-pointer hover:bg-[rgba(201,25,11,0.05)] font-['Red_Hat_Text:Regular',sans-serif]">Simulate failure</button>
                </>
              )}
              {agentStatus === "rolling-back" && (
                <button onClick={() => { setAgentStatus("idle"); setPlanDecision("pending"); openChatbot("rollback-complete"); }} className="text-[11px] px-[10px] py-[4px] rounded-[4px] border border-[#3e8635] text-[#3e8635] bg-transparent cursor-pointer hover:bg-[rgba(62,134,53,0.05)] font-['Red_Hat_Text:Regular',sans-serif]">Simulate rollback complete</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Complete Panel */}
      {agentStatus === "completed" && (
        <div className="rounded-[16px] border-2 border-[#3e8635] overflow-hidden">
          <div className="px-[24px] py-[20px] bg-[rgba(62,134,53,0.06)]">
            <div className="flex items-center gap-[12px] mb-[16px]">
              <div className="size-[40px] rounded-full bg-[#3e8635] flex items-center justify-center">
                <CheckCircle className="size-[22px] text-white" />
              </div>
              <div>
                <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px]">Cluster updated to 5.1.10</h2>
                <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Completed at {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} &middot; Duration: 1h 38m</p>
              </div>
            </div>

            {/* Post-update verification */}
            <div className="mb-[16px]">
              <div className="flex items-center gap-[8px] mb-[10px]">
                <Shield className="size-[14px] text-[#3e8635]" />
                <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-semibold">Post-update health verification</p>
                <span className="text-[12px] text-[#3e8635] font-semibold px-[8px] py-[1px] rounded-full bg-[rgba(62,134,53,0.1)] font-['Red_Hat_Text:Regular',sans-serif]">
                  {postUpdateChecks.length}/{postUpdateChecks.length} passed
                </span>
              </div>
              <div className="grid grid-cols-3 gap-[6px]">
                {postUpdateChecks.map((c) => (
                  <div key={c.label} className="flex items-center gap-[6px] bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[999px] px-[10px] py-[6px] border border-[rgba(62,134,53,0.2)]">
                    <CheckCircle className="size-[12px] text-[#3e8635] shrink-0" />
                    <span className="text-[12px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-[12px]">
              <div className="bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px] border border-[rgba(0,0,0,0.06)]">
                <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Previous version</p>
                <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">5.0.0</p>
              </div>
              <div className="bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px] border border-[rgba(0,0,0,0.06)]">
                <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Current version</p>
                <p className="text-[14px] text-[#3e8635] font-['Red_Hat_Mono:Regular',sans-serif] font-semibold">5.1.10</p>
              </div>
              <div className="bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px] border border-[rgba(0,0,0,0.06)]">
                <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Nodes updated</p>
                <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">6/6</p>
              </div>
              <div className="bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[14px] py-[10px] border border-[rgba(0,0,0,0.06)]">
                <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Operators updated</p>
                <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">3/3</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Failed Panel */}
      {agentStatus === "failed" && (
        <div className="rounded-[16px] border-2 border-[#c9190b] overflow-hidden">
          <div className="px-[24px] py-[20px] bg-[rgba(201,25,11,0.04)]">
            <div className="flex items-center gap-[12px] mb-[16px]">
              <div className="size-[40px] rounded-full bg-[#c9190b] flex items-center justify-center">
                <AlertCircle className="size-[22px] text-white" />
              </div>
              <div>
                <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px]">Update to 5.1.10 failed</h2>
                <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">Failed at {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} &middot; Node master-2 failed to drain</p>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#c9190b]/30 bg-white dark:bg-[rgba(255,255,255,0.02)] p-[14px] mb-[16px]">
              <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] font-semibold mb-[6px]">Error details</p>
              <div className="bg-[#151515] rounded-[999px] p-[12px] font-['Red_Hat_Mono:Regular',sans-serif] text-[12px] text-[#e0e0e0] overflow-x-auto">
                <p className="text-[#c9190b]">error: node/master-2 drain failed</p>
                <p className="text-[#8a8d90] mt-[4px]">  pods with local storage: prometheus-k8s-0</p>
                <p className="text-[#8a8d90]">  eviction timeout: 300s exceeded</p>
                <p className="text-[#c58c00] mt-[4px]">warning: cluster version is partially updated</p>
                <p className="text-[#8a8d90]">  completed: 2/3 control-plane, 0/3 worker</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-[8px] mb-[16px]">
              {updateNodes.map((node) => {
                const failed = node.name === "master-2";
                return (
                  <div key={node.name} className="flex items-center gap-[8px] bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] px-[12px] py-[10px] border border-[rgba(0,0,0,0.06)]">
                    {node.status === "done" && <CheckCircle className="size-[14px] text-[#3e8635] shrink-0" />}
                    {failed && <AlertCircle className="size-[14px] text-[#c9190b] shrink-0" />}
                    {!failed && node.status !== "done" && <Clock className="size-[14px] text-[#8a8d90] shrink-0" />}
                    <div>
                      <p className={`text-[13px] font-['Red_Hat_Mono:Regular',sans-serif] ${failed ? "text-[#c9190b]" : "text-[#151515] dark:text-white"}`}>{node.name}</p>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">{failed ? "Drain failed" : node.status === "done" ? "Complete" : "Not started"}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-[10px]">
              <button onClick={() => setShowRollbackModal(true)}
                className="flex items-center gap-[6px] bg-transparent text-[#151515] dark:text-white text-[14px] px-[16px] py-[8px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                <RotateCcw className="size-[14px]" /> Rollback to 5.0.0
              </button>
              <button onClick={() => { setAgentStatus("updating"); setUpdateProgress(0); openChatbot("update-retry"); }}
                className="flex items-center gap-[6px] bg-[#0066cc] hover:bg-[#004080] text-white text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                <RefreshCw className="size-[14px]" /> Retry update
              </button>
              <button onClick={() => openChatbot("update-failed")}
                className="flex items-center gap-[6px] bg-transparent text-[#0066cc] dark:text-[#4dabf7] text-[14px] px-[16px] py-[8px] rounded-[999px] border border-[#0066cc] dark:border-[#4dabf7] cursor-pointer hover:bg-[#0066cc]/5 transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Get AI diagnosis <Sparkles className="size-[14px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback confirmation modal */}
      {showRollbackModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={() => setShowRollbackModal(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-w-[480px] w-full mx-[16px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <h3 className="text-[16px] font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#c9190b]">Rollback to 5.0.0?</h3>
              <button onClick={() => setShowRollbackModal(false)} className="bg-transparent border-0 cursor-pointer text-[#6a6e73] hover:text-[#151515] dark:hover:text-white p-[4px]"><X className="size-[16px]" /></button>
            </div>
            <div className="px-[24px] py-[16px]">
              <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[8px]">This will revert your cluster from the partially updated state back to version 5.0.0.</p>
              <ul className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] list-disc pl-[18px] space-y-[4px]">
                <li>All nodes will be reverted to 5.0.0</li>
                <li>Operator versions will be restored</li>
                <li>Workloads may experience brief disruption</li>
                <li>Estimated rollback time: ~30 minutes</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-[10px] px-[24px] py-[16px] border-t border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <button onClick={() => setShowRollbackModal(false)} className="text-[14px] px-[16px] py-[8px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] bg-transparent text-[#151515] dark:text-white cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                Cancel
              </button>
              <button onClick={startRollback}
                className="flex items-center gap-[6px] text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 bg-[#c9190b] hover:bg-[#a2150a] text-white cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                <RotateCcw className="size-[14px]" /> Start rollback
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pause confirmation modal */}
      {showPauseModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={() => setShowPauseModal(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-w-[440px] w-full mx-[16px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <h3 className="text-[16px] font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white">Pause update agent?</h3>
              <button onClick={() => setShowPauseModal(false)} className="bg-transparent border-0 cursor-pointer text-[#6a6e73] hover:text-[#151515] dark:hover:text-white p-[4px]"><X className="size-[16px]" /></button>
            </div>
            <div className="px-[24px] py-[16px]">
              <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[8px]">The update agent will stop processing and no further actions will be taken until you resume.</p>
              <ul className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] list-disc pl-[18px] space-y-[4px]">
                <li>Current update progress will be preserved</li>
                <li>Scheduled execution window will be skipped</li>
                <li>You can resume at any time</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-[10px] px-[24px] py-[16px] border-t border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <button onClick={() => setShowPauseModal(false)} className="text-[14px] px-[16px] py-[8px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] bg-transparent text-[#151515] dark:text-white cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                Keep running
              </button>
              <button onClick={() => { setAgentStatus("paused"); setShowPauseModal(false); openChatbot("agent-paused"); }}
                className="text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 bg-[#0066cc] hover:bg-[#004080] text-white cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Pause agent
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-w-[440px] w-full mx-[16px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <h3 className="text-[16px] font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#c9190b]">Cancel update?</h3>
              <button onClick={() => setShowCancelModal(false)} className="bg-transparent border-0 cursor-pointer text-[#6a6e73] hover:text-[#151515] dark:hover:text-white p-[4px]"><X className="size-[16px]" /></button>
            </div>
            <div className="px-[24px] py-[16px]">
              <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] mb-[8px]">This will stop the update agent and discard the current update plan. This action cannot be undone.</p>
              <ul className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] list-disc pl-[18px] space-y-[4px]">
                <li>The proposed update plan will be discarded</li>
                <li>Any accepted risks will be cleared</li>
                <li>You will need to start a new update session</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-[10px] px-[24px] py-[16px] border-t border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
              <button onClick={() => setShowCancelModal(false)} className="text-[14px] px-[16px] py-[8px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] bg-transparent text-[#151515] dark:text-white cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                Go back
              </button>
              <button onClick={() => { setAgentStatus("idle"); setPlanDecision("pending"); setAcceptedSlugs(new Set()); setShowCancelModal(false); openChatbot("agent-cancelled"); }}
                className="text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 bg-[#c9190b] hover:bg-[#a2150a] text-white cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Cancel update
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Per-risk acceptance modal */}
      {showRiskAcceptModal && (() => {
        const allRisks = [
          ...incompatibleOps.map((op) => ({ slug: op.slug!, name: op.name, severity: "critical" as const, detail: `${op.name} ${op.currentVersion} (max OCP ${op.maxOCP}) — ${op.action}` })),
          ...warningOps.map((op) => ({ slug: op.slug!, name: op.name, severity: "warning" as const, detail: `${op.name} ${op.currentVersion} (max OCP ${op.maxOCP}) — ${op.action}` })),
        ];
        const selectedCount = allRisks.filter((r) => acceptedSlugs.has(r.slug)).length;
        const allSelected = selectedCount === allRisks.length;
        const toggleSlug = (slug: string) => {
          setAcceptedSlugs((prev) => { const next = new Set(prev); if (next.has(slug)) next.delete(slug); else next.add(slug); return next; });
        };
        const toggleAll = () => {
          if (allSelected) { setAcceptedSlugs(new Set()); }
          else { setAcceptedSlugs(new Set(allRisks.map((r) => r.slug))); }
        };
        return createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={() => setShowRiskAcceptModal(false)}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[16px] shadow-[0_10px_20px_rgba(41,41,41,0.15)] max-w-[560px] w-full mx-[16px] max-h-[80vh] flex flex-col" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)]">
                <h3 className="text-[18px] font-['Red_Hat_Display',sans-serif] font-semibold text-[#151515] dark:text-white">Accept known risks</h3>
                <button onClick={() => setShowRiskAcceptModal(false)} className="bg-transparent border-0 cursor-pointer text-[#6a6e73] hover:text-[#151515] dark:hover:text-white p-[4px]" aria-label="Close">
                  <X className="size-[18px]" />
                </button>
              </div>

              <div className="px-[24px] py-[16px] overflow-y-auto flex-1">
                <div className="flex items-start gap-[8px] rounded-[16px] border-l-[2px] border-l-[#dca614] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#1a1a1a] px-[16px] py-[12px] mb-[16px]">
                  <AlertTriangle className="size-[14px] text-[#dca614] shrink-0 mt-[2px]" />
                  <p className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text',sans-serif]">
                    Acknowledging these risks will set <span className="font-['Red_Hat_Mono',sans-serif] text-[#5e40be]">desiredUpdate.acceptedRisks</span> on the ClusterVersion resource.
                    The update will proceed despite known incompatibilities. You must accept all risks to proceed.
                  </p>
                </div>

                <div className="flex items-center justify-between mb-[12px]">
                  <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text',sans-serif] uppercase tracking-[0.5px] font-semibold">
                    {allRisks.length} risk{allRisks.length !== 1 ? "s" : ""} identified
                  </p>
                  <label className="flex items-center gap-[6px] cursor-pointer">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="size-[16px] accent-[#0066cc] cursor-pointer" />
                    <span className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text',sans-serif] font-medium">Select all</span>
                  </label>
                </div>

                <div className="space-y-[10px]">
                  {allRisks.map((risk) => (
                    <label key={risk.slug} className={`flex items-start gap-[12px] rounded-[16px] p-[14px] border cursor-pointer transition-colors ${acceptedSlugs.has(risk.slug) ? "border-[#0066cc] bg-[#e7f1fa]/30 dark:bg-[rgba(43,154,243,0.06)]" : "border-[#d2d2d2] dark:border-[rgba(255,255,255,0.15)] hover:border-[#8a8d90]"}`}>
                      <input type="checkbox" checked={acceptedSlugs.has(risk.slug)} onChange={() => toggleSlug(risk.slug)}
                        className="size-[16px] mt-[2px] cursor-pointer accent-[#0066cc] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[6px] mb-[4px]">
                          {risk.severity === "critical" ? <AlertCircle className="size-[12px] text-[#b1380b] shrink-0" /> : <AlertTriangle className="size-[12px] text-[#dca614] shrink-0" />}
                          <span className="text-[14px] text-[#151515] dark:text-white font-medium font-['Red_Hat_Text',sans-serif]">{risk.name}</span>
                          <span className={`text-[11px] px-[6px] py-[1px] rounded-[4px] font-semibold ${risk.severity === "critical" ? "bg-[rgba(177,56,11,0.1)] text-[#b1380b]" : "bg-[rgba(220,166,20,0.1)] text-[#795600]"}`}>
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text',sans-serif]">{risk.detail}</p>
                        <p className="text-[11px] text-[#6a6e73] dark:text-[#8a8d90] font-['Red_Hat_Mono',sans-serif] mt-[4px]">slug: {risk.slug}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-[12px] px-[24px] py-[16px] border-t border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)]">
                <button disabled={!allSelected}
                  onClick={() => { setPlanDecision("approved"); setShowRiskAcceptModal(false); }}
                  className={`text-[14px] px-[16px] py-[8px] rounded-[999px] border-0 transition-colors font-['Red_Hat_Text',sans-serif] font-medium ${allSelected ? "bg-[#0066cc] hover:bg-[#004080] text-white cursor-pointer" : "bg-[#d2d2d2] text-[#6a6e73] cursor-not-allowed"}`}>
                  Accept all risks &amp; approve plan
                </button>
                <button disabled={selectedCount === 0}
                  onClick={() => setShowRiskAcceptModal(false)}
                  className={`text-[14px] px-[16px] py-[8px] rounded-[999px] border transition-colors font-['Red_Hat_Text',sans-serif] font-medium ${selectedCount > 0 ? "border-[#0066cc] dark:border-[#4dabf7] text-[#0066cc] dark:text-[#4dabf7] bg-transparent cursor-pointer hover:bg-[#0066cc]/5" : "border-[#d2d2d2] text-[#6a6e73] bg-transparent cursor-not-allowed"}`}>
                  Accept and save
                </button>
                <button onClick={() => setShowRiskAcceptModal(false)}
                  className="text-[14px] px-[16px] py-[8px] bg-transparent border-0 text-[#0066cc] dark:text-[#4dabf7] cursor-pointer hover:underline font-['Red_Hat_Text',sans-serif] font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Sticky Approval Footer */}
      {(agentStatus === "active" || agentStatus === "paused") && planDecision === "pending" && createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[80] bg-white dark:bg-[#1a1a1a] border-t border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] px-[24px] py-[14px] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex items-center gap-[10px]">
              {incompatibleOps.length > 0 && <AlertTriangle className="size-[16px] text-[#c58c00]" />}
              <span className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">
                {incompatibleOps.length > 0 ? (
                  <><span className="font-semibold">{incompatibleOps.length} blocking issue{incompatibleOps.length !== 1 ? "s" : ""}</span> must be resolved before approving, or you can accept the risks and proceed.</>
                ) : (
                  <>Update plan ready for approval</>
                )}
                <span className="text-[#4d4d4d] dark:text-[#b0b0b0] ml-[12px]">Target: <span className="font-['Red_Hat_Mono:Regular',sans-serif] font-medium text-[#151515] dark:text-white">5.0.0 → 5.1.10</span></span>
              </span>
            </div>
            <div className="flex items-center gap-[10px]">
              {incompatibleOps.length > 0 ? (
                <>
                  <button onClick={() => setShowRiskAcceptModal(true)}
                    className="text-[13px] px-[14px] py-[7px] rounded-[999px] border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.2)] bg-transparent text-[#151515] dark:text-white cursor-pointer hover:bg-[rgba(0,0,0,0.03)] transition-colors font-['Red_Hat_Text:Regular',sans-serif]">
                    Accept risks &amp; approve
                  </button>
                  <div className="relative group">
                    <button disabled className="text-[13px] px-[14px] py-[7px] rounded-[999px] border-0 bg-[#d2d2d2] text-[#6a6e73] cursor-not-allowed font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                      Approve plan
                    </button>
                    <div className="absolute bottom-full right-0 mb-[6px] hidden group-hover:block z-10">
                      <div className="bg-[#151515] text-white text-[11px] px-[10px] py-[6px] rounded-[999px] shadow-lg whitespace-nowrap font-['Red_Hat_Text:Regular',sans-serif]">
                        Resolve {incompatibleOps.length} blocking issue{incompatibleOps.length !== 1 ? "s" : ""} to approve
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button onClick={() => setPlanDecision("approved")}
                  className="text-[13px] px-[14px] py-[7px] rounded-[999px] border-0 cursor-pointer bg-[#0066cc] hover:bg-[#004080] text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium transition-colors">
                  Approve plan
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {(agentStatus === "active" || agentStatus === "paused") && planDecision === "approved" && createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[80] bg-white dark:bg-[#1a1a1a] border-t border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] px-[24px] py-[14px] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <CheckCircle className="size-[16px] text-[#3e8635]" />
              <span className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">
                Plan approved &middot; Target: <span className="font-['Red_Hat_Mono:Regular',sans-serif] font-medium">5.0.0 → 5.1.10</span>
              </span>
            </div>
            <button onClick={startUpdate}
              className="text-[13px] px-[14px] py-[7px] rounded-[999px] border-0 cursor-pointer bg-[#0066cc] hover:bg-[#004080] text-white font-['Red_Hat_Text:Regular',sans-serif] font-medium transition-colors flex items-center gap-[6px]">
              <Play className="size-[13px]" /> Start update
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── Help popovers (PatternFly) ─── */
function InfoTooltip() {
  return (
    <Popover
      aria-label="About available updates"
      headerContent={<Title headingLevel="h4">Available updates</Title>}
      bodyContent={
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Content component="p">
            Available updates are determined by your selected channel and the cluster&apos;s current version. Versions are
            tested for update compatibility and risk is assessed based on known issues.
          </Content>
          <Button
            variant="link"
            component="a"
            href="https://docs.openshift.com/container-platform/latest/updating/understanding_updates/intro-to-updates.html"
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLink aria-hidden />}
            iconPosition="end"
            isInline
          >
            View documentation
          </Button>
        </Flex>
      }
    >
      <Button variant="plain" aria-label="Learn more about available updates" icon={<HelpCircle />} />
    </Popover>
  );
}

function ChannelTooltip() {
  return (
    <Popover
      aria-label="About update channels"
      headerContent={<Title headingLevel="h4">Update channels</Title>}
      bodyContent={
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Content component="p">
            Channels determine which versions are available for update. <strong>fast</strong> delivers updates as soon as
            they pass CI, <strong>stable</strong> waits for broader adoption, <strong>eus</strong> provides extended update
            support for select minor versions, and <strong>candidate</strong> includes pre-release builds for early testing.
          </Content>
          <Button
            variant="link"
            component="a"
            href="https://docs.openshift.com/container-platform/latest/updating/understanding_updates/understanding-update-channels-releases.html"
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLink aria-hidden />}
            iconPosition="end"
            isInline
          >
            Learn more about channels
          </Button>
        </Flex>
      }
    >
      <Button variant="plain" aria-label="Learn more about update channels" icon={<HelpCircle />} />
    </Popover>
  );
}

/* ─── Agent Plan Data & Components ─── */
interface AgentOperator {
  name: string;
  current: string;
  required: string | null;
  compatible: boolean;
  incompatibleAt?: string;
  action: "required" | "optional" | "up-to-date";
}

/** Versions match cluster target compatibility — all rows green for the proposed update storyline. */
const AGENT_OPERATORS: AgentOperator[] = [
  { name: "Abot Operator", current: "3.1.0", required: null, compatible: true, action: "up-to-date" },
  { name: "Airflow Helm Operator", current: "5.7.3", required: null, compatible: true, action: "up-to-date" },
  { name: "Ansible Automation Platform", current: "1.6.0", required: null, compatible: true, action: "up-to-date" },
  { name: "Bare Metal Event Relay", current: "1.2.0", required: null, compatible: true, action: "up-to-date" },
  { name: "Camel K Operator", current: "2.1.0", required: null, compatible: true, action: "up-to-date" },
];

function agentOperatorName(op: AgentOperator) {
  return op.name;
}

function OperatorCompatibilityTable({ targetVersion }: { targetVersion: string }) {
  return (
    <OcsNamedResourceDataView
      ouiaId="operator-compat-data-view"
      ariaLabel="Operator compatibility with target version"
      itemsLabel="operators"
      items={AGENT_OPERATORS}
      getName={agentOperatorName}
    >
      {(rows) => (
        <>
          <Thead>
            <Tr>
              <Th dataLabel="Operator">
                <PlainTableHeader label="Operator" />
              </Th>
              <Th dataLabel="Current">
                <PlainTableHeader label="Current" />
              </Th>
              <Th dataLabel="Required version">
                <PlainTableHeader label="Required version" />
              </Th>
              <Th dataLabel="Compatibility">
                <PlainTableHeader label={`OCP ${targetVersion} compat.`} />
              </Th>
              <Th dataLabel="Action needed">
                <PlainTableHeader label="Action needed" />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((op) => (
              <Tr key={op.name}>
                <Td dataLabel="Operator">
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    {!op.compatible ? (
                      <span
                        aria-hidden
                        style={{ color: "var(--pf-t--global--danger-color--100)", fontSize: "var(--pf-t--global--FontSize--xs)" }}
                      >
                        ●
                      </span>
                    ) : null}
                    <span>{op.name}</span>
                  </Flex>
                </Td>
                <Td dataLabel="Current">
                  <code
                    style={{
                      fontFamily: "var(--pf-t--global--FontFamily--mono)",
                      color: "var(--pf-t--global--text--Color--200)",
                    }}
                  >
                    {op.current}
                  </code>
                </Td>
                <Td dataLabel="Required version">
                  {op.required ? (
                    <code
                      style={{
                        fontFamily: "var(--pf-t--global--FontFamily--mono)",
                        fontWeight: 600,
                        color: op.compatible
                          ? "var(--pf-t--global--text--Color--100)"
                          : "var(--pf-t--global--danger-color--100)",
                      }}
                    >
                      {op.required}
                    </code>
                  ) : (
                    <span style={{ color: "var(--pf-t--global--text--Color--200)" }}>–</span>
                  )}
                </Td>
                <Td dataLabel="Compatibility">
                  {op.compatible ? (
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "nowrap" }}>
                      <Icon status="success" iconSize="sm">
                        <CheckCircle />
                      </Icon>
                      <span style={{ fontSize: "var(--pf-t--global--FontSize--sm)" }}>Compatible</span>
                    </Flex>
                  ) : (
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "nowrap" }}>
                      <Icon status="warning" iconSize="sm">
                        <AlertTriangle />
                      </Icon>
                      <span style={{ fontSize: "var(--pf-t--global--FontSize--sm)" }}>
                        Incompatible at {op.incompatibleAt}
                      </span>
                    </Flex>
                  )}
                </Td>
                <Td dataLabel="Action needed">
                  {op.action === "required" ? (
                    <Label color="orange" variant="outline" isCompact>
                      Update required before OCP update
                    </Label>
                  ) : op.action === "optional" ? (
                    <Label color="green" variant="outline" isCompact>
                      Update available (optional)
                    </Label>
                  ) : (
                    <span style={{ fontSize: "var(--pf-t--global--FontSize--sm)", color: "var(--pf-t--global--text--Color--200)" }}>
                      Up to date
                    </span>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </>
      )}
    </OcsNamedResourceDataView>
  );
}

type PlanStepStatus = "done" | "warning" | "pending";
interface PlanStep {
  label: string;
  status: PlanStepStatus;
  badge?: string;
  badgeColor?: string;
  detail: string;
}

function StepIcon({ status }: { status: PlanStepStatus }) {
  if (status === "done") {
    return (
      <Icon iconSize="lg" status="success">
        <CheckCircle />
      </Icon>
    );
  }
  if (status === "warning") {
    return (
      <Icon iconSize="lg" status="warning">
        <AlertTriangle />
      </Icon>
    );
  }
  return (
    <Icon iconSize="lg" style={{ color: "var(--pf-t--global--icon--Color--disabled)" }}>
      <Clock />
    </Icon>
  );
}

function StepStatusLabel({ text, color }: { text: string; color: string }) {
  const labelColor: "green" | "orange" | "red" =
    color === "#f0ab00" || color === "#c58c00" ? "orange" : color === "#c9190b" ? "red" : "green";
  return (
    <Label isCompact color={labelColor} variant="filled">
      {text}
    </Label>
  );
}

function agentRiskProgressVariant(riskLabel: string): "success" | "warning" | "danger" {
  if (/High|Critical/i.test(riskLabel)) {
    return "danger";
  }
  if (/Moderate|Medium/i.test(riskLabel)) {
    return "warning";
  }
  return "success";
}

function flattenChannelVersionOptions(groups: VersionGroup[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of groups) {
    for (const v of g.versions) {
      if (!seen.has(v.version)) {
        seen.add(v.version);
        out.push(v.version);
      }
    }
  }
  return out;
}

/** Matches the agent-only demo storyline (cluster on 5.0.x, target chosen from channel). */
const AGENT_CLUSTER_CURRENT_VERSION = CLUSTER_CURRENT_VERSION;

const DEFAULT_AGENT_MAINTENANCE_WINDOW = "Apr 15, 2026 · 2:00 AM EST";

function formatAgentScheduleLine(dateIso: string, timeHm: string, tzLabel: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  if (!y || !m || !d) return DEFAULT_AGENT_MAINTENANCE_WINDOW;
  const date = new Date(y, m - 1, d);
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const [hh, mm] = timeHm.split(":").map(Number);
  const t = new Date(2000, 0, 1, hh || 0, mm || 0);
  const timePart = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart} · ${tzLabel}`;
}

function hashVersionKey(version: string): number {
  let h = 0;
  for (let i = 0; i < version.length; i++) h = Math.imul(31, h) + version.charCodeAt(i) | 0;
  return Math.abs(h);
}

type AgentPlanProfile = {
  defaultMaintenance: string;
  durationRange: string;
  rollingStrategy: string;
  riskBarPct: number;
  riskLabel: string;
  riskBarColor: string;
  riskDetail: string;
  tags: string[];
  compatCompatible: number;
  compatTotal: number;
  compatRequired: number;
  storageDetail: string;
};

/** Deterministic mock plan details per target version (prototype). */
function getAgentPlanProfile(version: string): AgentPlanProfile {
  const h = hashVersionKey(version);
  const windows = [
    DEFAULT_AGENT_MAINTENANCE_WINDOW,
    "Apr 18, 2026 · 3:30 AM EST",
    "Apr 22, 2026 · 1:00 AM UTC",
    "May 2, 2026 · 11:00 PM EST",
    "Apr 12, 2026 · 6:00 AM EST",
  ];
  const durations = ["38–52 minutes", "45–60 minutes", "52–70 minutes", "40–55 minutes", "48–65 minutes"];
  const rolling = [
    "Rolling (2 nodes at a time)",
    "Rolling (1 node at a time)",
    "Rolling (3 nodes at a time)",
    "Parallel control plane, rolling workers",
  ];
  const tagSets = [
    ["Security patches", "Bug fixes", "Performance"],
    ["Security patches", "Networking", "Observability"],
    ["Bug fixes", "Performance", "Operator tooling"],
    ["Security patches", "AI workload", "Storage"],
  ];
  const risks = [
    { pct: 20, label: "2 / 10 — Low", color: "#3e8635", detail: "AI risk score: 2/10 · No PDB violations or blocking conditions detected" },
    { pct: 22, label: "2 / 10 — Low", color: "#3e8635", detail: "AI risk score: 2/10 · Minor cordon delay on one node pool" },
    { pct: 45, label: "4 / 10 — Moderate", color: "#f0ab00", detail: "AI risk score: 4/10 · Review PDBs and surge settings before execution" },
    { pct: 24, label: "2 / 10 — Low", color: "#3e8635", detail: "AI risk score: 2/10 · etcd backup verified within policy" },
  ];
  const storageDetails = [
    "Sufficient capacity (68% used)",
    "Sufficient capacity (72% used)",
    "Sufficient capacity (61% used)",
  ];
  /** All prototype operators are modeled compatible with the chosen cluster target (aligned worker + catalog versions). */
  const ri = risks[h % risks.length];
  return {
    defaultMaintenance: windows[h % windows.length],
    durationRange: durations[h % durations.length],
    rollingStrategy: rolling[h % rolling.length],
    riskBarPct: ri.pct,
    riskLabel: ri.label,
    riskBarColor: ri.color,
    riskDetail: ri.detail,
    tags: tagSets[h % tagSets.length],
    compatCompatible: 5,
    compatTotal: 5,
    compatRequired: 0,
    storageDetail: storageDetails[h % storageDetails.length],
  };
}

function UpdateAgentTab({
  selectedVersion,
  onSelectedVersionChange,
  selectedChannel,
  channelGroups,
}: {
  openChatbot: (ctx: string) => void;
  selectedVersion: string;
  onSelectedVersionChange: (v: string) => void;
  selectedChannel: string;
  channelGroups: VersionGroup[];
}) {
  const navigate = useNavigate();
  const [activePlanVersion, setActivePlanVersion] = useState(selectedVersion);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planDecision, setPlanDecision] = useState<"pending" | "scheduled" | "rejected">("pending");
  const [planSerial, setPlanSerial] = useState(13);
  const [planAgeLabel, setPlanAgeLabel] = useState("2 hours ago");
  const [maintenanceWindowLine, setMaintenanceWindowLine] = useState(() => getAgentPlanProfile(selectedVersion).defaultMaintenance);
  const [scheduledWindowLine, setScheduledWindowLine] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    plansCreated: 12,
    updatesExecuted: 12,
    totalDurationMin: 12 * 78,
  });

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("2026-04-15");
  const [scheduleTime, setScheduleTime] = useState("02:00");
  const [scheduleTzLabel, setScheduleTzLabel] = useState("Eastern Time (ET)");
  const [versionSelectOpen, setVersionSelectOpen] = useState(false);
  const isGlass = usePatternFlyGlassActive();

  const planRegenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runGeneratePlan = useCallback(() => {
    if (isPlanLoading) return;
    const versionToApply = selectedVersion;
    setIsPlanLoading(true);
    if (planRegenTimerRef.current) clearTimeout(planRegenTimerRef.current);
    planRegenTimerRef.current = setTimeout(() => {
      planRegenTimerRef.current = null;
      const profile = getAgentPlanProfile(versionToApply);
      setActivePlanVersion(versionToApply);
      setPlanSerial((n) => n + 1);
      setPlanDecision("pending");
      setPlanAgeLabel("Just now");
      setMaintenanceWindowLine(profile.defaultMaintenance);
      setScheduledWindowLine(null);
      setIsPlanLoading(false);
    }, 1100);
  }, [selectedVersion, isPlanLoading]);

  useEffect(
    () => () => {
      if (planRegenTimerRef.current) {
        clearTimeout(planRegenTimerRef.current);
        planRegenTimerRef.current = null;
      }
    },
    []
  );

  const planProfile = useMemo(() => getAgentPlanProfile(activePlanVersion), [activePlanVersion]);
  const planDiffersFromSelection = selectedVersion !== activePlanVersion;
  const targetVersion = activePlanVersion;
  const versionOptions = flattenChannelVersionOptions(channelGroups);

  const avgDurationMin = Math.max(1, Math.round(metrics.totalDurationMin / metrics.updatesExecuted));

  const stats = [
    { label: "Plans Created", value: String(metrics.plansCreated) },
    { label: "Updates Executed", value: String(metrics.updatesExecuted) },
    { label: "Avg Duration", value: `${avgDurationMin} min` },
  ];

  const recordApproval = () => {
    const simulatedRunMin = 72;
    setMetrics((m) => {
      const nextExecutions = m.updatesExecuted + 1;
      const nextTotal = m.totalDurationMin + simulatedRunMin;
      return {
        plansCreated: m.plansCreated + 1,
        updatesExecuted: nextExecutions,
        totalDurationMin: nextTotal,
      };
    });
  };

  const steps: PlanStep[] = useMemo(
    () => [
      { label: "Version Detection", status: "done", badge: "FOUND", badgeColor: "#3e8635", detail: `New version ${targetVersion} detected on ${selectedChannel} channel` },
      { label: "Pre-flight Checks Complete", status: "done", badge: "PASSED", badgeColor: "#3e8635", detail: "All cluster health checks completed successfully" },
      {
        label: "Compatibility Analysis",
        status: planProfile.compatRequired > 0 ? "warning" : "done",
        badge: planProfile.compatRequired > 0 ? "ACTION NEEDED" : "PASSED",
        badgeColor: planProfile.compatRequired > 0 ? "#f0ab00" : "#3e8635",
        detail:
          planProfile.compatRequired > 0
            ? `${planProfile.compatCompatible} of ${planProfile.compatTotal} operators compatible with ${targetVersion} · ${planProfile.compatRequired} operators must be updated first`
            : `All ${planProfile.compatTotal} operators are compatible with OpenShift ${targetVersion}`,
      },
      { label: "API Deprecations", status: "done", detail: "No deprecated APIs in use" },
      { label: "Custom Resources", status: "done", detail: "All CRDs compatible with new version" },
      {
        label: "Risk Assessment",
        status: "done",
        badge: planProfile.riskLabel.includes("Moderate") ? "MEDIUM" : "LOW",
        badgeColor: planProfile.riskLabel.includes("Moderate") ? "#f0ab00" : "#3e8635",
        detail: planProfile.riskDetail,
      },
      { label: "Maintenance Window", status: "done", badge: "IDENTIFIED", badgeColor: "#3e8635", detail: `Optimal window: ${maintenanceWindowLine} (minimal cluster traffic)` },
      { label: "Awaiting Decision", status: "pending", badge: "PENDING", badgeColor: "#f0ab00", detail: "Plan ready — approve, schedule for later, or reject below" },
    ],
    [targetVersion, selectedChannel, maintenanceWindowLine, planProfile]
  );

  const healthChecks = useMemo(
    () => [
      { label: "Cluster Health", detail: "All operators available", ok: true },
      {
        label: "Node Status",
        detail: `6/6 nodes Ready on ${AGENT_CLUSTER_CURRENT_VERSION}; schedulable for cluster update to ${targetVersion}`,
        ok: true,
      },
      { label: "Storage", detail: planProfile.storageDetail, ok: true },
      { label: "Network", detail: "All pods reachable", ok: true },
    ],
    [planProfile.storageDetail, targetVersion]
  );

  const confirmApproveAndStart = () => {
    recordApproval();
    localStorage.setItem("clusterUpdateInProgress", JSON.stringify({ version: selectedVersion, startedAt: Date.now() }));
    setShowApproveModal(false);
    navigate("/administration/cluster-update/in-progress", { state: { version: selectedVersion } });
  };

  const confirmRejectPlan = () => {
    setPlanDecision("rejected");
    setShowRejectModal(false);
  };

  const confirmScheduleWindow = () => {
    const line = formatAgentScheduleLine(scheduleDate, scheduleTime, scheduleTzLabel);
    setScheduledWindowLine(line);
    setMaintenanceWindowLine(line);
    setPlanDecision("scheduled");
    setShowScheduleModal(false);
  };

  const applySchedulePreset = (date: string, time: string, tz: string) => {
    setScheduleDate(date);
    setScheduleTime(time);
    setScheduleTzLabel(tz);
  };

  return (
    <>
    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
      <Card id="ai-update-agent-card" isGlass={isGlass}>
        <CardBody>
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h2" size="xl">
                AI Update Agent
              </Title>
              <Content component="p">
                Activity summary and the current proposed plan · {selectedChannel} channel
              </Content>
            </Flex>

            <Panel variant="bordered">
              <PanelMain>
                <PanelMainBody>
                  <Flex
                    direction={{ default: "column", lg: "row" }}
                    gap={{ default: "gapLg" }}
                    justifyContent={{ lg: "justifyContentSpaceBetween" }}
                    alignItems={{ default: "alignItemsStretch", lg: "alignItemsFlexEnd" }}
                  >
                    <FlexItem flex={{ default: "flex_1" }}>
                      <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                        <Title headingLevel="h4" size="md">
                          Agent target version
                        </Title>
                        <Content component="p">
                          Pick a target from your channel (updates AI Assessment), then click{" "}
                          <strong>Generate plan</strong> to build or refresh the proposed update below.
                        </Content>
                      </Flex>
                    </FlexItem>
                    <Flex
                      direction={{ default: "column", sm: "row" }}
                      gap={{ default: "gapMd" }}
                      alignItems={{ default: "alignItemsStretch", sm: "alignItemsFlexEnd" }}
                    >
                      <FlexItem flex={{ default: "flex_1" }}>
                        <FormGroup label="Target version" fieldId="ai-agent-target-version">
                          <Select
                            isOpen={versionSelectOpen}
                            selected={selectedVersion}
                            onSelect={(_event, value) => {
                              onSelectedVersionChange(String(value));
                              setVersionSelectOpen(false);
                            }}
                            onOpenChange={(open) => setVersionSelectOpen(open)}
                            toggle={(toggleRef) => (
                              <MenuToggle
                                ref={toggleRef}
                                id="ai-agent-target-version"
                                onClick={() => setVersionSelectOpen((prev) => !prev)}
                                isExpanded={versionSelectOpen}
                                isDisabled={isPlanLoading}
                                isFullWidth
                              >
                                {selectedVersion}
                              </MenuToggle>
                            )}
                          >
                            <SelectList>
                              {versionOptions.map((v) => (
                                <SelectOption key={v} value={v}>
                                  {v}
                                </SelectOption>
                              ))}
                            </SelectList>
                          </Select>
                        </FormGroup>
                        {planDiffersFromSelection && !isPlanLoading && (
                          <HelperText>
                            <HelperTextItem variant="warning">
                              Selection differs from the plan shown — generate to update.
                            </HelperTextItem>
                          </HelperText>
                        )}
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="primary"
                          type="button"
                          onClick={runGeneratePlan}
                          isDisabled={isPlanLoading}
                          icon={
                            isPlanLoading ? (
                              <Spinner size="sm" aria-label="Generating plan" />
                            ) : (
                              <Sparkles aria-hidden className="ocs-ai-sparkle-cta-icon" />
                            )
                          }
                        >
                          {isPlanLoading ? "Generating…" : "Generate plan"}
                        </Button>
                      </FlexItem>
                    </Flex>
                  </Flex>
                </PanelMainBody>
              </PanelMain>
            </Panel>

            <Grid hasGutter>
              {stats.map((s) => (
                <GridItem key={s.label} span={12} md={4}>
                  <Card isCompact variant="secondary">
                    <CardBody>
                      <Content component="small">{s.label}</Content>
                      <Title headingLevel="h3" size="2xl">
                        {s.value}
                      </Title>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </Flex>
        </CardBody>
      </Card>

      <Card id="agent-proposed-plan-card" isGlass={isGlass} style={{ position: "relative" }}>
        {isPlanLoading && (
          <Flex
            role="status"
            aria-live="polite"
            aria-busy="true"
            direction={{ default: "column" }}
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentCenter" }}
            gap={{ default: "gapMd" }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              padding: "var(--pf-t--global--spacer--lg)",
              backgroundColor: "var(--pf-t--global--background--color--primary--default)",
              opacity: 0.92,
            }}
          >
            <Spinner size="xl" aria-label="Generating plan" />
            <Content component="p" style={{ margin: 0, textAlign: "center" }}>
              Generating plan for{" "}
              <Content component="span" style={{ fontFamily: "var(--pf-t--global--FontFamily--mono)", fontWeight: 600 }}>
                {selectedVersion}
              </Content>
              …
            </Content>
            <Content component="small" style={{ margin: 0, textAlign: "center", color: "var(--pf-t--global--text--Color--200)" }}>
              Recomputing steps, risk, and maintenance window
            </Content>
          </Flex>
        )}
        <CardHeader>
          <Flex
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsFlexStart" }}
            gap={{ default: "gapMd" }}
            flexWrap={{ default: "wrap" }}
            style={{ width: "100%" }}
          >
            <FlexItem>
              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                <AiGeneratedPlanMarker />
                <Content
                  component="p"
                  style={{
                    margin: 0,
                    marginBottom: "var(--pf-t--global--spacer--md)",
                    fontSize: "var(--pf-t--global--FontSize--xs)",
                    color: "var(--pf-t--global--text--Color--200)",
                  }}
                >
                  PLAN #{planSerial} · Generated {planAgeLabel}
                </Content>
                <Title headingLevel="h3" size="lg">
                  Proposed Update: {AGENT_CLUSTER_CURRENT_VERSION} → {targetVersion}
                </Title>
                <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                  {planProfile.tags.map((tag) => (
                    <Label key={tag} color="blue" variant="outline" icon={<Shield aria-hidden />} isCompact>
                      {tag}
                    </Label>
                  ))}
                </Flex>
              </Flex>
            </FlexItem>
            <FlexItem>
              {planDecision === "pending" ? (
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} style={{ maxWidth: "16rem", textAlign: "right" }}>
                  <Content
                    component="p"
                    style={{
                      margin: 0,
                      fontSize: "var(--pf-t--global--FontSize--xs)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "var(--pf-t--global--text--Color--200)",
                    }}
                  >
                    Prerequisites
                  </Content>
                  <Content component="p" style={{ margin: 0, fontWeight: 500 }}>
                    {planProfile.compatRequired > 0 ? (
                      <>
                        {planProfile.compatRequired} operator {planProfile.compatRequired === 1 ? "update" : "updates"} required before this cluster update
                      </>
                    ) : (
                      <>No operator blockers — review steps below to approve or schedule</>
                    )}
                  </Content>
                </Flex>
              ) : (
                <Label color={planDecision === "rejected" ? "red" : "blue"} variant="outline" isCompact>
                  {planDecision === "rejected" ? "Rejected" : "Scheduled"}
                </Label>
              )}
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardBody>
          <Flex direction={{ default: "column" }}>
            {steps.map((step, i) => (
              <Flex
                key={i}
                direction={{ default: "column" }}
                gap={{ default: "gapSm" }}
                style={
                  i < steps.length - 1
                    ? { paddingBottom: "var(--pf-t--global--spacer--md)" }
                    : undefined
                }
              >
                <Flex
                  flexWrap={{ default: "wrap" }}
                  alignItems={{ default: "alignItemsCenter" }}
                  gap={{ default: "gapSm" }}
                  justifyContent={{ default: "justifyContentFlexStart" }}
                >
                  <StepIcon status={step.status} />
                  <Title headingLevel="h4" size="md">
                    {step.label}
                  </Title>
                  {step.badge && step.badgeColor ? <StepStatusLabel text={step.badge} color={step.badgeColor} /> : null}
                </Flex>
                <Content
                  component="p"
                  style={{
                    margin: 0,
                    fontSize: "var(--pf-t--global--FontSize--sm)",
                    color: "var(--pf-t--global--text--Color--200)",
                  }}
                >
                  {step.detail}
                </Content>

                {i === 1 && (
                  <Grid hasGutter>
                    {healthChecks.map((h) => (
                      <GridItem key={h.label} span={12} md={6}>
                        <Card isCompact variant="secondary">
                          <CardBody>
                            <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }}>
                              <Icon status="success" iconSize="md">
                                <CheckCircle />
                              </Icon>
                              <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                                <Content component="p" style={{ margin: 0, fontWeight: 600 }}>
                                  {h.label}
                                </Content>
                                <Content component="small">{h.detail}</Content>
                              </Flex>
                            </Flex>
                          </CardBody>
                        </Card>
                      </GridItem>
                    ))}
                  </Grid>
                )}

                {i === 2 && (
                  <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} style={{ width: "100%" }}>
                      <Icon status={planProfile.compatRequired > 0 ? "warning" : "success"} iconSize="sm">
                        {planProfile.compatRequired > 0 ? <AlertTriangle /> : <CheckCircle />}
                      </Icon>
                      <Title headingLevel="h4" size="md">
                        Operator compatibility
                      </Title>
                    </Flex>
                    <Content component="p" style={{ margin: 0 }}>
                      {planProfile.compatRequired > 0
                        ? `${planProfile.compatRequired} operators must be updated before updating to ${targetVersion}`
                        : `All operators meet requirements for OpenShift ${targetVersion}`}
                    </Content>
                    <OperatorCompatibilityTable targetVersion={targetVersion} />
                  </Flex>
                )}
              </Flex>
            ))}
          </Flex>
        </CardBody>
        <Divider />
        <CardFooter>
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            <Grid hasGutter>
              <GridItem span={12} md={4}>
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  <Content component="small" style={{ margin: 0, color: "var(--pf-t--global--text--Color--200)" }}>
                    Maintenance Window
                  </Content>
                  <Content component="p" style={{ margin: 0, fontWeight: 600 }}>
                    {planDecision === "scheduled" && scheduledWindowLine ? scheduledWindowLine : maintenanceWindowLine}
                  </Content>
                </Flex>
              </GridItem>
              <GridItem span={12} md={4}>
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  <Content component="small" style={{ margin: 0, color: "var(--pf-t--global--text--Color--200)" }}>
                    Estimated Duration
                  </Content>
                  <Content component="p" style={{ margin: 0, fontWeight: 600 }}>
                    {planProfile.durationRange}
                  </Content>
                </Flex>
              </GridItem>
              <GridItem span={12} md={4}>
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  <Content component="small" style={{ margin: 0, color: "var(--pf-t--global--text--Color--200)" }}>
                    Rolling Strategy
                  </Content>
                  <Content component="p" style={{ margin: 0, fontWeight: 600 }}>
                    {planProfile.rollingStrategy}
                  </Content>
                </Flex>
              </GridItem>
            </Grid>

            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              <Content id="ai-risk-score-label" component="p" style={{ margin: 0, color: "var(--pf-t--global--text--Color--200)" }}>
                AI Risk Score
              </Content>
              <Progress
                id="agent-plan-risk-progress"
                value={planProfile.riskBarPct}
                min={0}
                max={100}
                measureLocation="outside"
                label={planProfile.riskLabel}
                variant={agentRiskProgressVariant(planProfile.riskLabel)}
                aria-labelledby="ai-risk-score-label"
              />
            </Flex>

            {planDecision === "pending" && (
              <ActionList>
                <ActionListItem>
                  <Button
                    type="button"
                    variant="primary"
                    isDisabled={isPlanLoading}
                    icon={<Check aria-hidden />}
                    onClick={() => setShowApproveModal(true)}
                  >
                    Approve plan
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button
                    type="button"
                    variant="secondary"
                    isDisabled={isPlanLoading}
                    icon={<Calendar aria-hidden />}
                    onClick={() => {
                      setScheduleDate("2026-04-15");
                      setScheduleTime("02:00");
                      setScheduleTzLabel("Eastern Time (ET)");
                      setShowScheduleModal(true);
                    }}
                  >
                    Schedule for later
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button
                    type="button"
                    variant="secondary"
                    isDanger
                    isDisabled={isPlanLoading}
                    icon={<X aria-hidden />}
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject plan
                  </Button>
                </ActionListItem>
              </ActionList>
            )}
            {planDecision === "scheduled" && (
              <Alert
                variant="info"
                isInline
                title="Scheduled for later"
                actionLinks={
                  <Button
                    variant="link"
                    onClick={() => {
                      setPlanDecision("pending");
                      setScheduledWindowLine(null);
                      setMaintenanceWindowLine(getAgentPlanProfile(activePlanVersion).defaultMaintenance);
                    }}
                  >
                    Undo
                  </Button>
                }
              >
                <Content component="p" style={{ margin: 0 }}>
                  Update window:{" "}
                  <Content component="span" style={{ fontWeight: 600 }}>
                    {scheduledWindowLine ?? maintenanceWindowLine}
                  </Content>
                  . The agent will re-analyze before that window and remind you to confirm execution.
                </Content>
              </Alert>
            )}
            {planDecision === "rejected" && (
              <Alert
                variant="danger"
                isInline
                title="Plan rejected"
                actionLinks={
                  <>
                    <Button variant="link" isDisabled={isPlanLoading} icon={<RefreshCw aria-hidden />} onClick={runGeneratePlan}>
                      Generate new plan
                    </Button>
                    <Button variant="link" onClick={() => setPlanDecision("pending")}>
                      Undo
                    </Button>
                  </>
                }
              >
                <Content component="p" style={{ margin: 0 }}>
                  Generate a new plan for your chosen target version, or adjust the target above and run again.
                </Content>
              </Alert>
            )}
          </Flex>
        </CardFooter>
      </Card>
    </Flex>

      <Modal
        className="ocs-cluster-update-modal"
        variant="medium"
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        aria-labelledby="agent-approve-title"
        aria-describedby="agent-approve-desc"
      >
        <ModalHeader labelId="agent-approve-title" title="Approve and start update" />
        <ModalBody id="agent-approve-desc">
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Content component="p" style={{ margin: 0 }}>
              You are about to approve the {AI_GENERATED_PLAN_HEADING} and start the cluster update from{" "}
              <code>{AGENT_CLUSTER_CURRENT_VERSION}</code> to <code>{selectedVersion}</code> on channel{" "}
              <strong>{selectedChannel}</strong>.
            </Content>
            <Content component="p" style={{ margin: 0 }}>
              By clicking &quot;Start update,&quot; you are confirming that you have reviewed the plan and understand its
              potential outcomes.
            </Content>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex
            justifyContent={{ default: "justifyContentFlexEnd" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Button variant="link" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Play aria-hidden />} onClick={confirmApproveAndStart}>
              Start update
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>

      <Modal
        className="ocs-cluster-update-modal"
        variant="medium"
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        aria-labelledby="agent-reject-title"
        aria-describedby="agent-reject-desc"
      >
        <ModalHeader labelId="agent-reject-title" title="Reject this plan?" />
        <ModalBody id="agent-reject-desc">
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Content component="p" style={{ margin: 0 }}>
              Rejecting stops this proposed update for <code>{selectedVersion}</code>. No changes will be applied until you approve a new plan.
            </Content>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex justifyContent={{ default: "justifyContentFlexEnd" }} gap={{ default: "gapMd" }}>
            <Button variant="link" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRejectPlan}>
              Reject plan
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>

      <Modal
        className="ocs-cluster-update-modal"
        variant="large"
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        aria-labelledby="agent-schedule-title"
        aria-describedby="agent-schedule-desc"
      >
        <ModalHeader labelId="agent-schedule-title" title="Schedule update window" />
        <ModalBody id="agent-schedule-desc">
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            <Content component="p" style={{ margin: 0 }}>
              Choose when the agent should target execution. You can pick a preset or set a custom date and time.
            </Content>
            <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => applySchedulePreset("2026-04-15", "02:00", "Eastern Time (ET)")}
              >
                Agent recommendation
              </Button>
              <Button
                variant="secondary"
                onClick={() => applySchedulePreset("2026-04-12", "23:00", "Eastern Time (ET)")}
              >
                This weekend · 11:00 PM
              </Button>
              <Button variant="secondary" onClick={() => applySchedulePreset("2026-04-18", "06:00", "UTC")}>
                Next week · 6:00 AM UTC
              </Button>
            </Flex>
            <Flex
              direction={{ default: "column", md: "row" }}
              gap={{ default: "gapMd", md: "gapLg" }}
              alignItems={{ default: "alignItemsFlexStart" }}
              flexWrap={{ default: "wrap" }}
              className="ocs-schedule-modal-fields"
            >
              <FlexItem className="ocs-schedule-modal-field">
                <FormGroup label="Date" fieldId="schedule-date">
                  <DatePicker
                    value={scheduleDate}
                    onChange={(_event, value) => {
                      if (value) setScheduleDate(value);
                    }}
                    placeholder="YYYY-MM-DD"
                    aria-label="Schedule date"
                    appendTo={() => document.body}
                    inputProps={{ id: "schedule-date" }}
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem className="ocs-schedule-modal-field">
                <FormGroup label="Time" fieldId="schedule-time">
                  <TimePicker
                    time={scheduleTime}
                    onChange={(_event, time) => setScheduleTime(time)}
                    is24Hour
                    placeholder="HH:MM"
                    aria-label="Schedule time"
                    menuAppendTo={() => document.body}
                    width="10rem"
                    inputProps={{ id: "schedule-time" }}
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem className="ocs-schedule-modal-field ocs-schedule-modal-field--timezone">
                <FormGroup label="Timezone" fieldId="schedule-tz">
                  <FormSelect
                    id="schedule-tz"
                    value={scheduleTzLabel}
                    onChange={(_e, value) => setScheduleTzLabel(value)}
                    aria-label="Timezone"
                  >
                    <option value="Eastern Time (ET)">Eastern Time (ET)</option>
                    <option value="Central Time (CT)">Central Time (CT)</option>
                    <option value="Pacific Time (PT)">Pacific Time (PT)</option>
                    <option value="UTC">UTC</option>
                  </FormSelect>
                </FormGroup>
              </FlexItem>
            </Flex>
            <Content component="p" style={{ margin: 0 }}>
              Preview: <strong>{formatAgentScheduleLine(scheduleDate, scheduleTime, scheduleTzLabel)}</strong>
            </Content>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex justifyContent={{ default: "justifyContentFlexEnd" }} gap={{ default: "gapMd" }}>
            <Button variant="link" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Calendar aria-hidden />} onClick={confirmScheduleWindow}>
              Save schedule
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>
    </>
  );
}

/* ─── Operators on this cluster ─── */
type OperatorClusterFilters = { name: string };
type OperatorClusterSortColumn = "name" | "status" | "version" | "compatibility" | "lastUpdated";

function sortOperatorClusterRows(
  rows: Array<InstalledOperator & { clusterCompatibility: string }>,
  column: OperatorClusterSortColumn,
  direction: SortDirection
) {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "status":
        return compareStrings(
          a.updateAvailable ? "Update available" : "Up to date",
          b.updateAvailable ? "Update available" : "Up to date",
          direction
        );
      case "version":
        return compareStrings(a.version, b.version, direction);
      case "compatibility":
        return compareStrings(a.clusterCompatibility, b.clusterCompatibility, direction);
      case "lastUpdated":
        return compareStrings(a.lastUpdated || "", b.lastUpdated || "", direction);
      default:
        return 0;
    }
  });
}

function OperatorsOnClusterSection({ selectedVersion, operators, navigate }: { selectedVersion: string; operators: InstalledOperator[]; navigate: ReturnType<typeof useNavigate> }) {
  const [updateAll, setUpdateAll] = useState(false);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<OperatorClusterFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<OperatorClusterSortColumn>("name");

  const rowsWithCompat = useMemo(
    () =>
      operators.map((op) => {
        const compat = getOperatorCompatibility(op, selectedVersion);
        return { ...op, clusterCompatibility: compat.compatibility };
      }),
    [operators, selectedVersion]
  );

  const filteredRows = useMemo(() => {
    const nameQ = (filters.name ?? "").trim().toLowerCase();
    return rowsWithCompat.filter((op) => !nameQ || op.name.toLowerCase().includes(nameQ));
  }, [rowsWithCompat, filters.name]);

  const sortedRows = useMemo(
    () => sortOperatorClusterRows(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );

  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 8);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const colSpan = 5;

  return (
    <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px] mb-[16px]">
      <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px] mb-[16px]">Operators on this cluster</h2>

      <div className="rounded-[8px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] overflow-hidden">
        <DataView ouiaId="operators-on-cluster-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="operators-on-cluster-dv-toolbar"
            id="operators-on-cluster-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<OperatorClusterFilters>
                values={filters}
                onChange={(_filterId, partial) => onSetFilters(partial)}
                breakpoint="xl"
              >
                <DataViewTextFilter
                  title="Name"
                  filterId="name"
                  placeholder="Filter by name..."
                  style={{ minWidth: "16rem", maxWidth: "100%" }}
                />
              </IoDataViewFiltersWithMidActions>
            }
            pagination={
              <Pagination
                perPageOptions={[
                  { title: "8", value: 8 },
                  { title: "20", value: 20 },
                  { title: "50", value: 50 },
                ]}
                itemCount={itemCount}
                page={page}
                perPage={perPage}
                onSetPage={(_e, p) => setPage(p)}
                onPerPageSelect={(_e, pp) => {
                  setPerPage(pp);
                  setPage(1);
                }}
                variant={PaginationVariant.top}
                isCompact
                ouiaId="operators-on-cluster-pagination"
                widgetId="operators-on-cluster-pagination"
                titles={{ items: "operators" }}
                paginationAriaLabel="Operators on cluster pagination"
              />
            }
          />

          <OcsPrototypeListTable ariaLabel="Operators on this cluster">
            <Thead>
              <Tr>
                <Th dataLabel="Name">
                  <SortableTableHeader
                    label="Name"
                    column="name"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Status">
                  <SortableTableHeader
                    label="Status"
                    column="status"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Version">
                  <SortableTableHeader
                    label="Version"
                    column="version"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Cluster compatibility">
                  <SortableTableHeader
                    label="Cluster compatibility"
                    column="compatibility"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Last updated">
                  <SortableTableHeader
                    label="Last updated"
                    column="lastUpdated"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 ? (
                <Tr>
                  <Td colSpan={colSpan} dataLabel="Empty state">
                    <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                      No operators match your filters.
                    </Content>
                  </Td>
                </Tr>
              ) : (
                paginated.map((op) => (
                  <Tr key={op.name}>
                    <Td dataLabel="Name">
                      <Button
                        variant="link"
                        isInline
                        onClick={() => navigate(`/ecosystem/installed-operators/${encodeURIComponent(op.name)}`)}
                      >
                        {op.name}
                      </Button>
                    </Td>
                    <Td dataLabel="Status">
                      <span className={`inline-flex items-center gap-[4px] text-[12px] ${op.updateAvailable ? "text-[#0066cc]" : "text-[#3e8635]"}`}>
                        {op.updateAvailable ? (
                          <>
                            <ArrowRight className="size-[12px]" /> Update available
                          </>
                        ) : (
                          <>
                            <CheckCircle className="size-[12px]" /> Up to date
                          </>
                        )}
                      </span>
                    </Td>
                    <Td dataLabel="Version">
                      <Content component="small">{op.version}</Content>
                    </Td>
                    <Td dataLabel="Cluster compatibility">
                      <span
                        className={`text-[12px] ${
                          op.clusterCompatibility === "Compatible"
                            ? "text-[#3e8635]"
                            : op.clusterCompatibility === "Incompatible"
                              ? "text-[#c9190b]"
                              : "text-[#795600]"
                        }`}
                      >
                        {op.clusterCompatibility}
                      </span>
                    </Td>
                    <Td dataLabel="Last updated">
                      <Content component="small">{op.lastUpdated || "—"}</Content>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </OcsPrototypeListTable>
        </DataView>
      </div>

      {operators.length > 8 && (
        <button onClick={() => navigate("/ecosystem/installed-operators")}
          className="mt-[12px] text-[13px] text-[#0066cc] dark:text-[#4dabf7] bg-transparent border-0 cursor-pointer hover:underline font-['Red_Hat_Text:Regular',sans-serif] font-medium">
          View all {operators.length} operators →
        </button>
      )}

      <div className="flex items-center gap-[8px] mt-[16px] pt-[16px] border-t border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
        <button onClick={() => setUpdateAll(!updateAll)}
          className={`relative w-[36px] h-[20px] rounded-full border-0 cursor-pointer transition-colors ${updateAll ? "bg-[#0066cc]" : "bg-[#8a8d90]"}`}>
          <div className={`absolute top-[2px] size-[16px] rounded-full bg-white transition-transform ${updateAll ? "left-[18px]" : "left-[2px]"}`} />
        </button>
        <span className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif]">Update all operators</span>
      </div>
    </div>
  );
}

/* ─── Worker Nodes on this cluster ─── */
type WorkerPoolRow = {
  pool: string;
  status: "Update required" | "Up to date";
  version: string;
  targetVersion: string | null;
  compatibility: "compatible";
  nodes: number;
  readyNodes: number;
};

function WorkerNodesSection({ targetClusterVersion }: { targetClusterVersion: string }) {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [updateAll, setUpdateAll] = useState(false);
  const isGlass = usePatternFlyGlassActive();

  const workerPools: WorkerPoolRow[] = useMemo(() => {
    const current = AGENT_CLUSTER_CURRENT_VERSION;
    const needsUpdate = targetClusterVersion !== current;
    return [
      {
        pool: "worker",
        status: needsUpdate ? ("Update required" as const) : ("Up to date" as const),
        version: current,
        targetVersion: needsUpdate ? targetClusterVersion : null,
        compatibility: "compatible" as const,
        nodes: 4,
        readyNodes: 4,
      },
      {
        pool: "infra",
        status: needsUpdate ? ("Update required" as const) : ("Up to date" as const),
        version: current,
        targetVersion: needsUpdate ? targetClusterVersion : null,
        compatibility: "compatible" as const,
        nodes: 2,
        readyNodes: 2,
      },
    ];
  }, [targetClusterVersion]);

  const poolsNeedingUpdate = workerPools.filter((p) => p.status === "Update required").length;

  return (
    <Card
      id="cluster-update-worker-nodes"
      isGlass={isGlass}
      component="div"
      isExpanded={sectionExpanded}
      style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
    >
      <CardHeader
        onExpand={(_event) => setSectionExpanded((prev) => !prev)}
        toggleButtonProps={{
          id: "cluster-update-worker-nodes-expand",
          "aria-labelledby": "cluster-update-worker-nodes-title",
        }}
      >
        <CardTitle>
          <Title headingLevel="h2" size="xl" id="cluster-update-worker-nodes-title">
            Worker nodes on this cluster
          </Title>
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            {poolsNeedingUpdate > 0 && (
              <Alert variant="warning" isInline title="Node pools need attention" icon={<AlertTriangle aria-hidden />}>
                <Content component="p">
                  {poolsNeedingUpdate} node pool{poolsNeedingUpdate !== 1 ? "s" : ""} require
                  {poolsNeedingUpdate === 1 ? "s" : ""} an update
                </Content>
              </Alert>
            )}

            <OcsNamedResourceDataView
              ouiaId="cluster-update-worker-pools-data-view"
              ariaLabel="Worker node pools"
              itemsLabel="pools"
              items={workerPools}
              getName={(pool) => pool.pool}
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
                    <Th dataLabel="Nodes">
                      <PlainTableHeader label="Nodes" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((pool) => (
                    <Tr key={pool.pool}>
                      <Td dataLabel="Pool">
                        <Content component="p">
                          <strong>{pool.pool}</strong>
                        </Content>
                      </Td>
                      <Td dataLabel="Status">
                        {pool.status === "Update required" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="warning">
                              <AlertTriangle />
                            </Icon>
                            {pool.status}
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle />
                            </Icon>
                            {pool.status}
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Version">
                        <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                          <Content component="small" style={{ margin: 0 }}>
                            <code>{pool.version}</code>
                            {pool.targetVersion ? (
                              <>
                                {" "}
                                <span className="text-[#6a6e73] dark:text-[#8a8d90]">→</span>{" "}
                                <code>{pool.targetVersion}</code>
                              </>
                            ) : null}
                          </Content>
                          {pool.targetVersion ? (
                            <Content component="small" style={{ margin: 0 }} className="pf-v6-u-font-size-xs">
                              Matches cluster update target
                            </Content>
                          ) : null}
                        </Flex>
                      </Td>
                      <Td dataLabel="Nodes">
                        {pool.readyNodes}/{pool.nodes} ready
                      </Td>
                      <Td dataLabel="Cluster compatibility">
                        <Label color="green" isCompact>
                          Compatible
                        </Label>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>

            <Switch
              id="cluster-update-all-worker-nodes"
              label="Update all worker nodes"
              isChecked={updateAll}
              onChange={(_e, c) => setUpdateAll(c)}
            />
          </Flex>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
}

/** Older minor / z-stream lines (e.g. 5.0) alongside a blocked newer minor — show bugfix-path hint. */
function shouldShowBugfixPathCallout(groups: VersionGroup[]): boolean {
  const hasOlderMinor = groups.some(
    (g) => g.label === "5.0" || g.label.startsWith("5.0 ") || /^4\.\d+/.test(g.label)
  );
  if (!hasOlderMinor) return false;
  return groups.some((g) =>
    g.versions.some((v) =>
      (v.operatorIssues ?? []).some(
        (i) =>
          i.slug === "ClusterLoggingMaxVersion" ||
          i.name === "ClusterLoggingMaxVersion" ||
          /maximum supported OCP version is 5\.0/i.test(i.message ?? "")
      )
    )
  );
}

/* ─── Available Updates Section ─── */
export function AvailableUpdatesSection({
  channelData,
  expandedGroups,
  setExpandedGroups,
  selectedVersion,
  setSelectedVersion,
  navigate,
  setActiveTab,
  openChatbot: _openChatbot,
  selectedChannel,
  handleChannelChange,
}: any) {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const groups = channelData.groups as VersionGroup[];
  const showBugfixHint = shouldShowBugfixPathCallout(groups);
  const isGlass = usePatternFlyGlassActive();

  return (
    <Card
      id="cluster-update-available-updates"
      isGlass={isGlass}
      component="div"
      isExpanded={sectionExpanded}
      style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
    >
      <CardHeader
        onExpand={(_event) => setSectionExpanded((prev) => !prev)}
        toggleButtonProps={{
          id: "cluster-update-available-updates-expand",
          "aria-labelledby": "cluster-update-available-updates-title",
        }}
      >
        <CardTitle>
          <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
            <Title headingLevel="h2" size="xl" id="cluster-update-available-updates-title">
              Available updates
            </Title>
            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <InfoTooltip />
            </span>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            <Flex
              direction={{ default: "column" }}
              gap={{ default: "gapMd" }}
              style={{
                paddingBottom: "var(--pf-t--global--spacer--lg)",
                borderBottom: "1px solid var(--pf-t--global--border--color--default)",
              }}
            >
              <Flex
                gap={{ default: "gapMd" }}
                alignItems={{ default: "alignItemsFlexEnd" }}
                flexWrap={{ default: "wrap" }}
              >
                <FormGroup label="Channel" fieldId="cluster-update-channel">
                  <FormSelect
                    id="cluster-update-channel"
                    value={selectedChannel}
                    onChange={(_e, value) => handleChannelChange(value)}
                    aria-label="Update channel"
                  >
                    <option value="fast-5.1">fast-5.1</option>
                    <option value="stable-5.1">stable-5.1</option>
                    <option value="candidate-5.1">candidate-5.1</option>
                    <option value="eus-5.0">eus-5.0</option>
                  </FormSelect>
                </FormGroup>
                <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  <ChannelTooltip />
                </span>
              </Flex>
            </Flex>

            {showBugfixHint && (
              <Alert
                variant="info"
                isInline
                isPlain
                title="Bugfix path"
                icon={<Info aria-hidden />}
              >
                <Content component="p">
                  Not interested in addressing <strong>ClusterLoggingMaxVersion</strong> today? You still have bugfix
                  options — use the <strong>5.0</strong> (and older) update lines below for z-stream releases without taking
                  the minor bump.
                </Content>
              </Alert>
            )}

            {groups.length === 0 ? (
              <Content component="p">No updates available for this channel.</Content>
            ) : (
              <Accordion
                aria-label="OpenShift release versions"
                isBordered
                displaySize="lg"
                headingLevel="h3"
                togglePosition="start"
              >
                {groups.map((group: VersionGroup) => (
                  <VersionGroupComponent
                    key={group.label}
                    label={group.label}
                    versions={group.versions}
                    expanded={!!expandedGroups[group.label]}
                    setExpanded={(val: boolean) =>
                      setExpandedGroups((prev: Record<string, boolean>) => {
                        if (val) {
                          const next: Record<string, boolean> = {};
                          for (const g of groups) {
                            next[g.label] = g.label === group.label;
                          }
                          return next;
                        }
                        return { ...prev, [group.label]: false };
                      })
                    }
                    selectedVersion={selectedVersion}
                    setSelectedVersion={setSelectedVersion}
                    navigate={navigate}
                    setActiveTab={setActiveTab}
                  />
                ))}
              </Accordion>
            )}
          </Flex>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
}

/* ─── Installed Operators Section (OLM-integrated widget) ─── */
function InstalledOperatorsSection({ selectedVersion, operators, navigate }: { selectedVersion: string; operators: InstalledOperator[]; navigate: ReturnType<typeof useNavigate> }) {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [filterCompat, setFilterCompat] = useState<"all" | "incompatible" | "update-available">("all");
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [openKebabFor, setOpenKebabFor] = useState<string | null>(null);
  const [updateAll, setUpdateAll] = useState(false);
  const isGlass = usePatternFlyGlassActive();

  const operatorsWithCompat = operators.map((op) => {
    const { compatibility, message } = getOperatorCompatibility(op, selectedVersion);
    return { ...op, clusterCompatibility: compatibility, compatibilityMessage: message || op.compatibilityMessage };
  });

  const filtered = operatorsWithCompat.filter((op) => {
    if (filterCompat === "incompatible") return op.clusterCompatibility === "Incompatible";
    if (filterCompat === "update-available") return !!op.updateAvailable;
    return true;
  });
  const incompatibleCount = operatorsWithCompat.filter((op) => op.clusterCompatibility === "Incompatible").length;
  const updateAvailableCount = operatorsWithCompat.filter((op) => op.updateAvailable).length;
  const clusterUpdateBlockedByOperators = incompatibleCount > 0;

  const navigateToUpdate = (op: (typeof operatorsWithCompat)[0]) => {
    navigate(`/ecosystem/installed-operators/${encodeURIComponent(op.name)}/update`, {
      state: { returnTo: "/administration/cluster-update", operatorName: op.name, operatorData: op },
    });
  };

  const handleSelectAll = (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    if (checked) {
      setSelectedOperators(filtered.map((op) => op.name));
    } else {
      setSelectedOperators([]);
    }
  };

  const handleSelectOperator = (name: string, checked: boolean) => {
    if (checked) {
      setSelectedOperators((prev) => (prev.includes(name) ? prev : [...prev, name]));
    } else {
      setSelectedOperators((prev) => prev.filter((n) => n !== name));
    }
  };

  const supportLabelColor = (t?: InstalledOperator["supportBadgeType"]) => {
    if (t === "danger") return "red";
    if (t === "warning") return "orange";
    return "green";
  };

  return (
    <Card
      id="operators-section"
      isGlass={isGlass}
      component="div"
      isExpanded={sectionExpanded}
      style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
    >
      <CardHeader
        onExpand={(_event) => setSectionExpanded((prev) => !prev)}
        toggleButtonProps={{
          id: "cluster-update-operators-expand",
          "aria-labelledby": "cluster-update-operators-title",
        }}
      >
        <CardTitle>
          <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
            <Title headingLevel="h2" size="xl" id="cluster-update-operators-title">
              Operators on this cluster
            </Title>
            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <InfoTooltip />
            </span>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsFlexStart" }} flexWrap={{ default: "wrap" }}>
              <Content component="p">
                {operators.length} catalog operators installed · Compatibility for <strong>{selectedVersion}</strong> —
                assessed with platform operators in unified AI pre-checks.
              </Content>
              <ToggleGroup aria-label="Filter operators by compatibility" isCompact>
                <ToggleGroupItem
                  text="All"
                  isSelected={filterCompat === "all"}
                  onChange={() => setFilterCompat("all")}
                />
                <ToggleGroupItem
                  text={`Incompatible (${incompatibleCount})`}
                  isSelected={filterCompat === "incompatible"}
                  onChange={() => setFilterCompat("incompatible")}
                />
                <ToggleGroupItem
                  text={`Updates available (${updateAvailableCount})`}
                  isSelected={filterCompat === "update-available"}
                  onChange={() => setFilterCompat("update-available")}
                />
              </ToggleGroup>
            </Flex>

            {clusterUpdateBlockedByOperators && filterCompat !== "update-available" && (
              <Alert variant="danger" isInline title="Cluster update blocked" icon={<AlertCircle aria-hidden />}>
                <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                    <Content component="p">
                      {incompatibleCount} operator{incompatibleCount !== 1 ? "s are" : " is"} incompatible with the target
                      cluster version. Update these operators or accept the associated risks before proceeding with the
                      cluster update.
                    </Content>
                    <Label color="red" isCompact>
                      Not eligible to update
                    </Label>
                  </Flex>
                  <List isPlain>
                    {operatorsWithCompat
                      .filter((op) => op.clusterCompatibility === "Incompatible")
                      .map((op) => (
                        <ListItem key={op.name}>
                          <strong>{op.name}</strong> ({op.version}): {op.compatibilityMessage}{" "}
                          {op.updateAvailable ? (
                            <Button variant="link" isInline onClick={() => navigateToUpdate(op)}>
                              Update to {op.updateAvailable}
                            </Button>
                          ) : null}
                        </ListItem>
                      ))}
                  </List>
                </Flex>
              </Alert>
            )}

            <OcsNamedResourceDataView
              ouiaId="cluster-update-installed-operators-data-view"
              ariaLabel="Operators on this cluster"
              itemsLabel="operators"
              items={filtered}
              getName={(op) => op.name}
            >
              {(rows) => (
                <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Select all rows">
                      <Checkbox
                        id="cluster-update-select-all-operators-header"
                        isChecked={
                          rows.length > 0 && selectedOperators.length === filtered.length
                            ? true
                            : selectedOperators.length > 0
                              ? null
                              : false
                        }
                        onChange={handleSelectAll}
                        aria-label="Select all in view"
                      />
                    </Th>
                    <Th dataLabel="Operator">
                      <PlainTableHeader label="Operator" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                    <Th dataLabel="Update plan">
                      <PlainTableHeader label="Update plan" />
                    </Th>
                    <Th dataLabel="Support">
                      <PlainTableHeader label="Support" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Last updated">
                      <PlainTableHeader label="Last updated" />
                    </Th>
                    <Th dataLabel="Managed namespaces">
                      <PlainTableHeader label="Managed namespaces" />
                    </Th>
                    <Th screenReaderText="Actions" />
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.length === 0 ? (
                    <Tr>
                      <Td colSpan={10}>
                        <Content component="p">No operators match your filter.</Content>
                      </Td>
                    </Tr>
                  ) : (
                    rows.map((op) => (
                      <Tr key={op.name}>
                        <Td dataLabel="Select row">
                          <Checkbox
                            id={`sel-${op.name}`}
                            isChecked={selectedOperators.includes(op.name)}
                            onChange={(_e, c) => handleSelectOperator(op.name, c)}
                            aria-label={`Select ${op.name}`}
                          />
                        </Td>
                        <Td dataLabel="Operator">
                          <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                            <Flex flexWrap={{ default: "flexWrapWrap" }} gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                              <Button
                                variant="link"
                                isInline
                                component={Link}
                                to={`/ecosystem/installed-operators/${encodeURIComponent(op.name)}`}
                              >
                                {op.name}
                              </Button>
                              {op.requiredBeforeClusterUpdate ? (
                                <Label color="orange" isCompact>
                                  Required
                                </Label>
                              ) : null}
                            </Flex>
                            <Content component="small">
                              <code>{op.namespace}</code>
                            </Content>
                          </Flex>
                        </Td>
                        <Td dataLabel="Version">
                          <Content component="small">
                            <code>{op.version}</code>
                          </Content>
                        </Td>
                        <Td dataLabel="Cluster compatibility">
                          {op.clusterCompatibility === "Compatible" ? (
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Icon status="success">
                                <CheckCircle />
                              </Icon>
                              Compatible
                            </Flex>
                          ) : op.clusterCompatibility === "Incompatible" ? (
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Icon status="danger">
                                <AlertCircle />
                              </Icon>
                              Incompatible
                            </Flex>
                          ) : (
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Icon status="warning">
                                <AlertTriangle />
                              </Icon>
                              Unknown
                            </Flex>
                          )}
                        </Td>
                        <Td dataLabel="Update plan">{op.autoUpdate ? "Automatic" : "Manual"}</Td>
                        <Td dataLabel="Support">
                          <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                            <Content component="small">{op.supportEndDate || "—"}</Content>
                            {op.supportBadge ? (
                              <Label color={supportLabelColor(op.supportBadgeType)} isCompact>
                                {op.supportBadge}
                              </Label>
                            ) : null}
                          </Flex>
                        </Td>
                        <Td dataLabel="Status">
                          {op.status === "Running" ? (
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Icon status="success">
                                <CheckCircle />
                              </Icon>
                              Running
                            </Flex>
                          ) : op.status === "Degraded" ? (
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Icon status="danger">
                                <AlertCircle />
                              </Icon>
                              Degraded
                            </Flex>
                          ) : (
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Icon status="warning">
                                <Clock />
                              </Icon>
                              Pending
                            </Flex>
                          )}
                        </Td>
                        <Td dataLabel="Last updated" modifier="nowrap">
                          {op.lastUpdated || "—"}
                        </Td>
                        <Td dataLabel="Managed namespaces">
                          <Flex gap={{ default: "gapXs" }} flexWrap={{ default: "flexWrapWrap" }}>
                            {(op.managedNamespaces || []).map((ns, idx) => (
                              <Label key={idx} isCompact variant="outline" color="grey">
                                {ns}
                              </Label>
                            ))}
                          </Flex>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Dropdown
                            isOpen={openKebabFor === op.name}
                            onOpenChange={(open) => setOpenKebabFor(open ? op.name : null)}
                            popperProps={{ position: "right-end" }}
                            toggle={(toggleRef) => (
                              <MenuToggle
                                ref={toggleRef}
                                variant="plain"
                                aria-label={`Actions for ${op.name}`}
                                icon={<EllipsisVIcon />}
                                onClick={() => setOpenKebabFor(openKebabFor === op.name ? null : op.name)}
                                isExpanded={openKebabFor === op.name}
                              />
                            )}
                            onSelect={() => setOpenKebabFor(null)}
                          >
                            <DropdownItem
                              itemId="view"
                              onClick={() =>
                                navigate(`/ecosystem/installed-operators/${encodeURIComponent(op.name)}`)
                              }
                            >
                              View details
                            </DropdownItem>
                            {op.updateAvailable ? (
                              <DropdownItem itemId="update" onClick={() => navigateToUpdate(op)}>
                                Update to {op.updateAvailable}
                              </DropdownItem>
                            ) : null}
                            <DropdownItem
                              itemId="subscription"
                              onClick={() =>
                                navigate(`/ecosystem/installed-operators/${encodeURIComponent(op.name)}/subscription`)
                              }
                            >
                              Edit subscription
                            </DropdownItem>
                          </Dropdown>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>

            <Switch
              id="cluster-update-all-operators"
              label="Update all operators"
              isChecked={updateAll}
              onChange={(_e, c) => setUpdateAll(c)}
            />
          </Flex>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
}

/* ─── Version Group ─── */

const PREFLIGHT_RISKS: Record<string, OperatorIssue[]> = {
  "5.1.10": [
    { name: "PodDisruptionBudgetAtLimit", slug: "PodDisruptionBudgetAtLimit", severity: "warning", message: "PDB \"zookeeper-pdb\" in namespace data-services is at maxUnavailable=0. Pod eviction during node drain may stall the update.", url: "https://docs.openshift.com/container-platform/latest/nodes/pods/nodes-pods-configuring.html#nodes-pods-configuring-pod-distruption-about_nodes-pods-configuring", source: "preflight", resolution: { type: "accept-only", description: "Adjust the PDB maxUnavailable to at least 1, or accept that node drains may take longer." } },
    { name: "DeprecatedAPIInUse", slug: "DeprecatedAPIInUse", severity: "critical", message: "3 resources still using rbac.authorization.k8s.io/v1beta1 — migrate to v1 before updating. Affected: ClusterRoleBinding/legacy-admin, RoleBinding/app-reader, RoleBinding/ci-deployer.", url: "https://docs.openshift.com/container-platform/latest/updating/preparing_for_updates/updating-cluster-prepare.html#update-preparing-migrate_updating-cluster-prepare", source: "preflight", resolution: { type: "update-z-stream", description: "Migrate deprecated API resources to v1 before proceeding. Run `oc get apirequestcounts` to identify all affected resources." } },
  ],
  "5.1.9": [
    { name: "PodDisruptionBudgetAtLimit", slug: "PodDisruptionBudgetAtLimit", severity: "warning", message: "PDB \"zookeeper-pdb\" in namespace data-services is at maxUnavailable=0. Pod eviction during node drain may stall the update.", source: "preflight", resolution: { type: "accept-only", description: "Adjust the PDB maxUnavailable to at least 1, or accept that node drains may take longer." } },
  ],
};

function VersionGroupComponent({ label, versions, expanded, setExpanded, selectedVersion, setSelectedVersion, navigate }: any) {
  const [acceptedSlugs, setAcceptedSlugs] = useState<Set<string>>(new Set());
  const [expandedRiskSlug, setExpandedRiskSlug] = useState<string | null>(null);
  const [expandedRiskDetail, setExpandedRiskDetail] = useState<string | null>(null);
  type PreflightStatus = "idle" | "checking-health" | "checking-operators" | "checking-apis" | "checking-nodes" | "complete";
  const [preflightStatus, setPreflightStatus] = useState<PreflightStatus>("idle");
  const riskReviewRef = useRef<HTMLDivElement>(null);

  const isPreflightRunning = preflightStatus !== "idle" && preflightStatus !== "complete";

  const preflightStepLabel: Record<PreflightStatus, string> = {
    "idle": "",
    "checking-health": "Checking cluster health…",
    "checking-operators": "Checking operator compatibility…",
    "checking-apis": "Checking API deprecations…",
    "checking-nodes": "Checking worker nodes…",
    "complete": "",
  };

  const toggleAccept = (slug: string) => {
    setAcceptedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const runPreflight = useCallback(() => {
    if (isPreflightRunning) return;
    const steps: PreflightStatus[] = ["checking-health", "checking-operators", "checking-apis", "checking-nodes", "complete"];
    let i = 0;
    const advance = () => {
      setPreflightStatus(steps[i]);
      i++;
      if (i < steps.length) setTimeout(advance, 1000);
    };
    advance();
  }, [isPreflightRunning]);

  useEffect(() => {
    setPreflightStatus("idle" as PreflightStatus);
  }, [selectedVersion]);

  const selectedVer = versions.find((v: VersionEntry) => v.version === selectedVersion);

  const preflightRisks: OperatorIssue[] = preflightStatus === "complete" && selectedVersion
    ? (PREFLIGHT_RISKS[selectedVersion] || [])
    : [];

  const allRisks: (OperatorIssue & { resolved?: boolean })[] = [];
  if (selectedVer?.operatorIssues) {
    for (const issue of selectedVer.operatorIssues) {
      allRisks.push({ ...issue, source: issue.source || "cincinnati", resolved: false });
    }
  }
  for (const pr of preflightRisks) {
    if (!allRisks.some(r => r.slug === pr.slug)) {
      allRisks.push({ ...pr, resolved: false });
    }
  }
  const addressedCount = allRisks.filter(r => acceptedSlugs.has(r.slug) || r.resolved).length;
  const allAddressed = allRisks.length > 0 && addressedCount === allRisks.length;
  const hasNoRisks = allRisks.length === 0;
  const canUpdate = hasNoRisks || allAddressed;

  // Compute shared risks (present on ALL versions in the group)
  const allGroupSlugs = versions.map((v: VersionEntry) => new Set((v.operatorIssues || []).map((i: OperatorIssue) => i.slug)));
  const sharedSlugs: string[] = [];
  if (allGroupSlugs.length > 0) {
    for (const slug of allGroupSlugs[0]) {
      if (allGroupSlugs.every((s: Set<string>) => s.has(slug))) sharedSlugs.push(slug);
    }
  }

  // Per-version unique risks (not in shared set)
  const getUniqueRisks = (v: VersionEntry) => (v.operatorIssues || []).filter((i: OperatorIssue) => !sharedSlugs.includes(i.slug));

  const releaseToggleId = `cluster-update-release-${label.replace(/[^a-zA-Z0-9_-]/g, "")}-toggle`;
  const releaseContentId = `cluster-update-release-${label.replace(/[^a-zA-Z0-9_-]/g, "")}-content`;

  return (
    <AccordionItem isExpanded={expanded}>
      <AccordionToggle
        id={releaseToggleId}
        component="div"
        onClick={() => setExpanded(!expanded)}
      >
        <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
          <Title headingLevel="h3" size="lg">
            {label}
          </Title>
          <Label color="blue" isCompact>
            {versions.length} update{versions.length !== 1 ? "s" : ""}
          </Label>
          {sharedSlugs.length > 0 ? (
            <Content component="small">
              All versions exposed to <code>{sharedSlugs.join(", ")}</code>
            </Content>
          ) : null}
        </Flex>
      </AccordionToggle>
      <AccordionContent id={releaseContentId} aria-labelledby={releaseToggleId}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          {versions.map((v: VersionEntry) => {
            const isSelected = selectedVersion === v.version;
            const uniqueRisks = getUniqueRisks(v);
            const selectThisVersion = () => {
              setSelectedVersion(v.version);
              setAcceptedSlugs(new Set());
              setExpandedRiskSlug(null);
            };
            const showRiskReview = isSelected && selectedVer && selectedVer.version === v.version;
            return (
              <div
                key={v.version}
                className={`ocp-version-line${isSelected ? " ocp-version-line--selected" : ""}`}
              >
                <div
                  className="ocp-version-line__body"
                  onClick={selectThisVersion}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectThisVersion();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Version ${v.version}${isSelected ? ", selected" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                    <Flex
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      alignItems={{ default: "alignItemsCenter" }}
                      flexWrap={{ default: "wrap" }}
                      gap={{ default: "gapMd" }}
                    >
                      <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                        <Radio
                          id={`cluster-update-version-${label}-${v.version.replace(/\./g, "-")}`}
                          name={`cluster-update-version-choice-${label}`}
                          isChecked={isSelected}
                          onChange={selectThisVersion}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select version ${v.version}`}
                        />
                        <Button
                          variant="link"
                          isInline
                          component={Link}
                          to={`/administration/cluster-update/version/${v.version}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <code>{v.version}</code>
                        </Button>
                        {v.recommended ? (
                          <Label color="blue" isCompact>
                            Recommended
                          </Label>
                        ) : null}
                        <Content component="small">{v.date}</Content>
                      </Flex>
                      {isSelected ? (
                        <Label color="blue" isCompact>
                          Selected version
                        </Label>
                      ) : null}
                    </Flex>
                    <Content component="p">
                      {v.features} features · {v.bugFixes} bug fixes{" "}
                      <Button
                        variant="link"
                        isInline
                        component="a"
                        href="https://docs.openshift.com/container-platform/latest/release_notes/ocp-4-18-release-notes.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        icon={<ExternalLink aria-hidden />}
                        iconPosition="end"
                      >
                        Release notes
                      </Button>
                    </Content>
                    {uniqueRisks.length > 0 ? (
                      <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "flexWrapWrap" }}>
                        {uniqueRisks.map((risk: OperatorIssue) => (
                          <Button
                            key={risk.slug}
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRiskSlug(expandedRiskSlug === `${v.version}:${risk.slug}` ? null : `${v.version}:${risk.slug}`);
                              setSelectedVersion(v.version);
                            }}
                          >
                            {risk.slug}
                          </Button>
                        ))}
                      </Flex>
                    ) : null}
                    {uniqueRisks.map((risk: OperatorIssue) =>
                      expandedRiskSlug === `${v.version}:${risk.slug}` ? (
                        <Alert
                          key={`detail-${risk.slug}`}
                          variant="info"
                          isInline
                          isPlain
                          title={risk.slug}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Content component="p">{risk.message}</Content>
                          {risk.url ? (
                            <Button
                              variant="link"
                              isInline
                              component="a"
                              href={risk.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              icon={<ExternalLink aria-hidden />}
                              iconPosition="end"
                            >
                              View impact statement
                            </Button>
                          ) : null}
                        </Alert>
                      ) : null
                    )}
                  </Flex>
                </div>
                {showRiskReview ? (
                    <div
                      className="ocp-version-line__footer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "block" }}
                    >
                      <div ref={riskReviewRef}>
                        {hasNoRisks ? (
                          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                            <Alert variant="success" isInline title={`No known risks for ${v.version}`} icon={<CheckCircle aria-hidden />}>
                              Ready to update.
                            </Alert>
                            <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "flexWrapWrap" }}>
                              <Button
                                variant="primary"
                                isDisabled={isPreflightRunning}
                                onClick={() => {
                                  if (isPreflightRunning) return;
                                  localStorage.setItem(
                                    "clusterUpdateInProgress",
                                    JSON.stringify({ version: selectedVersion, startedAt: Date.now() })
                                  );
                                  navigate("/administration/cluster-update/in-progress", { state: { version: selectedVersion } });
                                }}
                              >
                                {isPreflightRunning ? "Update requested" : `Update to ${selectedVersion}`}
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={runPreflight}
                                isDisabled={isPreflightRunning}
                                icon={
                                  isPreflightRunning ? (
                                    <Spinner size="sm" aria-label="Running pre-flight" />
                                  ) : (
                                    <Shield aria-hidden />
                                  )
                                }
                              >
                                {isPreflightRunning
                                  ? preflightStepLabel[preflightStatus]
                                  : preflightStatus === "complete" && preflightRisks.length === 0
                                    ? `Pre-flight passed for ${selectedVersion}`
                                    : preflightStatus === "complete" && preflightRisks.length > 0
                                      ? `${preflightRisks.length} concern${preflightRisks.length !== 1 ? "s" : ""} found for ${selectedVersion}`
                                      : `Run pre-flight for ${selectedVersion} release`}
                              </Button>
                            </Flex>
                          </Flex>
                        ) : (
                          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
                            <Flex
                              justifyContent={{ default: "justifyContentSpaceBetween" }}
                              alignItems={{ default: "alignItemsFlexStart" }}
                              gap={{ default: "gapMd" }}
                            >
                              <Title headingLevel="h3" size="lg">
                                Review risks for {v.version}
                              </Title>
                              <Content component="small">
                                {addressedCount} of {allRisks.length} risk{allRisks.length !== 1 ? "s" : ""} addressed
                              </Content>
                            </Flex>
                            <Progress
                              value={allRisks.length > 0 ? (addressedCount / allRisks.length) * 100 : 0}
                              title="Risk review progress"
                              measureLocation="none"
                            />
                            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                              {allRisks.map((risk) => {
                                const isAccepted = acceptedSlugs.has(risk.slug);
                                const isResolved = !!risk.resolved;
                                const statusLabel = isResolved ? "resolved" : isAccepted ? "accepted" : risk.severity;
                                const resolution = risk.resolution;
                                const isDetailOpen = expandedRiskDetail === risk.slug;
                                const statusLabelColor =
                                  isResolved || isAccepted ? "green" : risk.severity === "critical" ? "red" : "orange";
                                return (
                                  <ExpandableSection
                                    key={risk.slug}
                                    isExpanded={isDetailOpen}
                                    onToggle={(_e, open) => setExpandedRiskDetail(open ? risk.slug : null)}
                                    isIndented
                                    toggleContent={
                                      <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                                        <code>{risk.slug}</code>
                                        <Label color={statusLabelColor} isCompact>
                                          {statusLabel}
                                        </Label>
                                        {(isResolved || isAccepted) && (
                                          <Icon status="success">
                                            <CheckCircle />
                                          </Icon>
                                        )}
                                      </Flex>
                                    }
                                  >
                                    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                                      <Content component="p">{risk.message}</Content>
                                      {risk.url ? (
                                        <Button
                                          variant="link"
                                          isInline
                                          component="a"
                                          href={risk.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          icon={<ExternalLink aria-hidden />}
                                          iconPosition="end"
                                        >
                                          View impact statement
                                        </Button>
                                      ) : null}
                                      {!isResolved && !isAccepted && resolution ? (
                                        <Panel variant="bordered">
                                          <PanelMain>
                                            <PanelMainBody>
                                              <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsFlexStart" }}>
                                                {resolution.type === "update-operator" && resolution.actionAvailable ? (
                                                  <Icon>
                                                    <ArrowRight />
                                                  </Icon>
                                                ) : null}
                                                {resolution.type === "update-operator" && !resolution.actionAvailable ? (
                                                  <Icon status="warning">
                                                    <Clock />
                                                  </Icon>
                                                ) : null}
                                                {resolution.type === "wait-for-fix" ? (
                                                  <Icon status="warning">
                                                    <Clock />
                                                  </Icon>
                                                ) : null}
                                                {resolution.type === "update-z-stream" ? (
                                                  <Icon status="info">
                                                    <Info />
                                                  </Icon>
                                                ) : null}
                                                {resolution.type === "accept-only" ? (
                                                  <Icon>
                                                    <Info />
                                                  </Icon>
                                                ) : null}
                                                <Content component="small">{resolution.description}</Content>
                                              </Flex>
                                            </PanelMainBody>
                                          </PanelMain>
                                        </Panel>
                                      ) : null}
                                      <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "flexWrapWrap" }}>
                                        {isResolved ? (
                                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                            <Icon status="success">
                                              <CheckCircle />
                                            </Icon>
                                            Risk resolved
                                          </Flex>
                                        ) : (
                                          <>
                                            {resolution?.type === "update-operator" && resolution.actionAvailable && !isAccepted ? (
                                              <Button
                                                variant="primary"
                                                onClick={() => navigate("/administration/installed-operators")}
                                                icon={<ArrowRight aria-hidden />}
                                              >
                                                Update operator
                                              </Button>
                                            ) : null}
                                            <Button
                                              variant={isAccepted ? "primary" : "secondary"}
                                              onClick={() => toggleAccept(risk.slug)}
                                            >
                                              {isAccepted ? "Accepted" : "Accept risk"}
                                            </Button>
                                          </>
                                        )}
                                      </Flex>
                                    </Flex>
                                  </ExpandableSection>
                                );
                              })}
                            </Flex>
                            <Divider />
                            <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "flexWrapWrap" }} alignItems={{ default: "alignItemsCenter" }}>
                              <Button
                                variant="primary"
                                isDisabled={!canUpdate || isPreflightRunning}
                                onClick={() => {
                                  if (isPreflightRunning || !canUpdate) return;
                                  localStorage.setItem(
                                    "clusterUpdateInProgress",
                                    JSON.stringify({ version: selectedVersion, startedAt: Date.now() })
                                  );
                                  navigate("/administration/cluster-update/in-progress", { state: { version: selectedVersion } });
                                }}
                              >
                                {isPreflightRunning ? "Update requested" : `Update to ${selectedVersion}`}
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={runPreflight}
                                isDisabled={isPreflightRunning}
                                icon={
                                  isPreflightRunning ? (
                                    <Spinner size="sm" aria-label="Running pre-flight" />
                                  ) : (
                                    <Shield aria-hidden />
                                  )
                                }
                              >
                                {isPreflightRunning
                                  ? preflightStepLabel[preflightStatus]
                                  : preflightStatus === "complete" && preflightRisks.length === 0
                                    ? `Pre-flight passed for ${selectedVersion}`
                                    : preflightStatus === "complete" && preflightRisks.length > 0
                                      ? `${preflightRisks.length} concern${preflightRisks.length !== 1 ? "s" : ""} found for ${selectedVersion}`
                                      : `Run pre-flight for ${selectedVersion} release`}
                              </Button>
                              {!canUpdate && !isPreflightRunning ? (
                                <Content component="small">Address all risks to proceed</Content>
                              ) : null}
                            </Flex>
                          </Flex>
                        )}
                      </div>
                    </div>
                ) : null}
              </div>
            );
          })}
        </Flex>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ─── Active agent update plans (scheduled / in progress) ─── */
type ActiveAgentPlanRow = {
  id: string;
  status: "scheduled" | "in_progress";
  targetVersion: string;
  summary: string;
  windowLabel: string;
  phase?: string;
  details: string[];
};

const MOCK_ACTIVE_AGENT_PLANS: ActiveAgentPlanRow[] = [
  {
    id: "plan-sched-1",
    status: "scheduled",
    targetVersion: "5.1.10",
    summary: "Approved — waiting for maintenance window",
    windowLabel: "Apr 15, 2026 · 2:00 AM EST",
    details: [
      "Agent: cluster-update-agent",
      "Pre-checks will run again 24 hours before the window.",
      "Rollback snapshot: taken Apr 7, 2026",
    ],
  },
  {
    id: "plan-run-1",
    status: "in_progress",
    targetVersion: "5.1.9",
    summary: "Executing coordinated platform + catalog updates",
    windowLabel: "Started Apr 8, 2026 · 1:12 AM EST",
    phase: "Operator coordination — step 4 of 8",
    details: [
      "Control plane: complete",
      "Catalog operators: in progress (12 of 28)",
      "Estimated remaining: ~28 minutes",
    ],
  },
];

function ActiveUpdatePlansTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = MOCK_ACTIVE_AGENT_PLANS.find((p) => p.id === selectedId);

  return (
    <div className="max-w-[960px]">
      <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[16px]">
        Scheduled or ongoing agent-based update plans. Select a row to view details.
      </p>
      <div className="border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] rounded-[8px] overflow-hidden">
        <div className="grid grid-cols-[minmax(110px,120px)_minmax(72px,90px)_1fr_minmax(140px,1fr)] gap-[8px] px-[16px] py-[10px] text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] border-b border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)]">
          <span>Status</span>
          <span>Target</span>
          <span>Summary</span>
          <span>Window / started</span>
        </div>
        {MOCK_ACTIVE_AGENT_PLANS.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(p.id === selectedId ? null : p.id);
                }
              }}
              className={`grid grid-cols-[minmax(110px,120px)_minmax(72px,90px)_1fr_minmax(140px,1fr)] gap-[8px] items-center px-[16px] py-[12px] border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] last:border-0 cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] ${
                isSelected
                  ? "bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)]"
                  : "hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              <span>
                <span
                  className={`inline-flex text-[12px] font-semibold px-[8px] py-[2px] rounded-[999px] ${
                    p.status === "scheduled"
                      ? "bg-[rgba(0,102,204,0.12)] text-[#0066cc] dark:text-[#4dabf7]"
                      : "bg-[rgba(103,83,172,0.12)] text-[#6753ac] dark:text-[#b2a3e0]"
                  }`}
                >
                  {p.status === "scheduled" ? "Scheduled" : "In progress"}
                </span>
              </span>
              <span className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">{p.targetVersion}</span>
              <span className="text-[14px] text-[#151515] dark:text-white min-w-0">{p.summary}</span>
              <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] whitespace-nowrap">{p.windowLabel}</span>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="mt-[16px] rounded-[12px] border border-[#0066cc]/35 dark:border-[#4dabf7]/35 bg-[#e7f1fa] dark:bg-[rgba(0,102,204,0.1)] p-[16px]"
          role="region"
          aria-label="Plan details"
        >
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6a6e73] dark:text-[#8a8d90] mb-[6px]">Plan details</p>
          <p className="text-[16px] font-medium text-[#151515] dark:text-white font-['Red_Hat_Display:SemiBold',sans-serif] mb-[4px]">
            OpenShift {selected.targetVersion}
          </p>
          {selected.phase && (
            <p className="text-[13px] text-[#0066cc] dark:text-[#4dabf7] font-medium mb-[8px]">{selected.phase}</p>
          )}
          <ul className="list-disc pl-[18px] space-y-[4px] text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">
            {selected.details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Cluster Operators Tab ─── */
/* ─── Update History Tab ─── */
function UpdateHistoryTab() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filterMethod, setFilterMethod] = useState<"all" | "Manual" | "Agent">("all");

  const filtered = filterMethod === "all" ? updateHistory : updateHistory.filter((e) => e.method === filterMethod);

  return (
    <div>
      <div className="flex items-center justify-between mb-[16px]">
        <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px]">Update history</h2>
        <div className="flex items-center gap-[8px]">
          {(["all", "Manual", "Agent"] as const).map((f) => (
            <button key={f} onClick={() => setFilterMethod(f)}
              className={`text-[13px] px-[12px] py-[5px] rounded-[999px] border cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] ${filterMethod === f ? "bg-[#0066cc] text-white border-[#0066cc]" : "bg-transparent text-[#4d4d4d] dark:text-[#b0b0b0] border-[#d2d2d2] dark:border-[rgba(255,255,255,0.15)] hover:border-[#8a8d90]"}`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] rounded-[8px] overflow-hidden">
        <div className="grid grid-cols-[90px_100px_72px_100px_1fr_140px_72px] gap-[8px] px-[16px] py-[10px] text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] border-b border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)]">
          <span>Version</span><span>Status</span><span>Method</span><span>Decision</span><span>Initiated by</span><span>Date</span><span>Pre-check</span>
        </div>
        {filtered.map((entry, i) => {
          const isExpanded = expandedRow === i;
          return (
            <div key={i}>
              <div onClick={() => setExpandedRow(isExpanded ? null : i)}
                className={`grid grid-cols-[90px_100px_72px_100px_1fr_140px_72px] gap-[8px] items-center px-[16px] py-[12px] border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] cursor-pointer transition-colors ${isExpanded ? "bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)]" : "hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)]"}`}>
                <span className="text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">{entry.version}</span>
                <span>
                  {entry.status === "Completed" && <span className="flex items-center gap-[3px] text-[11px] px-[6px] py-[2px] rounded-[4px] font-semibold bg-[rgba(62,134,53,0.1)] text-[#3e8635] w-fit"><CheckCircle className="size-[10px]" /> Done</span>}
                  {entry.status === "Failed" && <span className="flex items-center gap-[3px] text-[11px] px-[6px] py-[2px] rounded-[4px] font-semibold bg-[rgba(201,25,11,0.1)] text-[#c9190b] w-fit"><AlertCircle className="size-[10px]" /> Failed</span>}
                  {entry.status === "Rejected" && <span className="flex items-center gap-[3px] text-[11px] px-[6px] py-[2px] rounded-[4px] font-semibold bg-[rgba(201,25,11,0.1)] text-[#c9190b] w-fit"><X className="size-[10px]" /> Rejected</span>}
                </span>
                <span>
                  {entry.method === "Agent" ? (
                    <span className="flex items-center gap-[3px] text-[11px] text-[#151515] dark:text-[#e0e0e0] font-semibold">
                      <AiExperienceIcon className="size-[11px] shrink-0 opacity-90" aria-hidden /> Agent
                    </span>
                  ) : (
                    <span className="flex items-center gap-[3px] text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0]"><User className="size-[11px]" /> Manual</span>
                  )}
                </span>
                <span>
                  {entry.decision === "Approved" && <span className="text-[11px] px-[6px] py-[2px] rounded-[4px] font-semibold bg-[rgba(62,134,53,0.1)] text-[#3e8635]">Approved</span>}
                  {entry.decision === "Auto-approved" && <span className="text-[11px] px-[6px] py-[2px] rounded-[4px] font-semibold bg-[#e7f1fa] text-[#0066cc]">Auto</span>}
                  {entry.decision === "Rejected" && <span className="text-[11px] px-[6px] py-[2px] rounded-[4px] font-semibold bg-[rgba(201,25,11,0.1)] text-[#c9190b]">Rejected</span>}
                  {entry.decision === "N/A" && <span className="text-[11px] text-[#8a8d90]">—</span>}
                </span>
                <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] truncate" title={entry.initiatedBy}>{entry.initiatedBy}</span>
                <span className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">{entry.startedAt.split(" ").slice(0, 3).join(" ")}</span>
                <span>
                  <span className={`text-[11px] px-[6px] py-[2px] rounded-[4px] font-semibold ${entry.preCheck.failed === 0 ? "bg-[rgba(62,134,53,0.1)] text-[#3e8635]" : "bg-[rgba(201,25,11,0.1)] text-[#c9190b]"}`}>
                    {entry.preCheck.passed}/{entry.preCheck.total}
                  </span>
                </span>
              </div>

              {/* Expanded detail row */}
              {isExpanded && (
                <div className="px-[16px] py-[16px] border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] bg-[#fafafa] dark:bg-[rgba(255,255,255,0.02)]">
                  <div className="grid grid-cols-3 gap-[16px] mb-[12px]">
                    <div>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Started</p>
                      <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">{entry.startedAt}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Completed</p>
                      <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">{entry.completedAt}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Duration</p>
                      <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Mono:Regular',sans-serif]">{entry.duration}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-[16px]">
                    <div>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Pre-check Summary</p>
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[13px] font-['Red_Hat_Text:Regular',sans-serif]">
                          <span className="text-[#3e8635] font-semibold">{entry.preCheck.passed} passed</span>
                          {entry.preCheck.failed > 0 && <span className="text-[#c9190b] font-semibold"> · {entry.preCheck.failed} failed</span>}
                          <span className="text-[#4d4d4d] dark:text-[#b0b0b0]"> of {entry.preCheck.total} checks</span>
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#4d4d4d] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Compatibility Summary</p>
                      <p className="text-[13px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif]">{entry.compatSummary ?? "No compatibility data recorded"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
