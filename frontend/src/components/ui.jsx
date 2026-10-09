import { useEffect } from "react";
import { AlertCircle, FolderKanban, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useProjects } from "../context/ProjectContext";

export function Loading({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-16 text-sm text-zinc-500">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium underline underline-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = FolderKanban, title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
        <Icon size={20} className="text-zinc-500" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-zinc-900">{title}</h2>
      {text && <p className="mt-1 text-sm text-zinc-500">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-800">{label}</label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500";

export function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDelete({ what, onCancel, onConfirm, busy }) {
  return (
    <Modal title="Delete?" subtitle="This cannot be undone." onClose={onCancel}>
      <p className="text-sm text-zinc-600">
        Are you sure you want to delete <span className="font-semibold">{what}</span>?
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

// Project-scoped pages (sprints, documents, meetings, github, ai, tasks) need
// to know which project they act on. This picker is shared by all of them.
export function ProjectPicker() {
  const { projects, activeProjectId, setActiveProjectId } = useProjects();

  if (projects.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <FolderKanban size={16} className="text-zinc-400" />
      <select
        value={activeProjectId}
        onChange={(event) => setActiveProjectId(event.target.value)}
        className="max-w-56 truncate rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none"
      >
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// Shown by project-scoped pages while there is nothing to act on.
export function NeedProject({ loading }) {
  if (loading) return <Loading label="Loading projects..." />;

  return (
    <EmptyState
      title="No project selected"
      text="Create a project first — sprints, documents, meetings and tasks belong to a project."
      action={
        <Link
          to="/projects"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Go to projects
        </Link>
      }
    />
  );
}

export function PageHeader({ eyebrow, title, text, actions }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-400">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        {text && <p className="mt-2 text-sm text-zinc-500">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
