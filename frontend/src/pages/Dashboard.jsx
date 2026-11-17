import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  ListTodo,
  MoreHorizontal,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "Active projects",
    value: "04",
    detail: "2 updated this week",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    value: "24",
    detail: "8 completed",
    icon: ListTodo,
  },
  {
    label: "Sprints",
    value: "03",
    detail: "1 ending soon",
    icon: Layers3,
  },
  {
    label: "Upcoming meetings",
    value: "02",
    detail: "Next one today",
    icon: CalendarDays,
  },
];

const activities = [
  {
    initials: "AS",
    name: "Ayesha",
    action: 'created "Authentication API"',
    time: "10 minutes ago",
  },
  {
    initials: "SP",
    name: "Shivangee",
    action: 'moved "Dashboard UI" to In Progress',
    time: "32 minutes ago",
  },
  {
    initials: "DP",
    name: "Dolly",
    action: "uploaded project documentation",
    time: "1 hour ago",
  },
  {
    initials: "SS",
    name: "Simran",
    action: 'completed "Database Schema"',
    time: "2 hours ago",
  },
];

const meetings = [
  {
    title: "Project Review",
    time: "Today · 3:00 PM",
    duration: "30 min",
    members: "4 participants",
  },
  {
    title: "Sprint Planning",
    time: "Tomorrow · 11:00 AM",
    duration: "45 min",
    members: "4 participants",
  },
];

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
          <Icon size={18} strokeWidth={1.8} />
        </div>

        <button
          type="button"
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mt-5">
        <p className="text-sm text-zinc-500">{item.label}</p>

        <div className="mt-1 flex items-end gap-2">
          <p className="text-2xl font-semibold tracking-tight text-zinc-950">
            {item.value}
          </p>
        </div>

        <p className="mt-1 text-xs text-zinc-400">{item.detail}</p>
      </div>
    </div>
  );
}

function AvatarGroup() {
  return (
    <div className="flex items-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-[10px] font-semibold text-white">
        A
      </div>

      <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-700 text-[10px] font-semibold text-white">
        S
      </div>

      <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-500 text-[10px] font-semibold text-white">
        D
      </div>

      <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-300 text-[10px] font-semibold text-zinc-800">
        S
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Workspace overview
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Good afternoon, Shivangee.
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Here's what's happening across your workspace.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          View projects
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      {/* Active project */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Active project
            </h2>

            <p className="mt-0.5 text-sm text-zinc-500">
              Current project progress and team activity
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950"
          >
            Open project
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white">
                  S
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-950">
                    SynapseOS
                  </h3>

                  <p className="text-sm text-zinc-500">
                    AI-powered team workspace
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-500">
                Centralized project workspace for managing tasks, sprints,
                documentation, meetings, development activity and intelligent
                project assistance.
              </p>
            </div>

            <div className="min-w-52">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  Project progress
                </span>

                <span className="text-sm font-semibold text-zinc-950">
                  82%
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full w-[82%] rounded-full bg-zinc-900" />
              </div>

              <p className="mt-2 text-xs text-zinc-400">
                18 tasks completed · 4 remaining
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AvatarGroup />

              <div>
                <p className="text-sm font-medium text-zinc-800">
                  4 team members
                </p>

                <p className="text-xs text-zinc-400">
                  Working across current sprint
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm">
              <div>
                <p className="text-xs text-zinc-400">Current sprint</p>
                <p className="mt-0.5 font-medium text-zinc-800">
                  Sprint 04
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">Due</p>
                <p className="mt-0.5 font-medium text-zinc-800">
                  In 4 days
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom section */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* Activity */}
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                Project activity
              </h2>

              <p className="mt-0.5 text-sm text-zinc-500">
                Recent changes across your workspace
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {activities.map((activity) => (
              <div
                key={`${activity.name}-${activity.time}`}
                className="flex items-center gap-3 px-5 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                  {activity.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-700">
                    <span className="font-medium text-zinc-950">
                      {activity.name}
                    </span>{" "}
                    {activity.action}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Meetings */}
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                Upcoming meetings
              </h2>

              <p className="mt-0.5 text-sm text-zinc-500">
                Your next scheduled sessions
              </p>
            </div>

            <CalendarDays
              size={18}
              className="text-zinc-400"
              strokeWidth={1.8}
            />
          </div>

          <div className="divide-y divide-zinc-100">
            {meetings.map((meeting) => (
              <div key={meeting.title} className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950">
                      {meeting.title}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {meeting.time}
                    </p>
                  </div>

                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                    {meeting.duration}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                  <Users size={14} />
                  {meeting.members}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-100 p-4">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              View calendar
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>

      {/* Workspace status */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
            <CheckCircle2 size={18} className="text-zinc-700" />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-900">
              Workspace is on track
            </p>

            <p className="mt-0.5 text-xs text-zinc-400">
              Current sprint is progressing normally
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
            <Clock3 size={18} className="text-zinc-700" />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-900">
              3 tasks need attention
            </p>

            <p className="mt-0.5 text-xs text-zinc-400">
              Review pending high-priority work
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;