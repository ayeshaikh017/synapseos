import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  ListTodo,
  X,
} from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    title: "Ayesha assigned you a task",
    description: '"Build dashboard UI"',
    time: "10 minutes ago",
    type: "task",
    read: false,
  },
  {
    id: 2,
    title: "Sprint 04 ends in 4 days",
    description: "7 tasks are still open in the current sprint.",
    time: "1 hour ago",
    type: "sprint",
    read: false,
  },
  {
    id: 3,
    title: "New project document uploaded",
    description: '"API Documentation" was added to SynapseOS.',
    time: "2 hours ago",
    type: "document",
    read: false,
  },
  {
    id: 4,
    title: "Task completed",
    description: '"Database Schema" was marked as completed.',
    time: "Yesterday",
    type: "completed",
    read: true,
  },
];

function NotificationIcon({ type }) {
  if (type === "task") {
    return <ListTodo size={17} />;
  }

  if (type === "sprint") {
    return <Clock3 size={17} />;
  }

  if (type === "document") {
    return <FileText size={17} />;
  }

  return <CheckCircle2 size={17} />;
}

function Notifications() {
  const [notifications, setNotifications] = useState(
    initialNotifications
  );

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    );
  };

  const removeNotification = (id) => {
    setNotifications((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Collaboration
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Stay updated with project activity and assigned work.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-zinc-600" />

            <span className="text-sm font-semibold text-zinc-950">
              Recent notifications
            </span>
          </div>

          <span className="text-xs text-zinc-400">
            {unreadCount} unread
          </span>
        </div>

        {notifications.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-4 px-5 py-5 ${
                  !notification.read ? "bg-zinc-50/70" : "bg-white"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                  <NotificationIcon type={notification.type} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {notification.description}
                      </p>

                      <p className="mt-2 text-xs text-zinc-400">
                        {notification.time}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeNotification(notification.id)
                      }
                      className="rounded-md p-1.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {!notification.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Bell
              size={22}
              className="mx-auto text-zinc-400"
            />

            <p className="mt-3 text-sm font-medium text-zinc-700">
              You're all caught up
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              No new notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;