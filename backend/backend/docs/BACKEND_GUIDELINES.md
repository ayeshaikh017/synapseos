# SynapseOS — Backend & Frontend Integration Guidelines

> **Purpose:** This document defines the backend structure, API naming, database naming, authentication, environment variables, request/response formats, and integration rules that the frontend must follow.
>
> **Important:** Do not change API names, field names, route names, status values, or authentication format independently. If a change is required, discuss it with the backend developer first.

---

# 1. Project Overview

SynapseOS is an AI-powered intelligent workspace for managing:

- Projects
- Tasks
- Sprints
- Documentation
- Meetings
- Team communication
- Notifications
- GitHub integration
- AI-powered project assistance
- RAG-based project knowledge

The project uses:

```text
Frontend  → React.js
Backend   → Node.js + Express.js
Database  → MongoDB Atlas
Authentication → JWT
```

---

# 2. Main Project Structure

```text
synapseos/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   └── React application
│
└── docs/
    └── BACKEND_GUIDELINES.md
```

---

# 3. Git Branch Structure

The project uses separate branches for independent development.

```text
main
├── backend
└── frontend
```

## Backend Developer

Works on:

```text
backend
```

## Frontend Developer

Works on:

```text
frontend
```

## Important

Do not directly work on another person's branch.

Backend changes:

```text
backend → GitHub backend branch
```

Frontend changes:

```text
frontend → GitHub frontend branch
```

The branches will be integrated into `main` later.

---

# 4. Technology Stack

## Backend

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcryptjs
dotenv
CORS
Helmet
```

## Frontend

```text
React.js
Vite
React Router
Axios
Tailwind CSS
React Hook Form
Zod
Lucide React
Recharts
```

---

# 5. Local Backend URL

During development:

```text
http://localhost:5000
```

API base URL:

```text
http://localhost:5000/api
```

Therefore:

```text
GET http://localhost:5000/api/health
```

---

# 6. Production Backend URL

After deployment on Render, the backend URL will be something like:

```text
https://YOUR-BACKEND-NAME.onrender.com
```

The frontend must use:

```text
https://YOUR-BACKEND-NAME.onrender.com/api
```

Do NOT hardcode the production URL directly into React components.

Use a frontend environment variable.

---

# 7. Frontend Environment Variable

Create this file inside:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_URL=https://YOUR-BACKEND-NAME.onrender.com/api
```

## Important

Frontend API requests should use:

```javascript
import.meta.env.VITE_API_URL
```

Example:

```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

Then:

```javascript
axios.get(`${API_URL}/projects`);
```

Do NOT write:

```javascript
axios.get("http://localhost:5000/api/projects");
```

inside individual components.

---

# 8. Backend Environment Variables

Backend `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

## Optional variables

```env
GITHUB_TOKEN=
OPENAI_API_KEY=
```

- `GITHUB_TOKEN` — optional, **server-side only**. Used only to raise GitHub's API rate limit for
  `GET /api/projects/:projectId/github`. It is never returned to the frontend.
  Note: if set, project members can see public info of any linked repository that this token can read.
- `OPENAI_API_KEY` — **PLANNED**. The LLM integration is not implemented; this variable is only
  reported (as true/false) by `GET /api/ai/status`.

## Meaning

### PORT

```env
PORT=5000
```

Backend runs on:

```text
http://localhost:5000
```

### MONGO_URI

MongoDB Atlas connection string.

```env
MONGO_URI=your_mongodb_connection_string
```

This is PRIVATE.

Never put the real value in GitHub.

### JWT_SECRET

Secret key used by the backend to create and verify JWT tokens.

```env
JWT_SECRET=your_jwt_secret
```

This is PRIVATE.

### CLIENT_URL

Frontend development URL:

```env
CLIENT_URL=http://localhost:5173
```

This is used for frontend/backend communication and CORS configuration.

---

# 9. Environment File Rules

## Backend

```text
backend/.env
```

contains real secrets.

DO NOT push this file to GitHub.

## Backend example

```text
backend/.env.example
```

contains only placeholders:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

This file CAN be pushed to GitHub.

---

# 10. API Base Path

Every backend API route starts with:

```text
/api
```

Example:

```text
/api/auth/login
/api/projects
/api/tasks
```

Frontend should therefore always use:

```text
VITE_API_URL + endpoint
```

where:

```text
VITE_API_URL=http://localhost:5000/api
```

---

# 11. API Naming Convention

Use plural resource names.

Correct:

