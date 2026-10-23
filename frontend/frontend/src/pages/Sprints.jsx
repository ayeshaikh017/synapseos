import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  MoreHorizontal,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";

const sprints = [
  {
    id: "sprint-04",
    name: "Sprint 04",
    start: "08 Oct",
    end: "12 Oct",
    status: "active",
    progress: 78,
    completed: 14,
    inProgress: 4,
    remaining: 3,
    goals: [
      { label: "Authentication", done: true },
      { label: "Project management", done: true },
      { label: "GitHub integration", done: false },
      { label: "AI assistant", done: false },
    ],
  },
  {
    id: "sprint-03",
    name: "Sprint 03",
    start: "02 Oct",
    end: "07 Oct",
    status: "completed",
    progress: 100,
    completed: 16,
    inProgress: 0,
    remaining: 0,
    goals: [
      { label: "Backend setup", done: true },
      { label: "MongoDB connection", done: true },
      { label: "Authentication API", done: true },
    ],
  },
  {
    id: "sprint-02",
    name: "Sprint 02",
    start: "25 Sep",
    end: "01 Oct",
    status: "completed",
    progress: 100,
    completed: 12,
    inProgress: 0,
    remaining: 0,
    goals: [
      { label: "Project structure", done: true },
      { label: "API planning", done: true },
      { label: "Database design", done: true },
    ],
  },
];

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        active
          ? "bg-zinc-900 text-white"
          : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {active ? "Active" : "Completed"}
    </span>
  );
}

function GoalRow({ goal }) {
  return (
    <div className="flex items-center gap-2.5">
      {goal.done ? (
        <CheckCircle2
          size={16}
          className="text-zinc-600"
          strokeWidth={1.8}
        />
      ) : (
        <div className="h-4 w-4 rounded-full border border-zinc-300" />
      )}

      <span
        className={`text-sm ${
          goal.done
            ? "text-zinc-500 line-through"
            : "text-zinc-800"
        }`}
      >
        {goal.label}
      </span>
    </div>
  );
}

function SprintCard({ sprint }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers3
                size={17}
                className="text-zinc-500"
              />

              <h2 className="text-base font-semibold text-zinc-950">
                {sprint.name}
              </h2>

              <StatusBadge status={sprint.status} />
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <CalendarDays size={14} />
              {sprint.start} — {sprint.end}
            </div>
          </div>

          <button
            type="button"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Sprint progress
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
              {sprint.progress}%
            </p>
          </div>

          <span className="text-xs text-zinc-400">
            {sprint.completed} completed
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all"
            style={{ width: `${sprint.progress}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-100 border-t border-zinc-100 pt-4">
          <div>
            <p className="text-xs text-zinc-400">
              Completed
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {sprint.completed}
            </p>
          </div>

          <div className="pl-4">
            <p className="text-xs text-zinc-400">
              In progress
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {sprint.inProgress}
            </p>
          </div>

          <div className="pl-4">
            <p className="text-xs text-zinc-400">
              Remaining
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {sprint.remaining}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Sprint goals
          </p>

          <div className="mt-3 space-y-2.5">
            {sprint.goals.map((goal) => (
              <GoalRow
                key={goal.label}
                goal={goal}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-950"
        >
          Open sprint
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function Sprints() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Sprint planning
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Plan sprint goals, monitor progress and keep project work
            moving.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus size={16} />
          New sprint
        </button>
      </div>

      {/* Current sprint */}
      <section className="mt-8 rounded-xl border border-zinc-200 bg-white">
        <div className="p-6 lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Current sprint
                </span>

                <span className="text-xs text-zinc-400">
                  Ends in 4 days
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                Sprint 04
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                08 Oct — 12 Oct
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg border border-zinc-200 px-4 py-3">
                <p className="text-xs text-zinc-400">
                  Completed
                </p>

                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  14
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 px-4 py-3">
                <p className="text-xs text-zinc-400">
                  In progress
                </p>

                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  4
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 px-4 py-3">
                <p className="text-xs text-zinc-400">
                  Remaining
                </p>

                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  3
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700">
                Overall progress
              </p>

              <p className="text-sm font-semibold text-zinc-950">
                78%
              </p>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-[78%] rounded-full bg-zinc-900" />
            </div>
          </div>
        </div>
      </section>

      {/* AI planning insight */}
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
              <Sparkles
                size={18}
                className="text-zinc-700"
                strokeWidth={1.8}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-950">
                AI planning insight
              </p>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                3 high-priority tasks are currently unassigned.
                Consider moving them into the next sprint to reduce
                delivery risk.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Review tasks
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Sprint history */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Sprint history
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Previous and current project sprints.
          </p>
        </div>

        <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
          <Clock3 size={14} />
          Updated recently
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {sprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
          />
        ))}
      </div>

      {/* Planning status */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
          <Target
            size={18}
            className="text-zinc-700"
            strokeWidth={1.8}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-900">
            Sprint is progressing normally
          </p>

          <p className="mt-0.5 text-xs text-zinc-400">
            Current sprint has 7 open tasks across planned work.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Sprints;