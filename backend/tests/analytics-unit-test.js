// Unit test for the pure analytics logic. Run: node tests/analytics-unit-test.js
const assert = require("assert");
const { buildAnalytics } = require("../src/services/analytics/analyticsService");

const now = new Date("2026-10-23T12:00:00Z");
const d = (s) => new Date(s);
const users = [
  { _id: "u1", name: "Ayesha", email: "a@x.com" },
  { _id: "u2", name: "Rohan", email: "r@x.com" },
  { _id: "u3", name: "Sana", email: "s@x.com" }
];
const project = { owner: "u1", members: ["u2", "u3"] };
const tasks = [
  { assignedTo: "u1", status: "completed", priority: "high", dueDate: d("2026-10-20"), createdAt: d("2026-10-10"), updatedAt: d("2026-10-19T10:00:00Z") }, // on time
  { assignedTo: "u1", status: "completed", priority: "low", dueDate: d("2026-10-15"), createdAt: d("2026-10-10"), updatedAt: d("2026-10-18T10:00:00Z") }, // late
  { assignedTo: "u2", status: "in_progress", priority: "medium", dueDate: d("2026-10-01"), createdAt: d("2026-10-05"), updatedAt: d("2026-10-06") }, // overdue
  { assignedTo: null, status: "todo", priority: "medium", createdAt: d("2026-10-22"), updatedAt: d("2026-10-22") },
  { assignedTo: "u2", status: "completed", priority: "medium", createdAt: d("2025-01-01"), updatedAt: d("2025-01-02") } // outside 30d
];
const documents = [
  { createdBy: "u3", updatedBy: "u1", createdAt: d("2026-10-12"), updatedAt: d("2026-10-14") }
];
const meetings = [
  { createdBy: "u2", participants: ["u1", "u2", "u3"], scheduledAt: d("2026-10-18") }
];
const sprints = [{ status: "active" }, { status: "completed" }];

const r = buildAnalytics({ project, users, tasks, documents, meetings, sprints, rangeDays: 30, now });
const by = Object.fromEntries(r.members.map((m) => [m.name, m]));

assert.strictEqual(r.summary.totalTasks, 4, "old task excluded from 30d range");
assert.strictEqual(by.Ayesha.tasks.completed, 2);
assert.strictEqual(by.Ayesha.tasks.completedOnTime, 1);
assert.strictEqual(by.Ayesha.onTimeRate, 50);
assert.strictEqual(by.Rohan.tasks.overdue, 1);
assert.strictEqual(r.summary.overdueTasks, 1);
assert.strictEqual(r.unassigned.tasks.total, 1);
// Ayesha: high 8 + low 3 + doc edited 2 + meeting attended 1 = 14
assert.strictEqual(by.Ayesha.score, 14);
// Rohan: in progress 1 + organised 3 = 4 ; Sana: doc created 4 + attended 1 = 5
assert.strictEqual(by.Rohan.score, 4);
assert.strictEqual(by.Sana.score, 5);
assert.strictEqual(r.summary.totalScore, 23);
assert.strictEqual(Math.round(r.members.reduce((s, m) => s + m.sharePercent, 0)), 100);
assert.strictEqual(r.members[0].name, "Ayesha");
assert.strictEqual(r.members[0].rank, 1);
assert.strictEqual(r.timeline.length, 30);
assert.strictEqual(r.timeline.at(-1).date, "2026-10-23");
assert.strictEqual(r.sprints.active, 1);

const all = buildAnalytics({ project, users, tasks, documents, meetings, sprints, rangeDays: null, now });
assert.strictEqual(all.summary.totalTasks, 5);
assert.ok(all.timeline.length <= 365);

// removed user's history is kept, empty project works
const gone = buildAnalytics({ project: { owner: "u1", members: [] }, users: [users[0]], tasks: [{ assignedTo: "zz", status: "completed", priority: "low", createdAt: now, updatedAt: now }], documents: [], meetings: [], sprints: [], rangeDays: 7, now });
assert.strictEqual(gone.members.find((m) => m.userId === "zz").projectRole, "former");
const empty = buildAnalytics({ project, users, tasks: [], documents: [], meetings: [], sprints: [], rangeDays: 7, now });
assert.strictEqual(empty.summary.totalScore, 0);
assert.strictEqual(empty.members.length, 3);

console.log("analytics unit tests: all passed");