```text
/api/projects
/api/tasks
/api/users
/api/sprints
/api/documents
/api/meetings
/api/notifications
```

Avoid creating random variations such as:

```text
/api/project
/api/createProject
/api/getProjects
```

The frontend and backend must use the same route names.

---

# 12. Authentication

Authentication uses:

```text
JWT — JSON Web Token
```

## Authentication flow

```text
User
 ↓
React Login Page
 ↓
POST /api/auth/login
 ↓
Express Backend
 ↓
Check email + password
 ↓
Generate JWT
 ↓
Return token
 ↓
Frontend stores token
 ↓
Frontend sends token with protected requests
```

---

# 13. JWT Header Format

For protected APIs, send:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example Axios configuration:

```javascript
const token = localStorage.getItem("token");

const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
};
```

Example:

```javascript
axios.get(`${API_URL}/auth/me`, config);
```

The exact token storage strategy can be changed later for security reasons, but the backend expects the standard:

```text
Bearer <token>
```

format.

---

# 14. Authentication Routes

## Register

```http
POST /api/auth/register
```

Example request:

```json
{
  "name": "Ayesha",
  "email": "ayesha@example.com",
  "password": "password123"
}
```

---

## Login

```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "ayesha@example.com",
  "password": "password123"
}
```

Expected response structure:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Ayesha",
      "email": "ayesha@example.com",
      "role": "member"
    },
    "token": "JWT_TOKEN"
  }
}
```

---

## Current User

```http
GET /api/auth/me
```

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Ayesha",
      "email": "ayesha@example.com",
      "avatar": "",
      "role": "member"
    }
  }
}
```

Errors: `401` missing/invalid/expired token, `404` user no longer exists.
The password is never returned.

---

# 15. User Naming Convention

Backend model:

```text
User.js
```

MongoDB collection:

```text
users
```

User object fields:

```text
_id
name
email
password
avatar
role
createdAt
updatedAt
```

Example:

```json
{
  "_id": "USER_ID",
  "name": "Ayesha",
  "email": "ayesha@example.com",
  "avatar": "",
  "role": "member"
}
```

---

# 16. User Roles

Current planned roles:

```text
admin
manager
member
```

Frontend must use these exact values.

Do not create alternatives such as:

```text
administrator
teamMember
employee
```

unless discussed with the backend developer.

---

# 17. Projects API
## Get all projects

```http
GET /api/projects
```

### Authentication

Required.

```http
Authorization: Bearer <JWT_TOKEN>
```

### Request body

No request body.

### Access rule

The backend returns only projects where the logged-in user is:

- the project owner, OR
- included in the project's `members` array.

### Success response

```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": {
    "projects": []
  }
}
```

If the logged-in user has accessible projects, they are returned inside the `projects` array.

If the logged-in user is authenticated but has no accessible projects, the `projects` array is empty.

### Unauthorized response

```json
{
  "success": false,
  "message": "Not authorized. Token required."
}
```

### Tested

- Owner can fetch their project.
- Project member can fetch the project.
- Authenticated user who is neither owner nor member receives an empty project list.
- Request without JWT is rejected.

# 18. Important Project ID Naming

Use:

```text
projectId
```

for project route parameters.

Example:

```text
/api/projects/:projectId
```

Do NOT randomly use:

```text
:id
:project_id
:projectID
```

The frontend should use:

```javascript
projectId
```

---

# 19. Tasks API

Base project task route:

```text
/api/projects/:projectId/tasks
```

## Get project tasks

```http
GET /api/projects/:projectId/tasks
```

---

## Create task

```http
POST /api/projects/:projectId/tasks
```

Example:

```json
{
  "title": "Create login page",
  "description": "Build React login interface",
  "status": "todo",
  "priority": "high"
}
```

---

## Update task

```http
PUT /api/tasks/:taskId
```

---

## Delete task

```http
DELETE /api/tasks/:taskId
```

---

# 20. Task Status Values

Use exactly:

```text
todo
in_progress
completed
```

Frontend display names can be:

```text
To Do
In Progress
Completed
```

But values sent to the backend must remain:

```text
todo
in_progress
completed
```

Example:

```json
{
  "status": "in_progress"
}
```

Do NOT send:

```json
{
  "status": "In Progress"
}
```

unless the backend contract is changed.

---

# 21. Task Priority Values

Planned values:

```text
low
medium
high
```

Frontend can display:

```text
Low
Medium
High
```

But API values should remain lowercase.

---

# 22. Task ID Naming

Use:

```text
taskId
```

Example:

```text
/api/tasks/:taskId
```

