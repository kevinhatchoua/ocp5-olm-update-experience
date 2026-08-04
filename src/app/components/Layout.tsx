import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { forwardRef, useEffect, useState } from "react";
import {
  Badge,
  Banner,
  Button,
  Content,
  Dropdown,
  DropdownItem,
  Divider,
  Flex,
  FlexItem,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  Nav,
  NavExpandable,
  NavGroup,
  NavItem,
  NavItemSeparator,
  Page,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  SkipToContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import displayStyles from "@patternfly/react-styles/css/utilities/Display/display.mjs";
import flexStyles from "@patternfly/react-styles/css/utilities/Flex/flex.mjs";
import sizingStyles from "@patternfly/react-styles/css/utilities/Sizing/sizing.mjs";
import BellIcon from "@patternfly/react-icons/dist/esm/icons/bell-icon";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import MinusCircleIcon from "@patternfly/react-icons/dist/esm/icons/minus-circle-icon";
import QuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/question-circle-icon";
import SignOutAltIcon from "@patternfly/react-icons/dist/esm/icons/sign-out-alt-icon";
import ThIcon from "@patternfly/react-icons/dist/esm/icons/th-icon";
import UsersIcon from "@patternfly/react-icons/dist/esm/icons/users-icon";
import RhMicronsCaretDownIcon from "@patternfly/react-icons/dist/esm/icons/rh-microns-caret-down-icon";
import ImpersonateUserModal from "./ImpersonateUserModal";
import CopyLoginCommandModal from "./CopyLoginCommandModal";
import ClusterUpdateDemoBanner from "./ClusterUpdateDemoBanner";
import BackToPrototypesBanner from "./BackToPrototypesBanner";
import { MastheadFedoraMark } from "./MastheadFedoraMark";
import { usePermissions } from "../contexts/PermissionsContext";
import { useChat } from "../contexts/ChatContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useToast } from "../contexts/ToastContext";
import {
  ADMINISTRATION_SUB,
  BUILDS_SUB,
  COMPUTE_SUB,
  ECOSYSTEM_SUB,
  GITOPS_SUB,
  HOME_SUB,
  NETWORKING_SUB,
  OBSERVE_SUB,
  VIRTUALIZATION_SUB,
  type SubNavEntry,
  STORAGE_SUB,
  USER_MANAGEMENT_SUB,
  WORKLOADS_SUB,
} from "../navigation/consoleNav";

interface ImpersonatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

const NavItemLink = forwardRef<HTMLAnchorElement, React.ComponentProps<typeof Link> & { href?: string }>(
  function NavItemLink({ href, to, ...rest }, ref) {
    const destination = to ?? href;
    return destination != null ? <Link ref={ref} to={destination} {...rest} /> : null;
  }
);

function MastheadIconButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return <Button variant="plain" type="button" aria-label={label} data-name={label} icon={icon} />;
}

function subPathMatches(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function subRoutesActive(pathname: string, subItems: { path: string }[]) {
  return subItems.some((s) => subPathMatches(pathname, s.path));
}

function activeSubPath(pathname: string, subItems: { path: string }[]): string | null {
  const matches = subItems.filter((s) => subPathMatches(pathname, s.path));
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (b.path.length > a.path.length ? b : a)).path;
}

function ExpandableNavRouteGroup({
  groupId,
  label,
  pathname,
  subItems,
}: {
  groupId: string;
  label: string;
  pathname: string;
  subItems: SubNavEntry[];
}) {
  const flatPaths = subItems.filter((x): x is { path: string; label: string } => x !== "separator");
  const groupHasActiveChild = subRoutesActive(pathname, flatPaths);
  const currentSubPath = activeSubPath(pathname, flatPaths);
  const [expanded, setExpanded] = useState(groupHasActiveChild);

  useEffect(() => {
    if (groupHasActiveChild) setExpanded(true);
  }, [groupHasActiveChild]);

  return (
    <NavExpandable
      groupId={groupId}
      title={label}
      isExpanded={expanded}
      onExpand={(_e, next) => setExpanded(next)}
    >
      {subItems.map((entry, i) =>
        entry === "separator" ? (
          <NavItemSeparator key={`${groupId}-sep-${i}`} />
        ) : (
          <NavItem
            key={entry.path}
            itemId={entry.path}
            isActive={currentSubPath === entry.path}
            to={entry.path}
            component={NavItemLink}
          >
            {entry.label}
          </NavItem>
        )
      )}
    </NavExpandable>
  );
}

