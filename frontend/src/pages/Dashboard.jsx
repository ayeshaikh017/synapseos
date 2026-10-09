import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarDays, FolderKanban, Layers3, ListTodo, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loadProjectBundle } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectContext";
import { ErrorBanner, Loading } from "../components/ui";
import { fmtDateTime, initialsOf, taskStats, timeAgo } from "../utils/format";

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"><Icon size={18} strokeWidth={1.8} /></div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{detail}</p>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, activeProject, loading: projectsLoading, error } = useProjects();
  const [bundles, setBundles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectsLoading) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(projects.map(async (p) => [p._id, await loadProjectBundle(p._id)]));
      if (!cancelled) {
        setBundles(Object.fromEntries(entries));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projects, projectsLoading]);

  if (projectsLoading || loading) return <div className="mx-auto max-w-7xl"><Loading label="Loading workspace..." /></div>;

  const all = Object.values(bundles);
  const allTasks = all.flatMap((b) => b.tasks);
  const allSprints = all.flatMap((b) => b.sprints);
  const upcoming = all
    .flatMap((b) => b.meetings)
    .filter((m) => new Date(m.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const taskTotals = taskStats(allTasks);
  const activeCount = projects.filter((p) => p.status === "active").length;
  const activeSprints = allSprints.filter((s) => s.status === "active").length;

  const bundle = (activeProject && bundles[activeProject._id]) || { tasks: [], sprints: [], documents: [], meetings: [] };
  const stats = taskStats(bundle.tasks);
  const currentSprint = bundle.sprints.find((s) => s.status === "active");

  const activity = [
    ...bundle.tasks.map((t) => ({ key: `t${t._id}`, at: t.updatedAt, text: `Task "${t.title}" is ${t.status.replace("_", " ")}` })),
    ...bundle.documents.map((d) => ({ key: `d${d._id}`, at: d.updatedAt, text: `Document "${d.title}" updated` })),
    ...bundle.meetings.map((m) => ({ key: `m${m._id}`, at: m.updatedAt, text: `Meeting "${m.title}" scheduled` })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Workspace overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{greeting()}, {user?.name?.split(" ")[0] || "there"}.</h1>
          <p className="mt-2 text-sm text-zinc-500">Here's what's happening across your workspace.</p>
        </div>
        <button type="button" onClick={() => navigate("/projects")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          View projects<ArrowRight size={15} />
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Active projects" value={pad(activeCount)} detail={`${projects.length} total`} />
        <StatCard icon={ListTodo} label="Tasks" value={pad(taskTotals.total)} detail={`${taskTotals.completed} completed`} />
        <StatCard icon={Layers3} label="Sprints" value={pad(allSprints.length)} detail={`${activeSprints} active`} />
        <StatCard icon={CalendarDays} label="Upcoming meetings" value={pad(upcoming.length)} detail={upcoming[0] ? `Next: ${fmtDateTime(upcoming[0].scheduledAt)}` : "Nothing scheduled"} />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div><h2 className="text-base font-semibold text-zinc-950">Active project</h2><p className="text-xs text-zinc-400">Current project progress and team</p></div>
          {activeProject && <Link to={`/projects/${activeProject._id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-950">Open project<ArrowUpRight size={15} /></Link>}
        </div>

        {activeProject ? (
          <div className="mt-5 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 font-semibold text-white">{initialsOf(activeProject.name)[0]}</div>
                <div><h3 className="text-base font-semibold text-zinc-950">{activeProject.name}</h3><p className="text-xs capitalize text-zinc-400">{activeProject.status}</p></div>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-500">{activeProject.description || "No description yet."}</p>
              <div className="mt-5">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Project progress</span><span className="font-semibold text-zinc-950">{stats.progress}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-zinc-900" style={{ width: `${stats.progress}%` }} /></div>
                <p className="mt-2 text-xs text-zinc-400">{stats.completed} tasks completed · {stats.total - stats.completed} remaining</p>
              </div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600"><Users size={16} />{1 + (activeProject.members?.length || 0)} team member{activeProject.members?.length ? "s" : ""}</div>
              <div className="mt-4 space-y-3 text-sm">
                <div><p className="text-xs text-zinc-400">Current sprint</p><p className="font-semibold text-zinc-900">{currentSprint?.name || "None active"}</p></div>
                <div><p className="text-xs text-zinc-400">Documents</p><p className="font-semibold text-zinc-900">{bundle.documents.length}</p></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-zinc-500">No projects yet. <Link to="/projects" className="font-medium text-zinc-900 underline underline-offset-2">Create your first project</Link> to see it here.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 lg:col-span-3">
          <h2 className="text-base font-semibold text-zinc-950">Project activity</h2>
          <p className="text-xs text-zinc-400">Recent changes in your active project</p>
          <div className="mt-5 space-y-4">
            {activity.length === 0 && <p className="text-sm text-zinc-400">No activity yet.</p>}
            {activity.map((a) => (
              <div key={a.key} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
                <div><p className="text-sm text-zinc-700">{a.text}</p><p className="text-xs text-zinc-400">{timeAgo(a.at)}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div><h2 className="text-base font-semibold text-zinc-950">Upcoming meetings</h2><p className="text-xs text-zinc-400">Your next scheduled sessions</p></div>
            <CalendarDays size={18} className="text-zinc-400" />
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-zinc-400">No upcoming meetings.</p>}
            {upcoming.slice(0, 3).map((m) => (
              <div key={m._id} className="rounded-lg border border-zinc-100 p-4">
                <h3 className="text-sm font-semibold text-zinc-900">{m.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{fmtDateTime(m.scheduledAt)}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400"><Users size={14} />{(m.participants || []).length} participants</div>
              </div>
            ))}
          </div>
          <Link to="/meetings" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-950">View meetings<ArrowRight size={15} /></Link>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
