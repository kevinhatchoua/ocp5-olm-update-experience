import { useMemo, useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  MenuToggle,
  NotificationBadge,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  Timestamp,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import {
  useToast,
  type ConsoleNotification,
  type ToastVariant,
} from "../contexts/ToastContext";

function drawerVariant(variant: ToastVariant): "success" | "danger" | "warning" | "info" | "custom" {
  if (variant === "success" || variant === "danger" || variant === "warning" || variant === "info") {
    return variant;
  }
  return "custom";
}

function NotificationItem({
  notification,
  onRead,
  onClear,
}: {
  notification: ConsoleNotification;
  onRead: (id: number) => void;
  onClear: (id: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <NotificationDrawerListItem
      variant={drawerVariant(notification.variant)}
      isRead={notification.isRead}
      onClick={() => onRead(notification.id)}
    >
      <NotificationDrawerListItemHeader
        variant={drawerVariant(notification.variant)}
        title={notification.title}
        srTitle={`${notification.variant} notification`}
      >
        <Dropdown
          isOpen={menuOpen}
          onOpenChange={setMenuOpen}
          onSelect={() => setMenuOpen(false)}
          popperProps={{ position: "right" }}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              variant="plain"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              isExpanded={menuOpen}
              aria-label={`Actions for notification: ${notification.title}`}
              icon={<EllipsisVIcon />}
            />
          )}
        >
          <DropdownList>
            {!notification.isRead ? (
              <DropdownItem
                key="read"
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(notification.id);
                }}
              >
                Mark as read
              </DropdownItem>
            ) : null}
            <DropdownItem
              key="clear"
              onClick={(e) => {
                e.stopPropagation();
                onClear(notification.id);
              }}
            >
              Clear
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      </NotificationDrawerListItemHeader>
      <NotificationDrawerListItemBody
        timestamp={<Timestamp date={new Date(notification.timestamp)} dateFormat="medium" timeFormat="short" />}
      />
    </NotificationDrawerListItem>
  );
}

type ConsoleNotificationDrawerProps = {
  onClose: () => void;
};

export default function ConsoleNotificationDrawer({ onClose }: ConsoleNotificationDrawerProps) {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    clearAllNotifications,
  } = useToast();
  const [actionsOpen, setActionsOpen] = useState(false);

  const headerActions = (
    <Dropdown
      isOpen={actionsOpen}
      onOpenChange={setActionsOpen}
      onSelect={() => setActionsOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          onClick={() => setActionsOpen((o) => !o)}
          isExpanded={actionsOpen}
          aria-label="Notification drawer actions"
          icon={<EllipsisVIcon />}
        />
      )}
    >
      <DropdownList>
        <DropdownItem key="mark-all" isDisabled={unreadCount === 0} onClick={markAllNotificationsRead}>
          Mark all read
        </DropdownItem>
        <DropdownItem key="clear-all" isDisabled={notifications.length === 0} onClick={clearAllNotifications}>
          Clear all
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );

  const list = useMemo(
    () =>
      notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={markNotificationRead}
          onClear={clearNotification}
        />
      )),
    [notifications, markNotificationRead, clearNotification]
  );

  return (
    <NotificationDrawer className="ocs-console-notification-drawer">
      <NotificationDrawerHeader
        title="Notifications"
        count={unreadCount > 0 ? unreadCount : undefined}
        onClose={(_event) => onClose()}
      >
        {headerActions}
      </NotificationDrawerHeader>
      <NotificationDrawerBody>
        {notifications.length === 0 ? (
          <EmptyState variant={EmptyStateVariant.full} titleText="No notifications" headingLevel="h2">
            <EmptyStateBody>When you connect resources or complete topology actions, they appear here.</EmptyStateBody>
          </EmptyState>
        ) : (
          <NotificationDrawerList aria-label="Notifications">{list}</NotificationDrawerList>
        )}
      </NotificationDrawerBody>
    </NotificationDrawer>
  );
}

type NotificationBellProps = {
  isDrawerOpen: boolean;
  onToggle: () => void;
};

export function NotificationBell({ isDrawerOpen, onToggle }: NotificationBellProps) {
  const { unreadCount } = useToast();

  const variant = unreadCount > 0 ? "unread" : "read";

  return (
    <NotificationBadge
      variant={variant}
      onClick={onToggle}
      aria-label="Notifications"
      isExpanded={isDrawerOpen}
      count={unreadCount > 0 ? unreadCount : undefined}
    />
  );
}
