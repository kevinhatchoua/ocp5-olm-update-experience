import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Button, PageSection, Pagination, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import SortCommonAscIcon from "@patternfly/react-icons/dist/esm/icons/pficon-sort-common-asc-icon";
import { InnerScrollContainer, Table } from "@patternfly/react-table";
import { IoDataViewFiltersWithMidActions } from "./IoDataViewFiltersWithMidActions";

/** Shared PatternFly table class — matches Installed Operators list styling. */
export const OCS_PROTOTYPE_TABLE_CLASS = "ocs-io-operator-table";

/** DataView wrapper class used across prototype list pages. */
export const OCS_PROTOTYPE_DATAVIEW_CLASS = "ocs-io-dataview";

/** Toolbar alignment class — filters left, pagination right. */
export const OCS_PROTOTYPE_TOOLBAR_CLASS =
  "ocs-io-dataview-toolbar pf-m-toggle-group-container ocs-io-dv-toolbar-align";

export type SortDirection = "asc" | "desc";

export function useTableSort<T extends string>(defaultColumn: T, defaultDirection: SortDirection = "asc") {
  const [sortColumn, setSortColumn] = useState<T>(defaultColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const toggleSort = useCallback(
    (col: T) => {
      if (col !== sortColumn) {
        setSortColumn(col);
        setSortDirection("asc");
      } else {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      }
    },
    [sortColumn]
  );

  return { sortColumn, sortDirection, toggleSort, setSortColumn, setSortDirection };
}

export function compareStrings(a: string, b: string, direction: SortDirection) {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
  return direction === "asc" ? cmp : -cmp;
}

type SortableHeaderProps<T extends string> = {
  label: string;
  column: T;
  sortColumn: T;
  sortDirection: SortDirection;
  onSort: (col: T) => void;
};

export function SortableTableHeader<T extends string>({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
}: SortableHeaderProps<T>) {
  const active = sortColumn === column;
  const isDesc = active && sortDirection === "desc";
  return (
    <Button
      className="ocs-operator-table-sort"
      variant="plain"
      onClick={() => onSort(column)}
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
}

export function PlainTableHeader({ label }: { label: string }) {
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
}

export function OcsPrototypeListTable({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <PageSection aria-label={ariaLabel} padding={{ default: "noPadding" }}>
      <InnerScrollContainer>
        <Table aria-label={ariaLabel} borders variant="compact" className={OCS_PROTOTYPE_TABLE_CLASS}>
          {children}
        </Table>
      </InnerScrollContainer>
    </PageSection>
  );
}

type NameFilters = { name: string };

/** DataView + toolbar chrome used by Installed Operators / Pods. Wrap every resource table in this. */
export function OcsPrototypeDataView({
  ouiaId,
  ariaLabel,
  clearAllFilters,
  filters,
  pagination,
  children,
}: {
  ouiaId: string;
  ariaLabel: string;
  clearAllFilters?: () => void;
  filters: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DataView ouiaId={ouiaId} className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
      <DataViewToolbar
        ouiaId={`${ouiaId}-toolbar`}
        id={`${ouiaId}-toolbar`}
        className={OCS_PROTOTYPE_TOOLBAR_CLASS}
        clearAllFilters={clearAllFilters}
        collapseListedFiltersBreakpoint="xl"
        filters={filters}
        pagination={pagination}
      />
      <OcsPrototypeListTable ariaLabel={ariaLabel}>{children}</OcsPrototypeListTable>
    </DataView>
  );
}

export function OcsNameDataViewFilters({
  values,
  onSetFilters,
  placeholder = "Filter by name...",
  midContent = null,
}: {
  values: NameFilters;
  onSetFilters: (partial: Partial<NameFilters>) => void;
  placeholder?: string;
  midContent?: ReactNode;
}) {
  return (
    <IoDataViewFiltersWithMidActions<NameFilters>
      values={values}
      onChange={
        ((_filterId: string, partial: Partial<Record<"name", unknown>>) =>
          onSetFilters(partial as Partial<NameFilters>)) as never
      }
      breakpoint="xl"
      midContent={midContent}
    >
      <DataViewTextFilter
        title="Name"
        filterId="name"
        placeholder={placeholder}
        style={{ minWidth: "16rem", maxWidth: "100%" }}
      />
    </IoDataViewFiltersWithMidActions>
  );
}

export function OcsCompactPagination({
  itemCount,
  page,
  setPage,
  perPage,
  setPerPage,
  itemsLabel,
  ouiaId,
}: {
  itemCount: number;
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  itemsLabel: string;
  ouiaId: string;
}) {
  return (
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
      ouiaId={ouiaId}
      widgetId={ouiaId}
      titles={{ items: itemsLabel }}
    />
  );
}

/** Standard name-filtered DataView table. Use this for new list and nested resource tables. */
export function OcsNamedResourceDataView<T>({
  ouiaId,
  ariaLabel,
  itemsLabel,
  items,
  getName,
  defaultPerPage = 20,
  children,
}: {
  ouiaId: string;
  ariaLabel: string;
  itemsLabel: string;
  items: T[];
  getName: (item: T) => string;
  defaultPerPage?: number;
  children: (paginated: T[]) => ReactNode;
}) {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NameFilters>({
    initialFilters: { name: "" },
  });
  const filtered = useMemo(() => {
    const query = (filters.name ?? "").trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => getName(item).toLowerCase().includes(query));
  }, [items, filters.name, getName]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(
    filtered,
    [filtered],
    defaultPerPage
  );

  return (
    <OcsPrototypeDataView
      ouiaId={ouiaId}
      ariaLabel={ariaLabel}
      clearAllFilters={clearAllFilters}
      filters={<OcsNameDataViewFilters values={filters} onSetFilters={onSetFilters} />}
      pagination={
        <OcsCompactPagination
          itemCount={itemCount}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          itemsLabel={itemsLabel}
          ouiaId={`${ouiaId}-pagination`}
        />
      }
    >
      {children(paginated)}
    </OcsPrototypeDataView>
  );
}

export function useListPagination<T>(
  items: T[],
  deps: unknown[] = [],
  defaultPerPage = 20
) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  return { page, setPage, perPage, setPerPage, paginated, itemCount: items.length };
}
