import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const initialTasks = [
  {
    id: "task-1",
    title: "Create login interface",
    description: "Build the responsive login page and form validation.",
    status: "todo",
    priority: "high",
    assignee: "Ayesha",
    initials: "AS",
    due: "Today",
  },
  {
    id: "task-2",
    title: "Project workspace layout",
    description: "Create project overview with tabs, team and progress.",
    status: "todo",
    priority: "medium",
    assignee: "Dolly",
    initials: "DP",
    due: "Tomorrow",
  },
  {
    id: "task-3",
    title: "GitHub repository integration",
    description: "Connect repository information to the project workspace.",
    status: "todo",
    priority: "high",
    assignee: "Simran",
    initials: "SS",
    due: "12 Oct",
  },
  {
    id: "task-4",
    title: "Dashboard UI",
    description: "Implement overview cards, activity and upcoming meetings.",
    status: "in_progress",
    priority: "high",
    assignee: "Shivangee",
    initials: "SP",
    due: "Today",
  },
  {
    id: "task-5",
    title: "AI assistant interface",
    description: "Create project intelligence interface for AI queries.",
    status: "in_progress",
    priority: "medium",
    assignee: "Shivangee",
    initials: "SP",
    due: "Tomorrow",
  },
  {
    id: "task-6",
    title: "Notification module",
    description: "Create notification list and read/unread states.",
    status: "in_progress",
    priority: "low",
    assignee: "Ayesha",
    initials: "AS",
    due: "13 Oct",
  },
  {
    id: "task-7",
    title: "Database schema",
    description: "Design initial project and task data structure.",
    status: "completed",
    priority: "high",
    assignee: "Simran",
    initials: "SS",
    due: "Completed",
  },
  {
    id: "task-8",
    title: "Authentication API",
    description: "Implement login, registration and JWT authorization.",
    status: "completed",
    priority: "high",
    assignee: "Ayesha",
    initials: "AS",
    due: "Completed",
  },
  {
    id: "task-9",
    title: "Backend project routes",
    description: "Create project CRUD routes and controllers.",
    status: "completed",
    priority: "medium",
    assignee: "Dolly",
    initials: "DP",
    due: "Completed",
  },
];

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

function StatusIcon({ status }) {
  if (status === "completed") {
    return (
      <CheckCircle2
        size={15}
        className="text-zinc-600"
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

function TaskCard({ task, onMove }) {
  const priority = priorityConfig[task.priority];

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
          className="rounded-md p-1 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-5 text-zinc-950">
        {task.title}
      </h3>

      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-500">
        {task.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white">
            {task.initials}
          </div>

          <span className="max-w-24 truncate text-xs font-medium text-zinc-600">
            {task.assignee}
          </span>
        </div>

        <span className="text-[11px] text-zinc-400">{task.due}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {task.status !== "todo" && (
          <button
            type="button"
            onClick={() =>
              onMove(
                task.id,
                task.status === "completed"
                  ? "in_progress"
                  : "todo"
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
                task.id,
                task.status === "todo"
                  ? "in_progress"
                  : "completed"
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

function NewTaskModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("Shivangee");
  const [description, setDescription] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onCreate({
      title: title.trim(),
      description:
        description.trim() ||
        "New task added to the project workspace.",
      status: "todo",
      priority,
      assignee,
      initials:
        assignee === "Shivangee"
          ? "SP"
          : assignee === "Ayesha"
          ? "AS"
          : assignee === "Dolly"
          ? "DP"
          : "SS",
      due: "Not set",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Create task
            </h2>

            <p className="mt-0.5 text-xs text-zinc-400">
              Add work to the current project.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="text-sm font-medium text-zinc-800">
              Task title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Build project overview"
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

          <div className="grid gap-4 sm:grid-cols-2">
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
                <option>Ayesha</option>
                <option>Shivangee</option>
                <option>Dolly</option>
                <option>Simran</option>
              </select>
            </div>
          </div>

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
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Tasks() {
  const { projectId } = useParams();

  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filteredTasks = useMemo(() => {
    const value = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !value ||
        task.title.toLowerCase().includes(value) ||
        task.description.toLowerCase().includes(value) ||
        task.assignee.toLowerCase().includes(value);

      const matchesPriority =
        priorityFilter === "all" ||
        task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, search, priorityFilter]);

  const moveTask = (taskId, newStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              due:
                newStatus === "completed"
                  ? "Completed"
                  : task.due === "Completed"
                  ? "Today"
                  : task.due,
            }
          : task
      )
    );
  };

  const createTask = (task) => {
    setTasks((current) => [
      {
        ...task,
        id: `task-${Date.now()}`,
      },
      ...current,
    ]);
  };

  const total = tasks.length;
  const completed = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const inProgress = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Back */}
      <div className="mb-6">
        <Link
          to={`/projects/${projectId}`}
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

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus size={16} />
          New task
        </button>
      </div>

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
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
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
                  onClick={() => setShowModal(true)}
                  className="rounded-md p-1.5 text-zinc-400 transition hover:bg-white hover:text-zinc-700"
                >
                  <Plus size={15} />
                </button>
              </div>

              <div className="mt-2 space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMove={moveTask}
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
              {total
                ? Math.round((completed / total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <NewTaskModal
          onClose={() => setShowModal(false)}
          onCreate={createTask}
        />
      )}
    </div>
  );
}

export default Tasks;