Do not use:

```text
:id
:task_id
:taskID
```

---

# 23. Sprints

**Status: IMPLEMENTED and tested.**

All sprint routes require `Authorization: Bearer <JWT_TOKEN>` and the user must be the owner or a member of the sprint's project.

```text
POST   /api/projects/:projectId/sprints
GET    /api/projects/:projectId/sprints
PUT    /api/sprints/:sprintId
DELETE /api/sprints/:sprintId
```

Sprint fields: `name`, `goal`, `project`, `startDate`, `endDate`, `status`, `createdAt`, `updatedAt`.
Status values: `planned` (default), `active`, `completed`.

## Create sprint

`POST /api/projects/:projectId/sprints` → `201`

```json
{
  "name": "Sprint 1",
  "goal": "Ship login",
  "startDate": "2026-10-01",
  "endDate": "2026-10-14",
  "status": "planned"
}
```

Only `name` is required. Response:

```json
{ "success": true, "message": "Sprint created successfully", "data": { "sprint": { "_id": "...", "name": "Sprint 1", "project": "PROJECT_ID", "status": "planned" } } }
```

## List sprints

`GET /api/projects/:projectId/sprints` → `200`, `data: { "sprints": [] }` (newest first).

## Update sprint

`PUT /api/sprints/:sprintId` → `200`, `data: { "sprint": {} }`.
Any of `name`, `goal`, `startDate`, `endDate`, `status`. `project` cannot be changed.

## Delete sprint

`DELETE /api/sprints/:sprintId` → `200`, `data: {}`.

## Errors

| Status | When |
|---|---|
| 400 | name missing/empty, invalid `status`, invalid date, `endDate` before `startDate` |
| 401 | missing/invalid token |
| 404 | project/sprint not found, malformed id, **or user has no access to the project** |

---

# 24. Documents

**Status: IMPLEMENTED and tested.**

All routes require a JWT and project access (owner or member).

```text
POST   /api/projects/:projectId/documents
GET    /api/projects/:projectId/documents
GET    /api/documents/:documentId
PUT    /api/documents/:documentId
DELETE /api/documents/:documentId
```

Fields: `title`, `content`, `project`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`.
`createdBy` / `updatedBy` are set by the backend from the JWT.

## Create document

`POST /api/projects/:projectId/documents` → `201`

```json
{ "title": "API Spec", "content": "# Overview" }
```

`title` required, `content` optional. Response: `data: { "document": {} }`.

## List / get

- `GET /api/projects/:projectId/documents` → `200`, `data: { "documents": [] }` (most recently updated first)
- `GET /api/documents/:documentId` → `200`, `data: { "document": {} }`

## Update

`PUT /api/documents/:documentId` → `200`, body: `title` and/or `content`. Sets `updatedBy` to the caller.

## Delete

`DELETE /api/documents/:documentId` → `200`, `data: {}`.

## Errors

| Status | When |
|---|---|
| 400 | title missing/empty |
| 401 | missing/invalid token |
| 404 | not found, malformed id, or no project access |

---

# 25. Meetings

**Status: IMPLEMENTED and tested.**

All routes require a JWT and project access (owner or member).

```text
POST   /api/projects/:projectId/meetings
GET    /api/projects/:projectId/meetings
GET    /api/meetings/:meetingId
PUT    /api/meetings/:meetingId
DELETE /api/meetings/:meetingId
```

Fields: `title`, `description`, `project`, `createdBy`, `scheduledAt`, `participants`, `meetingLink`, `notes`, `createdAt`, `updatedAt`.

## Create meeting

`POST /api/projects/:projectId/meetings` → `201`

```json
{
  "title": "Sprint planning",
  "description": "Plan sprint 2",
  "scheduledAt": "2026-10-12T09:00:00Z",
  "participants": ["USER_ID_1", "USER_ID_2"],
  "meetingLink": "https://meet.example.com/abc",
  "notes": ""
}
```

- `title` and `scheduledAt` are required.
- `participants` (optional) must be user ids of the project's owner/members.
- `meetingLink` (optional) must be an `http(s)` URL.
- Each participant other than the creator receives a notification (`type: "meeting"`).

Response: `data: { "meeting": {} }`.

## List / get

- `GET /api/projects/:projectId/meetings` → `200`, `data: { "meetings": [] }` (soonest first)
- `GET /api/meetings/:meetingId` → `200`, `data: { "meeting": {} }`

## Update

`PUT /api/meetings/:meetingId` → `200`. Any of `title`, `description`, `scheduledAt`, `participants`, `meetingLink`, `notes`.
Newly added participants are notified; existing ones are not notified again.

## Delete

`DELETE /api/meetings/:meetingId` → `200`, `data: {}`.

## Errors

| Status | When |
|---|---|
| 400 | missing title/scheduledAt, invalid date, invalid/non-http `meetingLink`, invalid or non-member participants |
| 401 | missing/invalid token |
| 404 | not found, malformed id, or no project access |

---

# 26. Notifications

**Status: IMPLEMENTED and tested.**

Notifications are strictly per user. Another user's notification returns `404` (not `403`) so its existence is not revealed.
Currently the backend creates notifications when a user is added as a meeting participant.

```text
GET    /api/notifications
PUT    /api/notifications/:notificationId/read
DELETE /api/notifications/:notificationId
```

Fields: `user`, `title`, `message`, `type` (`info | task | meeting | project | system`), `isRead`, `createdAt`.

## List

`GET /api/notifications` (optional `?unreadOnly=true`) → `200`

```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": { "notifications": [], "unreadCount": 0 }
}
```

Newest first, max 100. `unreadCount` always counts all unread notifications.

## Mark as read

`PUT /api/notifications/:notificationId/read` → `200`, `data: { "notification": {} }`. No request body.

## Delete

`DELETE /api/notifications/:notificationId` → `200`, `data: {}`.

## Errors

`401` missing/invalid token · `404` not found, malformed id, or belongs to another user.

---

# 27. GitHub Integration

**Status: BASIC version IMPLEMENTED. Advanced features are PLANNED.**

One public GitHub repository can be linked per project. The backend fetches basic info from GitHub's public REST API.
There is **no OAuth**. No GitHub token is stored in the database or returned to the frontend.

```text
GET    /api/projects/:projectId/github
PUT    /api/projects/:projectId/github
DELETE /api/projects/:projectId/github
```

All require a JWT and project access.

## Link a repository

`PUT /api/projects/:projectId/github` → `200`

```json
{ "repositoryUrl": "https://github.com/expressjs/express" }
```

Only `https://github.com/<owner>/<repo>` (optional `.git`) is accepted. Response:

