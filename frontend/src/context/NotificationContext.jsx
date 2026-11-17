import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { notificationApi } from "../api/notificationApi";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const POLL_MS = 30000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || "";

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("token")) return;

    try {
      const result = await notificationApi.getNotifications();
      if (!mounted.current) return;
      setNotifications(result.data?.notifications || []);
      setUnreadCount(result.data?.unreadCount || 0);
      setError("");
    } catch (err) {
      if (mounted.current && err.response?.status !== 401) {
        setError("Could not load notifications.");
      }
    }
  }, []);

  // Initial load + polling + refresh when the tab regains focus.
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    setLoading(true);
    refresh().finally(() => mounted.current && setLoading(false));

    const timer = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, refresh]);

  const markRead = useCallback(
    async (id) => {
      const target = notifications.find((n) => n._id === id);
      if (!target || target.isRead) return;

      setNotifications((current) =>
        current.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));

      try {
        await notificationApi.markRead(id);
      } catch {
        refresh();
      }
    },
    [notifications, refresh]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationApi.markAllRead();
    } catch {
      setError("Could not mark notifications as read.");
    }
    // Always re-sync with the server so the badge reflects the real state.
    await refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id) => {
      const target = notifications.find((n) => n._id === id);
      setNotifications((current) => current.filter((n) => n._id !== id));
      if (target && !target.isRead) setUnreadCount((count) => Math.max(0, count - 1));

      try {
        await notificationApi.remove(id);
      } catch {
        refresh();
      }
    },
    [notifications, refresh]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, error, refresh, markRead, markAllRead, remove }),
    [notifications, unreadCount, loading, error, refresh, markRead, markAllRead, remove]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}

// Where a notification should take the user. Older notifications have no
// stored link, so fall back to the page matching their type.
export const notificationTarget = (notification) => {
  if (notification.link) return notification.link;

  const byType = {
    task: "/tasks",
    meeting: "/meetings",
    document: "/documents",
    sprint: "/sprints",
    project: "/projects",
  };
  return byType[notification.type] || "/notifications";
};
