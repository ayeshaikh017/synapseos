import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Pencil, Plus, Trash2, Users, Video } from "lucide-react";
import { meetingApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
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
import { errMsg, fmtDateTime, toDateTimeInput } from "../utils/format";

function MeetingForm({ meeting, projectId, people, onClose, onSaved }) {
  const [title, setTitle] = useState(meeting?.title || "");
  const [description, setDescription] = useState(meeting?.description || "");
  const [scheduledAt, setScheduledAt] = useState(toDateTimeInput(meeting?.scheduledAt));
  const [meetingLink, setMeetingLink] = useState(meeting?.meetingLink || "");
  const [notes, setNotes] = useState(meeting?.notes || "");
  const [participants, setParticipants] = useState(meeting?.participants || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) =>
    setParticipants((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return setError("Meeting title is required");
    if (!scheduledAt) return setError("Please choose a date and time");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      meetingLink: meetingLink.trim(),
      notes,
      participants,
    };

    setSaving(true);
    setError("");
    try {
      if (meeting) await meetingApi.update(meeting._id, payload);
      else await meetingApi.create(projectId, payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err, "Could not save meeting"));
      setSaving(false);
    }
  };

  return (
    <Modal title={meeting ? "Edit meeting" : "Schedule meeting"} subtitle="Participants are notified when added." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <ErrorBanner message={error} />
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Sprint planning" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date & time"><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} /></Field>
          <Field label="Meeting link"><input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className={inputClass} placeholder="https://meet.google.com/..." /></Field>
        </div>
        <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} resize-none`} /></Field>
        <Field label="Participants">
          <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
            {people.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={participants.includes(p.id)} onChange={() => toggle(p.id)} />
                {p.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Agenda, decisions, action items..." /></Field>
        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : meeting ? "Save changes" : "Schedule"}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function MeetingRow({ meeting, past, onEdit, onDelete }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"><Video size={19} /></div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-950">{meeting.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${past ? "bg-zinc-100 text-zinc-500" : "bg-zinc-900 text-white"}`}>{past ? "Past" : "Upcoming"}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{fmtDateTime(meeting.scheduledAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Users size={13} />{(meeting.participants || []).length} participant{(meeting.participants || []).length === 1 ? "" : "s"}</span>
            {meeting.meetingLink && (
              <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-zinc-600 underline underline-offset-2 hover:text-zinc-900"><ExternalLink size={13} />Join</a>
            )}
          </div>
          {meeting.description && <p className="mt-2 text-sm text-zinc-500">{meeting.description}</p>}
          {meeting.notes && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-zinc-400">Notes: {meeting.notes}</p>}
        </div>
      </div>
      <div className="flex shrink-0">
        <button type="button" onClick={onEdit} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><Pencil size={16} /></button>
        <button type="button" onClick={onDelete} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

function Meetings() {
  const { user } = useAuth();
  const { activeProject, activeProjectId, loading: projectsLoading } = useProjects();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError("");
    try {
      const data = await meetingApi.list(activeProjectId);
      setMeetings(data.meetings || []);
      setNow(Date.now());
    } catch (err) {
      setError(errMsg(err, "Could not load meetings"));
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => { load(); }, [load]);

  const people = useMemo(() => {
    const ids = new Set([activeProject?.owner, ...(activeProject?.members || [])].filter(Boolean));
    return [...ids].map((id) => ({ id, name: id === user?._id ? `${user.name} (me)` : `Member …${String(id).slice(-4)}` }));
  }, [activeProject, user]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await meetingApi.remove(deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(errMsg(err, "Could not delete meeting"));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const upcoming = meetings.filter((m) => new Date(m.scheduledAt).getTime() >= now);
  const past = meetings.filter((m) => new Date(m.scheduledAt).getTime() < now).reverse();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Collaboration"
        title="Meetings"
        text="Schedule team sessions and keep project discussions organized."
        actions={activeProjectId && (<><ProjectPicker /><PrimaryButton onClick={() => setEditing("new")}><Plus size={16} />Schedule meeting</PrimaryButton></>)}
      />

      {!activeProjectId ? <NeedProject loading={projectsLoading} /> : (
        <>
          <ErrorBanner message={error} onRetry={load} />
          {loading && meetings.length === 0 ? <Loading label="Loading meetings..." /> : (
            <>
              <section>
                <h2 className="text-base font-semibold text-zinc-950">Upcoming</h2>
                <p className="mb-3 text-xs text-zinc-400">Your next scheduled project sessions.</p>
                {upcoming.length === 0 ? (
                  <EmptyState icon={Video} title="No upcoming meetings" text="Schedule a meeting to keep the team aligned." action={<PrimaryButton onClick={() => setEditing("new")}><Plus size={16} />Schedule meeting</PrimaryButton>} />
                ) : (
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                    {upcoming.map((m) => <MeetingRow key={m._id} meeting={m} onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} />)}
                  </div>
                )}
              </section>

              {past.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-zinc-950">Recent meetings</h2>
                  <p className="mb-3 text-xs text-zinc-400">Previous sessions and their notes.</p>
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                    {past.map((m) => <MeetingRow key={m._id} meeting={m} past onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {editing && <MeetingForm meeting={editing === "new" ? null : editing} projectId={activeProjectId} people={people} onClose={() => setEditing(null)} onSaved={load} />}
      {deleting && <ConfirmDelete what={deleting.title} busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

export default Meetings;
