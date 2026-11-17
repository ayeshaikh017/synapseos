import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  GitBranch,
  Layers3,
  ListTodo,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const project = {
  name: "SynapseOS",
  description:
    "AI-powered workspace for project collaboration and intelligent project management.",
  status: "Active",
  progress: 82,
  completedTasks: 18,
  totalTasks: 22,
  currentSprint: "Sprint 04",
  sprintDue: "In 4 days",
  members: [
    { initials: "A", name: "Ayesha" },
    { initials: "S", name: "Shivangee" },
    { initials: "D", name: "Dolly" },
    { initials: "S", name: "Simran" },
  ],
};

const recentActivity = [
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

const projectStats = [
  {
    label: "Tasks",
    value: "18 / 22",
    detail: "completed",
    icon: ListTodo,
  },
  {
    label: "Current sprint",
    value: "Sprint 04",
    detail: "ends in 4 days",
    icon: Layers3,
  },
  {
    label: "Documents",
    value: "08",
    detail: "project documents",
    icon: FileText,
  },
  {
    label: "GitHub",
    value: "24",
    detail: "recent commits",
    icon: GitBranch,
  },
];

function MemberAvatars() {
  return (
    <div className="flex items-center">
      {project.members.map((member, index) => (
        <div
          key={`${member.name}-${index}`}
          className={`${
            index > 0 ? "-ml-2" : ""
          } flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold ${
            index === 0
              ? "bg-zinc-900 text-white"
              : index === 1
              ? "bg-zinc-700 text-white"
              : index === 2
              ? "bg-zinc-400 text-white"
              : "bg-zinc-200 text-zinc-700"
          }`}
          title={member.name}
        >
          {member.initials}
        </div>
      ))}
    </div>
  );
}

function ProjectStat({ stat }) {
  const Icon = stat.icon;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <p className="mt-4 text-sm text-zinc-500">{stat.label}</p>

      <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
        {stat.value}
      </p>

      <p className="mt-1 text-xs text-zinc-400">{stat.detail}</p>
    </div>
  );
}

function ProjectWorkspace() {
  const { projectId } = useParams();

  return (
    <div className="mx-auto max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft size={15} />
          Back to projects
        </Link>
      </div>

      {/* Project header */}
      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="p-6 lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-lg font-semibold text-white">
                S
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                    {project.name}
                  </h1>

                  <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white">
                    {project.status}
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  {project.description}
                </p>

                <p className="mt-2 text-xs text-zinc-400">
                  Project ID: {projectId}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <MoreHorizontal size={16} />
              Project actions
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-7 -mb-6 flex gap-6 overflow-x-auto border-t border-zinc-100 pt-4">
            <Link
              to={`/projects/${projectId}`}
              className="border-b-2 border-zinc-900 pb-3 text-sm font-medium text-zinc-950"
            >
              Overview
            </Link>

            <Link
              to={`/projects/${projectId}/tasks`}
              className="pb-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              Tasks
            </Link>

            <Link
              to="/sprints"
              className="pb-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              Sprints
            </Link>

            <Link
              to="/documents"
              className="pb-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              Documents
            </Link>

            <Link
              to="/github"
              className="pb-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Project progress
            </p>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-zinc-950">
                {project.progress}%
              </span>

              <span className="pb-1 text-sm text-zinc-400">
                overall completion
              </span>
            </div>
          </div>

          <div className="w-full lg:max-w-md">
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900"
                style={{ width: `${project.progress}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-zinc-400">
              <span>
                {project.completedTasks} tasks completed
              </span>

              <span>
                {project.totalTasks - project.completedTasks} remaining
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {projectStats.map((stat) => (
          <ProjectStat key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* Recent activity */}
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                Recent activity
              </h2>

              <p className="mt-0.5 text-sm text-zinc-500">
                Latest changes in this project
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {recentActivity.map((activity) => (
              <div
                key={`${activity.name}-${activity.time}`}
                className="flex gap-3 px-5 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                  {activity.initials}
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-zinc-700">
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

        {/* Team */}
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">
              Project team
            </h2>

            <p className="mt-0.5 text-sm text-zinc-500">
              Members working on this project
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4">
              <MemberAvatars />

              <div>
                <p className="text-sm font-medium text-zinc-900">
                  4 team members
                </p>

                <p className="mt-0.5 text-xs text-zinc-400">
                  Active on current sprint
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                      {member.initials}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {member.name}
                      </p>

                      <p className="text-xs text-zinc-400">
                        Project member
                      </p>
                    </div>
                  </div>

                  <span className="h-2 w-2 rounded-full bg-zinc-700" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Current sprint */}
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 size={18} className="text-zinc-500" />

              <p className="text-sm font-medium text-zinc-500">
                Current sprint
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold text-zinc-950">
              {project.currentSprint}
            </h2>

            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
              <CalendarDays size={15} />
              Ends {project.sprintDue.replace("In ", "").toLowerCase()}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/sprints"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              View sprint
              <ArrowUpRight size={15} />
            </Link>

            <Link
              to={`/projects/${projectId}/tasks`}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Open tasks
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-400">Completed</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              14
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">In progress</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              4
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">Remaining</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              3
            </p>
          </div>
        </div>
      </section>

      {/* Project status */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
          <CheckCircle2 size={18} className="text-zinc-700" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-900">
            Project is currently on track
          </p>

          <p className="mt-0.5 text-xs text-zinc-400">
            Current sprint activity is progressing normally.
          </p>
        </div>

        <Users size={17} className="text-zinc-400" />
      </div>
    </div>
  );
}

export default ProjectWorkspace;