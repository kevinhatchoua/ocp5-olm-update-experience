import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CheckCircle,
  Info,
  AlertCircle,
  ExternalLink,
  Clock,
  Columns2,
  Globe,
} from "@/lib/pfIcons";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Checkbox,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Dropdown,
  DropdownItem,
  Flex,
  FlexItem,
  FormSelect,
  FormSelectOption,
  Icon,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Pagination,
  PaginationVariant,
  Popover,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  Tooltip,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewCheckboxFilter,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import SlidersHIcon from "@patternfly/react-icons/dist/esm/icons/sliders-h-icon";
import SortCommonAscIcon from "@patternfly/react-icons/dist/esm/icons/pficon-sort-common-asc-icon";
import { InnerScrollContainer, Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { useChat } from "../../contexts/ChatContext";
import { AiAssessmentSection } from "../../components/AiAssessmentSection";
import { OlsChatbot } from "../../components/OlsChatbot";
import { useClusterUpdateDemoVariant } from "../../contexts/ClusterUpdateDemoContext";
import {
  ListAdvancedFilterModal,
  type ListAdvancedAttributeSpec,
} from "../../components/dataView/ListAdvancedFilterModal";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import { ADDITIONAL_CATALOG_OPERATORS } from "./installedOperatorsFixtureData";
import {
  formatLifecycleDateShort,
  getDerivedSupportPhase,
  getEntitlementAwareDaysUntilPhaseEnd,
  getEntitlementAwareLifecycleDateEntries,
  getEntitlementAwareLifecycleTrackSegment,
  getEntitlementAwarePhaseDateLabelUrgency,
  getEntitlementAwarePhaseEndDateRaw,
  getEntitlementAwarePhaseEndSortTimestamp,
  getEntitlementAwareSupportPhase,
  getEntitlementAwareSupportPhaseSortRank,
  getLifecycleEvaluationRow,
  hasPlatformAlignedEusMismatch,
  LIFECYCLE_PUBLIC_SCHEDULE_DISCLAIMER,
  PLATFORM_ALIGNED_EUS_MISMATCH_DISCLAIMER,
  RH_OPERATOR_LC_DOC_URL,
  SUBSCRIPTION_ENTITLEMENT_OPTIONS,
  type ClusterOcpLifecycleDates,
  type OperatorSupportLifecycle,
  type PhaseDateLabelUrgency,
  type SubscriptionEntitlementContext,
  type SupportPhase,
} from "@/lib/operatorSupportLifecycle";

export type {
  OperatorSupportLifecycle,
  PhaseDateLabelUrgency,
  SubscriptionEntitlementContext,
  SupportPhase,
} from "@/lib/operatorSupportLifecycle";

/** Prototype cluster (OCP 5.0) published boundaries for platform-aligned operators. */
const PROTOTYPE_CLUSTER_OCP_LIFECYCLE: ClusterOcpLifecycleDates = {
  ocpVersionLabel: "5.0",
  fullSupportEndDate: "2026-05-03",
  maintenanceEndDate: "2027-04-21",
  eus1EndDate: "2027-10-21",
  eus2EndDate: "2028-04-21",
  eus3EndDate: "2028-10-21",
  eolEndDate: "2029-04-21",
};

const CLUSTER_TARGET_VERSION = "5.1.10";
const CLUSTER_CHANNEL = "fast-5.1";

/** Red Hat docs — ClusterServiceVersion (Installed Operators). */
const IO_CSV_DOC_URL =
  "https://docs.redhat.com/en/documentation/openshift_container_platform/latest/html/operators/operator-lifecycle-manager/olm-understanding-cluster-service-version-csv";

/** Red Hat docs — creating resources from YAML in the web console. */
const IO_IMPORT_YAML_DOC_URL =
  "https://docs.redhat.com/en/documentation/openshift_container_platform/latest/html/web_console/web-console-overview";

/** Data columns and optional table chrome (kebab) via Managed columns. */
type TableColumnKey =
  | "version"
  | "clusterCompatibility"
  | "updatePlan"
  | "support"
  | "supportPhaseEnd"
  | "status"
  | "lastUpdated"
  | "managedNamespaces"
  | "rowActions";

type DataColumnKey = Exclude<TableColumnKey, "rowActions">;

const TABLE_COLUMN_OPTIONS: { key: DataColumnKey; label: string }[] = [
  { key: "version", label: "Version" },
  { key: "clusterCompatibility", label: "Cluster compatibility" },
  { key: "updatePlan", label: "Update plan" },
  { key: "support", label: "Support phase" },
  { key: "supportPhaseEnd", label: "Current phase end date" },
  { key: "status", label: "Status" },
  { key: "lastUpdated", label: "Last updated" },
  { key: "managedNamespaces", label: "Managed namespaces" },
];

/** “Default columns” in Manage columns (Operator is always on). */
const DEFAULT_MANAGE_COLUMN_ORDER: { key: TableColumnKey; label: string }[] = [
  { key: "version", label: "Version" },
  { key: "status", label: "Status" },
  { key: "clusterCompatibility", label: "Cluster compatibility" },
  { key: "support", label: "Support phase" },
  { key: "supportPhaseEnd", label: "Current phase end date" },
  { key: "lastUpdated", label: "Last updated" },
];

const ADDITIONAL_MANAGE_COLUMN_ORDER: { key: TableColumnKey; label: string }[] = [
  { key: "updatePlan", label: "Update plan" },
  { key: "managedNamespaces", label: "Managed namespaces" },
  { key: "rowActions", label: "Actions" },
];

const RESTORE_DEFAULT_VISIBLE: Record<TableColumnKey, boolean> = {
  version: true,
  status: true,
  clusterCompatibility: true,
  support: true,
  supportPhaseEnd: true,
  lastUpdated: true,
  updatePlan: false,
  managedNamespaces: false,
  rowActions: false,
};

const ioManageColRowStyle = (withDivider: boolean): CSSProperties => ({
  paddingBlock: "var(--pf-t--global--spacer--sm)",
  ...(withDivider
    ? { borderBottom: "1px solid var(--pf-t--global--border--color--default)" }
    : {}),
});

/**
 * PatternFly Data View filters (see @patternfly/react-data-view) — `useDataViewFilters` shape.
 * Matches HPUX-1429 / CONSOLE-5091 prototype (attribute menu + chip rows on ToolbarFilter).
 */
type IoListFilters = {
  name: string;
  status: string[];
  version: string;
  clusterCompatibility: string[];
  support: string[];
  supportPhaseEnd: string;
  lastUpdated: string;
  managedNamespaces: string;
};

const INITIAL_IO_FILTERS: IoListFilters = {
  name: "",
  status: [],
  version: "",
  clusterCompatibility: [],
  support: [],
  supportPhaseEnd: "",
  lastUpdated: "",
  managedNamespaces: "",
};

function getEmptyIoListFilters(): IoListFilters {
  return { ...INITIAL_IO_FILTERS };
}

const FILTER_VALUE_OPTIONS: Record<
  keyof Pick<IoListFilters, "status" | "clusterCompatibility" | "support">,
  { value: string; label: string }[]
> = {
  status: [
    { value: "Running", label: "Running" },
    { value: "Degraded", label: "Degraded" },
    { value: "Pending", label: "Pending" },
  ],
  clusterCompatibility: [
    { value: "Compatible", label: "Compatible" },
    { value: "Incompatible", label: "Incompatible" },
  ],
  support: [
    { value: "Full support", label: "Full support" },
    { value: "Maintenance support", label: "Maintenance support" },
    { value: "EUS", label: "EUS" },
    { value: "EUS Term 2", label: "EUS Term 2" },
    { value: "EUS Term 3", label: "EUS Term 3" },
    { value: "End of life", label: "End of life" },
    { value: "Unsupported", label: "Unsupported" },
  ],
};

/** HPUX-1429 / CONSOLE-5091 — advanced filter attributes (toolbar attribute menu uses the same set per tab). */
const IO_LIST_ADV_FILTER_SPEC: ListAdvancedAttributeSpec<keyof IoListFilters>[] = [
  {
    id: "name",
    label: "Name",
    valueKind: "text",
    valuePlaceholder: "Filter by name or namespace",
  },
  {
    id: "status",
    label: "Status",
    valueKind: "multi",
    valuePlaceholder: "Filter by status",
    options: FILTER_VALUE_OPTIONS.status,
  },
  {
    id: "version",
    label: "Version",
    valueKind: "text",
    valuePlaceholder: "Filter by version",
  },
  {
    id: "clusterCompatibility",
    label: "Cluster compatibility",
    valueKind: "multi",
    valuePlaceholder: "Filter by cluster compatibility",
    options: FILTER_VALUE_OPTIONS.clusterCompatibility,
  },
  {
    id: "support",
    label: "Support phase",
    valueKind: "multi",
    valuePlaceholder: "Filter by support phase",
    options: FILTER_VALUE_OPTIONS.support,
  },
  {
    id: "supportPhaseEnd",
    label: "Current phase end date",
    valueKind: "text",
    valuePlaceholder: "Filter by current phase end date",
  },
  {
    id: "lastUpdated",
    label: "Last updated",
    valueKind: "text",
    valuePlaceholder: "Filter by last updated",
  },
  {
    id: "managedNamespaces",
    label: "Managed namespaces",
    valueKind: "text",
    valuePlaceholder: "Filter by managed namespace",
  },
];

type SortColumnKey =
  | "name"
  | "version"
  | "status"
  | "lastUpdated"
  | "clusterCompatibility"
  | "support"
  | "supportPhaseEnd";

const COMPAT_SORT_ORDER: Record<"Compatible" | "Incompatible", number> = {
  Compatible: 0,
  Incompatible: 1,
};

function parseUpdatedAt(s?: string): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * List timestamp cell — same en-US “medium + short” shape as PatternFly Data View examples
 * (see https://www.patternfly.org/extensions/data-view/overview). Falls back to the raw value if it won’t parse.
 */
function formatDataViewListDate(value: string | undefined): string {
  if (!value || value === "—") return "—";
  const t = Date.parse(value);
  if (Number.isNaN(t)) {
    return value;
  }
  return new Date(t).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

type InstalledOperator = {
  name: string;
  namespace: string;
  version: string;
  channel: string;
  source: string;
  status: "Running" | "Degraded" | "Pending";
  autoUpdate: boolean;
  clusterCompatibility: "Compatible" | "Incompatible";
  compatibilityMessage?: string;
  /** Policy dates and optional EUS; see Red Hat OpenShift Operator life cycles. */
  supportLifecycle?: OperatorSupportLifecycle;
  /** HPBU catalog operators follow page entitlement; false for layered/third-party (Ansible, RHOAI, etc.). */
  isHpbuOwned?: boolean;
  /** Operator lifecycle is tied to cluster OCP version line (see cluster lifecycle constants). */
  isPlatformAligned?: boolean;
  /** Community / non-entitled installs — not covered by Red Hat support for this row. */
  isUnsupported?: boolean;
  updateAvailable?: string;
  maxOcpVersion?: string;
  lastUpdated?: string;
  managedNamespaces?: string[];
};

export type CatalogOperator = InstalledOperator & {
  requiredBeforeClusterUpdate?: boolean;
  isOlmV1Extension?: boolean;
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

function getOperatorCompatibilityPage(
  op: InstalledOperator,
  targetVersion: string
): { compatibility: "Compatible" | "Incompatible"; message?: string } {
  if (op.status === "Pending") {
    return {
      compatibility: "Incompatible",
      message: op.compatibilityMessage || "Operator is pending and not compatible until it is running.",
    };
  }
  if (op.status === "Degraded") {
    return {
      compatibility: "Incompatible",
      message:
        op.compatibilityMessage ||
        "Operator is degraded and not compatible until the operator is healthy.",
    };
  }
  if (!op.maxOcpVersion) return { compatibility: "Compatible" };
  const targetMajorMinor = targetVersion.split(".").slice(0, 2).join(".");
  if (compareVersions(op.maxOcpVersion, targetMajorMinor) < 0) {
    return {
      compatibility: "Incompatible",
      message: `Max supported OCP version is ${op.maxOcpVersion}. ${
        op.updateAvailable
          ? `Update to v${op.updateAvailable}+ before upgrading cluster.`
          : "Update operator before upgrading cluster."
      }`,
    };
  }
  return { compatibility: "Compatible" };
}

type OperatorRow = CatalogOperator & {
  clusterCompatibility: "Compatible" | "Incompatible";
};

function rowMatchesDataViewFilters(
  op: OperatorRow,
  f: IoListFilters,
  entitlement: SubscriptionEntitlementContext
): boolean {
  const lifecycleOp = getLifecycleEvaluationRow(op, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
  if (f.name.trim()) {
    const q = f.name.trim().toLowerCase();
    if (!op.name.toLowerCase().includes(q) && !op.namespace.toLowerCase().includes(q)) return false;
  }
  if (f.status.length > 0 && !f.status.includes(op.status)) return false;
  if (f.version.trim()) {
    const q = f.version.trim().toLowerCase();
    if (!op.version.toLowerCase().includes(q)) return false;
  }
  if (f.clusterCompatibility.length > 0) {
    if (op.isOlmV1Extension) return false;
    if (!f.clusterCompatibility.includes(op.clusterCompatibility)) return false;
  }
  if (f.support.length > 0) {
    if (op.isOlmV1Extension) return false;
    if (!f.support.includes(getEntitlementAwareSupportPhase(lifecycleOp, entitlement))) return false;
  }
  if (f.supportPhaseEnd.trim()) {
    if (op.isOlmV1Extension) return false;
    const q = f.supportPhaseEnd.trim().toLowerCase();
    const raw = getEntitlementAwarePhaseEndDateRaw(lifecycleOp, entitlement);
    const formatted = formatLifecycleDateShort(raw).toLowerCase();
    const rawStr = (raw ?? "").toLowerCase();
    if (!formatted.includes(q) && !rawStr.includes(q)) return false;
  }
  if (f.lastUpdated.trim()) {
    const q = f.lastUpdated.trim().toLowerCase();
    const display = formatDataViewListDate(op.lastUpdated).toLowerCase();
    const rawStr = (op.lastUpdated ?? "").toLowerCase();
    if (!display.includes(q) && !rawStr.includes(q)) return false;
  }
  if (f.managedNamespaces.trim()) {
    const q = f.managedNamespaces.trim().toLowerCase();
    const nss = op.managedNamespaces ?? [];
    if (!nss.some((ns) => ns.toLowerCase().includes(q))) return false;
  }
  return true;
}

function sortOperatorRows(
  rows: OperatorRow[],
  key: SortColumnKey,
  dir: "asc" | "desc",
  entitlement: SubscriptionEntitlementContext
): OperatorRow[] {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const lifecycleA = getLifecycleEvaluationRow(a, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
    const lifecycleB = getLifecycleEvaluationRow(b, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        break;
      case "version":
        cmp = compareVersions(a.version, b.version);
        break;
      case "status": {
        const order = { Running: 0, Degraded: 1, Pending: 2 };
        cmp = order[a.status] - order[b.status];
        break;
      }
      case "clusterCompatibility": {
        const ta = a.isOlmV1Extension ? 1 : 0;
        const tb = b.isOlmV1Extension ? 1 : 0;
        if (ta !== tb) return ta - tb;
        if (ta === 1) cmp = 0;
        else cmp = COMPAT_SORT_ORDER[a.clusterCompatibility] - COMPAT_SORT_ORDER[b.clusterCompatibility];
        break;
      }
      case "lastUpdated":
        cmp = parseUpdatedAt(a.lastUpdated) - parseUpdatedAt(b.lastUpdated);
        break;
      case "support": {
        const ta = a.isOlmV1Extension ? 1 : 0;
        const tb = b.isOlmV1Extension ? 1 : 0;
        if (ta !== tb) {
          cmp = ta - tb;
          break;
        }
        if (ta === 1) cmp = 0;
        else {
          cmp =
            getEntitlementAwareSupportPhaseSortRank(lifecycleA, entitlement) -
            getEntitlementAwareSupportPhaseSortRank(lifecycleB, entitlement);
          if (cmp === 0) {
            cmp =
              getEntitlementAwarePhaseEndSortTimestamp(lifecycleA, entitlement) -
              getEntitlementAwarePhaseEndSortTimestamp(lifecycleB, entitlement);
          }
        }
        break;
      }
      case "supportPhaseEnd": {
        const ta = a.isOlmV1Extension ? 1 : 0;
        const tb = b.isOlmV1Extension ? 1 : 0;
        if (ta !== tb) {
          cmp = ta - tb;
          break;
        }
        if (ta === 1) cmp = 0;
        else {
          cmp =
            getEntitlementAwarePhaseEndSortTimestamp(lifecycleA, entitlement) -
            getEntitlementAwarePhaseEndSortTimestamp(lifecycleB, entitlement);
        }
        break;
      }
      default:
        cmp = 0;
    }
    if (cmp !== 0) return cmp * m;
    return a.name.localeCompare(b.name) * m;
  });
}

const INITIAL_CATALOG_OPERATORS: CatalogOperator[] = [
  {
    name: "Cluster Logging",
    namespace: "openshift-logging",
    version: "6.4.3",
    channel: "stable-6.4",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Incompatible",
    compatibilityMessage:
      "Max supported OCP version is 5.0. Update to v6.5+ before upgrading cluster.",
    supportLifecycle: {
      fullSupportEndDate: "2025-08-01",
      maintenanceEndDate: "2025-10-15",
      eolEndDate: "2025-11-13",
    },
    updateAvailable: "6.5.1",
    maxOcpVersion: "5.0",
    lastUpdated: "Jan 8, 2026, 3:12 PM",
    managedNamespaces: ["openshift-logging"],
    requiredBeforeClusterUpdate: true,
  },
  {
    name: "Elasticsearch Operator",
    namespace: "openshift-operators-redhat",
    version: "5.7.2",
    channel: "stable-5.7",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2028-05-10",
      maintenanceEndDate: "2029-11-10",
      eus1EndDate: "2030-05-10",
      eus2EndDate: "2031-05-10",
      eus3EndDate: "2032-05-10",
      eolEndDate: "2032-05-10",
    },
    maxOcpVersion: "5.1",
    lastUpdated: "Feb 12, 2026, 4:32 AM",
    managedNamespaces: ["openshift-operators-redhat", "openshift-logging"],
    requiredBeforeClusterUpdate: true,
  },
  {
    name: "Cloud Credential Operator",
    namespace: "openshift-cloud-credential-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    isPlatformAligned: true,
    clusterCompatibility: "Compatible",
    compatibilityMessage: "IAM configuration may need updating before cluster upgrade.",
    supportLifecycle: {
      fullSupportEndDate: "2026-05-03",
      maintenanceEndDate: "2027-04-21",
      eus1EndDate: "2027-10-21",
      eus2EndDate: "2028-04-21",
      eus3EndDate: "2028-10-21",
      eolEndDate: "2029-04-21",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-cloud-credential-operator"],
  },
  {
    name: "Operator Lifecycle Manager",
    namespace: "openshift-operator-lifecycle-manager",
    version: "4.21.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: false,
    isPlatformAligned: true,
    clusterCompatibility: "Incompatible",
    compatibilityMessage: "Incompatible with OCP 5.1. Update to 4.22.0 or higher.",
    supportLifecycle: {
      fullSupportEndDate: "2027-03-20",
      maintenanceEndDate: "2028-03-20",
      eus1EndDate: "2028-09-20",
      eus2EndDate: "2029-03-20",
      eus3EndDate: "2029-09-20",
      eolEndDate: "2030-03-20",
    },
    updateAvailable: "4.22.0",
    maxOcpVersion: "5.0",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-operator-lifecycle-manager", "openshift-marketplace"],
  },
  {
    name: "Cert Manager",
    namespace: "cert-manager-operator",
    version: "1.14.0",
    channel: "stable-v1",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2026-01-31",
      maintenanceEndDate: "2026-06-30",
      eus1EndDate: "2027-06-30",
      eus2EndDate: "2028-03-31",
      eus3EndDate: "2028-08-15",
      eolEndDate: "2028-09-01",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 18, 2026, 2:05 AM",
    managedNamespaces: ["cert-manager", "cert-manager-operator"],
  },
  {
    name: "OpenShift DNS",
    namespace: "openshift-dns-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2028-06-15",
      maintenanceEndDate: "2029-06-15",
      eus1EndDate: "2030-06-15",
      eus2EndDate: "2031-06-15",
      eus3EndDate: "2032-03-15",
      eolEndDate: "2032-06-15",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-dns", "openshift-dns-operator"],
  },
  {
    name: "Ingress Operator",
    namespace: "openshift-ingress-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2028-06-15",
      maintenanceEndDate: "2029-06-15",
      eus1EndDate: "2030-06-15",
      eus2EndDate: "2031-06-15",
      eus3EndDate: "2032-03-15",
      eolEndDate: "2032-06-15",
    },
  },
  {
    name: "Machine Config Operator",
    namespace: "openshift-machine-config-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2028-06-15",
      maintenanceEndDate: "2029-06-15",
      eus1EndDate: "2030-06-15",
      eus2EndDate: "2031-06-15",
      eus3EndDate: "2032-03-15",
      eolEndDate: "2032-06-15",
    },
  },
  {
    name: "Monitoring Stack",
    namespace: "openshift-monitoring",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2028-06-15",
      maintenanceEndDate: "2029-06-15",
      eus1EndDate: "2030-06-15",
      eus2EndDate: "2031-06-15",
      eus3EndDate: "2032-03-15",
      eolEndDate: "2032-06-15",
    },
  },
  {
    name: "Service Mesh",
    namespace: "openshift-operators",
    version: "2.5.1",
    channel: "stable",
    source: "redhat-operators",
    status: "Degraded",
    autoUpdate: false,
    clusterCompatibility: "Incompatible",
    compatibilityMessage:
      "Operator is degraded. Compatibility cannot be determined until the operator is healthy.",
    supportLifecycle: {
      fullSupportEndDate: "2026-02-01",
      maintenanceEndDate: "2026-12-01",
      eus1EndDate: "2027-12-01",
      eus2EndDate: "2028-12-01",
      eus3EndDate: "2029-12-01",
      eolEndDate: "2029-12-01",
    },
    updateAvailable: "2.6.0",
    lastUpdated: "Nov 5, 2025, 10:22 AM",
    managedNamespaces: ["istio-system", "openshift-operators"],
  },
  {
    name: "Web Terminal",
    namespace: "openshift-operators",
    version: "1.9.0",
    channel: "fast",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2027-05-03",
      maintenanceEndDate: "2028-04-21",
      eus1EndDate: "2029-04-21",
      eus2EndDate: "2030-04-21",
      eus3EndDate: "2031-04-21",
      eolEndDate: "2032-04-21",
    },
  },
  {
    name: "Kiali Operator",
    namespace: "openshift-operators",
    version: "1.73.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2028-01-15",
      maintenanceEndDate: "2029-01-15",
      eus1EndDate: "2030-01-15",
      eus2EndDate: "2031-01-15",
      eus3EndDate: "2032-01-15",
      eolEndDate: "2032-06-15",
    },
    updateAvailable: "1.76.0",
    maxOcpVersion: "5.1",
    lastUpdated: "Dec 20, 2025, 9:15 AM",
    managedNamespaces: ["kiali-operator", "istio-system"],
  },
  {
    name: "OpenShift GitOps (cluster extension)",
    namespace: "openshift-gitops-operator",
    version: "1.12.0",
    channel: "gitops-1.12",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-06-01",
      maintenanceEndDate: "2026-05-01",
      eus1EndDate: "2027-05-01",
      eus2EndDate: "2028-05-01",
      eus3EndDate: "2029-05-01",
      eolEndDate: "2029-05-01",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "Jun 12, 2025, 4:02 PM",
    managedNamespaces: ["openshift-gitops"],
    isOlmV1Extension: true,
  },
  {
    name: "Sample observability bundle",
    namespace: "observability-bundles",
    version: "0.4.1",
    channel: "stable",
    source: "community-operators",
    status: "Pending",
    autoUpdate: true,
    clusterCompatibility: "Incompatible",
    compatibilityMessage: "V1 discovery in progress — update availability TBD",
    isUnsupported: true,
    lastUpdated: "Jun 11, 2025, 9:15 AM",
    managedNamespaces: ["observability-sample"],
    isOlmV1Extension: true,
  },
  ...ADDITIONAL_CATALOG_OPERATORS,
];

