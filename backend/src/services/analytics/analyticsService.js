// Pure analytics logic: no DB / HTTP in here, so it is easy to unit-test.
// Input = plain (lean) objects, output = JSON-ready analytics for one project.

// How a member's "contribution score" is calculated (also returned by the API
// so the dashboard can show it transparently).
const WEIGHTS = {
  taskCompleted: { low: 3, medium: 5, high: 8 },
  taskInProgress: 1,
  documentCreated: 4,
  documentEdited: 2,
  meetingOrganized: 3,
  meetingAttended: 1
};

const DAY = 24 * 60 * 60 * 1000;
const UNASSIGNED = "unassigned";

const idOf = (v) => (v && v._id ? String(v._id) : v ? String(v) : null);
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const round1 = (n) => Math.round(n * 10) / 10;
const pct = (a, b) => (b > 0 ? round1((a / b) * 100) : 0);

const emptyMember = (user, role) => ({
  userId: user ? String(user._id) : UNASSIGNED,
  name: user ? user.name : "Unassigned",
  email: user ? user.email : "",
  avatar: user ? user.avatar || "" : "",
  projectRole: role,
  tasks: {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    completedOnTime: 0,
    completedWithDueDate: 0,
    completedByPriority: { low: 0, medium: 0, high: 0 }
  },
  documents: { created: 0, edited: 0 },
  meetings: { organized: 0, attended: 0 },
  completionRate: 0,
  onTimeRate: 0,
  score: 0,
  scoreBreakdown: { tasks: 0, documents: 0, meetings: 0 },
  sharePercent: 0
});

// Rebuilds a per-day series of length `days` ending today (UTC).
const buildTimeline = (days, now, events) => {
  const start = new Date(now.getTime() - (days - 1) * DAY);
  const keys = [];
  for (let i = 0; i < days; i++) keys.push(dayKey(new Date(start.getTime() + i * DAY)));
  const map = Object.fromEntries(
    keys.map((k) => [k, { date: k, tasksCreated: 0, tasksCompleted: 0, documents: 0, meetings: 0 }])
  );
  const bump = (date, field) => {
    if (!date) return;
    const row = map[dayKey(date)];
    if (row) row[field] += 1;
  };
  events.taskCreated.forEach((d) => bump(d, "tasksCreated"));
  events.taskCompleted.forEach((d) => bump(d, "tasksCompleted"));
  events.documents.forEach((d) => bump(d, "documents"));
  events.meetings.forEach((d) => bump(d, "meetings"));
  return keys.map((k) => map[k]);
};

/**
 * @param {object} input
 * @param {object} input.project   lean project (owner, members)
 * @param {object[]} input.users   lean users (_id, name, email, avatar)
 * @param {object[]} input.tasks
 * @param {object[]} input.documents
 * @param {object[]} input.meetings
 * @param {object[]} input.sprints
 * @param {number|null} input.rangeDays  null => whole project life (max 365 days on the timeline)
 * @param {Date} [input.now]
 */