```json
{
  "success": true,
  "message": "GitHub repository linked successfully",
  "data": {
    "integration": {
      "project": "PROJECT_ID",
      "repositoryUrl": "https://github.com/expressjs/express",
      "repositoryOwner": "expressjs",
      "repositoryName": "express"
    }
  }
}
```

Calling it again replaces the linked repository. The repository is not verified at link time.

## Get repository info

`GET /api/projects/:projectId/github` → `200`

Not linked:

```json
{ "success": true, "message": "No GitHub repository linked to this project", "data": { "linked": false, "integration": null, "repository": null } }
```

Linked:

```json
{
  "success": true,
  "message": "GitHub repository fetched successfully",
  "data": {
    "linked": true,
    "integration": {},
    "repository": {
      "fullName": "expressjs/express",
      "description": "...",
      "htmlUrl": "https://github.com/expressjs/express",
      "defaultBranch": "master",
      "language": "JavaScript",
      "stars": 0,
      "forks": 0,
      "openIssues": 0,
      "isPrivate": false,
      "pushedAt": "...",
      "updatedAt": "..."
    }
  }
}
```

## Unlink

`DELETE /api/projects/:projectId/github` → `200`, `data: {}` (`404` if nothing is linked).

## Errors

| Status | When |
|---|---|
| 400 | `repositoryUrl` missing or not a valid `https://github.com/<owner>/<repo>` URL |
| 401 | missing/invalid token |
| 404 | project not found / no access, or (on GET) repository does not exist on GitHub |
| 502 | GitHub unreachable or returned an unexpected response |
| 503 | GitHub API rate limit reached (set `GITHUB_TOKEN` on the server to raise the limit) |

## PLANNED (not implemented)

Commits, issues, pull requests, branches, webhooks, and OAuth / private-repository access per user.

---

# 28. AI Routes

**Status: PLANNED / NOT FULLY IMPLEMENTED.**

The route / controller / service structure and input validation exist. **No LLM provider is integrated**, so the AI endpoints
validate the request and then respond `501`. They never return invented AI output.
The frontend must never call an LLM provider directly.

```text
GET  /api/ai/status
POST /api/ai/task-priority
POST /api/ai/search
```

All require a JWT.

## AI status

`GET /api/ai/status` → `200`