type LifecycleTrackSegment = "full" | "maintenance" | "elc" | "eol";

/** PatternFly Progress Stepper success icon (matches PF docs). */
const PF_PROGRESS_STEPPER_CHECK_ICON = (
  <svg className="pf-v6-svg" viewBox="0 0 32 32" fill="currentColor" aria-hidden width="1em" height="1em" role="img">
    <path d="M16 1C7.729 1 1 7.729 1 16s6.729 15 15 15 15-6.729 15-15S24.271 1 16 1Zm7.795 11.795-8.646 8.646c-.317.317-.733.475-1.149.475s-.832-.158-1.149-.475l-4.646-4.646a1.126 1.126 0 0 1 1.591-1.591l4.205 4.205 8.205-8.205a1.126 1.126 0 0 1 1.591 1.591Z" />
  </svg>
);

type LifecycleStepperVisual = "success" | "current" | "pending" | "danger";

const LIFECYCLE_STEPPER_STEPS_FULL = [
  { id: "full", title: "Full support" },
  { id: "maintenance", title: "Maintenance support" },
  { id: "elc", title: "Extended life cycle" },
  { id: "eol", title: "End of life" },
] as const;

const LIFECYCLE_STEPPER_STEPS_STANDARD = [
  { id: "full", title: "Full support" },
  { id: "maintenance", title: "Maintenance support" },
  { id: "eol", title: "End of life" },
] as const;

