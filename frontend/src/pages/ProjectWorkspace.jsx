import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  GitBranch,
  Layers3,
  ListTodo,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { githubApi, loadProjectBundle, projectApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { ErrorBanner, Loading } from "../components/ui";
import { daysLeft, errMsg, fmtDateLong, initialsOf, taskStats, timeAgo } from "../utils/format";

function ProjectStat({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{detail}</p>
    </div>
  );
}

function ProjectWorkspace() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { setActiveProjectId } = useProjects();

  const [project, setProject] = useState(null);
  const [bundle, setBundle] = useState({ tasks: [], sprints: [], documents: [], meetings: [] });
  const [github, setGithub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setActiveProjectId(projectId);
    setLoading(true);
    setError("");

    (async () => {
      try {
        const [{ project: p }, b, gh] = await Promise.all([
          projectApi.get(projectId),
          loadProjectBundle(projectId),
          githubApi.get(projectId).catch(() => null),
        ]);
        if (cancelled) return;
        setProject(p);
        setBundle(b);
        setGithub(gh);
      } catch (err) {
        if (!cancelled) setError(errMsg(err, "Could not load project"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, setActiveProjectId]);

  if (loading) return <div className="mx-auto max-w-7xl"><Loading label="Loading project..." /></div>;

  if (error || !project) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900">
          <ArrowLeft size={15} /> Back to projects
        </Link>
        <ErrorBanner message={error || "Project not found"} />
      </div>
    );
  }

  const stats = taskStats(bundle.tasks);
  const currentSprint =
    bundle.sprints.find((s) => s.status === "active") || bundle.sprints[0] || null;
  const left = currentSprint ? daysLeft(currentSprint.endDate) : null;
  const memberIds = [project.owner, ...(project.members || []).filter((m) => m !== project.owner)];
  const memberName = (id) => (id === user?._id ? user.name : `Member …${String(id).slice(-4)}`);

  // There is no activity-feed endpoint, so recent activity is built from the
  // latest tasks, documents and meetings of this project.
  const activity = [
    ...bundle.tasks.map((t) => ({
      key: `t${t._id}`,
      at: t.updatedAt,
      text: `Task "${t.title}" is ${t.status.replace("_", " ")}`,
    })),
    ...bundle.documents.map((d) => ({ key: `d${d._id}`, at: d.updatedAt, text: `Document "${d.title}" updated` })),
    ...bundle.meetings.map((m) => ({ key: `m${m._id}`, at: m.updatedAt, text: `Meeting "${m.title}" scheduled` })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  const tabs = [
    { to: `/projects/${projectId}`, label: "Overview" },
    { to: `/projects/${projectId}/tasks`, label: "Tasks" },
    { to: "/sprints", label: "Sprints" },
    { to: "/documents", label: "Documents" },
    { to: "/meetings", label: "Meetings" },
    { to: "/github", label: "GitHub" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900">
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-lg font-semibold text-white">
              {initialsOf(project.name)[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{project.name}</h1>
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium capitalize text-white">{project.status}</span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{project.description || "No description yet."}</p>
              <p className="mt-2 text-xs text-zinc-400">
                {project.startDate ? `Starts ${fmtDateLong(project.startDate)}` : "No start date"}
                {" · "}
                {project.endDate ? `Ends ${fmtDateLong(project.endDate)}` : "No end date"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-1 border-t border-zinc-100 pt-4">
            {tabs.map((tab, i) => (
              <Link key={tab.label} to={tab.to} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${i === 0 ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"}`}>
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm font-medium text-zinc-500">Project progress</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-zinc-950">{stats.progress}%</span>
          <span className="text-sm text-zinc-400">overall completion</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-zinc-900" style={{ width: `${stats.progress}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-400">
          <span>{stats.completed} tasks completed</span>
          <span>{stats.total - stats.completed} remaining</span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProjectStat icon={ListTodo} label="Tasks" value={`${stats.completed} / ${stats.total}`} detail="completed" />
        <ProjectStat icon={Layers3} label="Sprints" value={String(bundle.sprints.length).padStart(2, "0")} detail={currentSprint ? currentSprint.name : "no sprint yet"} />
        <ProjectStat icon={FileText} label="Documents" value={String(bundle.documents.length).padStart(2, "0")} detail="project documents" />
        <ProjectStat
          icon={GitBranch}
          label="GitHub"
          value={github?.linked ? github.repository?.fullName?.split("/")[1] || "Linked" : "—"}
          detail={github?.linked ? "repository linked" : "no repository linked"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 lg:col-span-3">
          <h2 className="text-base font-semibold text-zinc-950">Recent activity</h2>
          <p className="mt-0.5 text-xs text-zinc-400">Latest changes in this project</p>
          <div className="mt-5 space-y-4">
            {activity.length === 0 && <p className="text-sm text-zinc-400">Nothing yet — create a task to get started.</p>}
            {activity.map((a) => (
              <div key={a.key} className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
                <div>
                  <p className="text-sm text-zinc-700">{a.text}</p>
                  <p className="text-xs text-zinc-400">{timeAgo(a.at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-zinc-950">Project team</h2>
          <p className="mt-0.5 text-xs text-zinc-400">Members working on this project</p>
          <div className="mt-5 space-y-3">
            {memberIds.map((id, i) => (
              <div key={id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                  {initialsOf(memberName(id))}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800">{memberName(id)}</p>
                  <p className="text-xs text-zinc-400">{i === 0 ? "Owner" : "Project member"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Layers3 size={18} />
              <p className="text-sm font-medium">Current sprint</p>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-zinc-950">{currentSprint ? currentSprint.name : "No sprint yet"}</h2>
            {currentSprint && (
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                <CalendarDays size={15} />
                {currentSprint.endDate
                  ? left >= 0 ? `Ends in ${left} day${left === 1 ? "" : "s"}` : `Ended ${-left} day${left === -1 ? "" : "s"} ago`
                  : "No end date"}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link to="/sprints" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              View sprints <ArrowUpRight size={15} />
            </Link>
            <Link to={`/projects/${projectId}/tasks`} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              Open tasks <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-5">
          <div><p className="text-xs text-zinc-400">Completed</p><p className="mt-1 text-xl font-semibold text-zinc-950">{stats.completed}</p></div>
          <div><p className="text-xs text-zinc-400">In progress</p><p className="mt-1 text-xl font-semibold text-zinc-950">{stats.inProgress}</p></div>
          <div><p className="text-xs text-zinc-400">To do</p><p className="mt-1 text-xl font-semibold text-zinc-950">{stats.todo}</p></div>
        </div>
      </section>

      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"><CheckCircle2 size={18} /></div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-950">
            {stats.total === 0 ? "No tasks yet" : stats.progress === 100 ? "All tasks completed" : `${stats.total - stats.completed} task${stats.total - stats.completed === 1 ? "" : "s"} still open`}
          </p>
          <p className="text-xs text-zinc-400">{bundle.meetings.length} meeting{bundle.meetings.length === 1 ? "" : "s"} scheduled</p>
        </div>
        <Users size={17} className="text-zinc-400" />
      </div>
    </div>
  );
}

export default ProjectWorkspace;
