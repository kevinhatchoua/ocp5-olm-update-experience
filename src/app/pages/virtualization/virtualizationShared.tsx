import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Badge,
  Button,
  Content,
  Flex,
  Label,
  Switch,
  TextInput,
  Title,
  TreeView,
  TreeViewDataItem,
} from "@patternfly/react-core";
import FolderOpenIcon from "@patternfly/react-icons/dist/esm/icons/folder-open-icon";
import FolderIcon from "@patternfly/react-icons/dist/esm/icons/folder-icon";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { vmDetailPath } from "../networking/networkingMockData";
import { getProjectVmCounts, getVmsForProject, VIRT_CRUMB, VIRT_PROJECTS } from "./virtualizationMockData";

export function VirtualizationPageShell({
  title,
  path,
  children,
  createLabel,
  createTo,
  createMenu,
}: {
  title: string;
  path: string;
  children: ReactNode;
  createLabel?: string;
  createTo?: string;
  createMenu?: ReactNode;
}) {
  return (
    <div className="ocs-app-page-outer ocs-virt-page w-full">
      <Breadcrumbs items={[{ label: "Home", path: "/" }, VIRT_CRUMB, { label: title, path }]}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="ocs-virt-page__body">
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                {title}
              </Title>
              <FavoriteButton name={title} path={path} />
            </Flex>
            {createMenu ??
              (createLabel && createTo ? (
                <Button variant="primary" component={Link} to={createTo}>
                  {createLabel}
                </Button>
              ) : null)}
          </Flex>
          {children}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

export function VirtualizationProjectLayout({
  children,
  selectedProject,
  selectedVm,
  onProjectSelect,
}: {
  children: ReactNode;
  selectedProject?: string;
  selectedVm?: string;
  onProjectSelect?: (project: string) => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const project = selectedProject ?? searchParams.get("project") ?? "";
  const [projectSearch, setProjectSearch] = useState("");
  const [onlyWithVms, setOnlyWithVms] = useState(false);
  const counts = useMemo(() => getProjectVmCounts(), [selectedVm, project]);

  const treeData = useMemo((): TreeViewDataItem[] => {
    const q = projectSearch.trim().toLowerCase();
    const projects = VIRT_PROJECTS.filter((p) => {
      if (onlyWithVms && (counts[p.name] ?? 0) === 0) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });

    return [
      {
        id: "local-cluster",
        name: "Local cluster",
        icon: <CubesIcon aria-hidden />,
        defaultExpanded: true,
        children: projects.map((p) => {
          const vms = getVmsForProject(p.name);
          const children: TreeViewDataItem[] = vms.map((vm) => ({
            id: `vm/${p.name}/${vm.name}`,
            name: vm.name,
          }));
          return {
            id: `project-${p.name}`,
            name: p.name,
            icon: project === p.name ? <FolderOpenIcon aria-hidden /> : <FolderIcon aria-hidden />,
            badge: <Badge isRead>{counts[p.name] ?? 0}</Badge>,
            defaultExpanded: project === p.name || selectedVm !== undefined,
            children: children.length > 0 ? children : undefined,
          };
        }),
      },
    ];
  }, [counts, onlyWithVms, project, projectSearch, selectedVm]);

  const handleSelect = (_event: React.MouseEvent, item: TreeViewDataItem) => {
    if (item.id.startsWith("vm/")) {
      const parts = item.id.slice(3).split("/");
      const projectName = parts[0] ?? "";
      const vmName = parts.slice(1).join("/");
      if (projectName && vmName) navigate(vmDetailPath(projectName, vmName));
      return;
    }
    if (item.id.startsWith("project-")) {
      const name = item.id.replace("project-", "");
      onProjectSelect?.(name);
      setSearchParams({ project: name });
    }
  };

  return (
    <Flex className="ocs-virt-split" alignItems={{ default: "alignItemsStretch" }} gap={{ default: "gapLg" }}>
      <aside className="ocs-virt-project-sidebar app-glass-panel" aria-label="Projects">
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="ocs-virt-project-sidebar__inner">
          <TextInput
            type="search"
            aria-label="Search projects"
            placeholder="Search projects"
            value={projectSearch}
            onChange={(_e, v) => setProjectSearch(v)}
          />
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <Switch
              id="virt-only-with-vms"
              aria-label="Show only projects with VirtualMachines"
              isChecked={onlyWithVms}
              onChange={(_e, checked) => setOnlyWithVms(checked)}
            />
            <label htmlFor="virt-only-with-vms" className="ocs-virt-project-sidebar__toggle-label">
              Show only projects with VirtualMachines
            </label>
          </Flex>
          <TreeView
            hasGuides
            hasSelectableNodes
            data={treeData}
            onSelect={handleSelect}
            activeItems={
              selectedVm && project
                ? [`vm/${project}/${selectedVm}`]
                : project
                  ? [`project-${project}`]
                  : []
            }
          />
        </Flex>
      </aside>
      <div className="ocs-virt-split__main">{children}</div>
    </Flex>
  );
}

export function VirtualizationEmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string;
  description: ReactNode;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="ocs-virt-empty">
      <Flex
        direction={{ default: "column" }}
        alignItems={{ default: "alignItemsCenter" }}
        justifyContent={{ default: "justifyContentCenter" }}
        gap={{ default: "gapMd" }}
        className="pf-v6-u-py-3xl"
      >
        <div className="ocs-virt-empty__icon" aria-hidden />
        <Title headingLevel="h2" size="lg">
          {title}
        </Title>
        <Content component="p" className="pf-v6-u-text-align-center ocs-networking-empty__desc">
          {description}
        </Content>
        <Button variant="primary" component={Link} to={actionTo}>
          {actionLabel}
        </Button>
      </Flex>
    </div>
  );
}

export function VirtListEmptyPanel({ resource, createLabel }: { resource: string; createLabel?: string }) {
  return (
    <VirtualizationEmptyState
      title={`No ${resource} found`}
      description={
        <>
          Click <strong>{createLabel ?? `Create ${resource}`}</strong> to create your first {resource}.
        </>
      }
      actionLabel={createLabel ?? `Create ${resource}`}
      actionTo="#"
    />
  );
}

export function VirtResourceTableShell({
  title,
  path,
  children,
  createLabel,
}: {
  title: string;
  path: string;
  children: ReactNode;
  createLabel?: string;
}) {
  return (
    <VirtualizationPageShell title={title} path={path} createLabel={createLabel}>
      <div className="ocs-pods-list__panel">{children}</div>
    </VirtualizationPageShell>
  );
}

export function ProjectLabel({ name }: { name: string }) {
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      <Label color="green" isCompact className="ocs-resource-label">
        PR
      </Label>
      {name}
    </Flex>
  );
}
