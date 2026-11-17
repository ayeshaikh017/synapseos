import api from "./axios";

export const taskApi = {
  getProjectTasks: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  createTask: async (projectId, payload) => {
    const response = await api.post(`/projects/${projectId}/tasks`, payload);
    return response.data;
  },

  updateTask: async (taskId, payload) => {
    const response = await api.put(`/tasks/${taskId}`, payload);
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
};
