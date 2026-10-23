import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { memberApi } from "../api/memberApi";
import { projectApi } from "../api/projectApi";
import { taskApi } from "../api/taskApi";
import { useAuth } from "../context/AuthContext";

const columns = [
  {
    key: "todo",
    title: "To Do",
    subtitle: "Planned work",
  },
  {
    key: "in_progress",
    title: "In Progress",
    subtitle: "Currently being worked on",
  },
  {
    key: "completed",
    title: "Completed",
    subtitle: "Finished work",
  },
];

const priorityConfig = {
  high: {
    label: "High",
    className: "bg-zinc-900 text-white",
  },
  medium: {
    label: "Medium",
    className: "bg-zinc-100 text-zinc-700",
  },
  low: {
    label: "Low",
    className: "border border-zinc-200 bg-white text-zinc-500",
  },
};

const initialsOf = (name = "?") => {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const formatDue = (task) => {
  if (task.status === "completed") return "Completed";
  if (!task.dueDate) return "Not set";
  return new Date(task.dueDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const errorText = (err, fallback) =>
  err.response?.data?.message || fallback;

function StatusIcon({ status }) {
  if (status === "completed") {
    return (
      <CheckCircle2
        size={15}
        className="text-emerald-600"
        strokeWidth={1.8}
      />
    );
  }

  if (status === "in_progress") {
    return (
      <Clock3
        size={15}
        className="text-zinc-500"
        strokeWidth={1.8}
      />
    );
  }

  return (
    <Circle
      size={15}
      className="text-zinc-400"
      strokeWidth={1.8}
    />
  );
}

function TaskCard({ task, assigneeName, onMove, onDelete }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const name = assigneeName || "Unassigned";

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon status={task.status} />

          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.className}`}
          >
            {priority.label}
          </span>
        </div>

        <button
          type="button"
          title="Delete task"
          onClick={() => onDelete(task)}
          className="rounded-md p-1 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-5 text-zinc-950">
        {task.title}
      </h3>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-500">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white">
            {assigneeName ? initialsOf(assigneeName) : "–"}
          </div>

          <span className="max-w-24 truncate text-xs font-medium text-zinc-600">
            {name}
          </span>
        </div>

        <span className="text-[11px] text-zinc-400">
          {formatDue(task)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {task.status !== "todo" && (
          <button
            type="button"
            onClick={() =>
              onMove(
                task,
                task.status === "completed" ? "in_progress" : "todo"
              )
            }
            className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Move back
          </button>
        )}

        {task.status !== "completed" && (
          <button
            type="button"
            onClick={() =>
              onMove(
                task,
                task.status === "todo" ? "in_progress" : "completed"
              )
            }
            className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-zinc-800"
          >
            {task.status === "todo" ? "Start task" : "Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function NewTaskModal({ members, defaultAssignee, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState(defaultAssignee || "");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: "todo",
        ...(assignee ? { assignedTo: assignee } : {}),
        ...(dueDate ? { dueDate } : {}),
      });
      onClose();
    } catch (err) {
      setError(errorText(err, "Could not create the task."));
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Create task"
      subtitle="Add work to the current project."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div>
          <label className="text-sm font-medium text-zinc-800">
            Task title
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Build project overview"
            autoFocus
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-800">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Describe what needs to be done..."
            className="mt-2 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-zinc-800">
              Priority
            </label>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800">
              Assignee
            </label>

            <select
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800">
              Due date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create task"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AddMemberModal({ onClose, onAdd }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter your teammate's email.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onAdd(email.trim());
      onClose();
    } catch (err) {
      setError(errorText(err, "Could not add this member."));
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Add team member"
      subtitle="They need a SynapseOS account already."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div>
          <label className="text-sm font-medium text-zinc-800">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            autoFocus
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add member"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function Tasks() {
  const { projectId: routeProjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projectsState, setProjectsState] = useState({
    loaded: false,
    projects: [],
    error: "",
  });
  const [data, setData] = useState({
    key: null,
    tasks: [],
    members: [],
    error: "",
  });
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // 1) the user's projects
  useEffect(() => {
    let cancelled = false;

    projectApi
      .getProjects()
      .then((result) => {
        if (!cancelled)
          setProjectsState({
            loaded: true,
            projects: result.data?.projects || [],
            error: "",
          });
      })
      .catch((err) => {
        if (!cancelled)
          setProjectsState({
            loaded: true,
            projects: [],
            error: errorText(err, "Failed to load projects."),
          });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { projects } = projectsState;
  const projectId = projects.some((p) => p._id === routeProjectId)
    ? routeProjectId
    : projects[0]?._id || "";
  const project = projects.find((p) => p._id === projectId);

  // 2) tasks + team of the selected project
  useEffect(() => {
    if (!projectId) return undefined;
    let cancelled = false;

    Promise.all([
      taskApi.getProjectTasks(projectId),
      memberApi.getMembers(projectId),
    ])
      .then(([taskResult, memberResult]) => {
        if (!cancelled)
          setData({
            key: projectId,
            tasks: taskResult.data?.tasks || [],
            members: memberResult.data?.members || [],
            error: "",
          });
      })
      .catch((err) => {
        if (!cancelled)
          setData({
            key: projectId,
            tasks: [],
            members: [],
            error: errorText(err, "Failed to load tasks."),
          });
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const loading = Boolean(projectId) && data.key !== projectId;
  const ready = data.key === projectId;
  const tasks = ready ? data.tasks : [];
  const members = ready ? data.members : [];

  const nameById = {};
  members.forEach((m) => {
    nameById[m._id] = m.name;
  });
  const assigneeOf = (task) =>
    nameById[String(task.assignedTo || "")] || "";

  const value = search.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !value ||
      task.title.toLowerCase().includes(value) ||
      (task.description || "").toLowerCase().includes(value) ||
      assigneeOf(task).toLowerCase().includes(value);

    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  /* ---------- actions (all persisted through the API) ---------- */
  const patchTasks = (fn) =>
    setData((current) => ({ ...current, tasks: fn(current.tasks) }));

  const moveTask = async (task, newStatus) => {
    setActionError("");
    const previous = task.status;

    // optimistic update, rolled back if the server refuses
    patchTasks((list) =>
      list.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
    );

    try {
      const result = await taskApi.updateTask(task._id, {
        status: newStatus,
      });
      const saved = result.data?.task;

      if (saved)
        patchTasks((list) =>
          list.map((t) => (t._id === saved._id ? saved : t))
        );
    } catch (err) {
      patchTasks((list) =>
        list.map((t) =>
          t._id === task._id ? { ...t, status: previous } : t
        )
      );
      setActionError(errorText(err, "Could not update the task."));
    }
  };

  const createTask = async (payload) => {
    const result = await taskApi.createTask(projectId, payload);
    const created = result.data?.task;

    if (created) patchTasks((list) => [created, ...list]);
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    setActionError("");

    try {
      await taskApi.deleteTask(task._id);
      patchTasks((list) => list.filter((t) => t._id !== task._id));
    } catch (err) {
      setActionError(errorText(err, "Could not delete the task."));
    }
  };

  const addMember = async (email) => {
    const result = await memberApi.addMember(projectId, email);

    setData((current) => ({
      ...current,
      members: result.data?.members || current.members,
    }));
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const isOwner =
    project && user && String(project.owner) === String(user._id);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Back */}
      <div className="mb-6">
        <Link
          to={projectId ? `/projects/${projectId}` : "/projects"}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft size={15} />
          Back to project
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            SynapseOS · Project workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Tasks
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Plan, track and complete work across the current project.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectId}
            onChange={(event) =>
              navigate(`/projects/${event.target.value}/tasks`)
            }
            disabled={!projects.length}
            aria-label="Project"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 outline-none"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowMemberModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <UserPlus size={16} />
              Add member
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTaskModal(true)}
            disabled={!projectId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus size={16} />
            New task
          </button>
        </div>
      </div>

      {/* States */}
      {(!projectsState.loaded || loading) && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          Loading tasks...
        </div>
      )}

      {projectsState.loaded && projectsState.error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm font-medium text-red-700">
          {projectsState.error}
        </div>
      )}

      {projectsState.loaded &&
        !projectsState.error &&
        projects.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
            <h2 className="text-base font-semibold text-zinc-900">
              No projects yet
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create a project first, then add tasks to it.
            </p>

            <Link
              to="/projects"
              className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Go to projects
            </Link>
          </div>
        )}

      {ready && data.error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm font-medium text-red-700">
          {data.error}
        </div>
      )}

      {actionError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {ready && !data.error && (
        <>
          {/* Summary */}
          <div className="mt-7 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-white">
              {total} total
            </span>

            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">
              {inProgress} in progress
            </span>

            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">
              {completed} completed
            </span>

            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 lg:max-w-md">
              <Search size={17} className="shrink-0 text-zinc-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-400" />

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none"
              >
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
            </div>
          </div>

          {/* Kanban */}
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter(
                (task) => task.status === column.key
              );

              return (
                <section
                  key={column.key}
                  className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3"
                >
                  <div className="flex items-start justify-between px-2 py-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-zinc-900">
                          {column.title}
                        </h2>

                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                          {columnTasks.length}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-zinc-400">
                        {column.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTaskModal(true)}
                      className="rounded-md p-1.5 text-zinc-400 transition hover:bg-white hover:text-zinc-700"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <div className="mt-2 space-y-3">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        assigneeName={assigneeOf(task)}
                        onMove={moveTask}
                        onDelete={deleteTask}
                      />
                    ))}

                    {columnTasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
                        <p className="text-sm font-medium text-zinc-600">
                          No tasks here
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          Tasks matching your filters will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Progress footer */}
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Project task progress
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  {completed} of {total} tasks completed
                </p>
              </div>

              <div className="w-full md:max-w-md">
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all"
                    style={{
                      width: `${total ? (completed / total) * 100 : 0}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-right text-xs font-medium text-zinc-500">
                  {total ? Math.round((completed / total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {showTaskModal && (
        <NewTaskModal
          members={members}
          defaultAssignee={user?._id}
          onClose={() => setShowTaskModal(false)}
          onCreate={createTask}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          onClose={() => setShowMemberModal(false)}
          onAdd={addMember}
        />
      )}
    </div>
  );
}

export default Tasks;