```json
{
  "success": true,
  "message": "AI feature status",
  "data": {
    "llm": { "keyConfigured": false, "implemented": false, "status": "PLANNED" },
    "rag": { "implemented": false, "status": "PLANNED" }
  }
}
```

The frontend can use this to hide or disable AI buttons.

## Task priority suggestion

`POST /api/ai/task-priority`

```json
{
  "title": "Fix login bug",
  "description": "Users cannot log in on Safari",
  "dueDate": "2026-10-20",
  "projectId": "PROJECT_ID"
}
```

`title` is required; the others are optional. If `projectId` is sent, the user must have access to it.

| Status | When |
|---|---|
| 400 | `title` missing, `description` not a string, invalid `dueDate` |
| 401 | missing/invalid token |
| 404 | `projectId` given but project not found / no access |
| 501 | **Current result for every valid request: LLM integration is PLANNED** |

```json
{ "success": false, "message": "AI is not configured (no LLM API key) and the LLM integration is PLANNED" }
```

## Project knowledge search

`POST /api/ai/search` — see section 29.

Not yet created (original planned list): `summarize`, `recommend`, `risk-analysis`.

---

# 29. RAG / Project Knowledge

**Status: PLANNED / NOT IMPLEMENTED (service interface only).**

`src/services/rag/ragService.js` defines the interface (`indexDocument`, `removeDocument`, `search`).
Every method currently throws a `501` error. There is no embedding provider and no vector index.

`POST /api/ai/search`

```json
{ "projectId": "PROJECT_ID", "query": "How does authentication work?" }
```

| Status | When |
|---|---|
| 400 | `projectId` missing/invalid, `query` missing |
| 401 | missing/invalid token |
| 404 | project not found / no access |
| 501 | **Current result for every valid request: vector search is PLANNED** |

Intended architecture (not built):

```text
Project Documents → chunking → embeddings → vector search → LLM → answer
```

React must never connect directly to MongoDB, an LLM provider, or an embedding provider.

---

# 30. Health Check

Backend health endpoint:

```http
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "message": "SynapseOS API is healthy"
}
```

This endpoint can be used to check whether the backend is running.

---

# 31. Root Backend Endpoint

Backend root:

```http
GET /
```

Expected response:

```json
{
  "success": true,
  "message": "SynapseOS Backend is running"
}
```

---

# 32. Standard API Response Structure

Where practical, APIs should follow:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

For errors:

```json
{
  "success": false,
  "message": "Error message"
}
```

The frontend should primarily check:

```javascript
response.data.success
```

and use:

```javascript
response.data.message
```

for user-facing messages when appropriate.

---

# 33. Axios Setup

The frontend should create one central Axios instance.

Example:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export default api;
```

Then use:

```javascript
api.get("/projects");
```

instead of repeatedly writing:

```javascript
axios.get("http://localhost:5000/api/projects");
```

---

# 34. JWT Axios Interceptor

For protected routes, the frontend can use an Axios interceptor.

Example:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

Then protected requests automatically contain:

```http
Authorization: Bearer <token>
```

---

# 35. React API Organization

Recommended frontend structure:

```text
frontend/
└── src/
    ├── api/
    │   ├── axios.js
    │   ├── authApi.js
    │   ├── projectApi.js
    │   ├── taskApi.js
    │   └── githubApi.js
    │
    ├── components/
    ├── pages/
    ├── layouts/
    ├── hooks/
    ├── context/
    ├── utils/
    └── App.jsx
```

This keeps API calls separate from UI components.

---

# 36. Frontend Route Naming

React routes can be:

```text
/login
/register
/dashboard
/projects
/projects/:projectId
/projects/:projectId/tasks
/sprints
/documents
/meetings
/notifications
/github
/ai
```

Frontend route names do not have to exactly match backend API routes, but API calls must follow the backend contract.

---

# 37. Backend vs Frontend Naming

Keep these names consistent.

| Concept | Backend Name | Frontend Variable |
|---|---|---|
| User | `user` | `user` |
| User ID | `_id` | `user._id` |
| Project | `project` | `project` |
| Project ID | `projectId` | `projectId` |
| Task | `task` | `task` |
| Task ID | `taskId` | `taskId` |
| Sprint | `sprint` | `sprint` |
| Sprint ID | `sprintId` | `sprintId` |
| Document | `document` | `document` |
| Document ID | `documentId` | `documentId` |
| Meeting | `meeting` | `meeting` |
| Meeting ID | `meetingId` | `meetingId` |
| Notification | `notification` | `notification` |

---

# 38. MongoDB ID

MongoDB/Mongoose uses:

```text
_id
```

Example:

```json
{
  "_id": "65abc123",
  "name": "SynapseOS"
}
```

Do not assume that the backend automatically returns:

```text
id
```

unless the backend explicitly transforms it.

Frontend should initially use:

```javascript
project._id
```

---

# 39. Date Fields

Backend uses standard MongoDB/Mongoose date fields.

Common fields:

```text
createdAt
updatedAt
```

Frontend should display these dates using its own formatting.

Do not change the database field names to:

```text
created_date
updated_date
```

without discussion.

---

# 40. CORS

The backend allows the frontend to communicate with it through CORS.

Development frontend:

```text
http://localhost:5173
```

Therefore:

```env
CLIENT_URL=http://localhost:5173
```

When frontend is deployed, `CLIENT_URL` will be changed to the deployed frontend URL.

---

# 41. Important Architecture Rule

Never connect React directly to MongoDB.

Incorrect:

```text
React → MongoDB
```

Correct:

```text
React
  ↓
