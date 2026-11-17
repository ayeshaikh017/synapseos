import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  ListTodo,
  Users,
} from "lucide-react";

import api from "../api/axios";
import { projectApi } from "../api/projectApi";
import { taskApi } from "../api/taskApi";
import { memberApi } from "../api/memberApi";
import { useAuth } from "../context/AuthContext";

const pad = (n) => String(n).padStart(2, "0");

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const timeAgo = (value) => {
  if (!value) return "";
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} minute${diff === 1 ? "" : "s"} ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const formatWhen = (value) =>
  new Date(value).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const dueIn = (value) => {
  if (!value) return "No end date";
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Today";
  return `In ${days} day${days === 1 ? "" : "s"}`;
};

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <div className="mt-5">
        <p className="text-sm text-zinc-500">{item.label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
          {item.value}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{item.detail}</p>
      </div>
    </div>
  );
}

function AvatarGroup({ members }) {
  const shades = [
    "bg-zinc-900 text-white",
    "bg-zinc-700 text-white",
    "bg-zinc-500 text-white",
    "bg-zinc-300 text-zinc-800",
  ];

  return (
    <div className="flex items-center">
      {members.slice(0, 4).map((member, index) => (
        <div
          key={member._id || index}
          title={member.name}
          className={`${index === 0 ? "" : "-ml-2"} flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold ${shades[index % shades.length]}`}
        >
          {initialsOf(member.name)}
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState({
    loading: true,
    error: "",
    projects: [],
    tasks: [],
    sprints: [],
    meetings: [],
    members: [],
    notifications: [],
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const projectResult = await projectApi.getProjects();
        const projects = projectResult.data?.projects || [];

        const perProject = await Promise.all(
          projects.map(async (project) => {
            const [tasks, sprints, meetings, members] = await Promise.allSettled([
              taskApi.getProjectTasks(project._id),
              api.get(`/projects/${project._id}/sprints`),
              api.get(`/projects/${project._id}/meetings`),
              memberApi.getMembers(project._id),
            ]);

            return {
              projectId: project._id,
              tasks: tasks.status === "fulfilled" ? tasks.value.data?.tasks || [] : [],
              sprints:
                sprints.status === "fulfilled"
                  ? sprints.value.data?.data?.sprints || []
                  : [],
              meetings:
                meetings.status === "fulfilled"
                  ? meetings.value.data?.data?.meetings || []
                  : [],
              members:
                members.status === "fulfilled" ? members.value.data?.members || [] : [],
            };
          })
        );

        let notifications = [];
        try {
          const res = await api.get("/notifications");
          notifications = res.data?.data?.notifications || [];
        } catch {
          notifications = [];
        }

        if (cancelled) return;

        setState({
          loading: false,
          error: "",
          projects,
          tasks: perProject.flatMap((p) =>
            p.tasks.map((task) => ({ ...task, _projectId: p.projectId }))
          ),
          sprints: perProject.flatMap((p) =>
            p.sprints.map((sprint) => ({ ...sprint, _projectId: p.projectId }))
          ),
          meetings: perProject.flatMap((p) => p.meetings),
          members: perProject.map((p) => ({ projectId: p.projectId, list: p.members })),
          notifications,
        });
      } catch (err) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: err.response?.data?.message || "Failed to load dashboard data.",
        }));
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    const { projects, tasks, sprints, meetings, members, notifications } = state;
    const now = Date.now();

    const completed = tasks.filter((t) => t.status === "completed").length;
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const activeSprints = sprints.filter((s) => s.status === "active");
    const upcoming = meetings
      .filter((m) => new Date(m.scheduledAt).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const attention = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        (t.priority === "high" ||
          (t.dueDate && new Date(t.dueDate).getTime() < now))
    ).length;

    const featured = projects.find((p) => p.status === "active") || projects[0];
    const featuredTasks = featured
      ? tasks.filter((t) => t._projectId === featured._id)
      : [];
    const featuredDone = featuredTasks.filter((t) => t.status === "completed").length;
    const progress = featuredTasks.length
      ? Math.round((featuredDone / featuredTasks.length) * 100)
      : 0;
    const featuredMembers =
      members.find((m) => m.projectId === featured?._id)?.list || [];
    const featuredSprint = featured
      ? sprints.find((s) => s._projectId === featured._id && s.status === "active")
      : null;

    return {
      stats: [
        {
          label: "Projects",
          value: pad(projects.length),
          detail: `${activeProjects} active`,
          icon: FolderKanban,
        },
        {
          label: "Tasks",
          value: pad(tasks.length),
          detail: `${completed} completed`,
          icon: ListTodo,
        },
        {
          label: "Sprints",
          value: pad(sprints.length),
          detail: `${activeSprints.length} active`,
          icon: Layers3,
        },
        {
          label: "Upcoming meetings",
          value: pad(upcoming.length),
          detail: upcoming[0] ? `Next: ${formatWhen(upcoming[0].scheduledAt)}` : "Nothing scheduled",
          icon: CalendarDays,
        },
      ],
      upcoming: upcoming.slice(0, 3),
      activity: notifications.slice(0, 5),
      attention,
      featured,
      featuredDone,
      featuredTotal: featuredTasks.length,
      progress,
      featuredMembers,
      featuredSprint,
    };
  }, [state]);

  const firstName = (user?.name || "there").split(" ")[0];

  if (state.loading) {
    return (
      <div className="mx-auto max-w-7xl py-20 text-center text-sm text-zinc-500">
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-400">Workspace overview</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            {greeting()}, {firstName}.
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Here's what's happening across your workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          View projects
          <ArrowRight size={15} />
        </button>
      </div>

      {state.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      {/* Active project */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">Active project</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Current project progress and team
            </p>
          </div>

          {view.featured && (
            <button
              type="button"
              onClick={() => navigate(`/projects/${view.featured._id}`)}
              className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950"
            >
              Open project
              <ArrowUpRight size={15} />
            </button>
          )}
        </div>

        {view.featured ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white">
                    {initialsOf(view.featured.name).slice(0, 1)}
                  </div>

                  <div>
                    <h3 className="font-semibold text-zinc-950">
                      {view.featured.name}
                    </h3>
                    <p className="text-sm capitalize text-zinc-500">
                      {view.featured.status}
                    </p>
                  </div>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-500">
                  {view.featured.description || "No description added yet."}
                </p>
              </div>

              <div className="min-w-52">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Project progress</span>
                  <span className="text-sm font-semibold text-zinc-950">
                    {view.progress}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-900"
                    style={{ width: `${view.progress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-zinc-400">
                  {view.featuredDone} tasks completed ·{" "}
                  {view.featuredTotal - view.featuredDone} remaining
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <AvatarGroup members={view.featuredMembers} />

                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {view.featuredMembers.length} team member
                    {view.featuredMembers.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm">
                <div>
                  <p className="text-xs text-zinc-400">Current sprint</p>
                  <p className="mt-0.5 font-medium text-zinc-800">
                    {view.featuredSprint ? view.featuredSprint.name : "No active sprint"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Due</p>
                  <p className="mt-0.5 font-medium text-zinc-800">
                    {view.featuredSprint
                      ? dueIn(view.featuredSprint.endDate)
                      : dueIn(view.featured.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-sm font-medium text-zinc-800">No projects yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Create your first project to see progress, tasks and meetings here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Go to projects
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>

      {/* Bottom section */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* Activity (notifications) */}
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">Recent activity</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Your latest notifications</p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              View all
            </button>
          </div>

          {view.activity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-400">
              No activity yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {view.activity.map((item) => (
                <div key={item._id} className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                    <Bell size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950">
                      {item.title}
                    </p>
                    {item.message && (
                      <p className="truncate text-sm text-zinc-500">{item.message}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Meetings */}
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                Upcoming meetings
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">Your next scheduled sessions</p>
            </div>

            <CalendarDays size={18} className="text-zinc-400" strokeWidth={1.8} />
          </div>

          {view.upcoming.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-400">
              No upcoming meetings.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {view.upcoming.map((meeting) => (
                <div key={meeting._id} className="px-5 py-5">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    {meeting.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatWhen(meeting.scheduledAt)}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                    <Users size={14} />
                    {(meeting.participants || []).length} participant
                    {(meeting.participants || []).length === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-100 p-4">
            <button
              type="button"
              onClick={() => navigate("/meetings")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              View meetings
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
              {view.progress}% of {view.featured ? view.featured.name : "your project"} done
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {view.featuredDone} of {view.featuredTotal} tasks completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
            <Clock3 size={18} className="text-zinc-700" />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-900">
              {view.attention} task{view.attention === 1 ? "" : "s"} need attention
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              High priority or overdue, not completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