const buildAnalytics = ({ project, users, tasks, documents, meetings, sprints, rangeDays, now = new Date() }) => {
  const since = rangeDays ? new Date(now.getTime() - rangeDays * DAY) : null;
  const inRange = (d) => !since || (d && new Date(d) >= since);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const ownerId = idOf(project.owner);
  const memberIds = [...new Set([ownerId, ...(project.members || []).map(idOf)])].filter(Boolean);

  const members = new Map();
  memberIds.forEach((id) => {
    const user = userMap.get(id);
    if (user) members.set(id, emptyMember(user, id === ownerId ? "owner" : "member"));
  });
  const ensure = (id) => {
    if (!id) {
      if (!members.has(UNASSIGNED)) members.set(UNASSIGNED, emptyMember(null, "none"));
      return members.get(UNASSIGNED);
    }
    if (!members.has(id)) {
      const user = userMap.get(id);
      // user removed from project / deleted: keep their history but flag them
      members.set(id, emptyMember(user || { _id: id, name: "Former member", email: "" }, "former"));
    }
    return members.get(id);
  };

  const status = { todo: 0, in_progress: 0, completed: 0 };
  const priority = { low: 0, medium: 0, high: 0 };
  const overall = { total: 0, overdue: 0, completed: 0, completedOnTime: 0, completedWithDueDate: 0 };
  const events = { taskCreated: [], taskCompleted: [], documents: [], meetings: [] };

  // ---- Tasks ----
  // A task counts in the selected range if it was created OR last touched in it.
  // (There is no completedAt field in the Task model, so updatedAt of a
  // completed task is used as the completion time.)
  tasks.forEach((t) => {
    const touched = inRange(t.createdAt) || inRange(t.updatedAt);
    if (!touched) return;

    const m = ensure(idOf(t.assignedTo));
    const s = t.status || "todo";
    const p = t.priority || "medium";

    overall.total++;
    m.tasks.total++;
    status[s] = (status[s] || 0) + 1;
    priority[p] = (priority[p] || 0) + 1;

    if (s === "todo") m.tasks.todo++;
    else if (s === "in_progress") m.tasks.inProgress++;
    else if (s === "completed") {
      m.tasks.completed++;
      overall.completed++;
      m.tasks.completedByPriority[p] = (m.tasks.completedByPriority[p] || 0) + 1;
      events.taskCompleted.push(t.updatedAt);
      if (t.dueDate) {
        m.tasks.completedWithDueDate++;
        overall.completedWithDueDate++;
        const dueEnd = new Date(t.dueDate).getTime() + DAY - 1; // due date counts until end of day
        if (new Date(t.updatedAt).getTime() <= dueEnd) {
          m.tasks.completedOnTime++;
          overall.completedOnTime++;
        }
      }
    }
    if (s !== "completed" && t.dueDate && new Date(t.dueDate).getTime() + DAY - 1 < now.getTime()) {
      m.tasks.overdue++;
      overall.overdue++;
    }
    events.taskCreated.push(t.createdAt);
  });

  // ---- Documents ----
  let docCount = 0;
  documents.forEach((d) => {
    if (inRange(d.createdAt)) {
      ensure(idOf(d.createdBy)).documents.created++;
      events.documents.push(d.createdAt);
      docCount++;
    }
    const editor = idOf(d.updatedBy);
    if (editor && editor !== idOf(d.createdBy) && inRange(d.updatedAt)) {
      ensure(editor).documents.edited++;
    }
  });

  // ---- Meetings ----
  let meetingCount = 0;
  meetings.forEach((mt) => {
    if (!inRange(mt.scheduledAt)) return;
    meetingCount++;
    events.meetings.push(mt.scheduledAt);
    const organizer = idOf(mt.createdBy);
    ensure(organizer).meetings.organized++;
    (mt.participants || []).forEach((p) => {
      const pid = idOf(p);
      if (pid && pid !== organizer) ensure(pid).meetings.attended++;
    });
  });

  // ---- Scores ----
  const list = [...members.values()];
  list.forEach((m) => {
    const t = m.tasks;
    const taskPts =
      t.completedByPriority.low * WEIGHTS.taskCompleted.low +
      t.completedByPriority.medium * WEIGHTS.taskCompleted.medium +
      t.completedByPriority.high * WEIGHTS.taskCompleted.high +
      t.inProgress * WEIGHTS.taskInProgress;
    const docPts = m.documents.created * WEIGHTS.documentCreated + m.documents.edited * WEIGHTS.documentEdited;
    const meetPts = m.meetings.organized * WEIGHTS.meetingOrganized + m.meetings.attended * WEIGHTS.meetingAttended;

    m.scoreBreakdown = { tasks: taskPts, documents: docPts, meetings: meetPts };
    m.score = taskPts + docPts + meetPts;
    m.completionRate = pct(t.completed, t.total);
    m.onTimeRate = pct(t.completedOnTime, t.completedWithDueDate);
  });

  const totalScore = list.reduce((s, m) => s + (m.userId === UNASSIGNED ? 0 : m.score), 0);
  list.forEach((m) => {
    m.sharePercent = m.userId === UNASSIGNED ? 0 : pct(m.score, totalScore);
  });

  // Unassigned bucket is reported separately, not ranked as a person.
  const unassigned = members.get(UNASSIGNED) || null;
  const ranked = list
    .filter((m) => m.userId !== UNASSIGNED)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((m, i) => ({ rank: i + 1, ...m }));

  // ---- Timeline ----
  let days = rangeDays || 90;
  if (!rangeDays) {
    const firstTs = [
      ...tasks.map((t) => t.createdAt),
      ...documents.map((d) => d.createdAt),
      ...meetings.map((mt) => mt.scheduledAt)
    ]
      .filter(Boolean)
      .map((d) => new Date(d).getTime());
    if (firstTs.length) days = Math.min(365, Math.max(7, Math.ceil((now - Math.min(...firstTs)) / DAY) + 1));
  }
  const timeline = buildTimeline(days, now, events);

  // ---- Sprints ----
  const sprintSummary = { planned: 0, active: 0, completed: 0, total: sprints.length };
  sprints.forEach((s) => {
    if (sprintSummary[s.status] !== undefined) sprintSummary[s.status]++;
  });

  return {
    range: { days: rangeDays || null, since: since ? since.toISOString() : null, generatedAt: now.toISOString() },
    summary: {
      totalTasks: overall.total,
      completedTasks: overall.completed,
      completionRate: pct(overall.completed, overall.total),
      overdueTasks: overall.overdue,
      onTimeRate: pct(overall.completedOnTime, overall.completedWithDueDate),
      documents: docCount,
      meetings: meetingCount,
      activeContributors: ranked.filter((m) => m.score > 0).length,
      totalMembers: ranked.filter((m) => m.projectRole !== "former").length,
      totalScore
    },
    scoring: WEIGHTS,
    members: ranked,
    unassigned: unassigned ? { ...unassigned } : null,
    breakdown: { status, priority },
    sprints: sprintSummary,
    timeline
  };
};

module.exports = { buildAnalytics, WEIGHTS };
