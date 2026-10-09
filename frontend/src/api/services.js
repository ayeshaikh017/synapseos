import api from "./axios";

// Every backend response looks like { success, message, data }.
// These helpers return `data` directly.
const unwrap = (promise) => promise.then((response) => response.data?.data ?? {});

export const projectApi = {
  list: () => unwrap(api.get("/projects")),
  get: (id) => unwrap(api.get(`/projects/${id}`)),
  create: (payload) => unwrap(api.post("/projects", payload)),
  update: (id, payload) => unwrap(api.put(`/projects/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/projects/${id}`)),
};

export const taskApi = {
  list: (projectId) => unwrap(api.get(`/projects/${projectId}/tasks`)),
  create: (projectId, payload) => unwrap(api.post(`/projects/${projectId}/tasks`, payload)),
  update: (taskId, payload) => unwrap(api.put(`/tasks/${taskId}`, payload)),
  remove: (taskId) => unwrap(api.delete(`/tasks/${taskId}`)),
};

export const sprintApi = {
  list: (projectId) => unwrap(api.get(`/projects/${projectId}/sprints`)),
  create: (projectId, payload) => unwrap(api.post(`/projects/${projectId}/sprints`, payload)),
  update: (sprintId, payload) => unwrap(api.put(`/sprints/${sprintId}`, payload)),
  remove: (sprintId) => unwrap(api.delete(`/sprints/${sprintId}`)),
};

export const documentApi = {
  list: (projectId) => unwrap(api.get(`/projects/${projectId}/documents`)),
  get: (documentId) => unwrap(api.get(`/documents/${documentId}`)),
  create: (projectId, payload) => unwrap(api.post(`/projects/${projectId}/documents`, payload)),
  update: (documentId, payload) => unwrap(api.put(`/documents/${documentId}`, payload)),
  remove: (documentId) => unwrap(api.delete(`/documents/${documentId}`)),
};

export const meetingApi = {
  list: (projectId) => unwrap(api.get(`/projects/${projectId}/meetings`)),
  get: (meetingId) => unwrap(api.get(`/meetings/${meetingId}`)),
  create: (projectId, payload) => unwrap(api.post(`/projects/${projectId}/meetings`, payload)),
  update: (meetingId, payload) => unwrap(api.put(`/meetings/${meetingId}`, payload)),
  remove: (meetingId) => unwrap(api.delete(`/meetings/${meetingId}`)),
};

export const notificationApi = {
  list: (unreadOnly = false) =>
    unwrap(api.get("/notifications", { params: unreadOnly ? { unreadOnly: true } : {} })),
  markRead: (notificationId) => unwrap(api.put(`/notifications/${notificationId}/read`)),
  remove: (notificationId) => unwrap(api.delete(`/notifications/${notificationId}`)),
};

export const githubApi = {
  get: (projectId) => unwrap(api.get(`/projects/${projectId}/github`)),
  link: (projectId, repositoryUrl) =>
    unwrap(api.put(`/projects/${projectId}/github`, { repositoryUrl })),
  unlink: (projectId) => unwrap(api.delete(`/projects/${projectId}/github`)),
};

export const aiApi = {
  status: () => unwrap(api.get("/ai/status")),
  taskPriority: (payload) => unwrap(api.post("/ai/task-priority", payload)),
  search: (projectId, query) => unwrap(api.post("/ai/search", { projectId, query })),
};

// Loads everything that belongs to one project. A failed part becomes an
// empty list so one broken endpoint never blanks a whole page.
export const loadProjectBundle = async (projectId) => {
  const safe = (promise, key) => promise.then((d) => d[key] || []).catch(() => []);

  const [tasks, sprints, documents, meetings] = await Promise.all([
    safe(taskApi.list(projectId), "tasks"),
    safe(sprintApi.list(projectId), "sprints"),
    safe(documentApi.list(projectId), "documents"),
    safe(meetingApi.list(projectId), "meetings"),
  ]);

  return { tasks, sprints, documents, meetings };
};
