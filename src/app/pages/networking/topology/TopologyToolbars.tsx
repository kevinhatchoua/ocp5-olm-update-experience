import { useState } from "react";
import {
  Button,
  Divider,
  Dropdown,
  MenuToggle,
  Radio,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import BookOpenIcon from "@patternfly/react-icons/dist/esm/icons/book-open-icon";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import QuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/question-circle-icon";
import { type NncProfile } from "../networkTopologyData";
import TopologyViewToggle from "../TopologyViewToggle";
import { NetworkResourceCreateDropdown, type NetworkCreateResource } from "../networkingCreateModals";
import type { NodeNetworkViewMode } from "../nodeNetworkViewMode";
import { filterOptionsForPerspective, TOPOLOGY_PERSPECTIVES, type TopologyPerspective, type TopologyResourceFilter } from "./topologyPerspective";
import { TOPOLOGY_LAYOUTS, type TopologyLayoutId } from "./topologyLayouts";


type UnifiedToolbarProps = {
  perspective: TopologyPerspective;
  onPerspectiveChange: (perspective: TopologyPerspective) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filterKind: TopologyResourceFilter;
  onFilterKindChange: (kind: TopologyResourceFilter) => void;
  displayLabels: boolean;
  onDisplayLabelsChange: (value: boolean) => void;
  layoutId: TopologyLayoutId;
  onLayoutIdChange: (layout: TopologyLayoutId) => void;
  onResetLayout?: () => void;
  viewMode: NodeNetworkViewMode;
  onViewModeChange?: (mode: NodeNetworkViewMode) => void;
  onShowShortcuts: () => void;
  showCreateActions?: boolean;
  isCreateEnabled: boolean;
  onCreateSelect: (resource: NetworkCreateResource) => void;
  onOpenWorkerNodeModal?: () => void;
  showNncSwitcher: boolean;
  physicalNetworkName?: string;
  nncProfiles: NncProfile[];
  onPhysicalNetworkChange?: (name: string) => void;
  /** When true, skip wrapping Toolbar — PatternFly TopologyView already provides one. */
  embedded?: boolean;
  /** Split OCP Topology chrome: filters = context header, actions = view toolbar. */
  slot?: "filters" | "actions" | "all";
};

/**
 * Single OCP-style topology toolbar:
 * Left: Host | Workloads | Cluster · Filter by resource · Search
 * Right: Display options · View shortcuts · Topology/Table · Create · Add worker
 */
export function TopologyUnifiedToolbar({
  perspective,
  onPerspectiveChange,
  searchTerm,
  onSearchTermChange,
  filterKind,
  onFilterKindChange,
  displayLabels,
  onDisplayLabelsChange,
  layoutId,
  onLayoutIdChange,
  onResetLayout,
  viewMode,
  onViewModeChange,
  onShowShortcuts,
  isCreateEnabled,
  onCreateSelect,
  onOpenWorkerNodeModal,
  showCreateActions = true,
  showNncSwitcher,
  physicalNetworkName,
  nncProfiles,
  onPhysicalNetworkChange,
  embedded = false,
  slot = "all",
}: UnifiedToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const perspectiveMeta = TOPOLOGY_PERSPECTIVES.find((p) => p.id === perspective);
  const filterOptions = filterOptionsForPerspective(perspective);
  const selectedFilterLabel = filterOptions.find((option) => option.id === filterKind)?.label;

  const filterGroup = (
      <ToolbarGroup variant="filter-group" className="ocs-pf-topo-toolbar-group ocs-pf-topo-view-toolbar__filters">
        <ToolbarItem>
          <Tooltip content={perspectiveMeta?.description ?? "Filter topology by perspective"}>
            <span>
              <ToggleGroup aria-label="Topology perspective" isCompact>
                {TOPOLOGY_PERSPECTIVES.map((p) => (
                  <ToggleGroupItem
                    key={p.id}
                    text={p.label}
                    isSelected={perspective === p.id}
                    onChange={() => onPerspectiveChange(p.id)}
                  />
                ))}
              </ToggleGroup>
            </span>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <Tooltip content="Filter resources by type">
            <span>
              <Select
                isOpen={filterOpen}
                selected={filterKind}
                onSelect={(_e, value) => {
                  onFilterKindChange(value as TopologyResourceFilter);
                  setFilterOpen(false);
                }}
                onOpenChange={setFilterOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    icon={<FilterIcon />}
                    variant={filterKind !== "all" ? "primary" : "default"}
                    onClick={() => setFilterOpen((o) => !o)}
                    isExpanded={filterOpen}
                    aria-label={
                      filterKind === "all"
                        ? "Filter by resource"
                        : `Resource filter: ${selectedFilterLabel}`
                    }
                  >
                    {filterKind === "all" ? "Filter by resource" : selectedFilterLabel}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  <SelectOption value="all">All types</SelectOption>
                  {filterOptions.map((option) => (
                    <SelectOption key={option.id} value={option.id}>
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </span>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <SearchInput
            className="ocs-net-topo-panel__search"
            placeholder="Find by name..."
            value={searchTerm}
            onChange={(_e, value) => onSearchTermChange(value)}
            onClear={() => onSearchTermChange("")}
            aria-label="Find topology resources by name"
          />
        </ToolbarItem>
        {showNncSwitcher && physicalNetworkName && onPhysicalNetworkChange ? (
          <ToolbarItem>
            <Select
              isOpen={profileOpen}
              selected={physicalNetworkName}
              onSelect={(_e, value) => {
                onPhysicalNetworkChange(String(value));
                setProfileOpen(false);
              }}
              onOpenChange={setProfileOpen}
              toggle={(toggleRef) => (
                <MenuToggle ref={toggleRef} onClick={() => setProfileOpen((o) => !o)} isExpanded={profileOpen}>
                  NNC: {physicalNetworkName}
                </MenuToggle>
              )}
            >
              <SelectList>
                {nncProfiles.map((profile) => (
                  <SelectOption key={profile.id} value={profile.physicalNetworkName}>
                    {profile.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
        ) : null}
      </ToolbarGroup>
  );

  const actionGroup = (
      <ToolbarGroup align={{ default: "alignEnd" }} className="ocs-pf-topo-toolbar-group ocs-pf-topo-view-toolbar__actions">
        <ToolbarItem>
          <Tooltip content="Configure layout, labels, and display settings">
            <span>
              <Dropdown
                isOpen={displayOpen}
                onOpenChange={setDisplayOpen}
                className="ocs-pf-topo-display-dropdown"
                popperProps={{ appendTo: () => document.body, position: "right" }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    icon={<BookOpenIcon />}
                    onClick={() => setDisplayOpen((o) => !o)}
                    isExpanded={displayOpen}
                    className="ocs-pf-topo-display-toggle"
                  >
                    Display options
                  </MenuToggle>
                )}
              >
                <div className="ocs-pf-topo-display-menu" role="group" aria-label="Display options">
                  <Switch
                    id="topo-display-labels"
                    label="Show labels"
                    isChecked={displayLabels}
                    onChange={(_e, checked) => onDisplayLabelsChange(checked)}
                  />
                  <Divider />
                  <div className="ocs-pf-topo-display-menu__section" id="topo-layout-heading">
                    Layout
                  </div>
                  <div className="ocs-pf-topo-display-menu__layouts" role="radiogroup" aria-labelledby="topo-layout-heading">
                    {TOPOLOGY_LAYOUTS.map((layout) => (
                      <Radio
                        key={layout.id}
                        id={`topo-layout-${layout.id}`}
                        name="topology-layout"
                        label={layout.label}
                        description={layout.description}
                        isChecked={layoutId === layout.id}
                        onChange={() => onLayoutIdChange(layout.id)}
                      />
                    ))}
                  </div>
                  {onResetLayout ? (
                    <>
                      <Divider />
                      <Button
                        variant="secondary"
                        isBlock
                        onClick={() => {
                          onResetLayout();
                          setDisplayOpen(false);
                        }}
                      >
                        Reset
                      </Button>
                    </>
                  ) : null}
                </div>
              </Dropdown>
            </span>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <Tooltip content="Keyboard shortcuts for topology navigation">
            <Button variant="link" icon={<QuestionCircleIcon />} onClick={onShowShortcuts}>
              View shortcuts
            </Button>
          </Tooltip>
        </ToolbarItem>
        {onViewModeChange ? (
          <ToolbarItem>
            <Tooltip content="Switch between topology graph and table list view">
              <span>
                <TopologyViewToggle currentView={viewMode} onChange={onViewModeChange} />
              </span>
            </Tooltip>
          </ToolbarItem>
        ) : null}
        {showCreateActions ? (
          <>
            <ToolbarItem>
              <Tooltip content="Create a networking resource">
                <span>
                  <NetworkResourceCreateDropdown
                    isDisabled={!isCreateEnabled}
                    onSelect={onCreateSelect}
                  />
                </span>
              </Tooltip>
            </ToolbarItem>
            {onOpenWorkerNodeModal ? (
              <ToolbarItem>
                <Tooltip content="Add worker nodes to the topology view">
                  <Button variant="link" icon={<PlusCircleIcon />} onClick={onOpenWorkerNodeModal}>
                    Add worker node
                  </Button>
                </Tooltip>
              </ToolbarItem>
            ) : null}
          </>
        ) : null}
      </ToolbarGroup>
  );

  const items = slot === "filters" ? filterGroup : slot === "actions" ? actionGroup : (
    <>
      {filterGroup}
      {actionGroup}
    </>
  );

  if (embedded) return items;
  return (
    <Toolbar className="ocs-pf-topo-unified-toolbar" aria-label="Topology">
      <ToolbarContent>{items}</ToolbarContent>
    </Toolbar>
  );
}

/** @deprecated Use TopologyUnifiedToolbar — kept for any external imports during migration. */
export function TopologyContextToolbar(
  props: Partial<UnifiedToolbarProps> & {
    project?: string;
    onProjectChange?: (p: string) => void;
    networkScope?: string;
    onNetworkScopeChange?: (s: string) => void;
  }
) {
  void props;
  return null;
}

/** @deprecated Use TopologyUnifiedToolbar */
export function TopologyFilterToolbar(props: UnifiedToolbarProps) {
  return <TopologyUnifiedToolbar {...props} />;
}