Express REST API
  ↓
Mongoose
  ↓
MongoDB Atlas
```

Similarly, AI services should be accessed through the backend:

```text
React
  ↓
Express
  ↓
AI/RAG service
```

---

# 42. Error Handling

Frontend should handle at least:

```text
400 → Bad request
401 → Unauthorized / token missing or invalid
403 → Forbidden
404 → Resource not found
500 → Server error
```

Example:

```javascript
try {
  const response = await api.get("/projects");
} catch (error) {
  console.error(error);
}
```

Do not assume every failed request is a frontend problem.

Check the HTTP status and backend response.

---

# 43. Loading States

Every API-based page should consider:

```text
Loading
Success
Empty
Error
```

Example:

```text
Loading projects...
       ↓
Projects loaded
```

If there are no projects:

```text
No projects found.
```

If the API fails:

```text
Unable to load projects.
```

---

# 44. API Contract Rule

Before changing any of the following, communicate with the backend developer:

```text
Route names
HTTP methods
Request field names
Response field names
Database field names
Status values
Role values
Authentication format
Environment variable names
```

For example, do NOT independently change:

```text
POST /api/auth/login
```

to:

```text
POST /api/login
```

because frontend and backend will stop matching.

---

# 45. What Frontend Developer Can Build Before Backend Is Complete

The frontend does NOT need to wait for the entire backend.

The frontend can build:

```text
Login UI
Register UI
Dashboard
Sidebar
Navbar
Project cards
Project page
Task board
Task cards
Sprint UI
Documentation UI
Meeting UI
Notification UI
GitHub UI
AI assistant UI
Loading states
Error states
Responsive design
```

For APIs that are not ready yet, use temporary mock data.

Example:

```javascript
const mockProjects = [
  {
    _id: "demo-project-1",
    name: "SynapseOS",
    description: "AI-powered workspace"
  }
];
```

Later replace the mock data with:

```javascript
const response = await api.get("/projects");
```

---

# 46. Do NOT Hardcode API Data Permanently

Temporary:

```javascript
const projects = mockProjects;
```

is okay during UI development.

But before integration, replace it with the real API.

Do not permanently hardcode:

```javascript
const projects = [...]
```

if the data should come from MongoDB.

---

# 47. Recommended API Development Order

Backend development order:

```text
1. Server setup
2. MongoDB connection
3. User model
4. Authentication
5. Project model/API
6. Task model/API
7. Sprint API
8. Document API
9. Meeting API
10. Notification API
11. GitHub integration
12. AI/RAG
```

Frontend can develop simultaneously in approximately the same feature order.

---

# 48. Integration Workflow

When backend authentication is ready:

```text
Frontend Login
      ↓
POST /api/auth/login
      ↓
Backend
      ↓
JWT response
      ↓
Frontend stores token
      ↓
Protected APIs become available
```

When Projects API is ready:

```text
Project UI
      ↓
GET /api/projects
      ↓
Backend
      ↓
MongoDB
      ↓
Project data
      ↓
React UI
```

When Tasks API is ready:

```text
Task Board
      ↓
GET /api/projects/:projectId/tasks
      ↓
Backend
      ↓
MongoDB
      ↓
Tasks
      ↓
React Task Board
```

---

# 49. Local Development

## Backend

Go to:

```text
backend/
```

Install dependencies:

```bash
npm install
```

Run:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

---

# 50. Frontend

Go to:

```text
frontend/
```

Install:

```bash
npm install
```

Run:

```bash
npm run dev
```

Vite normally runs at:

```text
http://localhost:5173
```

Frontend environment:

```env
VITE_API_URL=http://localhost:5000/api
```

---

# 51. Complete Local Architecture

When both applications are running:

```text
┌──────────────────────────────┐
│        React Frontend        │
│    http://localhost:5173     │
└──────────────┬───────────────┘
               │
               │ Axios
               ↓
