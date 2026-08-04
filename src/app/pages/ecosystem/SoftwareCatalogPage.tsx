import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  AlertGroup,
  Content,
  Drawer,
  DrawerContent,
  DrawerPanelContent,
} from "@patternfly/react-core";
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
} from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import CatalogOperatorDetailPanel from "../../components/CatalogOperatorDetailPanel";
import { CatalogBrandLogo } from "./CatalogBrandLogo";
import type { LogoCatalogType } from "./catalogLogos";

/** Facet / tile type for Software Catalog entries (operators + other catalog resources). */
type CatalogItemKind =
  | "builderImages"
  | "devfiles"
  | "helmCharts"
  | "operators"
  | "templates"
  | "event-sources"
  | "knative-serving"
  | "samples"
  | "shared-resources"
  | "cluster-addons"
  | "pipelines";

interface CatalogItem {
  id: string;
  name: string;
  provider: string;
  providerType: "Red Hat" | "Community" | "Certified";
  description: string;
  installed: boolean;
  hasUpdate?: boolean;
  newVersion?: string;
  currentVersion?: string;
  categories: string[];
  olmVersion?: "v0" | "v1";
  catalogType: CatalogItemKind;
}

const PROVIDER_ROTATION = [
  "Red Hat",
  "Apache",
  "IBM",
  "MongoDB",
  "Elastic",
  "Grafana Labs",
  "Couchbase",
  "CrunchyData",
  "Dynatrace",
  "Oracle",
  "Strimzi",
  "Spotahome",
  "Fluent",
  "Sysdig",
  "HashiCorp",
  "Red Hat",
] as const;

const SOURCE_ROTATION: Array<"Red Hat" | "Community" | "Certified"> = [
  "Red Hat",
  "Community",
  "Certified",
  "Community",
  "Certified",
  "Community",
  "Certified",
  "Red Hat",
];

