import { useEffect, useMemo } from "react";
import {
  Button,
  Content,
  Flex,
  Label,
  Pagination,
  PaginationVariant,
  Title,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import PrototypeCreateButton from "../../components/prototype/PrototypeCreateButton";
import PrototypeResourceLink from "../../components/prototype/PrototypeResourceLink";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../../components/dataView/OcsPrototypeListTable";

interface Crd {
  name: string;
  group: string;
  version: string;
  scope: string;
  kind: string;
}

type CrdFilters = { name: string };

type SortColumn = "name" | "group" | "version" | "scope" | "kind";

const CRDS: Crd[] = [
  { name: "deployments.apps", group: "apps", version: "v1", scope: "Namespaced", kind: "Deployment" },
  { name: "services.core", group: "core", version: "v1", scope: "Namespaced", kind: "Service" },
  { name: "routes.route.openshift.io", group: "route.openshift.io", version: "v1", scope: "Namespaced", kind: "Route" },
  { name: "clusterserviceversions.operators.coreos.com", group: "operators.coreos.com", version: "v1alpha1", scope: "Namespaced", kind: "ClusterServiceVersion" },
  { name: "prometheuses.monitoring.coreos.com", group: "monitoring.coreos.com", version: "v1", scope: "Namespaced", kind: "Prometheus" },
];

function rowMatchesFilters(row: Crd, filters: CrdFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortCrds(rows: Crd[], column: SortColumn, direction: SortDirection): Crd[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "group":
        return compareStrings(a.group, b.group, direction);
      case "version":
        return compareStrings(a.version, b.version, direction);
      case "scope":
        return compareStrings(a.scope, b.scope, direction);
      case "kind":
        return compareStrings(a.kind, b.kind, direction);
      default:
        return 0;
    }
  });
}

export default function CustomResourceDefinitionsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<CrdFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(() => CRDS.filter((c) => rowMatchesFilters(c, filters)), [filters]);
  const sorted = useMemo(
    () => sortCrds(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const colSpan = 6;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Administration", path: "/administration" },
          { label: "CustomResourceDefinitions", path: "/administration/custom-resource-definitions" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                CustomResourceDefinitions
              </Title>
              <FavoriteButton name="CustomResourceDefinitions" path="/administration/custom-resource-definitions" />
            </Flex>
            <PrototypeCreateButton>Create CRD</PrototypeCreateButton>
          </Flex>

          <Content component="p">
            CustomResourceDefinitions extend the Kubernetes API to support custom resource types.
          </Content>

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="crds-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="crds-dv-toolbar"
                id="crds-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<CrdFilters>
                    values={filters}
                    onChange={(_id, partial) => onSetFilters(partial)}
                    breakpoint="xl"
                    midContent={
                      <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                        <ToolbarItem>
                          <Button variant="plain" aria-label="List view" isAriaPressed icon={<ListIcon />} />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button variant="plain" aria-label="Refresh" icon={<SyncIcon />} />
                        </ToolbarItem>
                      </ToolbarGroup>
                    }
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
                      { title: "10", value: 10 },
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
                    ouiaId="crds-pagination"
                    widgetId="crds-pagination"
                    titles={{ items: "definitions" }}
                    paginationAriaLabel="CustomResourceDefinitions pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="CustomResourceDefinitions">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Group">
                      <SortableTableHeader label="Group" column="group" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Version">
                      <SortableTableHeader label="Version" column="version" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Scope">
                      <SortableTableHeader label="Scope" column="scope" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Kind">
                      <SortableTableHeader label="Kind" column="kind" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.length === 0 ? (
                    <Tr>
                      <Td colSpan={colSpan} dataLabel="Empty state">
                        <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                          No custom resource definitions match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((crd) => (
                      <Tr key={crd.name}>
                        <Td dataLabel="Name">
                          <PrototypeResourceLink listKey="crds" name={crd.name} namespace="" />
                        </Td>
                        <Td dataLabel="Group">
                          <Content component="small">{crd.group}</Content>
                        </Td>
                        <Td dataLabel="Version">
                          <Label color="grey" isCompact>
                            {crd.version}
                          </Label>
                        </Td>
                        <Td dataLabel="Scope">
                          <Content component="small">{crd.scope}</Content>
                        </Td>
                        <Td dataLabel="Kind">
                          <Content component="small">{crd.kind}</Content>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="plain" aria-label={`Actions for ${crd.name}`} icon={<EllipsisVIcon />} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </OcsPrototypeListTable>
            </DataView>
          </div>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