┌──────────────────────────────┐
│      Express Backend         │
│    http://localhost:5000     │
│                              │
│        /api/...              │
└──────────────┬───────────────┘
               │
               │ Mongoose
               ↓
┌──────────────────────────────┐
│       MongoDB Atlas          │
│        synapseos DB          │
└──────────────────────────────┘
```

---

# 52. GitHub Integration Architecture

```text
React Frontend
      ↓
SynapseOS Backend
      ↓
GitHub REST API
      ↓
GitHub data
      ↓
Backend
      ↓
Frontend
```

GitHub credentials/tokens must remain on the backend where applicable.

Never expose private GitHub tokens in:

```text
React code
frontend/.env
public/
GitHub repository
```

---

# 53. Security Rules

NEVER commit:

```text
.env
MongoDB password
JWT secret
GitHub private token
LLM API key
Cloud credentials
```

Never write secrets directly in:

```javascript
const secret = "my-real-secret";
```

Use environment variables instead.

---

# 54. Important Variables That Must Match

These are especially important for frontend/backend integration.

## Backend

```env
PORT=5000
CLIENT_URL=http://localhost:5173
```

## Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

The relationship is:

```text
Frontend:
http://localhost:5173

        ↓

Backend:
http://localhost:5000

        ↓

API:
http://localhost:5000/api
```

---

# 55. Naming Rules Summary

Use:

```text
projectId
taskId
sprintId
documentId
meetingId
notificationId
userId
```

Use status values:

```text
todo
in_progress
completed
```

Use priority values:

```text
low
medium
high
```

Use roles:

```text
admin
manager
member
```

Use API base:

```text
/api
```

Use frontend environment variable:

```text
VITE_API_URL
```

Use backend environment variable:

```text
CLIENT_URL
```

Use JWT header:

```text
Authorization: Bearer <token>
```

---

# 56. Current Backend Status

# 56. Current Backend Status

### Implemented / Initial Setup

```text
✓ Node.js
✓ Express.js
✓ MongoDB Atlas connection
✓ Mongoose
✓ dotenv
✓ CORS
✓ Helmet
✓ Basic server
✓ / endpoint
✓ /api/health endpoint
✓ User model
✓ User registration
✓ User login
✓ JWT authentication
✓ JWT middleware
✓ /api/auth/me
✓ Role-based authorization
✓ Project model
✓ POST /api/projects
✓ GET /api/projects
```

### Planned / To Be Implemented

```text
□ GET /api/projects/:projectId
□ PUT /api/projects/:projectId
□ DELETE /api/projects/:projectId
□ Task APIs
□ Sprint APIs
□ Document APIs
□ Meeting APIs
□ Notification APIs
□ GitHub integration
□ AI APIs
□ RAG
□ Vector search
```

**Important:** A route documented above is a planned contract unless it is marked as implemented in the backend code.

# 57. If an API Changes

If the backend developer changes:

```text
Route
Request body
Response structure
Field name
Status value
Authentication
```

update this document immediately.

Example:

If:

```text
POST /api/projects
```

changes to:

```text
POST /api/project
```

the frontend developer must be informed before making the change.

---

# 58. Communication Rule Between Frontend and Backend

For every new API, backend developer should provide:

```text
1. HTTP method
2. Endpoint
3. Authentication required?
4. Request body
5. Query parameters
6. Path parameters
7. Success response
8. Error response
9. Possible status codes
```

Example:

```text
Method:
POST

Endpoint:
/api/projects

Authentication:
Required

Request:
{
  "name": "SynapseOS",
  "description": "AI workspace"
}

Success:
{
  "success": true,
  "message": "Project created",
  "data": {...}
}
```

This keeps frontend and backend synchronized.

---

# 59. Final Integration Rule

The most important rule:

```text
FRONTEND MUST NOT GUESS THE BACKEND.
BACKEND MUST NOT ASSUME THE FRONTEND.
BOTH MUST FOLLOW THIS API CONTRACT.
```

The frontend handles:

```text
UI
User interaction
Forms
Routing
Displaying data
Loading states
Error states
Calling APIs
```

The backend handles:

```text
Authentication
Authorization
Business logic
Database
API validation
Security
GitHub integration
AI/RAG
```

The database handles:

```text
Persistent project data
Users
Projects
Tasks
Sprints
Documents
Meetings
Notifications
```

Final architecture:

```text
                 SYNAPSEOS
                     │
        ┌────────────┴────────────┐
        │                         │
     FRONTEND                  BACKEND
     React                    Node.js
     Vite                     Express
     Tailwind                 Mongoose
        │                         │
        │       REST API           │
        └────────────┬────────────┘
                     │
                     ↓
                MongoDB Atlas
                     │
          ┌──────────┴──────────┐
          │                     │
       GitHub API            AI / RAG
