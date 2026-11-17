import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Video,
} from "lucide-react";

import { meetingApi } from "../api/meetingApi";
import { memberApi } from "../api/memberApi";
import Markdownish from "../components/Markdownish";
import Modal from "../components/Modal";
import ProjectPicker from "../components/ProjectPicker";
import {
  errorText,
  initialsOf,
  useProjectSelection,
} from "../hooks/useProjectSelection";

const DURATIONS = [15, 30, 45, 60, 90, 120];

const pad = (n) => String(n).padStart(2, "0");
const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const endsAt = (meeting) =>
  new Date(meeting.scheduledAt).getTime() + (meeting.durationMinutes || 30) * 60000;

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-400">{hint}</span>}
    </label>
  );
}

/* ---------- Schedule meeting modal ---------- */

function ScheduleModal({ projectId, members, currentUserId, onClose, onCreated }) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 60, 0, 0);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toDateInput(now));
  const [time, setTime] = useState(toTimeInput(now));
  const [duration, setDuration] = useState(30);
  const [meetingLink, setMeetingLink] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) return setError("Please enter a meeting title.");
    if (!date || !time) return setError("Please choose a date and time.");

    const when = new Date(`${date}T${time}`);
    if (Number.isNaN(when.getTime())) return setError("The date or time is not valid.");

    if (meetingLink.trim() && !/^https?:\/\//i.test(meetingLink.trim())) {
      return setError("Meeting link must start with http:// or https://");
    }

    setSaving(true);
    try {
      const result = await meetingApi.createMeeting(projectId, {
        title: title.trim(),
        description: description.trim(),
        scheduledAt: when.toISOString(),
        durationMinutes: Number(duration),
        meetingLink: meetingLink.trim(),
        participants: selected,
      });
      onCreated(result.data.meeting);
    } catch (err) {
      setError(errorText(err, "Could not schedule the meeting."));
      setSaving(false);
    }
  };

  const others = members.filter((m) => m._id !== currentUserId);

  return (
    <Modal title="Schedule meeting" subtitle="Invited members get a notification." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input
            autoFocus
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sprint planning"
            maxLength={120}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <input type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Duration">
            <select className={inputClass} value={duration} onChange={(e) => setDuration(e.target.value)}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Meeting link (optional)" hint="Google Meet, Zoom, Teams...">
          <input
            className={inputClass}
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/..."
          />
        </Field>

        <Field label="Agenda / description (optional)">
          <textarea
            rows={3}
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will be discussed?"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-zinc-600">Participants</span>
          {others.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-xs text-zinc-500">
              No other members in this project yet. Add members from the project page to invite them.
            </p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2">
              {others.map((member) => (
                <label
                  key={member._id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(member._id)}
                    onChange={() => toggle(member._id)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                    {initialsOf(member.name)}
                  </span>
                  <span className="text-sm text-zinc-800">{member.name}</span>
                  <span className="truncate text-xs text-zinc-400">{member.email}</span>
                </label>
              ))}
            </div>
          )}
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
            {saving ? "Scheduling..." : "Schedule meeting"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Meeting details + summary modal ---------- */

function SummaryModal({ meeting, members, onClose, onChanged }) {
  const [notes, setNotes] = useState(meeting.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const nameOf = (id) => members.find((m) => m._id === String(id))?.name || "Member";
  const dirty = notes !== (meeting.notes || "");

  const saveNotes = async () => {
    setError("");
    setInfo("");
    setSavingNotes(true);
    try {
      const result = await meetingApi.updateMeeting(meeting._id, { notes });
      onChanged(result.data.meeting);
      setInfo("Notes saved.");
    } catch (err) {
      setError(errorText(err, "Could not save notes."));
    } finally {
      setSavingNotes(false);
    }
  };

  const generate = async () => {
    setError("");
    setInfo("");
    setGenerating(true);
    try {
      // Make sure the latest notes are saved before summarizing them.
      if (dirty) {
        const saved = await meetingApi.updateMeeting(meeting._id, { notes });
        onChanged(saved.data.meeting);
      }
      const result = await meetingApi.generateSummary(meeting._id);
      onChanged(result.data.meeting);
      setInfo(
        result.data.source === "ai"
          ? "Summary generated with AI."
          : "Summary generated (basic mode - AI is not available right now)."
      );
    } catch (err) {
      setError(errorText(err, "Could not generate the summary."));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      wide
      title={meeting.title}
      subtitle={`${formatDate(meeting.scheduledAt)} · ${formatTime(meeting.scheduledAt)} · ${meeting.durationMinutes || 30} min`}
      onClose={onClose}
    >
      <div className="space-y-5">
        {meeting.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Agenda</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{meeting.description}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Participants ({meeting.participants.length})
          </p>
          {meeting.participants.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {meeting.participants.map((id) => (
                <span key={id} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                  {nameOf(id)}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-zinc-500">No participants invited.</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Meeting notes</p>
          <textarea
            rows={6}
            className={`${inputClass} mt-2`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={"Write what was discussed.\nTip: start a line with 'Action:' to list action items."}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={saveNotes}
              disabled={!dirty || savingNotes}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {savingNotes ? "Saving..." : "Save notes"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-zinc-700" />
              <p className="text-sm font-semibold text-zinc-950">Summary</p>
              {meeting.summarySource === "ai" && (
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">AI</span>
              )}
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={generating || (!notes.trim() && !meeting.description)}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {generating ? "Generating..." : meeting.summary ? "Regenerate" : "Generate summary"}
            </button>
          </div>

          <div className="mt-3">
            {meeting.summary ? (
              <Markdownish text={meeting.summary} />
            ) : (
              <p className="text-sm text-zinc-500">
                No summary yet. Add notes above, then click "Generate summary".
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {info && !error && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Meeting card ---------- */

function MeetingCard({ meeting, past, onOpen, onDelete }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
            <Video size={19} className="text-zinc-700" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-950">{meeting.title}</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  past ? "bg-zinc-100 text-zinc-600" : "bg-zinc-900 text-white"
                }`}
              >
                {past ? "Completed" : "Upcoming"}
              </span>
              {meeting.summary && (
                <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500">
                  Summary ready
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} />
                {formatDate(meeting.scheduledAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 size={13} />
                {formatTime(meeting.scheduledAt)} · {meeting.durationMinutes || 30} min
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {meeting.participants.length} participant{meeting.participants.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {!past && meeting.meetingLink && (
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Join
              <ExternalLink size={13} />
            </a>
          )}

          <button
            type="button"
            onClick={() => onOpen(meeting)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <FileText size={14} />
            View summary
          </button>

          <button
            type="button"
            title="Delete meeting"
            onClick={() => onDelete(meeting)}
            className="rounded-md p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

function Meetings() {
  const { projects, projectId, setProjectId, loading, error, searchParams, setSearchParams } =
    useProjectSelection();

  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [toast, setToast] = useState("");

  const currentUserId = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?._id || u?.id || "";
    } catch {
      return "";
    }
  }, []);

  const load = useCallback(async () => {
    if (!projectId) return;
    setDataLoading(true);
    setDataError("");
    try {
      const [meetingResult, memberResult] = await Promise.all([
        meetingApi.getProjectMeetings(projectId),
        memberApi.getMembers(projectId),
      ]);
      setMeetings(meetingResult.data?.meetings || []);
      setMembers(memberResult.data?.members || []);
    } catch (err) {
      setDataError(errorText(err, "Could not load meetings."));
    } finally {
      setDataLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Deep link from a notification: /meetings?project=..&meeting=..
  const linkedMeeting = searchParams.get("meeting") || "";
  useEffect(() => {
    if (linkedMeeting && meetings.some((m) => m._id === linkedMeeting)) {
      setActiveId(linkedMeeting);
    }
  }, [linkedMeeting, meetings]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...meetings].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    return {
      upcoming: sorted.filter((m) => endsAt(m) >= now),
      past: sorted.filter((m) => endsAt(m) < now).reverse(),
    };
  }, [meetings]);

  const active = meetings.find((m) => m._id === activeId) || null;

  const closeActive = () => {
    setActiveId("");
    if (searchParams.get("meeting")) setSearchParams({ project: projectId }, { replace: true });
  };

  const replaceMeeting = (updated) =>
    setMeetings((current) => current.map((m) => (m._id === updated._id ? updated : m)));

  const remove = async (meeting) => {
    if (!window.confirm(`Delete "${meeting.title}"? This cannot be undone.`)) return;
    try {
      await meetingApi.deleteMeeting(meeting._id);
      setMeetings((current) => current.filter((m) => m._id !== meeting._id));
      setToast("Meeting deleted.");
    } catch (err) {
      setToast(errorText(err, "Could not delete the meeting."));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Collaboration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">Meetings</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Schedule team sessions and keep project discussions organized.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProjectPicker projects={projects} projectId={projectId} onChange={setProjectId} />

          <button
            type="button"
            disabled={!projectId}
            onClick={() => setShowSchedule(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus size={16} />
            Schedule meeting
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
          <p className="mt-1 text-sm text-zinc-500">Meetings belong to a project. Create one from the Projects page.</p>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-zinc-950">Upcoming</h2>
              <p className="mt-1 text-sm text-zinc-500">Your next scheduled project sessions.</p>
            </div>

            {dataLoading && meetings.length === 0 ? (
              <p className="text-sm text-zinc-500">Loading meetings...</p>
            ) : upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
                <Video size={22} className="mx-auto text-zinc-400" />
                <p className="mt-3 text-sm font-medium text-zinc-800">No upcoming meetings</p>
                <p className="mt-1 text-sm text-zinc-500">Click "Schedule meeting" to plan one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    onOpen={(m) => setActiveId(m._id)}
                    onDelete={remove}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-base font-semibold text-zinc-950">Recent meetings</h2>
            <p className="mt-1 text-sm text-zinc-500">Previous sessions, notes and summaries.</p>

            {past.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">No past meetings yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {past.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    past
                    meeting={meeting}
                    onOpen={(m) => setActiveId(m._id)}
                    onDelete={remove}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {showSchedule && (
        <ScheduleModal
          projectId={projectId}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setShowSchedule(false)}
          onCreated={(meeting) => {
            setMeetings((current) => [...current, meeting]);
            setShowSchedule(false);
            setToast("Meeting scheduled. Invited members were notified.");
          }}
        />
      )}

      {active && (
        <SummaryModal
          key={active._id}
          meeting={active}
          members={members}
          onClose={closeActive}
          onChanged={replaceMeeting}
        />
      )}
    </div>
  );
}

export default Meetings;