function lifecycleStepperStepsForEntitlement(entitlement: SubscriptionEntitlementContext) {
  return entitlement === "standard" ? LIFECYCLE_STEPPER_STEPS_STANDARD : LIFECYCLE_STEPPER_STEPS_FULL;
}

function lifecycleProgressStepStates(
  seg: LifecycleTrackSegment,
  stepCount: number
): LifecycleStepperVisual[] {
  if (stepCount === 3) {
    switch (seg) {
      case "full":
        return ["current", "pending", "pending"];
      case "maintenance":
        return ["success", "current", "pending"];
      case "elc":
      case "eol":
        return ["success", "success", "danger"];
    }
  }
  switch (seg) {
    case "full":
      return ["current", "pending", "pending", "pending"];
    case "maintenance":
      return ["success", "current", "pending", "pending"];
    case "elc":
      return ["success", "success", "current", "pending"];
    case "eol":
      return ["success", "success", "success", "danger"];
  }
}

function lifecycleProgressStepClass(v: LifecycleStepperVisual): string {
  const base = "pf-v6-c-progress-stepper__step";
  if (v === "success") return `${base} pf-m-success`;
  if (v === "current") return `${base} pf-m-current`;
  if (v === "danger") return `${base} pf-m-danger`;
  return `${base} pf-m-pending`;
}

function lifecycleProgressStepAriaLabel(v: LifecycleStepperVisual, title: string): string {
  if (v === "success") return `Completed step: ${title}`;
  if (v === "current") return `Current step, in process: ${title}`;
  if (v === "danger") return `Ended: ${title}`;
  return `Pending step: ${title}`;
}

function LifecycleProgressStepIcon({ visual }: { visual: LifecycleStepperVisual }) {
  if (visual === "success") {
    return <span className="pf-v6-c-progress-stepper__step-icon">{PF_PROGRESS_STEPPER_CHECK_ICON}</span>;
  }
  if (visual === "current") {
    return (
      <span className="pf-v6-c-progress-stepper__step-icon">
        <i className="pf-v6-pficon pf-v6-pficon-resources-full" aria-hidden />
      </span>
    );
  }
  if (visual === "danger") {
    return (
      <span className="pf-v6-c-progress-stepper__step-icon">
        <ExclamationTriangleIcon className="fa-exclamation-triangle" aria-hidden />
      </span>
    );
  }
  return <span className="pf-v6-c-progress-stepper__step-icon" />;
}