```

---

# 60. Quick Reference

### Backend

```text
Node.js
Express.js
MongoDB Atlas
Mongoose
JWT
```

### Local Backend

```text
http://localhost:5000
```

### API

```text
http://localhost:5000/api
```

### Health Check

```text
GET /api/health
```

### Frontend

```text
React + Vite
```

### Frontend URL

```text
http://localhost:5173
```

### Frontend Environment

```env
VITE_API_URL=http://localhost:5000/api
```

### Authentication

```text
Authorization: Bearer <JWT_TOKEN>
```

### Main API Groups

```text
/api/auth
/api/users
/api/projects
/api/tasks
/api/sprints
/api/documents
/api/meetings
/api/notifications
/api/github
/api/ai
```

### Main IDs

```text
userId
projectId
taskId
sprintId
documentId
meetingId
notificationId
```

### Main Status Values

```text
todo
in_progress
completed
```

### Roles

```text
admin
manager
member
```

### Database

```text
MongoDB Atlas
Database: synapseos
```

## Get Single Project API

Status: Implemented

GET /api/projects/:projectId

Authentication:
Authorization: Bearer <JWT_TOKEN>

Route parameter:
projectId — MongoDB ID of the project.

Request body:
None.

Success response:
{
  "success": true,
  "message": "Project fetched successfully",
  "data": {
    "project": {
      "_id": "...",
      "name": "...",
      "description": "...",
      "owner": "...",
      "members": [],
      "status": "planning",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}

Error response:
{
  "success": false,
  "message": "Project not found"
}

Access:
The authenticated user must be the project owner or a project member.


## Update Project

### Endpoint

PUT /api/projects/:projectId

### Authentication

Requires JWT authentication.

Header:

Authorization: Bearer <JWT_TOKEN>

### Request Body

Allowed fields:

- name
- description
- members
- status
- startDate
- endDate

The `owner` field cannot be updated.

### Example Request

PUT /api/projects/6ac7f26f0fbfad13252f1315

```json
{
  "name": "SynapseOS AI Workspace",
  "description": "AI-powered workspace for teams and students",
  "status": "active",
  "startDate": "2026-10-09",
  "endDate": "2027-05-31",
  "members": [
    "USER_ID"
  ]
}

Success Response
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {}
  }
}

Invalid Project Data
{
  "success": false,
  "message": "Invalid project data"
}

Status code: 400
Project Not Found
{
  "success": false,
  "message": "Project not found"
}

Status code: 404

Add it and reply **`done`**.

Then we immediately start **DELETE Project**.



 **Task CRUD is working.**

We now have all 4 core Task APIs:

```text
POST   /api/projects/:projectId/tasks  ✅
GET    /api/projects/:projectId/tasks  ✅
PUT    /api/tasks/:taskId              ✅
DELETE /api/tasks/:taskId              ✅
```



## Step 16 — Action 13: Document Tasks

Open:

```text
docs/BACKEND_GUIDELINES.md
```

Add this at the end:

```md
## Task APIs

### Create Task

POST /api/projects/:projectId/tasks

Authentication: Required

Request body:

```json
{
  "title": "Build Task API",
  "description": "Implement task APIs",
  "status": "todo",
  "priority": "high"
}
```

Allowed status values:

- todo
- in_progress
- completed

Allowed priority values:

- low
- medium
- high

Success response:

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {}
  }
}
```

### Get Project Tasks

GET /api/projects/:projectId/tasks

Authentication: Required

Success response:

```json
{
  "success": true,
  "message": "Tasks fetched successfully",
  "data": {
    "tasks": []
  }
}
```

### Update Task

PUT /api/tasks/:taskId

Authentication: Required

Allowed fields:

- title
- description
- assignedTo
- status
- priority
- dueDate

Success response:

```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {}
  }
}
```

### Delete Task

DELETE /api/tasks/:taskId

Authentication: Required

Success response:

```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": {}
}
```
```