/** Red Hat OpenShift Lightspeed floating action button (official icon asset). */
const LIGHTSPEED_FAB_ICON_SRC =
  "https://www.redhat.com/rhdc/managed-files/styles/training_page/private/Red%20Hat%20OpenShift%20Lightspeed%20icon.png?itok=PF8IqhT4";

function MastheadBrandLink() {
  return (
    <MastheadBrand component="div">
      <Link to="/" className="ocs-masthead-brand-link" aria-label="Red Hat OpenShift">
        <div className="ocs-masthead-brand-lockup">
          <MastheadFedoraMark className="ocs-masthead-logo-hat" />
          <div className="ocs-masthead-brand-text">
            <span className="ocs-masthead-brand-rh">Red Hat</span>
            <span className="ocs-masthead-brand-ocp">OpenShift</span>
          </div>
        </div>
      </Link>
    </MastheadBrand>
  );
}

function UserMenu({
  impersonatedUser,
  onImpersonate,
  onStopImpersonation,
  onCopyLoginCommand,
}: {
  impersonatedUser: ImpersonatedUser | null;
  onImpersonate: () => void;
  onStopImpersonation: () => void;
  onCopyLoginCommand: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const displayName = impersonatedUser ? impersonatedUser.name : "kube:admin";

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      popperProps={{ direction: "down", position: "end" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          className="ocs-masthead-user-toggle"
          data-name="user-menu"
          aria-label="User menu"
          onClick={() => setIsOpen((o) => !o)}
          isExpanded={isOpen}
        >
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapXs" }}>
            <Content component="span">{displayName}</Content>
            <span
              className={isOpen ? "inline-flex [transition:transform_0.2s_ease] -rotate-180" : "inline-flex [transition:transform_0.2s_ease]"}
            >
              <RhMicronsCaretDownIcon aria-hidden />
            </span>
          </Flex>
        </MenuToggle>
      )}
      onSelect={() => setIsOpen(false)}
    >
      <DropdownItem
        itemId="copy-login"
        onClick={() => {
          onCopyLoginCommand();
          setIsOpen(false);
        }}
      >
        Copy login command
      </DropdownItem>
      <DropdownItem
        itemId="prefs"
        onClick={() => {
          navigate("/user-preferences");
          setIsOpen(false);
        }}
      >
        User Preferences
      </DropdownItem>
      <Divider component="li" />
      {impersonatedUser ? (
        <DropdownItem
          itemId="stop-impersonate"
          icon={<MinusCircleIcon aria-hidden />}
          isDanger
          onClick={() => {
            onStopImpersonation();
            setIsOpen(false);
          }}
        >
          Stop Impersonation
        </DropdownItem>
      ) : (
        <DropdownItem
          itemId="impersonate"
          icon={<UsersIcon aria-hidden />}
          onClick={() => {
            onImpersonate();
            setIsOpen(false);
          }}
        >
          Impersonate User
        </DropdownItem>
      )}
      <Divider component="li" />
      <DropdownItem
        itemId="logout"
        icon={<SignOutAltIcon aria-hidden />}
        isDanger
        onClick={() => {
          pushToast({
            variant: "info",
            title: "Logged out (prototype)",
          });
          setIsOpen(false);
        }}
      >
        Log out
      </DropdownItem>
    </Dropdown>
  );
}

