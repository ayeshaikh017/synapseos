import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { taskApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import {
  ConfirmDelete,
  ErrorBanner,
  Field,
  Loading,
  Modal,
  NeedProject,
  PageHeader,
  PrimaryButton,
  ProjectPicker,
  SecondaryButton,
  inputClass,
} from "../components/ui";
import { errMsg, fmtDate, initialsOf, toDateInput } from "../utils/format";

const columns = [
  { key: "todo", title: "To Do", subtitle: "Planned work" },
  { key: "in_progress", title: "In Progress", subtitle: "Currently being worked on" },
  { key: "completed", title: "Completed", subtitle: "Finished work" },
];

const priorityConfig = {
  high: { label: "High", className: "bg-zinc-900 text-white" },
  medium: { label: "Medium", className: "bg-zinc-100 text-zinc-700" },
  low: { label: "Low", className: "border border-zinc-200 bg-white text-zinc-500" },
};

function StatusIcon({ status }) {
  if (status === "completed") return <CheckCircle2 size={15} className="text-zinc-600" strokeWidth={1.8} />;
  if (status === "in_progress") return <Clock3 size={15} className="text-zinc-500" strokeWidth={1.8} />;
  return <Circle size={15} className="text-zinc-400" strokeWidth={1.8} />;
}

function TaskCard({ task, assigneeName, onMove, onEdit, onDelete }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const overdue = task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date();

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon status={task.status} />
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.className}`}>
            {priority.label}
          </span>
        </div>
        <div className="flex items-center opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={onEdit} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><Pencil size={14} /></button>
          <button type="button" onClick={onDelete} className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-5 text-zinc-950">{task.title}</h3>
      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white">
            {assigneeName ? initialsOf(assigneeName) : "–"}
          </div>
          <span className="max-w-24 truncate text-xs font-medium text-zinc-600">
            {assigneeName || "Unassigned"}
          </span>
        </div>
        <span className={`text-[11px] ${overdue ? "font-medium text-red-600" : "text-zinc-400"}`}>
          {task.dueDate ? `${overdue ? "Overdue · " : ""}${fmtDate(task.dueDate)}` : "No due date"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {task.status !== "todo" && (
          <button type="button" onClick={() => onMove(task, task.status === "completed" ? "in_progress" : "todo")} className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50">
            Move back
          </button>
        )}
        {task.status !== "completed" && (
          <button type="button" onClick={() => onMove(task, task.status === "todo" ? "in_progress" : "completed")} className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-zinc-800">
            {task.status === "todo" ? "Start task" : "Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

function TaskForm({ task, projectId, assignees, onClose, onSaved }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [status, setStatus] = useState(task?.status || "todo");
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || "");
  const [dueDate, setDueDate] = useState(toDateInput(task?.dueDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return setError("Task title is required");

    const payload = { title: title.trim(), description: description.trim(), priority, status };
    payload.assignedTo = assignedTo || null;
    payload.dueDate = dueDate || null;

    setSaving(true);
    setError("");
    try {
      if (task) await taskApi.update(task._id, payload);
      else await taskApi.create(projectId, payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err, "Could not save task"));
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? "Edit task" : "Create task"} subtitle="Add work to the current project." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <ErrorBanner message={error} />
        <Field label="Task title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build project overview" className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe what needs to be done..." className={`${inputClass} resize-none`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Assignee">
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputClass}>
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving..." : task ? "Save changes" : "Create task"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function Tasks() {
  const { projectId: routeProjectId } = useParams();
  const { user } = useAuth();
  const { projects, loading: projectsLoading, activeProjectId, activeProject, setActiveProjectId } = useProjects();

  // /projects/:projectId/tasks uses the URL; /tasks uses the picker.
  const projectId = routeProjectId || activeProjectId;
  const project = projects.find((p) => p._id === projectId) || activeProject;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [editing, setEditing] = useState(null); // null | "new" | task
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (routeProjectId && routeProjectId !== activeProjectId) setActiveProjectId(routeProjectId);
  }, [routeProjectId, activeProjectId, setActiveProjectId]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const data = await taskApi.list(projectId);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(errMsg(err, "Could not load tasks"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // The backend only exposes user ids, so assignees are shown by name for
  // the current user and as a short id for teammates.
  const assignees = useMemo(() => {
    const ids = new Set([project?.owner, ...(project?.members || [])].filter(Boolean));
    return [...ids].map((id) => ({
      id,
      name: id === user?._id ? `${user.name} (me)` : `Member …${String(id).slice(-4)}`,
    }));
  }, [project, user]);

  const nameFor = (id) => assignees.find((a) => a.id === id)?.name.replace(" (me)", "") || (id ? `Member …${String(id).slice(-4)}` : "");

  const moveTask = async (task, newStatus) => {
    const previous = tasks;
    setTasks((cur) => cur.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)));
    try {
      await taskApi.update(task._id, { status: newStatus });
    } catch (err) {
      setTasks(previous);
      setError(errMsg(err, "Could not update task"));
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await taskApi.remove(deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(errMsg(err, "Could not delete task"));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesSearch =
        !q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, search, priorityFilter]);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  if (!projectId) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader eyebrow="Workspace" title="Tasks" />
        <div className="mt-8"><NeedProject loading={projectsLoading} /></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {routeProjectId && (
        <div className="mb-6">
          <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900">
            <ArrowLeft size={15} />
            Back to project
          </Link>
        </div>
      )}

      <PageHeader
        eyebrow={`SynapseOS · ${project?.name || "Project workspace"}`}
        title="Tasks"
        text="Plan, track and complete work across the current project."
        actions={
          <>
            {!routeProjectId && <ProjectPicker />}
            <PrimaryButton onClick={() => setEditing("new")}>
              <Plus size={16} />
              New task
            </PrimaryButton>
          </>
        }
      />

      <div className="mt-7 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-white">{total} total</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">{inProgress} in progress</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">{completed} completed</span>
      </div>

      <div className="mt-4"><ErrorBanner message={error} onRetry={load} /></div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 lg:max-w-md">
          <Search size={17} className="shrink-0 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-400" />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none">
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="mt-6"><Loading label="Loading tasks..." /></div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.key);
            return (
              <section key={column.key} className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                <div className="flex items-start justify-between px-2 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-zinc-900">{column.title}</h2>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500">{columnTasks.length}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">{column.subtitle}</p>
                  </div>
                  <button type="button" onClick={() => setEditing("new")} className="rounded-md p-1.5 text-zinc-400 transition hover:bg-white hover:text-zinc-700">
                    <Plus size={15} />
                  </button>
                </div>
                <div className="mt-2 space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      assigneeName={nameFor(task.assignedTo)}
                      onMove={moveTask}
                      onEdit={() => setEditing(task)}
                      onDelete={() => setDeleting(task)}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
                      <p className="text-sm font-medium text-zinc-600">No tasks here</p>
                      <p className="mt-1 text-xs text-zinc-400">Tasks matching your filters will appear here.</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-950">Project task progress</p>
            <p className="mt-1 text-xs text-zinc-400">{completed} of {total} tasks completed</p>
          </div>
          <div className="w-full md:max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
            </div>
            <p className="mt-2 text-right text-xs font-medium text-zinc-500">{total ? Math.round((completed / total) * 100) : 0}%</p>
          </div>
        </div>
      </div>

      {editing && (
        <TaskForm
          task={editing === "new" ? null : editing}
          projectId={projectId}
          assignees={assignees}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {deleting && (
        <ConfirmDelete what={deleting.title} busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
}

export default Tasks;
