export const errMsg = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export const initialsOf = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
};

export const timeAgo = (value) => {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString();
};

export const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short" })
    : "—";

export const fmtDateLong = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

// <input type="date"> / <input type="datetime-local"> helpers
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const toDateTimeInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const daysLeft = (value) => {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
};

export const taskStats = (tasks = []) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const todo = total - completed - inProgress;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, inProgress, todo, progress };
};
