import api from "./axios";

export const sprintApi = {
  getProjectSprints: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/sprints`);
    return response.data;
  },

  createSprint: async (projectId, payload) => {
    const response = await api.post(`/projects/${projectId}/sprints`, payload);
    return response.data;
  },

  updateSprint: async (sprintId, payload) => {
    const response = await api.put(`/sprints/${sprintId}`, payload);
    return response.data;
  },

  deleteSprint: async (sprintId) => {
    const response = await api.delete(`/sprints/${sprintId}`);
    return response.data;
  },

  setSprintTasks: async (sprintId, taskIds) => {
    const response = await api.put(`/sprints/${sprintId}/tasks`, { taskIds });
    return response.data;
  },

  // withAi=true also asks Gemini for a written planning insight.
  getInsight: async (projectId, withAi = false) => {
    const response = await api.get(`/projects/${projectId}/sprints/insight`, {
      params: withAi ? { ai: "true" } : {},
      timeout: withAi ? 60000 : 15000,
    });
    return response.data;
  },
};
