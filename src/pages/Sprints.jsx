import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TriangleAlert,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  Layers3,
  Play,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";

import { sprintApi } from "../api/sprintApi";
import { taskApi } from "../api/taskApi";
import Markdownish from "../components/Markdownish";
import Modal from "../components/Modal";
import ProjectPicker from "../components/ProjectPicker";
import { errorText, useProjectSelection } from "../hooks/useProjectSelection";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

const fmt = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "Not set";

const dateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const daysLeft = (sprint) => {
  if (!sprint.endDate) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Math.ceil((new Date(sprint.endDate) - today) / 86400000);
};

const STATUS_LABEL = { planned: "Planned", active: "Active", completed: "Completed" };

function StatusBadge({ status }) {
  const styles =
    status === "active"
      ? "bg-zinc-900 text-white"
      : status === "planned"
        ? "border border-zinc-200 bg-white text-zinc-600"
        : "bg-zinc-100 text-zinc-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${styles}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

/* ---------- New sprint modal ---------- */

function NewSprintModal({ projectId, suggestedName, onClose, onCreated }) {
  const today = new Date();
  const inTwoWeeks = new Date(Date.now() + 14 * 86400000);

  const [name, setName] = useState(suggestedName);
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(dateInput(today));
  const [endDate, setEndDate] = useState(dateInput(inTwoWeeks));
  const [status, setStatus] = useState("planned");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) return setError("Please enter a sprint name.");
    if (startDate && endDate && endDate < startDate) {
      return setError("End date cannot be before the start date.");
    }

    setSaving(true);
    try {
      const result = await sprintApi.createSprint(projectId, {
        name: name.trim(),
        goal: goal.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
      });
      onCreated(result.data.sprint);
    } catch (err) {
      setError(errorText(err, "Could not create the sprint."));
      setSaving(false);
    }
  };

  return (
    <Modal title="New sprint" subtitle="Plan a time-boxed block of work." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Sprint name">
          <input
            autoFocus
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </Field>

        <Field label="Goal (optional)">
          <textarea
            rows={3}
            className={inputClass}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What should this sprint achieve?"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Start date">
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End date">
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
            </select>
          </Field>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create sprint"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Open sprint: choose its tasks ---------- */

function SprintTasksModal({ sprint, tasks, onClose, onSaved }) {
  const [selected, setSelected] = useState(() =>
    tasks.filter((t) => String(t.sprint || "") === sprint._id).map((t) => t._id)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await sprintApi.setSprintTasks(sprint._id, selected);
      onSaved();
    } catch (err) {
      setError(errorText(err, "Could not update sprint tasks."));
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={sprint.name}
      subtitle={`${fmt(sprint.startDate)} — ${fmt(sprint.endDate)}`}
      onClose={onClose}
    >
      {sprint.goal && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Goal</p>
          <p className="mt-1.5 text-sm leading-6 text-zinc-600">{sprint.goal}</p>
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Tasks in this sprint ({selected.length})
      </p>

      {tasks.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-500">
          This project has no tasks yet. Create tasks first, then add them here.
        </p>
      ) : (
        <div className="mt-3 max-h-80 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200">
          {tasks.map((task) => {
            const elsewhere = task.sprint && String(task.sprint) !== sprint._id;
            return (
              <label key={task._id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={selected.includes(task._id)}
                  onChange={() => toggle(task._id)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${task.status === "completed" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                    {task.title}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {task.status.replace("_", " ")} · {task.priority} priority
                    {elsewhere ? " · in another sprint (will be moved)" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || tasks.length === 0}
          onClick={save}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save sprint tasks"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Sprint card ---------- */

function SprintCard({ sprint, onOpen, onStatus, onDelete }) {
  const s = sprint.stats;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Layers3 size={17} className="text-zinc-500" />
              <h2 className="text-base font-semibold text-zinc-950">{sprint.name}</h2>
              <StatusBadge status={sprint.status} />
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <CalendarDays size={14} />
              {fmt(sprint.startDate)} — {fmt(sprint.endDate)}
            </div>
          </div>

          <button
            type="button"
            title="Delete sprint"
            onClick={() => onDelete(sprint)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-zinc-500">Sprint progress</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{s.progress}%</p>
          </div>
          <span className="text-xs text-zinc-400">
            {s.completed} of {s.total} task{s.total === 1 ? "" : "s"} done
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${s.progress}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-100 border-t border-zinc-100 pt-4">
          <div>
            <p className="text-xs text-zinc-400">Completed</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">{s.completed}</p>
          </div>
          <div className="pl-4">
            <p className="text-xs text-zinc-400">In progress</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">{s.inProgress}</p>
          </div>
          <div className="pl-4">
            <p className="text-xs text-zinc-400">To do</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">{s.todo}</p>
          </div>
        </div>

        {sprint.goal && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sprint goal</p>
            <p className="mt-2 flex gap-2 text-sm leading-6 text-zinc-700">
              <Target size={16} className="mt-1 shrink-0 text-zinc-500" />
              {sprint.goal}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onOpen(sprint)}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-950"
          >
            Open sprint
            <ArrowRight size={15} />
          </button>

          {sprint.status === "planned" && (
            <button
              type="button"
              onClick={() => onStatus(sprint, "active")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <Play size={12} />
              Start sprint
            </button>
          )}
          {sprint.status === "active" && (
            <button
              type="button"
              onClick={() => onStatus(sprint, "completed")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <CheckCircle2 size={13} />
              Complete sprint
            </button>
          )}
          {sprint.status === "completed" && (
            <button
              type="button"
              onClick={() => onStatus(sprint, "active")}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- AI planning insight ---------- */

function InsightIcon({ level }) {
  if (level === "warning") return <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />;
  if (level === "ok") return <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />;
  return <Info size={15} className="mt-0.5 shrink-0 text-zinc-400" />;
}

function InsightPanel({ insight, loading, aiLoading, error, onGenerateAi, onReview }) {
  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
            <Sparkles size={18} className="text-zinc-700" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-950">AI planning insight</p>

            {loading && !insight ? (
              <p className="mt-1 text-sm text-zinc-500">Analyzing your project...</p>
            ) : error && !insight ? (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            ) : insight ? (
              <>
                <ul className="mt-2 space-y-2">
                  {insight.insights.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm leading-6 text-zinc-600">
                      <InsightIcon level={item.level} />
                      <span>
                        {item.text}
                        {item.tasks?.length > 0 && (
                          <span className="block text-xs text-zinc-400">
                            {item.tasks.join(" · ")}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {insight.ai?.text && (
                  <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Gemini recommendation
                    </p>
                    <Markdownish text={insight.ai.text} />
                  </div>
                )}

                {insight.ai?.error && (
                  <p className="mt-3 text-xs text-amber-700">{insight.ai.error}</p>
                )}
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 self-start">
          <button
            type="button"
            onClick={onGenerateAi}
            disabled={aiLoading || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <Sparkles size={14} />
            {aiLoading ? "Thinking..." : insight?.ai?.text ? "Refresh AI insight" : "Generate AI insight"}
          </button>

          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Review tasks
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

function Sprints() {
  const navigate = useNavigate();
  const { projects, projectId, setProjectId, loading, error } = useProjectSelection();

  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState("");
  const [toast, setToast] = useState("");

  const loadInsight = useCallback(async () => {
    if (!projectId) return;
    setInsightLoading(true);
    setInsightError("");
    try {
      const result = await sprintApi.getInsight(projectId, false);
      setInsight((current) => ({ ...result.data, ai: current?.ai?.text ? current.ai : result.data.ai }));
    } catch (err) {
      setInsightError(errorText(err, "Could not load planning insight."));
    } finally {
      setInsightLoading(false);
    }
  }, [projectId]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setDataLoading(true);
    setDataError("");
    try {
      const [sprintResult, taskResult] = await Promise.all([
        sprintApi.getProjectSprints(projectId),
        taskApi.getProjectTasks(projectId),
      ]);
      setSprints(sprintResult.data?.sprints || []);
      setTasks(taskResult.data?.tasks || []);
    } catch (err) {
      setDataError(errorText(err, "Could not load sprints."));
    } finally {
      setDataLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setInsight(null);
    load();
    loadInsight();
  }, [load, loadInsight]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const generateAi = async () => {
    setAiLoading(true);
    setInsightError("");
    try {
      const result = await sprintApi.getInsight(projectId, true);
      setInsight(result.data);
    } catch (err) {
      setInsightError(errorText(err, "Could not generate the AI insight."));
    } finally {
      setAiLoading(false);
    }
  };

  const current = useMemo(
    () => sprints.find((s) => s.status === "active") || null,
    [sprints]
  );

  const suggestedName = `Sprint ${String(sprints.length + 1).padStart(2, "0")}`;

  const changeStatus = async (sprint, status) => {
    try {
      await sprintApi.updateSprint(sprint._id, { status });
      setToast(`${sprint.name} is now ${STATUS_LABEL[status].toLowerCase()}.`);
      await Promise.all([load(), loadInsight()]);
    } catch (err) {
      setToast(errorText(err, "Could not update the sprint."));
    }
  };

  const removeSprint = async (sprint) => {
    if (!window.confirm(`Delete "${sprint.name}"? Its tasks stay in the project but leave the sprint.`)) return;
    try {
      await sprintApi.deleteSprint(sprint._id);
      setToast("Sprint deleted.");
      await Promise.all([load(), loadInsight()]);
    } catch (err) {
      setToast(errorText(err, "Could not delete the sprint."));
    }
  };

  const openSprint = sprints.find((s) => s._id === openId) || null;
  const left = current ? daysLeft(current) : null;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">Sprint planning</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Plan sprint goals, monitor progress and keep project work moving.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProjectPicker projects={projects} projectId={projectId} onChange={setProjectId} />

          <button
            type="button"
            disabled={!projectId}
            onClick={() => setShowNew(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus size={16} />
            New sprint
          </button>
        </div>
      </div>

      {toast && (
        <p className="mt-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">{toast}</p>
      )}
      {(error || dataError) && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || dataError}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-zinc-500">Loading...</p>
      ) : projects.length === 0 && !error ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-800">Create a project first</p>
          <p className="mt-1 text-sm text-zinc-500">Sprints belong to a project. Create one from the Projects page.</p>
        </div>
      ) : (
        <>
          {current ? (
            <section className="mt-8 rounded-xl border border-zinc-200 bg-white">
              <div className="p-6 lg:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Current sprint
                      </span>
                      {left !== null && (
                        <span className="text-xs text-zinc-400">
                          {left > 0 ? `Ends in ${left} day${left === 1 ? "" : "s"}` : left === 0 ? "Ends today" : `Ended ${Math.abs(left)} day(s) ago`}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{current.name}</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {fmt(current.startDate)} — {fmt(current.endDate)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[
                      ["Completed", current.stats.completed],
                      ["In progress", current.stats.inProgress],
                      ["To do", current.stats.todo],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-zinc-200 px-4 py-3">
                        <p className="text-xs text-zinc-400">{label}</p>
                        <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-7">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700">Overall progress</p>
                    <p className="text-sm font-semibold text-zinc-950">{current.stats.progress}%</p>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all"
                      style={{ width: `${current.stats.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : (
            !dataLoading && (
              <section className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
                <p className="text-sm font-medium text-zinc-800">No active sprint</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {sprints.length ? 'Click "Start sprint" on a planned sprint below.' : 'Click "New sprint" to create your first sprint.'}
                </p>
              </section>
            )
          )}

          <InsightPanel
            insight={insight}
            loading={insightLoading}
            aiLoading={aiLoading}
            error={insightError}
            onGenerateAi={generateAi}
            onReview={() => navigate(`/projects/${projectId}/tasks`)}
          />

          <div className="mt-8 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">Sprint history</h2>
              <p className="mt-1 text-sm text-zinc-500">Previous and current project sprints.</p>
            </div>

            <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
              <Clock3 size={14} />
              {sprints.length} sprint{sprints.length === 1 ? "" : "s"}
            </div>
          </div>

          {dataLoading && sprints.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Loading sprints...</p>
          ) : sprints.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No sprints yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {sprints.map((sprint) => (
                <SprintCard
                  key={sprint._id}
                  sprint={sprint}
                  onOpen={(s) => setOpenId(s._id)}
                  onStatus={changeStatus}
                  onDelete={removeSprint}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showNew && (
        <NewSprintModal
          projectId={projectId}
          suggestedName={suggestedName}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            setToast("Sprint created.");
            load();
            loadInsight();
          }}
        />
      )}

      {openSprint && (
        <SprintTasksModal
          key={openSprint._id}
          sprint={openSprint}
          tasks={tasks}
          onClose={() => setOpenId("")}
          onSaved={() => {
            setOpenId("");
            setToast("Sprint tasks updated.");
            load();
            loadInsight();
          }}
        />
      )}
    </div>
  );
}

export default Sprints;