export default function Layout() {
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [isCopyLoginOpen, setIsCopyLoginOpen] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);
  const [isHomeExpanded, setIsHomeExpanded] = useState(true);
  const location = useLocation();

  const { impersonatedUser, setImpersonatedUser } = usePermissions();

  const { isOpen: isAIOpen, setIsOpen: setIsAIOpen } = useChat();

  const { favorites } = useFavorites();
  const { activeCount: activeToastCount } = useToast();

  const handleImpersonate = (user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }) => {
    setImpersonatedUser(user);
  };

  const handleStopImpersonation = () => {
    setImpersonatedUser(null);
  };

  const homeFlat = HOME_SUB.filter((x): x is { path: string; label: string } => x !== "separator");
  const homeGroupActive = subRoutesActive(location.pathname, homeFlat);
  const homeCurrentPath = activeSubPath(location.pathname, homeFlat);

  useEffect(() => {
    if (homeGroupActive) setIsHomeExpanded(true);
  }, [homeGroupActive]);

  const favoritesPathActive =
    location.pathname === "/favorites" || location.pathname.startsWith("/favorites/");
  const favoriteRouteActive = favorites.some(
    (f) => location.pathname === f.path || location.pathname.startsWith(`${f.path}/`)
  );
  const favoritesGroupActive = favoritesPathActive || favoriteRouteActive;
  const activeFavoritePath = activeSubPath(
    location.pathname,
    favorites.map((f) => ({ path: f.path }))
  );

  useEffect(() => {
    if (favoritesGroupActive) setIsFavoritesExpanded(true);
  }, [favoritesGroupActive]);

  const masthead = (
    <Masthead display={{ default: "inline" }} className="ocs-console-masthead">
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton id="layout-nav-toggle" aria-label="Global navigation" isHamburgerButton />
        </MastheadToggle>
        <MastheadBrandLink />
      </MastheadMain>
      <MastheadContent>
        <Toolbar id="layout-masthead-toolbar-end" ouiaId="layout-masthead-toolbar-end" isFullHeight>
          <ToolbarContent alignItems="center">
            <ToolbarGroup
              className="ocs-masthead-toolbar-group"
              gap={{ default: "gapSm" }}
              align={{ default: "alignEnd" }}
              alignItems="center"
            >
              <ToolbarItem className="ocs-masthead-toolbar-item">
                <MastheadIconButton label="Application launcher" icon={<ThIcon aria-hidden />} />
              </ToolbarItem>
              <ToolbarItem className="ocs-masthead-toolbar-item ocs-masthead-toolbar-notifications">
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  justifyContent={{ default: "justifyContentCenter" }}
                  gap={{ default: "gapXs" }}
                >
                  <MastheadIconButton label="Notifications" icon={<BellIcon aria-hidden />} />
                  {activeToastCount > 0 ? (
                    <Badge isRead={false} screenReaderText={`${activeToastCount} active notifications`}>
                      {activeToastCount}
                    </Badge>
                  ) : null}
                </Flex>
              </ToolbarItem>
              <ToolbarItem className="ocs-masthead-toolbar-item">
                <MastheadIconButton label="Settings" icon={<CogIcon aria-hidden />} />
              </ToolbarItem>
              <ToolbarItem className="ocs-masthead-toolbar-item">
                <MastheadIconButton label="Help" icon={<QuestionCircleIcon aria-hidden />} />
              </ToolbarItem>
              <ToolbarItem className="ocs-masthead-toolbar-item">
                <UserMenu
                  impersonatedUser={impersonatedUser}
                  onImpersonate={() => setIsImpersonateModalOpen(true)}
                  onStopImpersonation={handleStopImpersonation}
                  onCopyLoginCommand={() => setIsCopyLoginOpen(true)}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar id="layout-sidebar" className="ocs-console-sidebar" data-name="Sidebar">
      <PageSidebarBody>
        <Nav aria-label="Core platform">
          <NavGroup title="Core platform" id="layout-nav-core-platform">
            <NavExpandable
              groupId="layout-nav-home"
              title="Home"
              isExpanded={isHomeExpanded}
              onExpand={(_e, next) => setIsHomeExpanded(next)}
            >
              {HOME_SUB.map((entry, i) =>
                entry === "separator" ? (
                  <NavItemSeparator key={`home-sep-${i}`} />
                ) : (
                  <NavItem
                    key={entry.path}
                    itemId={entry.path}
                    isActive={homeCurrentPath === entry.path}
                    to={entry.path}
                    component={NavItemLink}
                  >
                    {entry.label}
                  </NavItem>
                )
              )}
            </NavExpandable>

            <NavExpandable
              groupId="layout-favorites"
              title={`Favorites${favorites.length > 0 ? ` (${favorites.length})` : ""}`}
              isExpanded={isFavoritesExpanded}
              onExpand={(_e, next) => setIsFavoritesExpanded(next)}
            >
              {favorites.length === 0 ? (
                <NavItem itemId="layout-favorites-empty" preventDefault to="#" onClick={(e) => e.preventDefault()}>
                  No favorites yet. Star a page to add it here.
                </NavItem>
              ) : (
                favorites.map((fav) => (
                  <NavItem
                    key={fav.id}
                    itemId={fav.id}
                    isActive={activeFavoritePath === fav.path}
                    to={fav.path}
                    component={NavItemLink}
                  >
                    {fav.name}
                  </NavItem>
                ))
              )}
            </NavExpandable>

            <ExpandableNavRouteGroup
              groupId="layout-nav-ecosystem"
              label="Ecosystem"
              pathname={location.pathname}
              subItems={ECOSYSTEM_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-workloads"
              label="Workloads"
              pathname={location.pathname}
              subItems={WORKLOADS_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-gitops"
              label="GitOps"
              pathname={location.pathname}
              subItems={GITOPS_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-virtualization"
              label="Virtualization"
              pathname={location.pathname}
              subItems={VIRTUALIZATION_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-networking"
              label="Networking"
              pathname={location.pathname}
              subItems={NETWORKING_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-storage"
              label="Storage"
              pathname={location.pathname}
              subItems={STORAGE_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-builds"
              label="Builds"
              pathname={location.pathname}
              subItems={BUILDS_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-observe"
              label="Observe"
              pathname={location.pathname}
              subItems={OBSERVE_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-compute"
              label="Compute"
              pathname={location.pathname}
              subItems={COMPUTE_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-user-management"
              label="User Management"
              pathname={location.pathname}
              subItems={USER_MANAGEMENT_SUB}
            />
            <ExpandableNavRouteGroup
              groupId="layout-nav-administration"
              label="Administration"
              pathname={location.pathname}
              subItems={ADMINISTRATION_SUB}
            />
          </NavGroup>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  const impersonationBanner =
    impersonatedUser !== null ? (
      <Banner status="info" aria-label="Impersonation active">
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
          flexWrap={{ default: "wrap" }}
          gap={{ default: "gapMd" }}
        >
          <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }}>
            <UsersIcon aria-hidden />
            <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
              <Content component="p">Viewing as {impersonatedUser.name}</Content>
              <Content component="small">
                {impersonatedUser.role} • {impersonatedUser.department}
              </Content>
            </Flex>
          </Flex>
          <Button variant="link" onClick={handleStopImpersonation}>
            Stop impersonation
          </Button>
        </Flex>
      </Banner>
    ) : undefined;

  return (
    <>
      <div
        className={css(
          sizingStyles.h_100,
          displayStyles.displayFlex,
          flexStyles.flexDirectionColumn,
          flexStyles.flexShrink_1
        )}
        style={{ minHeight: "var(--pf-t--global--spacer--0, 0px)" }}
      >
        <div
          className={css(
            flexStyles.flex_1,
            displayStyles.displayFlex,
            flexStyles.flexDirectionColumn,
            flexStyles.flexShrink_1
          )}
          style={{ minHeight: "var(--pf-t--global--spacer--0, 0px)" }}
        >
          <BackToPrototypesBanner />
          <ClusterUpdateDemoBanner />
          <Page
            className={css(sizingStyles.h_100, "ocs-console-page")}
            isManagedSidebar
            isContentFilled
            masthead={masthead}
            sidebar={sidebar}
            skipToContent={<SkipToContent href="#app-main-container">Skip to content</SkipToContent>}
            mainContainerId="app-main-container"
            mainAriaLabel="OpenShift console"
            banner={impersonationBanner}
          >
            <div
              className={css(
                sizingStyles.h_100,
                displayStyles.displayFlex,
                flexStyles.flexDirectionColumn,
                flexStyles.flexShrink_1,
                flexStyles.flex_1
              )}
              style={
                isAIOpen
                  ? {
                      paddingInlineEnd: "var(--pf-v6-c-drawer__panel--m-width, 26.25rem)",
                      transition:
                        "padding-inline-end var(--pf-t--global--transition--Duration, 0.3s) var(--pf-t--global--transition--TimingFunction, ease-in-out)",
                    }
                  : {
                      transition:
                        "padding-inline-end var(--pf-t--global--transition--Duration, 0.3s) var(--pf-t--global--transition--TimingFunction, ease-in-out)",
                    }
              }
            >
              <Outlet />
            </div>
          </Page>
        </div>
      </div>

      <ImpersonateUserModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
        onImpersonate={handleImpersonate}
      />
      <CopyLoginCommandModal isOpen={isCopyLoginOpen} onClose={() => setIsCopyLoginOpen(false)} />

      <Button
        type="button"
        variant="plain"
        className="ocs-lightspeed-fab"
        onClick={() => setIsAIOpen(!isAIOpen)}
        aria-label={isAIOpen ? "Close OpenShift LightSpeed" : "Open OpenShift LightSpeed"}
        aria-pressed={isAIOpen}
      >
        <img
          src={LIGHTSPEED_FAB_ICON_SRC}
          alt=""
          className="ocs-lightspeed-fab__icon"
          width={56}
          height={48}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </Button>
    </>
  );
}
