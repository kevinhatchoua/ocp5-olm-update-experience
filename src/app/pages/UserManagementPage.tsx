import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  DataViewCheckboxFilter,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../components/Breadcrumbs";
import FavoriteButton from "../components/FavoriteButton";
import ImpersonateUserModal from "../components/ImpersonateUserModal";
import { IoDataViewFiltersWithMidActions } from "../components/dataView/IoDataViewFiltersWithMidActions";
import { usePermissions } from "../contexts/PermissionsContext";
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
} from "../components/dataView/OcsPrototypeListTable";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin: string;
  status: "Active" | "Inactive";
}

type UserFilters = {
  name: string;
  status: string[];
};

type SortColumn = "name" | "role" | "department" | "lastLogin" | "status";

const USERS: User[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah.johnson@redhat.com", role: "Cluster Admin", department: "Platform Engineering", lastLogin: "2 hours ago", status: "Active" },
  { id: "2", name: "Michael Chen", email: "michael.chen@redhat.com", role: "Developer", department: "Application Development", lastLogin: "5 hours ago", status: "Active" },
  { id: "3", name: "Emily Rodriguez", email: "emily.rodriguez@redhat.com", role: "Viewer", department: "Quality Assurance", lastLogin: "1 day ago", status: "Active" },
  { id: "4", name: "David Kim", email: "david.kim@redhat.com", role: "Developer", department: "Application Development", lastLogin: "3 hours ago", status: "Active" },
  { id: "5", name: "Lisa Anderson", email: "lisa.anderson@redhat.com", role: "Cluster Admin", department: "Platform Engineering", lastLogin: "30 minutes ago", status: "Active" },
  { id: "6", name: "James Wilson", email: "james.wilson@redhat.com", role: "Viewer", department: "Business Analysis", lastLogin: "2 days ago", status: "Active" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

function roleLabelColor(role: string): "red" | "green" | "orange" | "grey" {
  if (role === "Cluster Admin") return "red";
  if (role === "Developer") return "green";
  if (role === "Viewer") return "orange";
  return "grey";
}

function rowMatchesFilters(row: User, filters: UserFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  if (nameQ) {
    const haystack = `${row.name} ${row.email} ${row.role}`.toLowerCase();
    if (!haystack.includes(nameQ)) return false;
  }
  if (filters.status.length > 0 && !filters.status.includes(row.status)) return false;
  return true;
}

function sortUsers(rows: User[], column: SortColumn, direction: SortDirection): User[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "role":
        return compareStrings(a.role, b.role, direction);
      case "department":
        return compareStrings(a.department, b.department, direction);
      case "lastLogin":
        return compareStrings(a.lastLogin, b.lastLogin, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      default:
        return 0;
    }
  });
}

export default function UserManagementPage() {
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { impersonatedUser, setImpersonatedUser } = usePermissions();

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UserFilters>({
    filters: { name: "", status: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filteredRows = useMemo(() => USERS.filter((row) => rowMatchesFilters(row, filters)), [filters]);
  const sortedRows = useMemo(
    () => sortUsers(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.status, perPage, setPage]);

  const handleImpersonate = (user: User) => {
    setSelectedUser(user);
    setIsImpersonateModalOpen(true);
  };

  const confirmImpersonate = (user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }) => {
    setImpersonatedUser(user);
    setIsImpersonateModalOpen(false);
  };

  const colSpan = 6;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "User Management", path: "/user-management" },
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
                User Management
              </Title>
              <FavoriteButton name="User Management" path="/user-management" />
            </Flex>
            <Button variant="primary">Create User</Button>
          </Flex>

          {impersonatedUser ? (
            <Alert
              variant="warning"
              isInline
              title={`Currently impersonating: ${impersonatedUser.name}`}
              actionClose={
                <Button variant="danger" onClick={() => setImpersonatedUser(null)}>
                  Stop impersonation
                </Button>
              }
            >
              {impersonatedUser.role} • {impersonatedUser.department}
            </Alert>
          ) : null}

          <div className="ocs-pods-list__panel">
            <DataView ouiaId="user-management-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="user-management-dv-toolbar"
                id="user-management-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<UserFilters>
                    values={filters}
                    onChange={(_filterId, partial) => onSetFilters(partial)}
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
                      placeholder="Filter by name, email, or role..."
                      style={{ minWidth: "16rem", maxWidth: "100%" }}
                    />
                    <DataViewCheckboxFilter
                      title="Status"
                      filterId="status"
                      placeholder="Choose statuses"
                      showIcon
                      showBadge
                      options={STATUS_OPTIONS}
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
                    ouiaId="user-management-pagination"
                    widgetId="user-management-pagination"
                    titles={{ items: "users" }}
                    paginationAriaLabel="User management pagination"
                  />
                }
              />

              <OcsPrototypeListTable ariaLabel="Users">
                <Thead>
                  <Tr>
                    <Th dataLabel="User">
                      <SortableTableHeader label="User" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Role">
                      <SortableTableHeader label="Role" column="role" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Department">
                      <SortableTableHeader label="Department" column="department" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Last login">
                      <SortableTableHeader label="Last login" column="lastLogin" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    </Th>
                    <Th dataLabel="Status">
                      <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                          No users match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((user) => (
                      <Tr key={user.id}>
                        <Td dataLabel="User">
                          <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                            <Content component="small">
                              <strong>{user.name}</strong>
                            </Content>
                            <Content component="small" className="pf-v6-u-color-200">
                              {user.email}
                            </Content>
                          </Flex>
                        </Td>
                        <Td dataLabel="Role">
                          <Label color={roleLabelColor(user.role)} isCompact>
                            {user.role}
                          </Label>
                        </Td>
                        <Td dataLabel="Department">
                          <Content component="small">{user.department}</Content>
                        </Td>
                        <Td dataLabel="Last login">
                          <Content component="small">{user.lastLogin}</Content>
                        </Td>
                        <Td dataLabel="Status">
                          <Label color="green" isCompact>
                            {user.status}
                          </Label>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <Button variant="primary" isSmall onClick={() => handleImpersonate(user)}>
                            Impersonate
                          </Button>
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

      {isImpersonateModalOpen && selectedUser ? (
        <ImpersonateUserModal
          onClose={() => setIsImpersonateModalOpen(false)}
          onImpersonate={confirmImpersonate}
          users={USERS}
          preselectedUser={selectedUser}
        />
      ) : null}
    </div>
  );
}
