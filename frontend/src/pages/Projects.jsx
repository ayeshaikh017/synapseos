import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { loadProjectBundle, projectApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import {
  ConfirmDelete,
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  Modal,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from "../components/ui";
import { errMsg, initialsOf, taskStats, timeAgo, toDateInput } from "../utils/format";

const filters = [
  { key: "all", label: "All" },
  { key: "planning", label: "Planning" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

function StatusBadge({ status }) {
  const isCompleted = status === "completed";
  const label = status ? status[0].toUpperCase() + status.slice(1) : "Planning";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isCompleted || status === "archived"
          ? "bg-zinc-100 text-zinc-600"
          : "bg-zinc-900 text-white"
      }`}
    >
      {isCompleted && <CheckCircle2 size={12} />}
      {label}
    </span>
  );
}

function ProjectForm({ project, onClose, onSaved }) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [status, setStatus] = useState(project?.status || "planning");
  const [startDate, setStartDate] = useState(toDateInput(project?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(project?.endDate));
  const [memberIds, setMemberIds] = useState((project?.members || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return setError("Project name is required");

    const payload = {
      name: name.trim(),
      description: description.trim(),
      status,
      members: memberIds.split(",").map((m) => m.trim()).filter(Boolean),
    };
    payload.startDate = startDate || null;
    payload.endDate = endDate || null;

    setSaving(true);
    setError("");
    try {
      if (project) await projectApi.update(project._id, payload);
      else await projectApi.create(payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err, "Could not save project"));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={project ? "Edit project" : "Create project"}
      subtitle="Projects hold tasks, sprints, documents and meetings."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <ErrorBanner message={error} />
        <Field label="Project name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. SynapseOS" />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Start date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label="End date">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Member user IDs (optional)" hint="Comma separated user ids. You are always the owner.">
          <input value={memberIds} onChange={(e) => setMemberIds(e.target.value)} className={inputClass} placeholder="64f1..., 64f2..." />
        </Field>
        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving..." : project ? "Save changes" : "Create project"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function ProjectCard({ project, stats, sprintCount, isOwner, onEdit, onDelete }) {
  const { user } = useAuth();
  const memberCount = 1 + (project.members?.filter((m) => m !== project.owner).length || 0);
  const avatars = [initialsOf(user?.name)].concat(
    (project.members || []).filter((m) => m !== project.owner).map(() => "·")
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <FolderKanban size={18} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-zinc-950">{project.name}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
              {project.description || "No description yet."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onEdit} title="Edit" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <Pencil size={16} />
          </button>
          {isOwner && (
            <button type="button" onClick={onDelete} title="Delete" className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">Progress</p>
          <p className="text-sm font-semibold text-zinc-950">{stats.progress}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-zinc-900" style={{ width: `${stats.progress}%` }} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-zinc-100 border-t border-zinc-100 pt-5">
        <div>
          <p className="text-xs text-zinc-400">Tasks</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">{stats.completed}/{stats.total}</p>
        </div>
        <div className="pl-4">
          <p className="text-xs text-zinc-400">Sprints</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">{sprintCount}</p>
        </div>
        <div className="pl-4">
          <p className="text-xs text-zinc-400">Team</p>
          <div className="mt-1 flex items-center">
            {avatars.slice(0, 4).map((a, i) => (
              <div key={i} className={`${i > 0 ? "-ml-2" : ""} flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold ${i === 0 ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-700"}`}>
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Users size={14} />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </div>
        <Link to={`/projects/${project._id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-950">
          Open project
          <ArrowRight size={15} />
        </Link>
      </div>
      <p className="mt-3 text-xs text-zinc-400">Updated {timeAgo(project.updatedAt)}</p>
    </div>
  );
}

function Projects() {
  const { user } = useAuth();
  const { projects, loading, error, refreshProjects } = useProjects();

  const [bundles, setBundles] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | project
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadBundles = useCallback(async (list) => {
    const entries = await Promise.all(
      list.map(async (p) => [p._id, await loadProjectBundle(p._id)])
    );
    setBundles(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    loadBundles(projects);
  }, [projects, loadBundles]);

  const saved = async () => {
    const list = await refreshProjects();
    await loadBundles(list);
  };

  const confirmDelete = async () => {
    setBusy(true);
    setActionError("");
    try {
      await projectApi.remove(deleting._id);
      setDeleting(null);
      await saved();
    } catch (err) {
      setActionError(errMsg(err, "Could not delete project"));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesFilter = activeFilter === "all" || p.status === activeFilter;
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [projects, activeFilter, search]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        text="Manage projects, progress and team activity from one place."
        actions={
          <PrimaryButton onClick={() => setEditing("new")}>
            <Plus size={16} />
            New project
          </PrimaryButton>
        }
      />

      <div className="mt-6 space-y-3">
        <ErrorBanner message={error} onRetry={refreshProjects} />
        <ErrorBanner message={actionError} />
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === f.key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 lg:max-w-sm">
          <Search size={17} className="shrink-0 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Showing <span className="font-medium text-zinc-800">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "project" : "projects"}
        </p>
      </div>

      {loading && projects.length === 0 ? (
        <div className="mt-4"><Loading label="Loading projects..." /></div>
      ) : filtered.length > 0 ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {filtered.map((project) => {
            const b = bundles[project._id] || { tasks: [], sprints: [] };
            return (
              <ProjectCard
                key={project._id}
                project={project}
                stats={taskStats(b.tasks)}
                sprintCount={b.sprints.length}
                isOwner={project.owner === user?._id}
                onEdit={() => setEditing(project)}
                onDelete={() => setDeleting(project)}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title={projects.length === 0 ? "No projects yet" : "No projects found"}
            text={projects.length === 0 ? "Create your first project to get started." : "Try changing your search or selecting another filter."}
            action={projects.length === 0 && (
              <PrimaryButton onClick={() => setEditing("new")}><Plus size={16} />New project</PrimaryButton>
            )}
          />
        </div>
      )}

      {editing && (
        <ProjectForm
          project={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await saved();
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete what={deleting.name} busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
}

export default Projects;
