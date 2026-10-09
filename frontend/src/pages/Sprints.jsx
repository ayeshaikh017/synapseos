import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, Layers3, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { sprintApi, taskApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import {
  ConfirmDelete,
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  Modal,
  NeedProject,
  PageHeader,
  PrimaryButton,
  ProjectPicker,
  SecondaryButton,
  inputClass,
} from "../components/ui";
import { daysLeft, errMsg, fmtDate, taskStats, toDateInput } from "../utils/format";

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${status === "active" ? "bg-zinc-900 text-white" : status === "completed" ? "bg-zinc-100 text-zinc-600" : "border border-zinc-200 bg-white text-zinc-500"}`}>
      {status}
    </span>
  );
}

function SprintForm({ sprint, projectId, onClose, onSaved }) {
  const [name, setName] = useState(sprint?.name || "");
  const [goal, setGoal] = useState(sprint?.goal || "");
  const [status, setStatus] = useState(sprint?.status || "planned");
  const [startDate, setStartDate] = useState(toDateInput(sprint?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(sprint?.endDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return setError("Sprint name is required");
    if (startDate && endDate && endDate < startDate) return setError("End date must not be before start date");

    const payload = { name: name.trim(), goal: goal.trim(), status };
    payload.startDate = startDate || null;
    payload.endDate = endDate || null;

    setSaving(true);
    setError("");
    try {
      if (sprint) await sprintApi.update(sprint._id, payload);
      else await sprintApi.create(projectId, payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err, "Could not save sprint"));
      setSaving(false);
    }
  };

  return (
    <Modal title={sprint ? "Edit sprint" : "Create sprint"} subtitle="Plan a time-boxed block of work." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <ErrorBanner message={error} />
        <Field label="Sprint name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Sprint 04" /></Field>
        <Field label="Goal"><textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="What should this sprint achieve?" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Start"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} /></Field>
          <Field label="End"><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} /></Field>
        </div>
        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : sprint ? "Save changes" : "Create sprint"}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function Sprints() {
  const { activeProjectId, loading: projectsLoading } = useProjects();
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError("");
    try {
      const [s, t] = await Promise.all([sprintApi.list(activeProjectId), taskApi.list(activeProjectId).catch(() => ({ tasks: [] }))]);
      setSprints(s.sprints || []);
      setTasks(t.tasks || []);
    } catch (err) {
      setError(errMsg(err, "Could not load sprints"));
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await sprintApi.remove(deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(errMsg(err, "Could not delete sprint"));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const quickStatus = async (sprint, status) => {
    try {
      await sprintApi.update(sprint._id, { status });
      await load();
    } catch (err) {
      setError(errMsg(err, "Could not update sprint"));
    }
  };

  const current = sprints.find((s) => s.status === "active");
  const stats = taskStats(tasks);
  const left = current ? daysLeft(current.endDate) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Sprint planning"
        text="Plan sprint goals, monitor progress and keep project work moving."
        actions={activeProjectId && (<><ProjectPicker /><PrimaryButton onClick={() => setEditing("new")}><Plus size={16} />New sprint</PrimaryButton></>)}
      />

      {!activeProjectId ? <NeedProject loading={projectsLoading} /> : (
        <>
          <ErrorBanner message={error} onRetry={load} />

          {loading && sprints.length === 0 ? <Loading label="Loading sprints..." /> : (
            <>
              {current && (
                <section className="rounded-xl border border-zinc-900 bg-zinc-900 p-6 text-white">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Current sprint</span>
                        {left !== null && <span className="text-zinc-400">{left >= 0 ? `Ends in ${left} day${left === 1 ? "" : "s"}` : `Ended ${-left} day${left === -1 ? "" : "s"} ago`}</span>}
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold">{current.name}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{fmtDate(current.startDate)} — {fmtDate(current.endDate)}</p>
                      {current.goal && <p className="mt-3 max-w-xl text-sm text-zinc-300">{current.goal}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div><p className="text-xs text-zinc-400">Completed</p><p className="mt-1 text-2xl font-semibold">{stats.completed}</p></div>
                      <div><p className="text-xs text-zinc-400">In progress</p><p className="mt-1 text-2xl font-semibold">{stats.inProgress}</p></div>
                      <div><p className="text-xs text-zinc-400">To do</p><p className="mt-1 text-2xl font-semibold">{stats.todo}</p></div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-zinc-400"><span>Project task progress</span><span>{stats.progress}%</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{ width: `${stats.progress}%` }} /></div>
                  </div>
                </section>
              )}

              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">Sprint history</h2>
                  <p className="text-xs text-zinc-400">All sprints in this project.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Clock3 size={14} />{sprints.length} total</div>
              </div>

              {sprints.length === 0 ? (
                <EmptyState icon={Layers3} title="No sprints yet" text="Create the first sprint for this project." action={<PrimaryButton onClick={() => setEditing("new")}><Plus size={16} />New sprint</PrimaryButton>} />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {sprints.map((sprint) => (
                    <div key={sprint._id} className="rounded-xl border border-zinc-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Layers3 size={17} className="text-zinc-500" />
                            <h3 className="text-base font-semibold text-zinc-950">{sprint.name}</h3>
                            <StatusBadge status={sprint.status} />
                          </div>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400"><CalendarDays size={14} />{fmtDate(sprint.startDate)} — {fmtDate(sprint.endDate)}</div>
                        </div>
                        <div className="flex">
                          <button type="button" onClick={() => setEditing(sprint)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><Pencil size={15} /></button>
                          <button type="button" onClick={() => setDeleting(sprint)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-zinc-600">{sprint.goal || <span className="text-zinc-400">No goal set.</span>}</p>
                      <div className="mt-5 flex gap-2 border-t border-zinc-100 pt-4">
                        {sprint.status === "planned" && <SecondaryButton className="!px-3 !py-1.5 text-xs" onClick={() => quickStatus(sprint, "active")}>Start sprint</SecondaryButton>}
                        {sprint.status === "active" && <PrimaryButton className="!px-3 !py-1.5 text-xs" onClick={() => quickStatus(sprint, "completed")}>Complete sprint</PrimaryButton>}
                        {sprint.status === "completed" && <SecondaryButton className="!px-3 !py-1.5 text-xs" onClick={() => quickStatus(sprint, "active")}>Reopen</SecondaryButton>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"><Target size={18} /></div>
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{current ? `${current.name} is in progress` : "No active sprint"}</p>
                  <p className="text-xs text-zinc-400">The project has {stats.total - stats.completed} open task{stats.total - stats.completed === 1 ? "" : "s"}.</p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {editing && <SprintForm sprint={editing === "new" ? null : editing} projectId={activeProjectId} onClose={() => setEditing(null)} onSaved={load} />}
      {deleting && <ConfirmDelete what={deleting.name} busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

export default Sprints;
