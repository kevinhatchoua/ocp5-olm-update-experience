import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  type AlertProps,
} from "@patternfly/react-core";

export type ToastVariant = NonNullable<AlertProps["variant"]>;

export type ToastMessage = {
  key: number;
  variant: ToastVariant;
  title: string;
  timeout?: number;
};

export type ToastInput = {
  variant: ToastVariant;
  title: string;
  timeout?: number;
};

/** Persisted entry for the masthead Notification drawer (OCP-style history). */
export type ConsoleNotification = {
  id: number;
  variant: ToastVariant;
  title: string;
  timestamp: number;
  isRead: boolean;
};

type ToastContextValue = {
  toasts: ToastMessage[];
  activeCount: number;
  notifications: ConsoleNotification[];
  unreadCount: number;
  pushToast: (toast: ToastInput) => number;
  dismissToast: (key: number) => void;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: number) => void;
  clearAllNotifications: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** PF Alert guidelines: 8s recommended timeout for toast alerts. */
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_VISIBLE_TOASTS = 4;
const MAX_DRAWER_NOTIFICATIONS = 50;

function variantLabel(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "Success alert";
    case "danger":
      return "Danger alert";
    case "warning":
      return "Warning alert";
    default:
      return "Info alert";
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<ConsoleNotification[]>([]);

  const dismissToast = useCallback((key: number) => {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const key = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [{ key, timeout: DEFAULT_TIMEOUT_MS, ...toast }, ...prev].slice(0, MAX_VISIBLE_TOASTS));
    setNotifications((prev) =>
      [
        {
          id: key,
          variant: toast.variant,
          title: toast.title,
          timestamp: Date.now(),
          isRead: false,
        },
        ...prev,
      ].slice(0, MAX_DRAWER_NOTIFICATIONS)
    );
    return key;
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const value = useMemo(
    () => ({
      toasts,
      activeCount: toasts.length,
      notifications,
      unreadCount,
      pushToast,
      dismissToast,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotification,
      clearAllNotifications,
    }),
    [
      toasts,
      notifications,
      unreadCount,
      pushToast,
      dismissToast,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotification,
      clearAllNotifications,
    ]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* PF6: isToast + isLiveRegion → top-right toast group; timeout 8s per guidelines */}
      <AlertGroup
        className="ocs-console-toast-group"
        isToast
        isLiveRegion
        hasAnimations
        aria-label="Toast notifications"
      >
        {toasts.map((toast) => (
          <Alert
            key={toast.key}
            variant={toast.variant}
            title={toast.title}
            isExpandable={false}
            timeout={toast.timeout ?? DEFAULT_TIMEOUT_MS}
            onTimeout={() => dismissToast(toast.key)}
            actionClose={
              <AlertActionCloseButton
                title={toast.title}
                variantLabel={variantLabel(toast.variant)}
                onClose={() => dismissToast(toast.key)}
              />
            }
          />
        ))}
      </AlertGroup>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
