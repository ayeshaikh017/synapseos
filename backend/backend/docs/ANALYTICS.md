# Team Analytics (new)

Dashboard: `http://localhost:5000/analytics` (sign in with your normal SynapseOS login; `?project=<id>` preselects a project).

API (JWT required, project owner/member only):
`GET /api/projects/:projectId/analytics?range=7|30|90|all` (default 30)

Response `data.analytics`: `summary`, `members[]` (rank, score, sharePercent, tasks, documents, meetings, onTimeRate...),
`unassigned`, `breakdown`, `sprints`, `timeline[]`, `scoring` (point weights), `github` (commit counts if a repo is linked).

Score weights live in `src/services/analytics/analyticsService.js` (`WEIGHTS`).
Test: `node tests/analytics-unit-test.js`
