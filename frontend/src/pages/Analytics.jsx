import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  ListTodo,
  Timer,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { analyticsApi } from "../api/analyticsApi";
import { projectApi } from "../api/projectApi";

/* ------------------------------------------------------------------ */
/* Look & feel                                                         */
/* ------------------------------------------------------------------ */

// Fixed categorical order. A person keeps the same colour in every chart.
const PALETTE = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];
const NEUTRAL = "#a1a1aa";
const GRID = "#eeeef0";
const AXIS = { fontSize: 12, fill: "#71717a" };

const RANGES = [
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
  { value: "all", label: "All" },
];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e4e4e7",
  boxShadow: "0 8px 24px rgba(0,0,0,.08)",
  fontSize: 12,
};

const short = (value, max = 12) =>
  String(value).length > max ? `${String(value).slice(0, max - 1)}…` : value;

const initials = (name = "?") => {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const formatDay = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Card({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white p-5 ${className}`}
    >
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
      {message}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, detail, danger }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${
          danger ? "text-red-600" : "text-zinc-950"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{detail}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-zinc-100" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-96 rounded-xl bg-zinc-100" />
        <div className="h-96 rounded-xl bg-zinc-100 xl:col-span-2" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [range, setRange] = useState("30");

  const [projectsState, setProjectsState] = useState({
    loaded: false,
    projects: [],
    error: "",
  });
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  // 1) projects for the selector
  useEffect(() => {
    let cancelled = false;
    projectApi
      .getProjects()
      .then((res) => {
        if (!cancelled)
          setProjectsState({
            loaded: true,
            projects: res?.data?.projects || [],
            error: "",
          });
      })
      .catch((err) => {
        if (!cancelled)
          setProjectsState({
            loaded: true,
            projects: [],
            error: err.response?.data?.message || "Could not load projects",
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { projects } = projectsState;
  const wanted = searchParams.get("project");
  const projectId = projects.some((p) => p._id === wanted)
    ? wanted
    : projects[0]?._id || "";

  // 2) analytics for the selected project + range
  const key = `${projectId}|${range}`;
  useEffect(() => {
    if (!projectId) return undefined;
    let cancelled = false;
    analyticsApi
      .getProjectAnalytics(projectId, range)
      .then((res) => {
        if (!cancelled)
          setResult({ key, data: res?.data?.analytics || null, error: "" });
      })
      .catch((err) => {
        if (!cancelled)
          setResult({
            key,
            data: null,
            error:
              err.response?.data?.message || "Could not load analytics",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, range, key]);

  const loading = Boolean(projectId) && result.key !== key;
  const analytics = result.key === key ? result.data : null;
  const error = result.key === key ? result.error : "";

  /* ---------- derived data ---------- */
  const members = analytics?.members || [];

  const colors = {};
  [...members]
    .sort((a, b) => (a.userId < b.userId ? -1 : 1))
    .forEach((m, i) => {
      colors[m.userId] = PALETTE[i] || NEUTRAL;
    });

  const contributors = members.filter((m) => m.score > 0);
  const withTasks = members.filter((m) => m.tasks.total > 0);
  const withCompleted = members.filter((m) => m.tasks.completed > 0);
  const withDocsMeet = members.filter(
    (m) =>
      m.documents.created +
        m.documents.edited +
        m.meetings.organized +
        m.meetings.attended >
      0
  );
  const topMembers = contributors.slice(0, 5);

  const buildRadar = () => {
    if (!topMembers.length) return [];
    const axes = [
      ["Tasks done", (m) => m.tasks.completed, true],
      ["High priority", (m) => m.tasks.completedByPriority.high, true],
      ["Docs", (m) => m.documents.created + m.documents.edited, true],
      ["Meetings", (m) => m.meetings.organized + m.meetings.attended, true],
      ["On-time %", (m) => m.onTimeRate, false],
      ["Completion %", (m) => m.completionRate, false],
    ];
    return axes.map(([axis, pick, relative]) => {
      const max = relative ? Math.max(1, ...topMembers.map(pick)) : 100;
      const row = { axis };
      topMembers.forEach((m, i) => {
        row[`m${i}`] = Math.round((pick(m) / max) * 100);
      });
      return row;
    });
  };
  const radar = buildRadar();

  /* ---------- actions ---------- */
  const changeProject = (id) => setSearchParams({ project: id });

  const exportCsv = () => {
    if (!analytics) return;
    const header = [
      "Rank", "Member", "Email", "Score", "Share %", "Tasks total",
      "Completed", "In progress", "To do", "Overdue", "Completion %",
      "On-time %", "Docs created", "Docs edited", "Meetings organised",
      "Meetings attended",
    ];
    const rows = members.map((m) => [
      m.rank, m.name, m.email, m.score, m.sharePercent, m.tasks.total,
      m.tasks.completed, m.tasks.inProgress, m.tasks.todo, m.tasks.overdue,
      m.completionRate, m.onTimeRate, m.documents.created, m.documents.edited,
      m.meetings.organized, m.meetings.attended,
    ]);
    const cell = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // neutralise spreadsheet formulas
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${analytics.project.name.replace(/[^\w-]+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- render ---------- */
  const s = analytics?.summary;
  const notes = [];
  if (analytics) {
    if (!s.totalTasks && !s.documents && !s.meetings)
      notes.push("No activity in this date range yet.");
    if (analytics.unassigned?.tasks.total)
      notes.push(
        `${analytics.unassigned.tasks.total} task(s) have no assignee and are not credited to anyone.`
      );
    if (analytics.github && analytics.github.contributors === null)
      notes.push("GitHub contributor data is unavailable right now.");
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Insights</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Team analytics
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Who contributed what — tasks, documents and meetings, scored and
            compared.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectId}
            onChange={(e) => changeProject(e.target.value)}
            disabled={!projects.length}
            aria-label="Project"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 outline-none focus:border-zinc-400"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <div
            className="flex rounded-lg border border-zinc-200 bg-white p-1"
            role="group"
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  range === r.value
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={!analytics}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* States */}
      {!projectsState.loaded && <Skeleton />}

      {projectsState.loaded && projectsState.error && (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {projectsState.error}
        </p>
      )}

      {projectsState.loaded && !projectsState.error && !projects.length && (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          Create a project first — analytics appear once your team starts
          working in it.
        </div>
      )}

      {loading && <Skeleton />}

      {error && (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {analytics && (
        <>
          {notes.length > 0 && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{notes.join(" ")}</span>
            </div>
          )}

          {/* KPIs */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <Kpi
              icon={ListTodo}
              label="Tasks"
              value={s.totalTasks}
              detail={`${s.completedTasks} completed`}
            />
            <Kpi
              icon={CheckCircle2}
              label="Completion rate"
              value={`${s.completionRate}%`}
              detail="of all tasks"
            />
            <Kpi
              icon={AlertTriangle}
              label="Overdue"
              value={s.overdueTasks}
              detail={s.overdueTasks ? "need attention" : "all on track"}
              danger={s.overdueTasks > 0}
            />
            <Kpi
              icon={Timer}
              label="On-time delivery"
              value={`${s.onTimeRate}%`}
              detail="of tasks with a due date"
            />
            <Kpi
              icon={Users}
              label="Active contributors"
              value={s.activeContributors}
              detail={`of ${s.totalMembers} members`}
            />
            <Kpi
              icon={FileText}
              label="Docs & meetings"
              value={s.documents + s.meetings}
              detail={`${s.documents} docs · ${s.meetings} meetings`}
            />
          </div>

          {/* Share + leaderboard */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.7fr]">
            <Card
              title="Contribution share"
              subtitle="Share of total score per member"
            >
              {contributors.length ? (
                <>
                  <div className="relative h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contributors}
                          dataKey="score"
                          nameKey="name"
                          innerRadius="64%"
                          outerRadius="96%"
                          paddingAngle={2}
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {contributors.map((m) => (
                            <Cell key={m.userId} fill={colors[m.userId]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v, n) => [`${v} pts`, n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-semibold tracking-tight text-zinc-950">
                        {s.totalScore}
                      </span>
                      <span className="text-xs text-zinc-400">total points</span>
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {contributors.map((m) => (
                      <li
                        key={m.userId}
                        className="flex items-center gap-1.5 text-xs text-zinc-600"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: colors[m.userId] }}
                        />
                        {m.name} · {m.sharePercent}%
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyChart message="No contributions yet" />
              )}
            </Card>

            <Card
              title="Leaderboard"
              subtitle="Score = weighted tasks, documents and meetings"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                      <th className="w-10 py-2 text-center font-medium">#</th>
                      <th className="py-2 text-left font-medium">Member</th>
                      <th className="px-2 py-2 text-right font-medium">Score</th>
                      <th className="px-2 py-2 text-right font-medium">Share</th>
                      <th className="px-2 py-2 text-right font-medium">Tasks done</th>
                      <th className="px-2 py-2 text-right font-medium">On-time</th>
                      <th className="px-2 py-2 text-right font-medium">Docs</th>
                      <th className="px-2 py-2 text-right font-medium">Meetings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {members.map((m) => {
                      const max = Math.max(1, ...members.map((x) => x.score));
                      const b = m.scoreBreakdown;
                      return (
                        <tr key={m.userId}>
                          <td className="py-3 text-center">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                m.rank === 1 && m.score > 0
                                  ? "bg-zinc-900 text-white"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {m.rank}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                                style={{ background: colors[m.userId] }}
                              >
                                {initials(m.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-zinc-900">
                                  {m.name}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {m.projectRole === "owner"
                                    ? "Owner"
                                    : m.projectRole === "former"
                                    ? "Former member"
                                    : "Member"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div
                              className="flex items-center justify-end gap-2"
                              title={`Tasks ${b.tasks} · Docs ${b.documents} · Meetings ${b.meetings}`}
                            >
                              <div className="flex h-1.5 w-20 gap-0.5 overflow-hidden rounded-full bg-zinc-100">
                                <i
                                  style={{
                                    width: `${(b.tasks / max) * 100}%`,
                                    background: PALETTE[0],
                                  }}
                                />
                                <i
                                  style={{
                                    width: `${(b.documents / max) * 100}%`,
                                    background: PALETTE[3],
                                  }}
                                />
                                <i
                                  style={{
                                    width: `${(b.meetings / max) * 100}%`,
                                    background: PALETTE[6],
                                  }}
                                />
                              </div>
                              <span className="w-8 text-right font-semibold text-zinc-900">
                                {m.score}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-right text-zinc-600">
                            {m.sharePercent}%
                          </td>
                          <td className="px-2 py-3 text-right text-zinc-600">
                            {m.tasks.completed} / {m.tasks.total}
                          </td>
                          <td className="px-2 py-3 text-right">
                            {m.tasks.completedWithDueDate ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  m.onTimeRate >= 80
                                    ? "bg-emerald-50 text-emerald-700"
                                    : m.onTimeRate < 50
                                    ? "bg-red-50 text-red-700"
                                    : "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                {m.onTimeRate}%
                              </span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-right text-zinc-600">
                            {m.documents.created + m.documents.edited}
                          </td>
                          <td className="px-2 py-3 text-right text-zinc-600">
                            {m.meetings.organized + m.meetings.attended}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                {[
                  ["Tasks", PALETTE[0]],
                  ["Documents", PALETTE[3]],
                  ["Meetings", PALETTE[6]],
                ].map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: color }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Task delivery + timeline */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card
              title="Task delivery by member"
              subtitle="Completed, in progress and to do — per assignee"
            >
              {withTasks.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={withTasks}
                      layout="vertical"
                      margin={{ left: 8, right: 8 }}
                    >
                      <CartesianGrid horizontal={false} stroke={GRID} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={AXIS}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={92}
                        tick={AXIS}
                        tickFormatter={(v) => short(v)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ fill: "#f4f4f5" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar
                        name="Completed"
                        dataKey="tasks.completed"
                        stackId="t"
                        fill="#1baf7a"
                        stroke="#fff"
                        strokeWidth={2}
                        barSize={20}
                      />
                      <Bar
                        name="In progress"
                        dataKey="tasks.inProgress"
                        stackId="t"
                        fill="#2a78d6"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                      <Bar
                        name="To do"
                        dataKey="tasks.todo"
                        stackId="t"
                        fill={NEUTRAL}
                        stroke="#fff"
                        strokeWidth={2}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No assigned tasks in this range" />
              )}
            </Card>

            <Card
              title="Activity over time"
              subtitle="Tasks created vs completed, plus documents and meetings"
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.timeline}
                    margin={{ left: -16, right: 8, top: 4 }}
                  >
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDay}
                      tick={AXIS}
                      minTickGap={36}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={AXIS}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={formatDay}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Line name="Tasks created" dataKey="tasksCreated" type="monotone" stroke={PALETTE[0]} strokeWidth={2} dot={false} />
                    <Line name="Tasks completed" dataKey="tasksCompleted" type="monotone" stroke="#1baf7a" strokeWidth={2} dot={false} />
                    <Line name="Documents" dataKey="documents" type="monotone" stroke={PALETTE[3]} strokeWidth={2} dot={false} />
                    <Line name="Meetings" dataKey="meetings" type="monotone" stroke={PALETTE[6]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Radar + priority + docs/meetings */}
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Card
              title="Contribution profile"
              subtitle="Top members, each axis scaled to the team's best (0–100)"
            >
              {topMembers.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radar} outerRadius="68%">
                      <PolarGrid stroke={GRID} />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#71717a" }} />
                      {topMembers.map((m, i) => (
                        <Radar
                          key={m.userId}
                          name={m.name}
                          dataKey={`m${i}`}
                          stroke={colors[m.userId]}
                          fill={colors[m.userId]}
                          fillOpacity={0.12}
                          strokeWidth={2}
                        />
                      ))}
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="Not enough data" />
              )}
            </Card>

            <Card
              title="Completed by priority"
              subtitle="High-priority work carries more points"
            >
              {withCompleted.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={withCompleted} margin={{ left: -16, right: 8 }}>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="name" tickFormatter={(v) => short(v, 9)} tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f4f4f5" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar name="Low" dataKey="tasks.completedByPriority.low" stackId="p" fill="#9ec5f4" stroke="#fff" strokeWidth={2} barSize={30} />
                      <Bar name="Medium" dataKey="tasks.completedByPriority.medium" stackId="p" fill="#2a78d6" stroke="#fff" strokeWidth={2} />
                      <Bar name="High" dataKey="tasks.completedByPriority.high" stackId="p" fill="#104281" stroke="#fff" strokeWidth={2} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No completed tasks yet" />
              )}
            </Card>

            <Card
              title="Docs & meetings"
              subtitle="Documents authored / edited, meetings organised / attended"
            >
              {withDocsMeet.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={withDocsMeet} margin={{ left: -16, right: 8 }}>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="name" tickFormatter={(v) => short(v, 9)} tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f4f4f5" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar name="Docs created" dataKey="documents.created" fill={PALETTE[3]} radius={[4, 4, 0, 0]} maxBarSize={14} />
                      <Bar name="Docs edited" dataKey="documents.edited" fill={PALETTE[6]} radius={[4, 4, 0, 0]} maxBarSize={14} />
                      <Bar name="Meetings organised" dataKey="meetings.organized" fill={PALETTE[2]} radius={[4, 4, 0, 0]} maxBarSize={14} />
                      <Bar name="Meetings attended" dataKey="meetings.attended" fill={PALETTE[0]} radius={[4, 4, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No documents or meetings yet" />
              )}
            </Card>
          </div>

          {/* GitHub */}
          {analytics.github?.contributors?.length > 0 && (
            <Card
              className="mt-6"
              title="GitHub commits by contributor"
              subtitle={`${analytics.github.repository} · all-time commits (GitHub usernames, not matched to SynapseOS users)`}
            >
              <div style={{ height: Math.max(160, analytics.github.contributors.length * 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.github.contributors} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="login" width={110} tick={AXIS} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f4f4f5" }} />
                    <Bar name="Commits" dataKey="commits" fill={PALETTE[0]} radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Scoring */}
          <Card
            className="mt-6"
            title="How the score is calculated"
            subtitle="Task completion time uses the task's last update (there is no completedAt field), so on-time % is an estimate."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {[
                ["Task completed", `${analytics.scoring.taskCompleted.low} / ${analytics.scoring.taskCompleted.medium} / ${analytics.scoring.taskCompleted.high}`, "low / medium / high"],
                ["Task in progress", analytics.scoring.taskInProgress, "per task"],
                ["Document created", analytics.scoring.documentCreated, "per document"],
                ["Document edited", analytics.scoring.documentEdited, "if not the author"],
                ["Meeting organised", analytics.scoring.meetingOrganized, "per meeting"],
                ["Meeting attended", analytics.scoring.meetingAttended, "as participant"],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{value}</p>
                  <p className="text-xs text-zinc-400">{detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default Analytics;
