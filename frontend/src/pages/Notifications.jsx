import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock3, FileText, ListTodo, Video, X } from "lucide-react";
import { notificationApi } from "../api/services";
import { EmptyState, ErrorBanner, Loading, PageHeader, SecondaryButton } from "../components/ui";
import { errMsg, timeAgo } from "../utils/format";

function NotificationIcon({ type }) {
  if (type === "task") return <ListTodo size={17} />;
  if (type === "meeting") return <Video size={17} />;
  if (type === "project") return <FileText size={17} />;
  if (type === "system") return <Clock3 size={17} />;
  return <CheckCircle2 size={17} />;
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await notificationApi.list();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(errMsg(err, "Could not load notifications"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (n) => {
    if (n.isRead) return;
    setNotifications((cur) => cur.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(n._id);
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      setError(errMsg(err, "Could not update notification"));
      load();
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    try {
      await Promise.all(unread.map((n) => notificationApi.markRead(n._id)));
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      setError(errMsg(err, "Could not mark all as read"));
    }
    load();
  };

  const remove = async (n) => {
    setNotifications((cur) => cur.filter((x) => x._id !== n._id));
    if (!n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.remove(n._id);
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      setError(errMsg(err, "Could not delete notification"));
      load();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Collaboration"
        title="Notifications"
        text="Stay updated with project activity and assigned work."
        actions={unreadCount > 0 && <SecondaryButton onClick={markAllRead}>Mark all as read</SecondaryButton>}
      />

      <ErrorBanner message={error} onRetry={load} />

      {loading ? <Loading label="Loading notifications..." /> : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2 text-zinc-800"><Bell size={18} /><span className="text-sm font-semibold">Recent notifications</span></div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">{unreadCount} unread</span>
          </div>

          {notifications.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {notifications.map((n) => (
                <div key={n._id} onClick={() => markRead(n)} className={`flex cursor-pointer gap-4 px-5 py-5 transition hover:bg-zinc-50 ${!n.isRead ? "bg-zinc-50/70" : "bg-white"}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600"><NotificationIcon type={n.type} /></div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.isRead ? "text-zinc-600" : "font-semibold text-zinc-950"}`}>{n.title}</p>
                    {n.message && <p className="mt-1 text-sm text-zinc-500">{n.message}</p>}
                    <p className="mt-1.5 text-xs text-zinc-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); remove(n); }} className="h-fit rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><X size={16} /></button>
                  {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16"><EmptyState icon={Bell} title="You're all caught up" text="No notifications yet. You'll be notified when you're added to a meeting." /></div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