function makeCatalogItems(
  catalogType: CatalogItemKind,
  count: number,
  namePrefix: string,
): CatalogItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${catalogType}-${i + 1}`,
    name: `${namePrefix} ${i + 1}`,
    provider: PROVIDER_ROTATION[i % PROVIDER_ROTATION.length],
    providerType: SOURCE_ROTATION[i % SOURCE_ROTATION.length],
    description: `Prototype ${catalogType.replace(/-/g, " ")} catalog entry for design reviews and demos.`,
    installed: false,
    categories: [],
    catalogType,
  }));
}

/** Shown only after “Show all” under Type; illustrative counts (prototype). */
const EXTRA_TYPE_FACETS: { id: string; label: string; count: number }[] = [
  { id: "event-sources", label: "Event Sources", count: 54 },
  { id: "knative-serving", label: "Knative Services", count: 51 },
  { id: "samples", label: "Samples", count: 58 },
  { id: "shared-resources", label: "Shared Resources", count: 62 },
  { id: "cluster-addons", label: "Cluster add-ons", count: 55 },
  { id: "pipelines", label: "Pipelines", count: 67 },
];

const MIN_TYPE_FACET_DISPLAY = 50;

const STATIC_TYPE_COUNTS = {
  builderImages: 62,
  devfiles: 55,
  helmCharts: 124,
  templates: 73,
} as const;

const SUBSCRIPTION_FACETS: { id: string; label: string; count: number }[] = [
  { id: "openshift-k8s-engine", label: "OpenShift Kubernetes Engine", count: 49 },
  { id: "openshift-virt-engine", label: "OpenShift Virtualization Engine", count: 49 },
  { id: "openshift-container-platform", label: "OpenShift Container Platform", count: 90 },
  { id: "openshift-platform-plus", label: "OpenShift Platform Plus", count: 105 },
  { id: "separate-subscription", label: "Requires separate subscription", count: 70 },
];

const PROVIDER_FACET_PAGE_SIZE = 4;

const CATALOG_TYPE_LABEL: Record<CatalogItemKind, string> = {
  builderImages: "Builder image",
  devfiles: "Devfile",
  helmCharts: "Helm chart",
  operators: "Operator",
  templates: "Template",
  "event-sources": "Event source",
  "knative-serving": "Knative service",
  samples: "Sample",
  "shared-resources": "Shared resource",
  "cluster-addons": "Cluster add-on",
  pipelines: "Pipeline",
};

/** Single top-right pill on catalog cards (matches console “All items” tile pattern). */
function catalogCardPillLabel(item: CatalogItem): string {
  switch (item.catalogType) {
    case "helmCharts":
      return "Helm Charts";
    case "devfiles":
      return "Devfiles";
    case "templates":
      return "Templates";
    case "builderImages":
      return "Builder Images";
    case "operators":
      if (item.providerType === "Red Hat") return "Red Hat";
      if (item.providerType === "Certified") return "Certified";
      return "Community";
    default:
      return CATALOG_TYPE_LABEL[item.catalogType];
  }
}

export default function SoftwareCatalogPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSort, setCatalogSort] = useState<"relevance" | "name">("relevance");
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Type",
    "Catalog",
    "Capabilities",
    "Source",
    "Provider",
    "Valid subscription",
  ]);
  /** Faceted “Catalog” filter: OLMv0 vs OLMv1. Both unchecked = show all (no OLM version filter). */
  const [catalogOlmFilters, setCatalogOlmFilters] = useState({
    legacyOlmv0: false,
    clusterExtensionOlmv1: false,
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  /** Type facets filter tiles; each catalog item has a matching `catalogType`. */
  const [typeFacet, setTypeFacet] = useState({
    builderImages: false,
    devfiles: false,
    helmCharts: false,
    operators: false,
    templates: false,
  });
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);
  /** Extra type rows revealed by “Show all”. */
  const [extraTypeFacet, setExtraTypeFacet] = useState<Record<string, boolean>>({});
  const [subscriptionFacet, setSubscriptionFacet] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState({
    source: [] as string[],
    provider: [] as string[],
  });

  const RAW_OPERATORS: Array<Omit<CatalogItem, "catalogType">> = [
    // OLMv0 Operators (default set - large catalog)
    {
      id: "abot-operator",
      name: "Abot Operator",
      provider: "Refactz Technologies",
      providerType: "Certified",
      description: "The Abot Test Bench is a test automation tool for 4G, 5G and ORAN Telecom networks",
      installed: true,
      hasUpdate: true,
      newVersion: "3.1.0",
      currentVersion: "3.0.0",
      categories: ["Operators", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "airflow-helm",
      name: "Airflow Helm Operator",
      provider: "Apache",
      providerType: "Community",
      description: "An experimental operator that installs Apache Airflow for workflow orchestration",
      installed: true,
      hasUpdate: true,
      newVersion: "5.7.3",
      currentVersion: "5.7.2",
      categories: ["Operators", "Community"],
      olmVersion: "v0"
    },
    {
      id: "ansible-automation",
      name: "Ansible Automation Platform",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "The Ansible Automation Platform Resource Operator manages everything Automation",
      installed: true,
      hasUpdate: true,
      newVersion: "1.6.0",
      currentVersion: "1.5.0",
      categories: ["Operators", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "bare-metal-event",
      name: "Bare Metal Event Relay",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "This software manages the lifecycle of the bare-event-proxy container",
      installed: true,
      hasUpdate: true,
      newVersion: "1.2.0",
      currentVersion: "1.1.1",
      categories: ["Operators", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "camel-k",
      name: "Camel K Operator",
      provider: "Apache",
      providerType: "Community",
      description: "Apache Camel K is a lightweight integration platform, born on Kubernetes, with serverless superpowers",
      installed: true,
      categories: ["Operators", "Community"],
      olmVersion: "v0"
    },
    {
      id: "business-automation",
      name: "Business Automation",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Deploys and manages Red Hat Process Automation Manager and Red Hat Decision Manager environments",
      installed: false,
      categories: ["Operators", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "postgresql",
      name: "PostgreSQL Operator",
      provider: "CrunchyData",
      providerType: "Certified",
      description: "Production PostgreSQL made easy, with high availability, backups and disaster recovery",
      installed: false,
      categories: ["Database", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "mongodb",
      name: "MongoDB Enterprise",
      provider: "MongoDB",
      providerType: "Certified",
      description: "MongoDB Enterprise Kubernetes Operator - production-grade MongoDB deployment and management",
      installed: false,
      categories: ["Database", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "mysql",
      name: "MySQL Operator",
      provider: "Oracle",
      providerType: "Community",
      description: "Create, operate and scale self-healing MySQL clusters in Kubernetes",
      installed: false,
      categories: ["Database", "Community"],
      olmVersion: "v0"
    },
    {
      id: "redis",
      name: "Redis Operator",
      provider: "Spotahome",
      providerType: "Community",
      description: "Redis Operator creates/configures/manages Redis clusters atop Kubernetes",
      installed: false,
      categories: ["Database", "Community"],
      olmVersion: "v0"
    },
    {
      id: "kafka-strimzi",
      name: "Strimzi Apache Kafka",
      provider: "Strimzi",
      providerType: "Community",
      description: "Strimzi provides a way to run an Apache Kafka cluster on Kubernetes in various deployment configurations",
      installed: false,
      categories: ["Streaming", "Community"],
      olmVersion: "v0"
    },
    {
      id: "couchbase",
      name: "Couchbase Operator",
      provider: "Couchbase",
      providerType: "Certified",
      description: "The Couchbase Autonomous Operator provides a native integration of Couchbase Server with Kubernetes",
      installed: false,
      categories: ["Database", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "jenkins",
      name: "Jenkins Operator",
      provider: "Jenkins",
      providerType: "Community",
      description: "Kubernetes native operator which fully manages Jenkins on Kubernetes",
      installed: false,
      categories: ["CI/CD", "Community"],
      olmVersion: "v0"
    },
    {
      id: "tekton",
      name: "OpenShift Pipelines",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Red Hat OpenShift Pipelines is a cloud-native, continuous integration and delivery solution based on Kubernetes resources",
      installed: false,
      categories: ["CI/CD", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "jaeger",
      name: "Jaeger Operator",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Jaeger Operator for Kubernetes simplifies deploying and running Jaeger on Kubernetes",
      installed: false,
      categories: ["Observability", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "kiali",
      name: "Kiali Operator",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Kiali is a management console for Istio-based service mesh",
      installed: false,
      categories: ["Observability", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "elasticsearch",
      name: "Elasticsearch Operator",
      provider: "Elastic",
      providerType: "Certified",
      description: "Automates the deployment, provisioning, management, and orchestration of Elasticsearch",
      installed: false,
      categories: ["Logging", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "fluentd",
      name: "Fluentd Operator",
      provider: "Fluent",
      providerType: "Community",
      description: "Fluentd is an open source data collector for unified logging layer",
      installed: false,
      categories: ["Logging", "Community"],
      olmVersion: "v0"
    },
    {
      id: "minio",
      name: "MinIO Operator",
      provider: "MinIO",
      providerType: "Community",
      description: "MinIO is a high performance distributed object storage server, designed for large-scale private cloud infrastructure",
      installed: false,
      categories: ["Storage", "Community"],
      olmVersion: "v0"
    },
    {
      id: "rook-ceph",
      name: "Rook Ceph",
      provider: "Rook",
      providerType: "Community",
      description: "Rook turns distributed storage systems into self-managing, self-scaling, self-healing storage services",
      installed: false,
      categories: ["Storage", "Community"],
      olmVersion: "v0"
    },
    {
      id: "metallb",
      name: "MetalLB Operator",
      provider: "MetalLB",
      providerType: "Community",
      description: "MetalLB is a load-balancer implementation for bare metal Kubernetes clusters",
      installed: false,
      categories: ["Networking", "Community"],
      olmVersion: "v0"
    },
    {
      id: "nginx-ingress",
      name: "NGINX Ingress Operator",
      provider: "NGINX",
      providerType: "Certified",
      description: "NGINX Ingress Operator provides ingress controller for Kubernetes deployments",
      installed: false,
      categories: ["Networking", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "istio",
      name: "Istio Service Mesh",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Red Hat OpenShift Service Mesh provides a uniform way to connect, manage and observe microservices based applications",
      installed: false,
      categories: ["Networking", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "kong",
      name: "Kong Gateway Operator",
      provider: "Kong",
      providerType: "Certified",
      description: "Kong for Kubernetes is an ingress controller and API gateway",
      installed: false,
      categories: ["Networking", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "datadog",
      name: "Datadog Operator",
      provider: "Datadog",
      providerType: "Certified",
      description: "The Datadog Operator provides a Kubernetes-native way to deploy the Datadog Agent",
      installed: false,
      categories: ["Monitoring", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "dynatrace",
      name: "Dynatrace Operator",
      provider: "Dynatrace",
      providerType: "Certified",
      description: "Dynatrace is an all-in-one, zero-configuration monitoring platform designed for modern cloud and hybrid environments",
      installed: false,
      categories: ["Monitoring", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "newrelic",
      name: "New Relic Operator",
      provider: "New Relic",
      providerType: "Certified",
      description: "Observability platform built to help engineers create more perfect software",
      installed: false,
      categories: ["Monitoring", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "splunk",
      name: "Splunk Operator",
      provider: "Splunk",
      providerType: "Certified",
      description: "Splunk Enterprise Operator for Kubernetes provides a cloud-native way to deploy and manage Splunk Enterprise",
      installed: false,
      categories: ["Logging", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "vault-secrets",
      name: "Vault Secrets Operator",
      provider: "HashiCorp",
      providerType: "Certified",
      description: "The Vault Secrets Operator allows Pods to consume Vault secrets natively from Kubernetes Secrets",
      installed: false,
      categories: ["Security", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "cert-manager",
      name: "cert-manager",
      provider: "Jetstack",
      providerType: "Community",
      description: "Automates the management and issuance of TLS certificates from various sources",
      installed: false,
      categories: ["Security", "Community"],
      olmVersion: "v0"
    },
    {
      id: "keycloak",
      name: "Keycloak Operator",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Keycloak is an Open Source Identity and Access Management solution for modern Applications and Services",
      installed: false,
      categories: ["Security", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "gpu-operator",
      name: "NVIDIA GPU Operator",
      provider: "NVIDIA",
      providerType: "Certified",
      description: "Automates the management of all NVIDIA software components needed to run GPU accelerated workloads",
      installed: false,
      categories: ["AI/ML", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "knative-serving",
      name: "Knative Serving",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Knative Serving builds on Kubernetes to support deploying and serving of serverless applications",
      installed: false,
      categories: ["Serverless", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "openfaas",
      name: "OpenFaaS",
      provider: "OpenFaaS",
      providerType: "Community",
      description: "Serverless Functions Made Simple for Kubernetes",
      installed: false,
      categories: ["Serverless", "Community"],
      olmVersion: "v0"
    },
    {
      id: "kubevirt",
      name: "KubeVirt",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "KubeVirt is a virtual machine management add-on for Kubernetes",
      installed: false,
      categories: ["Virtualization", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "crossplane",
      name: "Crossplane",
      provider: "Upbound",
      providerType: "Community",
      description: "Crossplane is an open source Kubernetes add-on that enables platform teams to assemble infrastructure from multiple vendors",
      installed: false,
      categories: ["Infrastructure", "Community"],
      olmVersion: "v0"
    },
    {
      id: "argocd",
      name: "Argo CD",
      provider: "Argo Project",
      providerType: "Community",
      description: "Declarative continuous delivery with a fully-loaded UI",
      installed: false,
      categories: ["CI/CD", "Community"],
      olmVersion: "v0"
    },
    {
      id: "gitops",
      name: "Red Hat OpenShift GitOps",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Enables teams to implement GitOps principles with a declarative approach to configuration management",
      installed: false,
      categories: ["CI/CD", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "nexus",
      name: "Nexus Operator",
      provider: "Sonatype",
      providerType: "Community",
      description: "Nexus Repository Manager helps developers and organizations to proxy, collect and manage dependencies",
      installed: false,
      categories: ["Development Tools", "Community"],
      olmVersion: "v0"
    },
    {
      id: "harbor",
      name: "Harbor Operator",
      provider: "VMware",
      providerType: "Community",
      description: "Harbor is an open source trusted cloud native registry project that stores, signs, and scans content",
      installed: false,
      categories: ["Development Tools", "Community"],
      olmVersion: "v0"
    },
    {
      id: "portworx",
      name: "Portworx Enterprise",
      provider: "Portworx",
      providerType: "Certified",
      description: "Cloud-Native storage and data management platform for Kubernetes",
      installed: false,
      categories: ["Storage", "Certified"],
      olmVersion: "v0"
    },

    // OLMv1 Operators (new simplified API - smaller set)
    {
      id: "argocd-operator-v1",
      name: "Argo CD",
      provider: "Argo Project",
      providerType: "Community",
      description: "Declarative GitOps continuous delivery for Kubernetes - built with OLMv1 for simpler management",
      installed: false,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
    {
      id: "prometheus-v1",
      name: "Prometheus Operator",
      provider: "Prometheus Community",
      providerType: "Community",
      description: "Provides Kubernetes native deployment and management of Prometheus and related monitoring components using OLMv1",
      installed: true,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
    {
      id: "cert-manager-v1",
      name: "cert-manager",
      provider: "Jetstack",
      providerType: "Community",
      description: "Automates the management and issuance of TLS certificates with OLMv1 simplified update control",
      installed: false,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
    {
      id: "elastic-v1",
      name: "Elastic Cloud on Kubernetes",
      provider: "Elastic",
      providerType: "Certified",
      description: "Orchestrate Elasticsearch, Kibana, APM Server, Enterprise Search, and Beats on Kubernetes with OLMv1",
      installed: false,
      hasUpdate: false,
      categories: ["Operators", "Certified"],
      olmVersion: "v1"
    },
    {
      id: "vault-v1",
      name: "Vault Operator",
      provider: "HashiCorp",
      providerType: "Certified",
      description: "Manage HashiCorp Vault in Kubernetes with OLMv1 direct control over upgrade rollouts",
      installed: true,
      hasUpdate: true,
      newVersion: "1.15.0",
      currentVersion: "1.14.2",
      categories: ["Operators", "Certified"],
      olmVersion: "v1"
    },
    {
      id: "grafana-v1",
      name: "Grafana Operator",
      provider: "Grafana Labs",
      providerType: "Community",
      description: "Kubernetes Operator for Grafana with OLMv1 streamlined API",
      installed: false,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
  ];

  const operatorCatalogItems: CatalogItem[] = RAW_OPERATORS.map((o) => ({
    ...o,
    catalogType: "operators" as const,
  }));

  const catalogItems: CatalogItem[] = [
    ...operatorCatalogItems,
    ...makeCatalogItems("builderImages", STATIC_TYPE_COUNTS.builderImages, "Builder image"),
    ...makeCatalogItems("devfiles", STATIC_TYPE_COUNTS.devfiles, "Devfile"),
    ...makeCatalogItems("helmCharts", STATIC_TYPE_COUNTS.helmCharts, "Helm chart"),
    ...makeCatalogItems("templates", STATIC_TYPE_COUNTS.templates, "Template"),
    ...EXTRA_TYPE_FACETS.flatMap((row) =>
      makeCatalogItems(row.id as CatalogItemKind, row.count, row.label),
    ),
  ];

  const availableUpdates = catalogItems.filter(
    (item) => item.catalogType === "operators" && item.hasUpdate,
  ).length;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleFilter = (filterType: "source" | "provider", value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }));
  };

  const toggleCatalogOlmFilter = (key: "legacyOlmv0" | "clusterExtensionOlmv1") => {
    setCatalogOlmFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTypeFacet = (key: keyof typeof typeFacet) => {
    setTypeFacet((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExtraTypeFacet = (id: string) => {
    setExtraTypeFacet((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubscriptionFacet = (id: string) => {
    setSubscriptionFacet((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function getSelectedCatalogTypes(): CatalogItemKind[] {
    const out: CatalogItemKind[] = [];
    if (typeFacet.builderImages) out.push("builderImages");
    if (typeFacet.devfiles) out.push("devfiles");
    if (typeFacet.helmCharts) out.push("helmCharts");
    if (typeFacet.operators) out.push("operators");
    if (typeFacet.templates) out.push("templates");
    for (const row of EXTRA_TYPE_FACETS) {
      if (extraTypeFacet[row.id]) out.push(row.id as CatalogItemKind);
    }
    return out;
  }

  /** Facet counts exclude the facet group being counted so tallies stay meaningful with multi-select. */
  function matchesCatalogItem(
    item: CatalogItem,
    skips?: {
      skipSearch?: boolean;
      skipCatalogOlm?: boolean;
      skipSource?: boolean;
      skipProvider?: boolean;
      skipType?: boolean;
    },
  ): boolean {
    if (!skips?.skipSearch && searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (!skips?.skipCatalogOlm) {
      const anyCatalogOlmSelected =
        catalogOlmFilters.legacyOlmv0 || catalogOlmFilters.clusterExtensionOlmv1;
      if (anyCatalogOlmSelected && item.catalogType === "operators") {
        const isV0 = item.olmVersion === "v0";
        const isV1 = item.olmVersion === "v1";
        const allowV0 = catalogOlmFilters.legacyOlmv0;
        const allowV1 = catalogOlmFilters.clusterExtensionOlmv1;
        if (isV0 && !allowV0) return false;
        if (isV1 && !allowV1) return false;
        if (!isV0 && !isV1) return false;
      }
    }

    if (!skips?.skipSource && filters.source.length > 0) {
      if (!filters.source.includes(item.providerType)) return false;
    }

    if (!skips?.skipProvider && filters.provider.length > 0) {
      if (!filters.provider.includes(item.provider)) return false;
    }

    if (!skips?.skipType) {
      const selectedTypes = getSelectedCatalogTypes();
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.catalogType)) {
        return false;
      }
    }

    return true;
  }

  const uniqueProviders = [...new Set(catalogItems.map((c) => c.provider))].sort((a, b) =>
    a.localeCompare(b),
  );
  const providerMoreCount = Math.max(0, uniqueProviders.length - PROVIDER_FACET_PAGE_SIZE);

  const baseForFacets = (skips?: Parameters<typeof matchesCatalogItem>[1]) =>
    catalogItems.filter((item) => matchesCatalogItem(item, skips));

  const countItemsOfType = (kind: CatalogItemKind) =>
    baseForFacets({ skipType: true }).filter((i) => i.catalogType === kind).length;

  const facetCounts = {
    operators: countItemsOfType("operators"),
    catalogLegacy: baseForFacets({ skipCatalogOlm: true }).filter(
      (i) => i.catalogType === "operators" && i.olmVersion === "v0",
    ).length,
    catalogCluster: baseForFacets({ skipCatalogOlm: true }).filter(
      (i) => i.catalogType === "operators" && i.olmVersion === "v1",
    ).length,
    certified: baseForFacets({ skipSource: true }).filter((i) => i.providerType === "Certified").length,
    community: baseForFacets({ skipSource: true }).filter((i) => i.providerType === "Community").length,
    redHatSource: baseForFacets({ skipSource: true }).filter((i) => i.providerType === "Red Hat").length,
    byProvider: Object.fromEntries(
      uniqueProviders.map((name) => [
        name,
        baseForFacets({ skipProvider: true }).filter((i) => i.provider === name).length,
      ]),
    ) as Record<string, number>,
  };

  const operatorsTypeDisplayCount = Math.max(MIN_TYPE_FACET_DISPLAY, facetCounts.operators);

  const filteredCatalogItems = catalogItems
    .filter((item) => matchesCatalogItem(item))
    .sort((a, b) => {
      if (catalogSort !== "name") return 0;
      return a.name.localeCompare(b.name);
    });

  const handleCatalogItemClick = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setShowSidePanel(true);
  };

  return (
    <Drawer isExpanded={showSidePanel && !!selectedCatalogItem} position="end">
      <DrawerContent>
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Ecosystem", path: "/ecosystem" },
            { label: "Software Catalog" },
          ]}
        >

        <Content className="mb-6">
          <h1 id="main-title">Software Catalog</h1>
          <p>
            Add shared applications, services, event sources, or source-to-image builders to your Project from the
            software catalog. Cluster administrators can customize the content made available in the catalog.
          </p>
        </Content>

        {availableUpdates > 0 && !dismissedAlerts.includes("updates") && (
          <AlertGroup className="mb-4">
            <Alert
              variant="info"
              isInline
              title={`${availableUpdates} Software versions available`}
              actionClose={
                <AlertActionCloseButton onClose={() => setDismissedAlerts((prev) => [...prev, "updates"])} />
              }
              actionLinks={
                <AlertActionLink component={Link} to="/ecosystem/installed-operators">
                  Manage updates
                </AlertActionLink>
              }
            >
              Review and approve pending software updates to keep your cluster secure and up-to-date.
            </Alert>
          </AlertGroup>
        )}

        <div className="flex gap-[24px]">
          {/* Left Sidebar - Filters */}
          <div className="w-[280px] shrink-0">
            {/* Type Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Type")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <div className="flex items-center gap-[4px]">
                  <span>Type</span>
                  <span className="text-[#4d4d4d] dark:text-[#b0b0b0]">ⓘ</span>
                </div>
                {expandedCategories.includes("Type") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Type") && (
                <div className="space-y-[8px] pl-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.builderImages}
                      onChange={() => toggleTypeFacet("builderImages")}
                    />
                    <span>Builder Images ({countItemsOfType("builderImages")})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.devfiles}
                      onChange={() => toggleTypeFacet("devfiles")}
                    />
                    <span>Devfiles ({countItemsOfType("devfiles")})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.helmCharts}
                      onChange={() => toggleTypeFacet("helmCharts")}
                    />
                    <span>Helm Charts ({countItemsOfType("helmCharts")})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.operators}
                      onChange={() => toggleTypeFacet("operators")}
                    />
                    <span>Operators ({operatorsTypeDisplayCount})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.templates}
                      onChange={() => toggleTypeFacet("templates")}
                    />
                    <span>Templates ({countItemsOfType("templates")})</span>
                  </label>
                  {showAllTypes && (
                    <>
                      {EXTRA_TYPE_FACETS.map((row) => (
                        <label
                          key={row.id}
                          className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white"
                        >
                          <input
                            type="checkbox"
                            className="size-[14px]"
                            checked={!!extraTypeFacet[row.id]}
                            onChange={() => toggleExtraTypeFacet(row.id)}
                          />
                          <span>
                            {row.label} ({countItemsOfType(row.id as CatalogItemKind)})
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                  <button
                    type="button"
                    className="text-[#0066cc] dark:text-[#4dabf7] hover:underline text-[13px]"
                    onClick={() => setShowAllTypes(!showAllTypes)}
                  >
                    {showAllTypes ? "Hide" : `Show all (${EXTRA_TYPE_FACETS.length} more)`}
                  </button>
                </div>
              )}
            </div>

            {/* Catalog (OLM) Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Catalog")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Catalog</span>
                {expandedCategories.includes("Catalog") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Catalog") && (
                <div className="space-y-[8px] pl-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={catalogOlmFilters.legacyOlmv0}
                      onChange={() => toggleCatalogOlmFilter("legacyOlmv0")}
                    />
                    <span>Legacy (OLMv0) ({facetCounts.catalogLegacy})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={catalogOlmFilters.clusterExtensionOlmv1}
                      onChange={() => toggleCatalogOlmFilter("clusterExtensionOlmv1")}
                    />
                    <span>Cluster extension (OLMv1) ({facetCounts.catalogCluster})</span>
                  </label>
                </div>
              )}
            </div>

            {/* Capabilities Filter */}
            <div className="mb-[16px]">
              <button 
                onClick={() => toggleCategory("Capabilities")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Capabilities</span>
                {expandedCategories.includes("Capabilities") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
            </div>

            {/* Source Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Source")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Source</span>
                {expandedCategories.includes("Source") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Source") && (
                <div className="space-y-[8px] pl-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input 
                      type="checkbox" 
                      className="size-[14px]" 
                      checked={filters.source.includes("Certified")}
                      onChange={() => toggleFilter("source", "Certified")}
                    />
                    <span>Certified ({facetCounts.certified})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input 
                      type="checkbox" 
                      className="size-[14px]" 
                      checked={filters.source.includes("Community")}
                      onChange={() => toggleFilter("source", "Community")}
                    />
                    <span>Community ({facetCounts.community})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input 
                      type="checkbox" 
                      className="size-[14px]" 
                      checked={filters.source.includes("Red Hat")}
                      onChange={() => toggleFilter("source", "Red Hat")}
                    />
                    <span>Red Hat ({facetCounts.redHatSource})</span>
                  </label>
                </div>
              )}
            </div>

            {/* Provider Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Provider")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Provider</span>
                {expandedCategories.includes("Provider") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Provider") && (
                <div className="space-y-[8px] pl-[4px]">
                  {(showAllProviders ? uniqueProviders : uniqueProviders.slice(0, PROVIDER_FACET_PAGE_SIZE)).map(
                    (name) => (
                      <label
                        key={name}
                        className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white"
                      >
                        <input
                          type="checkbox"
                          className="size-[14px]"
                          checked={filters.provider.includes(name)}
                          onChange={() => toggleFilter("provider", name)}
                        />
                        <span>
                          {name} ({facetCounts.byProvider[name] ?? 0})
                        </span>
                      </label>
                    ),
                  )}
                  {providerMoreCount > 0 && (
                    <button
                      type="button"
                      className="text-[#0066cc] dark:text-[#4dabf7] hover:underline text-[13px]"
                      onClick={() => setShowAllProviders(!showAllProviders)}
                    >
                      {showAllProviders ? "Hide" : `Show ${providerMoreCount} more`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Valid subscription */}
            <div className="mb-[16px]">
              <button
                type="button"
                onClick={() => toggleCategory("Valid subscription")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Valid subscription</span>
                {expandedCategories.includes("Valid subscription") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Valid subscription") && (
                <div className="space-y-[8px] pl-[4px]">
                  {SUBSCRIPTION_FACETS.map((row) => (
                    <label
                      key={row.id}
                      className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white"
                    >
                      <input
                        type="checkbox"
                        className="size-[14px]"
                        checked={!!subscriptionFacet[row.id]}
                        onChange={() => toggleSubscriptionFacet(row.id)}
                      />
                      <span>
                        {row.label} ({row.count})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content — catalog grid (search + sort left-aligned) */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-[12px] mb-[24px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-[12px]">
              <div className="relative w-full sm:max-w-[320px] sm:w-[320px]">
                <Search className="absolute left-[12px] top-[10px] size-[16px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
                <input
                  type="search"
                  placeholder="Filter by keyword…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-[36px] pr-[12px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#c7c7c7] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] text-[14px] text-[#151515] dark:text-white placeholder:text-[#4d4d4d] dark:placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#4dabf7]"
                />
              </div>
              <select
                aria-label="Sort catalog items"
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as "relevance" | "name")}
                className="w-full sm:w-auto min-w-[140px] pl-[12px] pr-[12px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#c7c7c7] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] text-[14px] text-[#151515] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#4dabf7]"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-[16px]">
              {filteredCatalogItems.map((item) => {
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCatalogItemClick(item)}
                  className="flex h-full min-h-[220px] flex-col bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.14)] rounded-[12px] p-[18px] text-left hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] dark:hover:border-[rgba(255,255,255,0.22)] transition-all"
                >
                  <div className="flex justify-between items-start gap-[12px] mb-[16px]">
                    <CatalogBrandLogo
                      id={item.id}
                      catalogType={item.catalogType as LogoCatalogType}
                      boxClassName="size-[40px] rounded-[6px] bg-white dark:bg-[#ececec] flex items-center justify-center p-[6px] shrink-0 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(0,0,0,0.12)]"
                      logoClassName="h-[28px] w-[28px] max-h-[28px] max-w-[28px]"
                    />
                    <span className="rounded-full px-[10px] py-[4px] text-[11px] font-semibold leading-tight bg-[#5c5f62] text-white shrink-0 max-w-[min(148px,48%)] text-right">
                      {catalogCardPillLabel(item)}
                    </span>
                  </div>
                  <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[16px] text-[#151515] dark:text-white mb-[8px] leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-[13px] text-[#151515] dark:text-[#ededed] mb-[16px]">
                    Provided by {item.provider}
                  </p>
                  <p className="text-[14px] text-[#4d4d4d] dark:text-[#c6c6c6] mb-[16px] line-clamp-4 flex-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] pt-[12px]">
                    {item.catalogType === "operators" && item.hasUpdate ? (
                      <a
                        href="https://docs.openshift.com/container-platform/latest/operators/admin/olm-upgrading-operators.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/ecosystem/software-catalog/${item.id}/update`);
                        }}
                        className="text-[13px] text-[#0066cc] dark:text-[#4dabf7] hover:underline flex items-center gap-[4px]"
                      >
                        <AlertTriangle className="size-[14px]" />
                        New version available
                      </a>
                    ) : item.catalogType === "operators" && item.installed ? (
                      <span className="text-[13px] text-[#3e8635] dark:text-[#5ba352] flex items-center gap-[4px]">
                        <CheckCircle className="size-[14px]" />
                        Installed
                      </span>
                    ) : (
                      <span className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                        {item.catalogType === "operators" ? "Not installed" : "Available"}
                      </span>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </div>
        </Breadcrumbs>
      </div>
      </DrawerContent>
      {selectedCatalogItem && showSidePanel ? (
        <DrawerPanelContent
          isPlain
          hasNoGlass
          widths={{ default: "width_100", lg: "width_50" }}
          focusTrap={{ enabled: true }}
        >
          <CatalogOperatorDetailPanel
            item={{
              id: selectedCatalogItem.id,
              name: selectedCatalogItem.name,
              provider: selectedCatalogItem.provider,
              providerType: selectedCatalogItem.providerType,
              description: selectedCatalogItem.description,
              installed: selectedCatalogItem.installed,
              hasUpdate: selectedCatalogItem.hasUpdate,
              newVersion: selectedCatalogItem.newVersion,
              currentVersion: selectedCatalogItem.currentVersion,
              catalogType: selectedCatalogItem.catalogType,
              typeLabel: CATALOG_TYPE_LABEL[selectedCatalogItem.catalogType],
            }}
            onClose={() => setShowSidePanel(false)}
            onInstall={() => {
              navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/install`);
              setShowSidePanel(false);
            }}
            onUpdate={() => {
              navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/update`);
              setShowSidePanel(false);
            }}
            onViewDetails={() => {
              navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}`);
              setShowSidePanel(false);
            }}
          />
        </DrawerPanelContent>
      ) : null}
    </Drawer>
  );
}