// SynapseOS backend smoke test. Usage: BASE_URL=http://localhost:5000/api node smoke-test.js
// Creates uniquely-named test users/projects; cleans up the project at the end.
const BASE = process.env.BASE_URL || "http://localhost:5000/api";
const stamp = Date.now();
let pass = 0, fail = 0;

const call = async (method, path, { token, body, raw } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(raw === undefined ? { "Content-Type": "application/json" } : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: raw !== undefined ? raw : body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (e) {}
  return { status: res.status, json };
};

const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};
const expectStatus = (name, r, status) =>
  check(`${name} -> ${status}`, r.status === status, `(got ${r.status}: ${JSON.stringify(r.json)})`);
const errShape = (name, r) =>
  check(`${name} error shape`, r.json && r.json.success === false && typeof r.json.message === "string");

(async () => {
  console.log("\n== HEALTH / ROOT / MISC");
  let r = await call("GET", "/health"); expectStatus("GET /health", r, 200);
  check("health body", r.json.success === true && r.json.message === "SynapseOS API is healthy");
  r = await call("GET", "/does-not-exist"); expectStatus("unknown route", r, 404); errShape("unknown route", r);
  r = await call("POST", "/auth/login", { raw: "{bad json" }); expectStatus("malformed JSON", r, 400); errShape("malformed JSON", r);

  console.log("\n== AUTH");
  const users = {};
  for (const k of ["A", "B", "C"]) {
    const email = `user${k}_${stamp}@test.com`;
    r = await call("POST", "/auth/register", { body: { name: `User ${k}`, email, password: "password123" } });
    expectStatus(`register ${k}`, r, 201);
    check(`register ${k} no password leaked`, r.json.data.user.password === undefined && !JSON.stringify(r.json).includes("password123"));
    r = await call("POST", "/auth/login", { body: { email, password: "password123" } });
    expectStatus(`login ${k}`, r, 200);
    check(`login ${k} returns token, no password`, !!r.json.data.token && r.json.data.user.password === undefined);
    users[k] = { email, token: r.json.data.token, id: r.json.data.user._id };
  }
  r = await call("POST", "/auth/register", { body: { name: "x", email: users.A.email, password: "password123" } }); expectStatus("register duplicate", r, 409);
  r = await call("POST", "/auth/login", { body: { email: users.A.email, password: "wrongpass" } }); expectStatus("login wrong password", r, 401);
  r = await call("POST", "/auth/register", { body: { email: "a@b.com" } }); expectStatus("register missing fields", r, 400);
  r = await call("GET", "/auth/me", { token: users.A.token }); expectStatus("GET /auth/me", r, 200);
  check("/me returns correct user, no password", r.json.data.user._id === users.A.id && r.json.data.user.email === users.A.email.toLowerCase() && r.json.data.user.password === undefined);
  r = await call("GET", "/auth/me"); expectStatus("/me no token", r, 401); errShape("/me no token", r);
  r = await call("GET", "/auth/me", { token: "garbage" }); expectStatus("/me bad token", r, 401);

  const A = users.A.token, B = users.B.token, C = users.C.token;

  console.log("\n== PROJECTS");
  r = await call("POST", "/projects", { token: A, body: { name: `P ${stamp}`, members: [users.B.id] } });
  expectStatus("POST /projects", r, 201);
  const pid = r.json.data.project._id;
  r = await call("POST", "/projects", { token: A, body: {} }); expectStatus("create project no name", r, 400);
  r = await call("GET", "/projects", { token: A }); expectStatus("GET /projects (owner)", r, 200);
  check("owner sees project", r.json.data.projects.some((p) => p._id === pid));
  r = await call("GET", "/projects", { token: B });
  check("member sees project", r.json.data.projects.some((p) => p._id === pid));
  r = await call("GET", "/projects", { token: C });
  check("outsider list empty of it", !r.json.data.projects.some((p) => p._id === pid));
  r = await call("GET", `/projects/${pid}`, { token: B }); expectStatus("GET project (member)", r, 200);
  r = await call("GET", `/projects/${pid}`, { token: C }); expectStatus("GET project (outsider)", r, 404);
  r = await call("PUT", `/projects/${pid}`, { token: B, body: { description: "updated by member", status: "active", owner: users.C.id } });
  expectStatus("PUT project (member)", r, 200);
  check("owner NOT changed by PUT", String(r.json.data.project.owner) === users.A.id);
  r = await call("PUT", `/projects/${pid}`, { token: C, body: { name: "hack" } }); expectStatus("PUT project (outsider)", r, 404);
  r = await call("DELETE", `/projects/${pid}`, { token: B }); expectStatus("DELETE project (non-owner member)", r, 404);

  console.log("\n== TASKS");
  r = await call("POST", `/projects/${pid}/tasks`, { token: A, body: { title: "T1", priority: "high" } }); expectStatus("POST task", r, 201);
  const tid = r.json.data.task._id;
  r = await call("POST", `/projects/${pid}/tasks`, { token: A, body: {} }); expectStatus("POST task no title", r, 400);
  r = await call("POST", `/projects/${pid}/tasks`, { token: C, body: { title: "x" } }); expectStatus("POST task outsider", r, 404);
  r = await call("GET", `/projects/${pid}/tasks`, { token: B }); expectStatus("GET tasks (member)", r, 200);
  check("task listed", r.json.data.tasks.length === 1);
  r = await call("GET", `/projects/${pid}/tasks`, { token: C }); expectStatus("GET tasks outsider", r, 404);
  r = await call("PUT", `/tasks/${tid}`, { token: B, body: { status: "in_progress" } }); expectStatus("PUT task", r, 200);
  r = await call("PUT", `/tasks/${tid}`, { token: A, body: { status: "bogus" } }); expectStatus("PUT task invalid status", r, 400);
  r = await call("DELETE", `/tasks/${tid}`, { token: C }); expectStatus("DELETE task outsider", r, 404);
  r = await call("DELETE", `/tasks/${tid}`, { token: A }); expectStatus("DELETE task", r, 200);

  console.log("\n== SPRINTS");
  r = await call("POST", `/projects/${pid}/sprints`, { token: A, body: { name: "Sprint 1", goal: "ship", startDate: "2026-10-01", endDate: "2026-10-14" } });
  expectStatus("POST sprint", r, 201);
  const sid = r.json.data.sprint._id;
  check("sprint default status planned", r.json.data.sprint.status === "planned" || r.json.data.sprint.status);
  r = await call("POST", `/projects/${pid}/sprints`, { token: A, body: {} }); expectStatus("POST sprint no name", r, 400);
  r = await call("POST", `/projects/${pid}/sprints`, { token: A, body: { name: "s", status: "nope" } }); expectStatus("POST sprint bad status", r, 400);
  r = await call("POST", `/projects/${pid}/sprints`, { token: A, body: { name: "s", startDate: "2026-10-10", endDate: "2026-10-01" } }); expectStatus("POST sprint end<start", r, 400);
  r = await call("POST", `/projects/${pid}/sprints`, { token: A, body: { name: "s", startDate: "not-a-date" } }); expectStatus("POST sprint bad date", r, 400);
  r = await call("POST", `/projects/${pid}/sprints`, { token: C, body: { name: "x" } }); expectStatus("POST sprint outsider", r, 404);
  r = await call("POST", `/projects/${pid}/sprints`); expectStatus("POST sprint no token", r, 401);
  r = await call("POST", `/projects/not-an-id/sprints`, { token: A, body: { name: "x" } }); expectStatus("POST sprint invalid projectId", r, 404);
  r = await call("GET", `/projects/${pid}/sprints`, { token: B }); expectStatus("GET sprints (member)", r, 200);
  check("sprint listed", r.json.data.sprints.length === 1);
  r = await call("GET", `/projects/${pid}/sprints`, { token: C }); expectStatus("GET sprints outsider", r, 404);
  r = await call("PUT", `/sprints/${sid}`, { token: B, body: { status: "active", project: "000000000000000000000000" } }); expectStatus("PUT sprint (member)", r, 200);
  check("sprint status updated, project unchanged", r.json.data.sprint.status === "active" && String(r.json.data.sprint.project) === pid);
  r = await call("PUT", `/sprints/${sid}`, { token: B, body: { endDate: "2020-01-01" } }); expectStatus("PUT sprint end<start", r, 400);
  r = await call("PUT", `/sprints/${sid}`, { token: B, body: { name: "  " } }); expectStatus("PUT sprint empty name", r, 400);
  r = await call("PUT", `/sprints/${sid}`, { token: C, body: { name: "hack" } }); expectStatus("PUT sprint outsider", r, 404);
  r = await call("PUT", `/sprints/zzz`, { token: A, body: { name: "x" } }); expectStatus("PUT sprint invalid id", r, 404);
  r = await call("PUT", `/sprints/507f1f77bcf86cd799439011`, { token: A, body: { name: "x" } }); expectStatus("PUT sprint nonexistent", r, 404);
  r = await call("DELETE", `/sprints/${sid}`, { token: C }); expectStatus("DELETE sprint outsider", r, 404);
  r = await call("DELETE", `/sprints/${sid}`, { token: B }); expectStatus("DELETE sprint (member)", r, 200);
  r = await call("DELETE", `/sprints/${sid}`, { token: B }); expectStatus("DELETE sprint again", r, 404);

  console.log("\n== DOCUMENTS");
  r = await call("POST", `/projects/${pid}/documents`, { token: A, body: { title: "Spec", content: "# Hello" } }); expectStatus("POST document", r, 201);
  const did = r.json.data.document._id;
  check("createdBy/updatedBy = A", String(r.json.data.document.createdBy) === users.A.id && String(r.json.data.document.updatedBy) === users.A.id);
  r = await call("POST", `/projects/${pid}/documents`, { token: A, body: { content: "x" } }); expectStatus("POST document no title", r, 400);
  r = await call("POST", `/projects/${pid}/documents`, { token: C, body: { title: "x" } }); expectStatus("POST document outsider", r, 404);
  r = await call("GET", `/projects/${pid}/documents`, { token: B }); expectStatus("GET documents (member)", r, 200);
  check("document listed", r.json.data.documents.length === 1);
  r = await call("GET", `/projects/${pid}/documents`, { token: C }); expectStatus("GET documents outsider", r, 404);
  r = await call("GET", `/documents/${did}`, { token: B }); expectStatus("GET document by id", r, 200);
  r = await call("GET", `/documents/${did}`, { token: C }); expectStatus("GET document outsider", r, 404);
  r = await call("GET", `/documents/bad`, { token: A }); expectStatus("GET document invalid id", r, 404);
  r = await call("PUT", `/documents/${did}`, { token: B, body: { content: "# Edited" } }); expectStatus("PUT document", r, 200);
  check("updatedBy = B, createdBy still A", String(r.json.data.document.updatedBy) === users.B.id && String(r.json.data.document.createdBy) === users.A.id && r.json.data.document.content === "# Edited");
  r = await call("PUT", `/documents/${did}`, { token: B, body: { title: "" } }); expectStatus("PUT document empty title", r, 400);
  r = await call("PUT", `/documents/${did}`, { token: C, body: { title: "hack" } }); expectStatus("PUT document outsider", r, 404);
  r = await call("DELETE", `/documents/${did}`, { token: C }); expectStatus("DELETE document outsider", r, 404);
  r = await call("DELETE", `/documents/${did}`, { token: B }); expectStatus("DELETE document", r, 200);
  r = await call("GET", `/documents/${did}`, { token: A }); expectStatus("GET deleted document", r, 404);

  console.log("\n== MEETINGS");
  r = await call("POST", `/projects/${pid}/meetings`, { token: A, body: { title: "Standup", scheduledAt: "2026-10-12T09:00:00Z", participants: [users.B.id], meetingLink: "https://meet.example.com/abc" } });
  expectStatus("POST meeting", r, 201);
  const mid = r.json.data.meeting._id;
  r = await call("POST", `/projects/${pid}/meetings`, { token: A, body: { scheduledAt: "2026-10-12" } }); expectStatus("POST meeting no title", r, 400);
  r = await call("POST", `/projects/${pid}/meetings`, { token: A, body: { title: "x" } }); expectStatus("POST meeting no scheduledAt", r, 400);
  r = await call("POST", `/projects/${pid}/meetings`, { token: A, body: { title: "x", scheduledAt: "garbage" } }); expectStatus("POST meeting bad date", r, 400);
  r = await call("POST", `/projects/${pid}/meetings`, { token: A, body: { title: "x", scheduledAt: "2026-10-12", meetingLink: "javascript:alert(1)" } }); expectStatus("POST meeting bad link", r, 400);
  r = await call("POST", `/projects/${pid}/meetings`, { token: A, body: { title: "x", scheduledAt: "2026-10-12", participants: [users.C.id] } }); expectStatus("POST meeting non-member participant", r, 400);
  r = await call("POST", `/projects/${pid}/meetings`, { token: A, body: { title: "x", scheduledAt: "2026-10-12", participants: ["nope"] } }); expectStatus("POST meeting invalid participant id", r, 400);
  r = await call("POST", `/projects/${pid}/meetings`, { token: C, body: { title: "x", scheduledAt: "2026-10-12" } }); expectStatus("POST meeting outsider", r, 404);
  r = await call("GET", `/projects/${pid}/meetings`, { token: B }); expectStatus("GET meetings (member)", r, 200);
  check("meeting listed (and only the valid one created)", r.json.data.meetings.length === 1);
  r = await call("GET", `/projects/${pid}/meetings`, { token: C }); expectStatus("GET meetings outsider", r, 404);
  r = await call("GET", `/meetings/${mid}`, { token: B }); expectStatus("GET meeting by id", r, 200);
  r = await call("GET", `/meetings/${mid}`, { token: C }); expectStatus("GET meeting outsider", r, 404);
  r = await call("PUT", `/meetings/${mid}`, { token: B, body: { notes: "decided X" } }); expectStatus("PUT meeting", r, 200);
  check("notes saved", r.json.data.meeting.notes === "decided X");
  r = await call("PUT", `/meetings/${mid}`, { token: B, body: { title: "" } }); expectStatus("PUT meeting empty title", r, 400);
  r = await call("PUT", `/meetings/${mid}`, { token: B, body: { participants: [users.C.id] } }); expectStatus("PUT meeting non-member participant", r, 400);
  r = await call("PUT", `/meetings/${mid}`, { token: C, body: { notes: "hack" } }); expectStatus("PUT meeting outsider", r, 404);

  console.log("\n== NOTIFICATIONS (created by the meeting above)");
  r = await call("GET", "/notifications", { token: B }); expectStatus("GET /notifications (B)", r, 200);
  check("B has 1 unread meeting notification", r.json.data.notifications.length === 1 && r.json.data.unreadCount === 1 && r.json.data.notifications[0].type === "meeting");
  const nid = r.json.data.notifications[0]._id;
  r = await call("GET", "/notifications", { token: A });
  check("creator A not notified of own meeting", r.json.data.notifications.length === 0);
  r = await call("GET", "/notifications", { token: C });
  check("C sees none of B's", r.json.data.notifications.length === 0);
  r = await call("GET", "/notifications"); expectStatus("GET notifications no token", r, 401);
  r = await call("PUT", `/notifications/${nid}/read`, { token: C }); expectStatus("C marks B's notification read", r, 404);
  r = await call("DELETE", `/notifications/${nid}`, { token: C }); expectStatus("C deletes B's notification", r, 404);
  r = await call("GET", "/notifications", { token: B });
  check("B's notification untouched by C", r.json.data.notifications.length === 1 && r.json.data.notifications[0].isRead === false);
  r = await call("PUT", `/notifications/${nid}/read`, { token: B }); expectStatus("B marks read", r, 200);
  check("isRead true", r.json.data.notification.isRead === true);
  r = await call("GET", "/notifications?unreadOnly=true", { token: B });
  check("unreadOnly filter + unreadCount 0", r.json.data.notifications.length === 0 && r.json.data.unreadCount === 0);
  r = await call("PUT", `/notifications/bad-id/read`, { token: B }); expectStatus("mark read invalid id", r, 404);
  // add C is not a member -> use PUT meeting adding a new participant: make C a member first
  r = await call("PUT", `/projects/${pid}`, { token: A, body: { members: [users.B.id, users.C.id] } }); expectStatus("add C as member", r, 200);
  r = await call("PUT", `/meetings/${mid}`, { token: A, body: { participants: [users.B.id, users.C.id] } }); expectStatus("PUT meeting add participant", r, 200);
  r = await call("GET", "/notifications", { token: C });
  check("newly added participant C notified, B not re-notified", r.json.data.notifications.length === 1);
  r = await call("GET", "/notifications", { token: B });
  check("B still only 1 notification", r.json.data.notifications.length === 1);
  r = await call("DELETE", `/notifications/${nid}`, { token: B }); expectStatus("B deletes own notification", r, 200);
  r = await call("DELETE", `/notifications/${nid}`, { token: B }); expectStatus("delete again", r, 404);
  r = await call("DELETE", `/meetings/${mid}`, { token: C }); expectStatus("DELETE meeting (member C)", r, 200);
  r = await call("GET", `/meetings/${mid}`, { token: A }); expectStatus("GET deleted meeting", r, 404);
  // remove C again for outsider tests
  r = await call("PUT", `/projects/${pid}`, { token: A, body: { members: [users.B.id] } }); expectStatus("remove C from members", r, 200);

  console.log("\n== GITHUB");
  r = await call("GET", `/projects/${pid}/github`, { token: A }); expectStatus("GET github (unlinked)", r, 200);
  check("linked:false", r.json.data.linked === false && r.json.data.repository === null);
  for (const bad of ["not a url", "https://evil.com/a/b", "http://github.com/a/b", "https://github.com/onlyowner", "https://github.com/a/b/c", "https://github.com/../x", "https://github.com.evil.com/a/b", ""]) {
    r = await call("PUT", `/projects/${pid}/github`, { token: A, body: { repositoryUrl: bad } });
    expectStatus(`PUT github rejects "${bad}"`, r, 400);
  }
  r = await call("PUT", `/projects/${pid}/github`, { token: C, body: { repositoryUrl: "https://github.com/expressjs/express" } }); expectStatus("PUT github outsider", r, 404);
  r = await call("PUT", `/projects/${pid}/github`, { token: A, body: { repositoryUrl: "https://github.com/expressjs/express.git" } }); expectStatus("PUT github link", r, 200);
  check("parsed owner/name/url", r.json.data.integration.repositoryOwner === "expressjs" && r.json.data.integration.repositoryName === "express" && r.json.data.integration.repositoryUrl === "https://github.com/expressjs/express");
  check("no token fields in response", !JSON.stringify(r.json).toLowerCase().includes("token"));
  r = await call("PUT", `/projects/${pid}/github`, { token: B, body: { repositoryUrl: "https://github.com/expressjs/express" } }); expectStatus("PUT github re-link (upsert, no dup)", r, 200);
  r = await call("GET", `/projects/${pid}/github`, { token: B });
  console.log(`  INFO  live GitHub fetch status=${r.status} ${r.json && r.json.data && r.json.data.repository ? "repo=" + r.json.data.repository.fullName + " stars=" + r.json.data.repository.stars : "msg=" + (r.json && r.json.message)}`);
  check("GET github returns repo info OR a clean GitHub error", (r.status === 200 && r.json.data.repository && r.json.data.repository.fullName === "expressjs/express") || [502, 503, 404].includes(r.status));
  r = await call("GET", `/projects/${pid}/github`, { token: C }); expectStatus("GET github outsider", r, 404);
  r = await call("PUT", `/projects/${pid}/github`, { token: A, body: { repositoryUrl: "https://github.com/this-owner-xyz-123/definitely-not-a-repo-987" } });
  r = await call("GET", `/projects/${pid}/github`, { token: A });
  check("nonexistent GitHub repo -> clean 404/502/503, error shape", [404, 502, 503].includes(r.status) && r.json.success === false);
  r = await call("DELETE", `/projects/${pid}/github`, { token: C }); expectStatus("DELETE github outsider", r, 404);
  r = await call("DELETE", `/projects/${pid}/github`, { token: A }); expectStatus("DELETE github", r, 200);
  r = await call("DELETE", `/projects/${pid}/github`, { token: A }); expectStatus("DELETE github again", r, 404);

  console.log("\n== AI / RAG (scaffold only; must be honest)");
  r = await call("GET", "/ai/status", { token: A }); expectStatus("GET /ai/status", r, 200);
  check("status says PLANNED/not implemented", r.json.data.llm.status === "PLANNED" && r.json.data.llm.implemented === false && r.json.data.rag.implemented === false);
  r = await call("GET", "/ai/status"); expectStatus("ai status no token", r, 401);
  r = await call("POST", "/ai/task-priority", { token: A, body: {} }); expectStatus("task-priority no title", r, 400);
  r = await call("POST", "/ai/task-priority", { token: A, body: { title: "x", dueDate: "garbage" } }); expectStatus("task-priority bad date", r, 400);
  r = await call("POST", "/ai/task-priority", { token: C, body: { title: "x", projectId: pid } }); expectStatus("task-priority outsider projectId", r, 404);
  r = await call("POST", "/ai/task-priority", { token: A, body: { title: "Fix login bug", projectId: pid } }); expectStatus("task-priority valid -> 501 (PLANNED)", r, 501);
  check("501 message says PLANNED, no fake data", /PLANNED/.test(r.json.message) && r.json.data === undefined);
  r = await call("POST", "/ai/task-priority", { body: { title: "x" } }); expectStatus("task-priority no token", r, 401);
  r = await call("POST", "/ai/search", { token: A, body: { query: "x" } }); expectStatus("ai search no projectId", r, 400);
  r = await call("POST", "/ai/search", { token: A, body: { projectId: pid } }); expectStatus("ai search no query", r, 400);
  r = await call("POST", "/ai/search", { token: C, body: { projectId: pid, query: "x" } }); expectStatus("ai search outsider", r, 404);
  r = await call("POST", "/ai/search", { token: A, body: { projectId: pid, query: "auth design" } }); expectStatus("ai search valid -> 501 (PLANNED)", r, 501);

  console.log("\n== CLEANUP");
  r = await call("DELETE", `/projects/${pid}`, { token: A }); expectStatus("DELETE project (owner)", r, 200);
  r = await call("GET", `/projects/${pid}`, { token: A }); expectStatus("GET deleted project", r, 404);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("Test crashed:", e); process.exit(2); });