/**
 * Published operator lifecycle buckets (policy tables), as a PatternFly Progress Stepper.
 * @see https://www.patternfly.org/components/progress-stepper
 */
function SupportLifecycleProgressStepper({
  phase,
  entitlement,
}: {
  phase: SupportPhase;
  entitlement: SubscriptionEntitlementContext;
}) {
  const seg = getEntitlementAwareLifecycleTrackSegment(phase, entitlement);
  const steps = lifecycleStepperStepsForEntitlement(entitlement);
  const visuals = lifecycleProgressStepStates(seg, steps.length);

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }} className="ocs-io-lifecycle-stepper-wrap">
      <ol
        className="pf-v6-c-progress-stepper pf-m-horizontal pf-m-center ocs-io-lifecycle-stepper"
        role="list"
        aria-label="Operator support lifecycle progression"
      >
        {steps.map((step, index) => {
          const visual = visuals[index];
          return (
            <li
              key={step.id}
              className={lifecycleProgressStepClass(visual)}
              role="listitem"
              aria-label={lifecycleProgressStepAriaLabel(visual, step.title)}
            >
              <div className="pf-v6-c-progress-stepper__step-connector">
                <LifecycleProgressStepIcon visual={visual} />
              </div>
              <div className="pf-v6-c-progress-stepper__step-main">
                <div className="pf-v6-c-progress-stepper__step-title">{step.title}</div>
              </div>
            </li>
          );
        })}
      </ol>
      {seg === "eol" ? (
        <Content component="p" className="ocs-io-lifecycle-stepper__eol-note pf-v6-u-font-size-sm pf-v6-u-mb-0">
          <strong>Current:</strong> End of life — past the published milestones below.
        </Content>
      ) : null}
    </Flex>
  );
}

function PhaseEndDateTooltipBody({
  op,
  urgency,
  entitlement,
  eusMismatch = false,
}: {
  op: OperatorRow;
  urgency: PhaseDateLabelUrgency;
  entitlement: SubscriptionEntitlementContext;
  eusMismatch?: boolean;
}) {
  const lifecycleOp = getLifecycleEvaluationRow(op, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
  const phase = getEntitlementAwareSupportPhase(lifecycleOp, entitlement);
  const days = getEntitlementAwareDaysUntilPhaseEnd(lifecycleOp, entitlement);

  const alignmentMismatchNote = eusMismatch ? (
    <PlatformAlignmentMismatchAlert className="pf-v6-u-mb-sm" />
  ) : null;

  const policyLink = (
    <Button
      variant="link"
      icon={<ExternalLink />}
      iconPosition="right"
      component="a"
      href={RH_OPERATOR_LC_DOC_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      Operator life cycles policy
    </Button>
  );

  const clusterUpdateLink = (
    <Button variant="link" component={Link} to="/administration/cluster-update">
      Update cluster
    </Button>
  );

  const operatorUpdateLink =
    op.updateAvailable != null && op.updateAvailable !== "" ? (
      <Button
        variant="link"
        component={Link}
        to={`/ecosystem/installed-operators/${encodeURIComponent(op.name)}/update`}
        state={{
          returnTo: "/ecosystem/installed-operators",
          operatorName: op.name,
          operatorData: op,
        }}
      >
        Update operator
      </Button>
    ) : null;

  if (urgency === "danger") {
    return (
      <div className="ocs-io-phase-end-date-tooltip-body">
        {alignmentMismatchNote}
        <Flex
          className="ocs-io-phase-end-date-tooltip-body__details"
          direction={{ default: "column" }}
          gap={{ default: "gapSm" }}
          alignItems={{ default: "alignItemsStart" }}
        >
          <Content component="p" className="pf-v6-u-mb-0">
            {phase === "Unsupported"
              ? "This installation is not represented as entitled Red Hat support in this prototype. Confirm subscription and catalog sources before production upgrades."
              : "Published support for this operator version has ended. Remaining on this version increases risk when you plan cluster updates."}
          </Content>
          <Flex
            direction={{ default: "column" }}
            gap={{ default: "gapXs" }}
            alignItems={{ default: "alignItemsStart" }}
            className="pf-v6-u-font-size-sm"
          >
            <strong className="ocs-io-phase-end-date-tooltip-body__heading">Suggested next steps</strong>
            {operatorUpdateLink ?? (
              <Content component="small">Move to a supported operator version via your catalog or channel.</Content>
            )}
            {clusterUpdateLink}
            {policyLink}
          </Flex>
        </Flex>
      </div>
    );
  }

  if (urgency === "warning") {
    const phaseWords =
      phase === "Maintenance support" ? "maintenance support" : "extended life cycle (published EUS terms)";
    return (
      <div className="ocs-io-phase-end-date-tooltip-body">
        {alignmentMismatchNote}
        <Flex
          className="ocs-io-phase-end-date-tooltip-body__details"
          direction={{ default: "column" }}
          gap={{ default: "gapSm" }}
          alignItems={{ default: "alignItemsStart" }}
        >
          <Content component="p" className="pf-v6-u-mb-0">
            {days !== undefined ? (
              <>
                <strong>{days}</strong>
                {` day${days === 1 ? "" : "s"} left in the current ${phaseWords} window for this version. Plan an operator update before this date to stay aligned with cluster upgrades.`}
              </>
            ) : (
              "This support window is ending soon. Plan an operator update before published boundaries change."
            )}
          </Content>
          <Flex
            direction={{ default: "column" }}
            gap={{ default: "gapXs" }}
            alignItems={{ default: "alignItemsStart" }}
            className="pf-v6-u-font-size-sm"
          >
            <strong className="ocs-io-phase-end-date-tooltip-body__heading">Suggested next steps</strong>
            {operatorUpdateLink ?? (
              <Content component="small">Check your channel for a newer operator minor.</Content>
            )}
            {clusterUpdateLink}
            {policyLink}
          </Flex>
        </Flex>
      </div>
    );
  }

  if (urgency === "success") {
    return (
      <div className="ocs-io-phase-end-date-tooltip-body">
        {alignmentMismatchNote}
        <Flex
          className="ocs-io-phase-end-date-tooltip-body__details"
          direction={{ default: "column" }}
          gap={{ default: "gapSm" }}
          alignItems={{ default: "alignItemsStart" }}
        >
          <Content component="p" className="pf-v6-u-mb-0">
            You are in full support for this published version. Use this period to validate newer operator releases and
            align with your cluster update schedule.
          </Content>
          <Flex
            direction={{ default: "column" }}
            gap={{ default: "gapXs" }}
            alignItems={{ default: "alignItemsStart" }}
            className="pf-v6-u-font-size-sm"
          >
            <strong className="ocs-io-phase-end-date-tooltip-body__heading">Suggested next steps</strong>
            {operatorUpdateLink}
            {clusterUpdateLink}
            {policyLink}
          </Flex>
        </Flex>
      </div>
    );
  }

  return (
    <div className="ocs-io-phase-end-date-tooltip-body">
      {alignmentMismatchNote}
      <Flex
        className="ocs-io-phase-end-date-tooltip-body__details"
        direction={{ default: "column" }}
        gap={{ default: "gapSm" }}
        alignItems={{ default: "alignItemsStart" }}
      >
        <Content component="p" className="pf-v6-u-mb-0">
          You are in {phase === "Maintenance support" ? "maintenance support" : "extended life cycle"} with time before
          the next published milestone. Add operator updates to your change calendar ahead of cluster upgrades.
        </Content>
        <Flex
          direction={{ default: "column" }}
          gap={{ default: "gapXs" }}
          alignItems={{ default: "alignItemsStart" }}
          className="pf-v6-u-font-size-sm"
        >
          <strong className="ocs-io-phase-end-date-tooltip-body__heading">Suggested next steps</strong>
          {operatorUpdateLink}
          {clusterUpdateLink}
          {policyLink}
        </Flex>
      </Flex>
    </div>
  );
}

function phaseDateLabelPfColor(urgency: PhaseDateLabelUrgency): "green" | "orange" | "red" | "grey" {
  switch (urgency) {
    case "success":
      return "green";
    case "warning":
      return "orange";
    case "danger":
      return "red";
    default:
      return "grey";
  }
}

const FLOATING_PANEL_INLINE_ALERT_CLASS = "ocs-io-floating-panel-inline-alert";

function FloatingPanelAlertTitle({
  status,
  icon,
  children,
}: {
  status: "info" | "warning";
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Flex
      display={{ default: "inlineFlex" }}
      gap={{ default: "gapSm" }}
      alignItems={{ default: "alignItemsFlexStart" }}
    >
      <FlexItem className="ocs-io-floating-panel-inline-alert__title-icon">
        <Icon status={status} aria-hidden>
          {icon}
        </Icon>
      </FlexItem>
      <FlexItem>{children}</FlexItem>
    </Flex>
  );
}

function LifecyclePublicScheduleBanner({ className }: { className?: string }) {
  return (
    <Alert
      variant="info"
      title={
        <FloatingPanelAlertTitle status="info" icon={<Info aria-hidden />}>
          Public lifecycle schedules
        </FloatingPanelAlertTitle>
      }
      isInline
      className={[FLOATING_PANEL_INLINE_ALERT_CLASS, className].filter(Boolean).join(" ")}
    >
      {LIFECYCLE_PUBLIC_SCHEDULE_DISCLAIMER}
    </Alert>
  );
}

/** Inline alert for platform-aligned operator EUS vs cluster date mismatch (popover / tooltip only). */
function PlatformAlignmentMismatchAlert({ className }: { className?: string }) {
  return (
    <Alert
      variant="warning"
      title={
        <FloatingPanelAlertTitle status="warning" icon={<ExclamationTriangleIcon aria-hidden />}>
          Alignment mismatch
        </FloatingPanelAlertTitle>
      }
      isInline
      className={[FLOATING_PANEL_INLINE_ALERT_CLASS, className].filter(Boolean).join(" ")}
    >
      {PLATFORM_ALIGNED_EUS_MISMATCH_DISCLAIMER}
    </Alert>
  );
}

function SupportLifecyclePopoverContents({
  op,
  entitlement,
}: {
  op: OperatorRow;
  entitlement: SubscriptionEntitlementContext;
}) {
  const lifecycleOp = getLifecycleEvaluationRow(op, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
  const phase = getEntitlementAwareSupportPhase(lifecycleOp, entitlement);
  const entries = getEntitlementAwareLifecycleDateEntries(lifecycleOp, entitlement);
  const eusMismatch = hasPlatformAlignedEusMismatch(op, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);

  if (op.isUnsupported) {
    return (
      <>
        <Content component="p" className="pf-v6-u-mb-md">
          This install is not represented as entitled Red Hat support for this prototype row. Confirm your subscription,
          catalog source, and support agreement in your real environment.
        </Content>
        <LifecyclePublicScheduleBanner className="pf-v6-u-mb-md" />
        <Divider className="pf-v6-u-my-md" />
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <Button
            variant="link"
            isInline
            icon={<ExternalLink />}
            iconPosition="right"
            component="a"
            target="_blank"
            rel="noopener noreferrer"
            href={RH_OPERATOR_LC_DOC_URL}
          >
            OpenShift Operator life cycles
          </Button>
        </Flex>
      </>
    );
  }

  return (
    <div className="ocs-io-lifecycle-popover-body">
      <LifecyclePublicScheduleBanner className="pf-v6-u-mb-md" />
      {eusMismatch ? <PlatformAlignmentMismatchAlert className="pf-v6-u-mb-md" /> : null}
      <SupportLifecycleProgressStepper phase={phase} entitlement={entitlement} />
      <Content component="p" className="pf-v6-u-font-size-sm pf-v6-u-mb-md pf-v6-u-color-200">
        Milestones reflect your selected{" "}
        <strong>
          {SUBSCRIPTION_ENTITLEMENT_OPTIONS.find((o) => o.value === entitlement)?.label ?? "subscription context"}
        </strong>
        . Extended life cycle (EUS) terms not included in this view are omitted from the list below.
      </Content>
      {entries.length > 0 ? (
        <DescriptionList isCompact isHorizontal termWidth="12rem">
          {entries.map((row) => (
            <DescriptionListGroup key={row.term}>
              <DescriptionListTerm>{row.term}</DescriptionListTerm>
              <DescriptionListDescription>{row.description}</DescriptionListDescription>
            </DescriptionListGroup>
          ))}
        </DescriptionList>
      ) : (
        <Content component="p" className="pf-v6-u-mb-md">
          Published lifecycle dates are not shown for this operator in this view. Use Red Hat Customer Portal
          documentation for authoritative timelines for your version line.
        </Content>
      )}
      <Divider className="pf-v6-u-my-md" />
      <Button
        variant="link"
        isInline
        icon={<ExternalLink />}
        iconPosition="right"
        component="a"
        target="_blank"
        rel="noopener noreferrer"
        href={RH_OPERATOR_LC_DOC_URL}
      >
        OpenShift Operator life cycles
      </Button>
    </div>
  );
}

function OlmV1ExtensionSupportPopoverContents() {
  return (
    <>
      <Content component="p" className="pf-v6-u-mb-md">
        This column reflects Red Hat published phases for <strong>OLM v0</strong> catalog operators.{" "}
        <strong>OLM v1</strong> cluster extensions use different packaging; use the same policy references and your
        extension version on the portal to confirm dates.
      </Content>
      <LifecyclePublicScheduleBanner />
    </>
  );
}

/**
 * Support phase: plain phase label with an info icon that opens full lifecycle dates (no colored badges).
 */
function InstalledOperatorSupportPhaseCell({
  op,
  entitlement,
}: {
  op: OperatorRow;
  entitlement: SubscriptionEntitlementContext;
}) {
  const lifecycleOp = getLifecycleEvaluationRow(op, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
  const phaseLabel = op.isOlmV1Extension ? "—" : getEntitlementAwareSupportPhase(lifecycleOp, entitlement);
  const popoverAriaLabel = op.isOlmV1Extension
    ? "Support phase and OLM v1 extensions"
    : `Operator lifecycle for ${op.name}`;
  const bodyContent = op.isOlmV1Extension ? (
    <OlmV1ExtensionSupportPopoverContents />
  ) : (
    <SupportLifecyclePopoverContents op={op} entitlement={entitlement} />
  );

  return (
    <Flex
      direction={{ default: "row" }}
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapSm" }}
      flexWrap={{ default: "nowrap" }}
      style={{ minWidth: 0 }}
    >
      <Popover
        key={`${op.name}-lifecycle`}
        aria-label={popoverAriaLabel}
        headerContent={<Title headingLevel="h6">Operator lifecycle</Title>}
        bodyContent={bodyContent}
        position="auto"
        maxWidth="min(36rem, 96vw)"
        appendTo={() => document.body}
      >
        <Button
          variant="plain"
          type="button"
          className="ocs-io-support-phase-lifecycle-info"
          aria-label={popoverAriaLabel}
          hasNoPadding
          icon={<Info aria-hidden />}
        />
      </Popover>
      <Content component="small" style={{ minWidth: 0 }}>
        {phaseLabel}
      </Content>
    </Flex>
  );
}

function InstalledOperatorSupportPhaseEndCell({
  op,
  entitlement,
}: {
  op: OperatorRow;
  entitlement: SubscriptionEntitlementContext;
}) {
  if (op.isOlmV1Extension || op.isUnsupported) {
    return <Content component="small">—</Content>;
  }

  const lifecycleOp = getLifecycleEvaluationRow(op, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
  const eusMismatch = hasPlatformAlignedEusMismatch(op, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
  const urgency = getEntitlementAwarePhaseDateLabelUrgency(lifecycleOp, entitlement);
  const color = eusMismatch ? "orange" : phaseDateLabelPfColor(urgency);

  const raw = getEntitlementAwarePhaseEndDateRaw(lifecycleOp, entitlement);
  const formatted = raw ? formatLifecycleDateShort(raw) : "—";

  if (formatted === "—") {
    return <Content component="small">—</Content>;
  }

  const labelNode = (
    <Label
      isCompact
      variant="outline"
      color={color}
      className={[
        "ocs-io-phase-end-date-label",
        eusMismatch ? "ocs-io-phase-end-date-label--alignment-mismatch" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      icon={
        eusMismatch ? (
          <ExclamationTriangleIcon
            className="ocs-io-phase-end-date-label__warn-icon"
            aria-label="Platform alignment date mismatch"
          />
        ) : undefined
      }
    >
      {formatted}
    </Label>
  );

  return (
    <Tooltip
      content={
        <PhaseEndDateTooltipBody
          op={op}
          urgency={urgency}
          entitlement={entitlement}
          eusMismatch={eusMismatch}
        />
      }
      position="top"
      maxWidth="28rem"
      isContentLeftAligned
    >
      <span className="ocs-io-phase-end-date-tooltip-target" tabIndex={0}>
        {labelNode}
      </span>
    </Tooltip>
  );
}

type InstalledCatalogKindTab = "olmv0" | "olmv1";

export default function InstalledOperatorsPage() {
  const [operators] = useState<CatalogOperator[]>(() => [...INITIAL_CATALOG_OPERATORS]);
  const [installKindTab, setInstallKindTab] = useState<InstalledCatalogKindTab>("olmv0");
  const [openKebabIndex, setOpenKebabIndex] = useState<number | null>(null);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<IoListFilters>({
    initialFilters: INITIAL_IO_FILTERS,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumnKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotContext, setChatbotContext] = useState("");
  const [olsMountKey, setOlsMountKey] = useState(0);
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<TableColumnKey, boolean>>(
    () => ({ ...RESTORE_DEFAULT_VISIBLE })
  );
  const [columnModalDraft, setColumnModalDraft] = useState<Record<TableColumnKey, boolean>>(
    () => ({ ...RESTORE_DEFAULT_VISIBLE })
  );
  /** SKU-blind interim: admin-selected subscription tier drives lifecycle columns and popovers (OCPSTRAT-2957). */
  const [subscriptionEntitlement, setSubscriptionEntitlement] =
    useState<SubscriptionEntitlementContext>("standard");
  const navigate = useNavigate();
  const { demoVariant, setDemoVariant } = useClusterUpdateDemoVariant();
  const { setCurrentPage } = useChat();
  const isGlass = usePatternFlyGlassActive();
  /** Agent-led demo (`agent-only`): AI Assessment + summary cards. Manual updates demo hides them. */
  const showAssessmentAndOverviewCards = demoVariant === "agent-only";

  // Demo variant is controlled by the Prototype demo banner.
  // Do not force manual-and-agent on mount — that fought the Design option switcher.

  const openChatbot = useCallback((context: string) => {
    setChatbotContext(context);
    setOlsMountKey((k) => k + 1);
    setChatbotOpen(true);
  }, []);

  const handleChatAction = useCallback(
    (actionId: string) => {
      if (actionId === "view-plan" || actionId === "view-history") {
        navigate("/administration/cluster-update");
      }
    },
    [navigate]
  );

  useEffect(() => {
    setCurrentPage("/ecosystem/installed-operators");
  }, [setCurrentPage]);

  const hasOlmV0Operators = useMemo(
    () => operators.some((o) => !o.isOlmV1Extension),
    [operators]
  );

  /** CSV-only columns: hide on Cluster extensions (OLMv1) tab, not only when the cluster has no v0 operators. */
  const showOlmV0ListColumns = hasOlmV0Operators && installKindTab === "olmv0";

  const visibleDataColumnCount = useMemo(
    () =>
      TABLE_COLUMN_OPTIONS.filter(({ key }) => {
        if (
          !showOlmV0ListColumns &&
          (key === "clusterCompatibility" || key === "support" || key === "supportPhaseEnd")
        ) {
          return false;
        }
        return visibleColumns[key];
      }).length,
    [visibleColumns, showOlmV0ListColumns]
  );

  const manageColumnsDefaultOrder = useMemo(
    () =>
      DEFAULT_MANAGE_COLUMN_ORDER.filter(
        (col) =>
          showOlmV0ListColumns ||
          (col.key !== "clusterCompatibility" &&
            col.key !== "support" &&
            col.key !== "supportPhaseEnd")
      ),
    [showOlmV0ListColumns]
  );

  const ioListAdvFilterSpecEffective = useMemo(() => {
    if (showOlmV0ListColumns) return IO_LIST_ADV_FILTER_SPEC;
    const omit = new Set<string>(["clusterCompatibility", "support", "supportPhaseEnd"]);
    return IO_LIST_ADV_FILTER_SPEC.filter((a) => !omit.has(String(a.id)));
  }, [showOlmV0ListColumns]);

  const tableColSpan = 1 + visibleDataColumnCount + (visibleColumns.rowActions ? 1 : 0);

  const operatorsWithCompat = useMemo(() => {
    return operators.map((op) => {
      const { compatibility, message } = getOperatorCompatibilityPage(op, CLUSTER_TARGET_VERSION);
      return {
        ...op,
        clusterCompatibility: compatibility,
        compatibilityMessage: message || op.compatibilityMessage,
      };
    });
  }, [operators]);

  const searchAndAttributeFiltered = useMemo(
    () => operatorsWithCompat.filter((op) => rowMatchesDataViewFilters(op, filters, subscriptionEntitlement)),
    [operatorsWithCompat, filters, subscriptionEntitlement]
  );

  const tabFilteredOperators = useMemo(
    () =>
      searchAndAttributeFiltered.filter((op) =>
        installKindTab === "olmv1" ? op.isOlmV1Extension === true : !op.isOlmV1Extension
      ),
    [searchAndAttributeFiltered, installKindTab]
  );

  const sortedFilteredOperators = useMemo(
    () => sortOperatorRows(tabFilteredOperators, sortColumn, sortDirection, subscriptionEntitlement),
    [tabFilteredOperators, sortColumn, sortDirection, subscriptionEntitlement]
  );

  const pagedOperators = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedFilteredOperators.slice(start, start + perPage);
  }, [sortedFilteredOperators, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [filters, perPage, installKindTab, subscriptionEntitlement]);

  useEffect(() => {
    if (installKindTab === "olmv1") {
      onSetFilters({ clusterCompatibility: [], support: [], supportPhaseEnd: "" });
    }
  }, [installKindTab, onSetFilters]);

  const toggleSort = useCallback((col: SortColumnKey) => {
    if (col !== sortColumn) {
      setSortColumn(col);
      setSortDirection("asc");
    } else {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    }
  }, [sortColumn]);

  const renderSortableHeader = useCallback(
    (label: string, col: SortColumnKey, trailing?: ReactNode) => {
      const active = sortColumn === col;
      const isDesc = active && sortDirection === "desc";
      const sortBtn = (
        <Button
          className="ocs-operator-table-sort"
          variant="plain"
          onClick={() => toggleSort(col)}
          isInline
          iconPosition="end"
          icon={
            <SortCommonAscIcon
              className={[
                "ocs-operator-table-sort-glyph",
                active ? "ocs-operator-table-sort-icon--active" : "ocs-operator-table-sort-icon--idle",
              ]
                .filter(Boolean)
                .join(" ")}
              style={isDesc ? { transform: "rotate(180deg)" } : undefined}
              aria-hidden
            />
          }
        >
          {label}
        </Button>
      );
      if (!trailing) return sortBtn;
      return (
        <Flex
          direction={{ default: "row" }}
          alignItems={{ default: "alignItemsCenter" }}
          gap={{ default: "gapXs" }}
          flexWrap={{ default: "nowrap" }}
          style={{ display: "inline-flex", minWidth: 0 }}
          className="ocs-io-support-phase-th-inner"
        >
          {sortBtn}
          {trailing}
        </Flex>
      );
    },
    [sortColumn, sortDirection, toggleSort]
  );

  /** Non-sortable headers: same <Button plain isInline> shell as sortable columns for consistent type size. */
  const renderPlainHeader = useCallback((label: string) => {
    return (
      <Button
        className="ocs-operator-table-sort ocs-operator-table-header-static"
        component="div"
        variant="plain"
        isInline
        tabIndex={-1}
      >
        {label}
      </Button>
    );
  }, []);

  const installedAiSummary = useMemo(
    () => ({
      totalOperators: operators.length,
      updatesAvailable: operators.filter((o) => o.updateAvailable).length,
      clusterTargetVersion: CLUSTER_TARGET_VERSION,
      channelLabel: CLUSTER_CHANNEL,
    }),
    [operators]
  );

  const navigateToUpdate = (op: OperatorRow) => {
    navigate(`/ecosystem/installed-operators/${encodeURIComponent(op.name)}/update`, {
      state: { returnTo: "/ecosystem/installed-operators", operatorName: op.name, operatorData: op },
    });
  };

  return (
    <div className="flex h-full relative min-w-0">
      <OlsChatbot
        key={olsMountKey}
        isOpen={chatbotOpen}
        context={chatbotContext}
        selectedVersion={CLUSTER_TARGET_VERSION}
        selectedChannel={CLUSTER_CHANNEL}
        onClose={() => setChatbotOpen(false)}
        onAction={handleChatAction}
      >
      <div className="ocs-app-page-outer flex-1 min-h-0 min-w-0 overflow-y-auto">
            <Breadcrumbs
              items={[
                { label: "Home", path: "/" },
                { label: "Ecosystem", path: "/ecosystem" },
                { label: "Installed Operators" },
              ]}
            >
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>

            <Content>
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
              >
                <h1 id="main-title">Installed Operators</h1>
                <FavoriteButton name="Installed Operators" path="/ecosystem/installed-operators" />
              </Flex>
              <p>
                Installed Operators are represented by ClusterServiceVersions within this Namespace. For more
                information, see the{" "}
                <Button
                  variant="link"
                  isInline
                  icon={<ExternalLink />}
                  iconPosition="right"
                  component="a"
                  href={IO_CSV_DOC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  documentation
                </Button>
                . Or create an Operator and ClusterServiceVersion using{" "}
                <Button
                  variant="link"
                  isInline
                  icon={<ExternalLink />}
                  iconPosition="right"
                  component="a"
                  href={IO_IMPORT_YAML_DOC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Import YAML
                </Button>
                .
              </p>
            </Content>

            {showAssessmentAndOverviewCards && (
              <>
                <AiAssessmentSection
                  variant="installed-operators"
                  installedSummary={installedAiSummary}
                  openChatbot={openChatbot}
                  selectedVersion={CLUSTER_TARGET_VERSION}
                />

                <Flex flexWrap={{ default: "flexWrapWrap" }} gap={{ default: "gapLg" }}>
                  <FlexItem flex={{ default: "flex_1" }} grow={{ default: "grow" }} shrink={{ default: "shrink" }}>
                    <Card isGlass={isGlass} isFullHeight>
                      <CardBody>
                        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                            <Icon size="lg" status="success">
                              <CheckCircle />
                            </Icon>
                            <Content component="small">Total installed</Content>
                          </Flex>
                          <Title headingLevel="h3" size="4xl">
                            {operators.length}
                          </Title>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: "flex_1" }} grow={{ default: "grow" }} shrink={{ default: "shrink" }}>
                    <Card isGlass={isGlass} isFullHeight>
                      <CardBody>
                        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                            <Icon size="lg" status="info">
                              <Info />
                            </Icon>
                            <Content component="small">Available Updates</Content>
                          </Flex>
                          <Title headingLevel="h3" size="4xl">
                            {operators.filter((o) => o.updateAvailable).length}
                          </Title>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: "flex_1" }} grow={{ default: "grow" }} shrink={{ default: "shrink" }}>
                    <Card isGlass={isGlass} isFullHeight>
                      <CardBody>
                        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                            <Icon size="lg" status="warning">
                              <AlertCircle />
                            </Icon>
                            <Content component="small">End of Life Support</Content>
                          </Flex>
                          <Title headingLevel="h3" size="4xl">
                            {
                              operators.filter((o) => {
                                if (o.isOlmV1Extension) return false;
                                const row = getLifecycleEvaluationRow(o, PROTOTYPE_CLUSTER_OCP_LIFECYCLE);
                                return (
                                  getEntitlementAwareSupportPhase(row, subscriptionEntitlement) === "End of life"
                                );
                              }).length
                            }
                          </Title>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                </Flex>
              </>
            )}

            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <Tabs
                id="installed-operators-olm-tabs"
                aria-label="Installed operator catalog type"
                activeKey={installKindTab}
                onSelect={(_event, eventKey) => {
                  if (eventKey === "olmv0" || eventKey === "olmv1") {
                    setInstallKindTab(eventKey);
                  }
                }}
                variant="secondary"
              >
                <Tab
                  eventKey="olmv0"
                  title={<TabTitleText>Operators (OLMv0)</TabTitleText>}
                  ouiaId="installed-operators-tab-olmv0"
                >
                  <></>
                </Tab>
                <Tab
                  eventKey="olmv1"
                  title={
                    <Flex
                      gap={{ default: "gapSm" }}
                      alignItems={{ default: "alignItemsCenter" }}
                      flexWrap={{ default: "nowrap" }}
                    >
                      <TabTitleText>Cluster extensions (OLMv1)</TabTitleText>
                      <Label isCompact color="orange">
                        Tech preview
                      </Label>
                    </Flex>
                  }
                  ouiaId="installed-operators-tab-olmv1"
                >
                  <></>
                </Tab>
              </Tabs>

              <DataView
              ouiaId="installed-operators-data-view"
              className="ocs-io-dataview"
              style={
                showAssessmentAndOverviewCards
                  ? undefined
                  : { marginBlockStart: 0 }
              }
            >
              <DataViewToolbar
                ouiaId="installed-operators-dv-toolbar"
                id="installed-operators-dv-toolbar"
                className="ocs-io-dataview-toolbar pf-m-toggle-group-container ocs-io-dv-toolbar-align"
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<IoListFilters>
                    values={filters}
                    onChange={(_filterId, partial) => onSetFilters(partial as Partial<IoListFilters>)}
                    breakpoint="xl"
                    afterFiltersContent={
                      showOlmV0ListColumns ? (
                        <ToolbarItem className="ocs-io-subscription-entitlement-toolbar-item">
                          <Flex
                            direction={{ default: "row" }}
                            gap={{ default: "gapSm" }}
                            alignItems={{ default: "alignItemsCenter" }}
                            flexWrap={{ default: "nowrap" }}
                          >
                            <FormSelect
                              id="installed-operators-subscription-entitlement"
                              aria-label="Subscription entitlement"
                              value={subscriptionEntitlement}
                              onChange={(_event, value) =>
                                setSubscriptionEntitlement(value as SubscriptionEntitlementContext)
                              }
                              style={{ minWidth: "min(20rem, 36vw)" }}
                            >
                              {SUBSCRIPTION_ENTITLEMENT_OPTIONS.map((opt) => (
                                <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
                              ))}
                            </FormSelect>
                            <Popover
                              aria-label="About subscription entitlement"
                              headerContent={<Title headingLevel="h6">Subscription entitlement</Title>}
                              bodyContent={
                                <Content component="div" className="pf-v6-u-font-size-sm">
                                  <p className="pf-v6-u-mb-md">
                                    OpenShift 5.0 cannot read your SKU. Select the tier that best matches your
                                    subscription so support phase and end date columns use the correct maintenance or
                                    extended life cycle boundaries.
                                  </p>
                                  <p className="pf-v6-u-mb-0">
                                    Layered and third-party operators always use their own published dates. Sub-cluster
                                    entitlement (OCPSTRAT-2957) will replace this control in a future release.
                                  </p>
                                </Content>
                              }
                              position="bottom"
                              maxWidth="min(24rem, 92vw)"
                              appendTo={() => document.body}
                            >
                              <Button
                                variant="plain"
                                type="button"
                                aria-label="About subscription entitlement"
                                hasNoPadding
                                icon={<Info aria-hidden />}
                              />
                            </Popover>
                          </Flex>
                        </ToolbarItem>
                      ) : null
                    }
                    midContent={
                      <ToolbarGroup
                        className="ocs-io-filters-mid-actions"
                        gap={{ default: "gapMd" }}
                        variant="action-group"
                        alignItems="center"
                      >
                        <ToolbarItem>
                          <Button
                            variant="plain"
                            title="Advanced filter"
                            aria-label="Advanced filter"
                            onClick={() => {
                              setIsAdvancedFilterModalOpen(true);
                            }}
                            icon={<SlidersHIcon aria-hidden />}
                          />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button
                            variant="plain"
                            title="Manage columns"
                            aria-label="Manage columns"
                            onClick={() => {
                              setColumnModalDraft({ ...visibleColumns });
                              setIsManageColumnsModalOpen(true);
                            }}
                            icon={<Columns2 aria-hidden />}
                          />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button
                            variant="link"
                            component={Link}
                            to="/ecosystem/software-catalog"
                            icon={<ExternalLink />}
                            iconPosition="right"
                          >
                            Browse Software Catalog
                          </Button>
                        </ToolbarItem>
                      </ToolbarGroup>
                    }
                  >
                    <DataViewTextFilter
                      title="Name"
                      filterId="name"
                      placeholder="Search operators or namespaces"
                      style={{ minWidth: "16rem", maxWidth: "100%" }}
                    />
                    <DataViewCheckboxFilter
                      title="Status"
                      filterId="status"
                      placeholder="Choose statuses"
                      showIcon
                      showBadge
                      options={FILTER_VALUE_OPTIONS.status}
                    />
                    <DataViewTextFilter
                      title="Version"
                      filterId="version"
                      placeholder="Type to match version"
                      style={{ minWidth: "12rem", maxWidth: "100%" }}
                    />
                    {showOlmV0ListColumns ? (
                      <>
                        <DataViewCheckboxFilter
                          title="Cluster compatibility"
                          filterId="clusterCompatibility"
                          placeholder="Choose compatibility"
                          showIcon
                          showBadge
                          options={FILTER_VALUE_OPTIONS.clusterCompatibility}
                        />
                        <DataViewCheckboxFilter
                          title="Support phase"
                          filterId="support"
                          placeholder="Choose lifecycle phases"
                          showIcon
                          showBadge
                          options={FILTER_VALUE_OPTIONS.support}
                        />
                        <DataViewTextFilter
                          title="Current phase end date"
                          filterId="supportPhaseEnd"
                          placeholder="Match current phase end date"
                          style={{ minWidth: "14rem", maxWidth: "100%" }}
                        />
                      </>
                    ) : null}
                    <DataViewTextFilter
                      title="Last updated"
                      filterId="lastUpdated"
                      placeholder="Match updated date or time"
                      style={{ minWidth: "14rem", maxWidth: "100%" }}
                    />
                    <DataViewTextFilter
                      title="Managed namespaces"
                      filterId="managedNamespaces"
                      placeholder="Search namespaces"
                      style={{ minWidth: "14rem", maxWidth: "100%" }}
                    />
                  </IoDataViewFiltersWithMidActions>
                }
                pagination={
                  <Pagination
                    perPageOptions={[
                      { title: "5", value: 5 },
                      { title: "10", value: 10 },
                      { title: "20", value: 20 },
                      { title: "50", value: 50 },
                    ]}
                    itemCount={sortedFilteredOperators.length}
                    page={page}
                    perPage={perPage}
                    onSetPage={(_e, p) => setPage(p)}
                    onPerPageSelect={(_e, pp) => {
                      setPerPage(pp);
                      setPage(1);
                    }}
                    variant={PaginationVariant.top}
                    isCompact
                    ouiaId="installed-operators-pagination"
                    widgetId="installed-operators-pagination"
                    titles={{ items: "operators" }}
                    paginationAriaLabel="Installed operators pagination (top)"
                  />
                }
              />

            <PageSection aria-label="Installed operators table" padding={{ default: "noPadding" }}>
            <InnerScrollContainer>
                <Table aria-label="Installed operators" borders variant="compact" className="ocs-io-operator-table">
                  <Thead>
                    <Tr>
                      <Th dataLabel="Operator">
                        {renderSortableHeader("Operator", "name")}
                      </Th>
                      {visibleColumns.status && (
                        <Th dataLabel="Status">{renderSortableHeader("Status", "status")}</Th>
                      )}
                      {visibleColumns.version && (
                        <Th dataLabel="Version">{renderSortableHeader("Version", "version")}</Th>
                      )}
                      {showOlmV0ListColumns && visibleColumns.clusterCompatibility && (
                        <Th dataLabel="Cluster compatibility">
                          {renderSortableHeader("Cluster compatibility", "clusterCompatibility")}
                        </Th>
                      )}
                      {showOlmV0ListColumns && visibleColumns.support && (
                        <Th dataLabel="Support phase">{renderSortableHeader("Support phase", "support")}</Th>
                      )}
                      {showOlmV0ListColumns && visibleColumns.supportPhaseEnd && (
                        <Th dataLabel="Current phase end date">
                          {renderSortableHeader("Current phase end date", "supportPhaseEnd")}
                        </Th>
                      )}
                      {visibleColumns.lastUpdated && (
                        <Th dataLabel="Last updated">{renderSortableHeader("Last updated", "lastUpdated")}</Th>
                      )}
                      {visibleColumns.updatePlan && (
                        <Th dataLabel="Update plan">{renderPlainHeader("Update plan")}</Th>
                      )}
                      {visibleColumns.managedNamespaces && (
                        <Th dataLabel="Managed namespaces">{renderPlainHeader("Managed namespaces")}</Th>
                      )}
                      {visibleColumns.rowActions && (
                        <Th modifier="fitContent" dataLabel="Actions">
                          {renderPlainHeader("Actions")}
                        </Th>
                      )}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sortedFilteredOperators.length === 0 ? (
                      <Tr>
                        <Td colSpan={tableColSpan} dataLabel="Empty state">
                          No operators match your search or filters.
                        </Td>
                      </Tr>
                    ) : (
                      pagedOperators.map((op, i) => (
                        <Tr key={op.name}>
                          <Td dataLabel="Operator">
                            <Button
                              variant="link"
                              isInline
                              component={Link}
                              to={`/ecosystem/installed-operators/${encodeURIComponent(op.name)}`}
                            >
                              {op.name}
                            </Button>
                          </Td>
                          {visibleColumns.status && (
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
                          )}
                          {visibleColumns.version && (
                            <Td dataLabel="Version">
                              <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                                <Content component="small">
                                  <code>{op.version}</code>
                                </Content>
                                {op.updateAvailable ? (
                                  <Content component="small">
                                    <Button
                                      variant="link"
                                      isInline
                                      component={Link}
                                      to={`/ecosystem/installed-operators/${encodeURIComponent(op.name)}/update`}
                                      state={{
                                        returnTo: "/ecosystem/installed-operators",
                                        operatorName: op.name,
                                        operatorData: op,
                                      }}
                                    >
                                      Update available: {op.updateAvailable}
                                    </Button>
                                  </Content>
                                ) : null}
                              </Flex>
                            </Td>
                          )}
                          {showOlmV0ListColumns && visibleColumns.clusterCompatibility && (
                            <Td dataLabel="Cluster compatibility">
                              {op.isOlmV1Extension ? (
                                <Tooltip
                                  content="Cluster compatibility applies to OLM v0 managed operators (CSV) only."
                                  position="top"
                                >
                                  <Content component="small">—</Content>
                                </Tooltip>
                              ) : op.clusterCompatibility === "Compatible" ? (
                                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                  <Icon status="success">
                                    <CheckCircle />
                                  </Icon>
                                  Compatible
                                </Flex>
                              ) : (
                                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                  <Icon status="danger">
                                    <AlertCircle />
                                  </Icon>
                                  Incompatible
                                </Flex>
                              )}
                            </Td>
                          )}
                          {showOlmV0ListColumns && visibleColumns.support && (
                            <Td dataLabel="Support phase">
                              <InstalledOperatorSupportPhaseCell
                                op={op}
                                entitlement={subscriptionEntitlement}
                              />
                            </Td>
                          )}
                          {showOlmV0ListColumns && visibleColumns.supportPhaseEnd && (
                            <Td dataLabel="Current phase end date">
                              <InstalledOperatorSupportPhaseEndCell
                                op={op}
                                entitlement={subscriptionEntitlement}
                              />
                            </Td>
                          )}
                          {visibleColumns.lastUpdated && (
                            <Td dataLabel="Last updated" modifier="nowrap">
                              {op.lastUpdated && op.lastUpdated !== "—" ? (
                                <Flex
                                  spaceItems={{ default: "spaceItemsSm" }}
                                  alignItems={{ default: "alignItemsCenter" }}
                                  flexWrap={{ default: "nowrap" }}
                                >
                                  <Globe
                                    aria-hidden
                                    style={{
                                      color: "var(--pf-t--global--icon--color--on-disabled, #6a6e73)",
                                      width: "1.125em",
                                      height: "1.125em",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span>{formatDataViewListDate(op.lastUpdated)}</span>
                                </Flex>
                              ) : (
                                "—"
                              )}
                            </Td>
                          )}
                          {visibleColumns.updatePlan && (
                            <Td dataLabel="Update plan">{op.autoUpdate ? "Automatic" : "Manual"}</Td>
                          )}
                          {visibleColumns.managedNamespaces && (
                            <Td dataLabel="Managed namespaces">
                              <Flex gap={{ default: "gapXs" }} flexWrap={{ default: "flexWrapWrap" }}>
                                {(op.managedNamespaces || []).map((ns, idx) => (
                                  <Label key={idx} isCompact variant="outline" color="grey">
                                    {ns}
                                  </Label>
                                ))}
                              </Flex>
                            </Td>
                          )}
                          {visibleColumns.rowActions && (
                            <Td dataLabel="Actions" isActionCell hasAction>
                              <Dropdown
                                isOpen={openKebabIndex === i}
                                onOpenChange={(open) => setOpenKebabIndex(open ? i : null)}
                                popperProps={{ position: "right-end" }}
                                toggle={(toggleRef) => (
                                  <MenuToggle
                                    ref={toggleRef}
                                    variant="plain"
                                    aria-label={`Actions for ${op.name}`}
                                    icon={<EllipsisVIcon />}
                                    onClick={() =>
                                      setOpenKebabIndex(openKebabIndex === i ? null : i)
                                    }
                                    isExpanded={openKebabIndex === i}
                                  />
                                )}
                                onSelect={() => setOpenKebabIndex(null)}
                              >
                                <DropdownItem
                                  itemId="view"
                                  onClick={() =>
                                    navigate(
                                      `/ecosystem/installed-operators/${encodeURIComponent(op.name)}`
                                    )
                                  }
                                >
                                  View details
                                </DropdownItem>
                                {typeof op.updateAvailable === "string" && op.updateAvailable.length > 0 ? (
                                  <DropdownItem itemId="update" onClick={() => navigateToUpdate(op)}>
                                    Update
                                  </DropdownItem>
                                ) : null}
                                <DropdownItem
                                  itemId="subscription"
                                  onClick={() =>
                                    navigate(
                                      `/ecosystem/installed-operators/${encodeURIComponent(op.name)}/subscription`
                                    )
                                  }
                                >
                                  Edit subscription
                                </DropdownItem>
                              </Dropdown>
                            </Td>
                          )}
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </InnerScrollContainer>
            </PageSection>
            </DataView>
            </Flex>
          </Flex>
            </Breadcrumbs>
      </div>
      </OlsChatbot>

      <Modal
        variant="large"
        isOpen={isManageColumnsModalOpen}
        onClose={() => setIsManageColumnsModalOpen(false)}
        aria-labelledby="io-manage-cols-title"
        aria-describedby="io-manage-cols-body"
      >
        <ModalHeader
          labelId="io-manage-cols-title"
          descriptorId="io-manage-cols-body"
          title="Manage columns"
          description="Default columns are shown by default. Additional columns include update plan, managed namespaces, and optional row actions. Cluster compatibility, Support phase, and Current phase end date apply to OLM v0 managed operators only. Operator is always shown."
        />
        <ModalBody id="io-manage-cols-body">
          <Flex
            direction={{ default: "column", md: "row" }}
            gap={{ default: "gap2xl" }}
            alignItems={{ default: "alignItemsStretch" }}
            style={{ maxWidth: "100%" }}
          >
            <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
              <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
                Default columns
              </Title>
              <div style={ioManageColRowStyle(true)}>
                <Checkbox
                  id="io-col-operator-mandatory"
                  label="Operator"
                  isChecked
                  isDisabled
                  onChange={() => {}}
                />
              </div>
              {manageColumnsDefaultOrder.map((col, i) => {
                const isLast = i === manageColumnsDefaultOrder.length - 1;
                return (
                  <div key={col.key} style={ioManageColRowStyle(!isLast)}>
                    <Checkbox
                      id={`io-col-draft-${col.key}`}
                      label={col.label}
                      isChecked={columnModalDraft[col.key]}
                      onChange={(_e, c) =>
                        setColumnModalDraft((d) => ({ ...d, [col.key]: c }))
                      }
                    />
                  </div>
                );
              })}
            </FlexItem>
            <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
              <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
                Additional columns
              </Title>
              {ADDITIONAL_MANAGE_COLUMN_ORDER.map((col, i) => {
                const isLast = i === ADDITIONAL_MANAGE_COLUMN_ORDER.length - 1;
                return (
                  <div key={col.key} style={ioManageColRowStyle(!isLast)}>
                    <Checkbox
                      id={`io-col-draft-${col.key}`}
                      label={col.label}
                      isChecked={columnModalDraft[col.key]}
                      onChange={(_e, c) =>
                        setColumnModalDraft((d) => ({ ...d, [col.key]: c }))
                      }
                    />
                  </div>
                );
              })}
            </FlexItem>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex
            flexWrap={{ default: "flexWrapWrap" }}
            alignItems={{ default: "alignItemsCenter" }}
            gap={{ default: "gapMd" }}
            justifyContent={{ default: "justifyContentFlexStart" }}
          >
            <Button
              variant="primary"
              onClick={() => {
                setVisibleColumns({ ...columnModalDraft });
                setIsManageColumnsModalOpen(false);
              }}
            >
              Save
            </Button>
            <Button variant="link" onClick={() => setIsManageColumnsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="link"
              onClick={() => setColumnModalDraft({ ...RESTORE_DEFAULT_VISIBLE })}
            >
              Restore default columns
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>

      <ListAdvancedFilterModal<keyof IoListFilters>
        isOpen={isAdvancedFilterModalOpen}
        onClose={() => setIsAdvancedFilterModalOpen(false)}
        source={filters}
        onSave={(next) => onSetFilters(next as IoListFilters)}
        getEmpty={getEmptyIoListFilters}
        spec={ioListAdvFilterSpecEffective}
        defaultAttributeWhenNoRows="name"
        idPrefix="io-list-adv"
      />
    </div>
  );
}
