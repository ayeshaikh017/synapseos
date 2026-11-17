
import api from "./axios";

export const projectApi = {
  getProjects: async () => {
    const response = await api.get("/projects");
    return response.data;
  },

  getProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  createProject: async (payload) => {
    const response = await api.post("/projects", payload);
    return response.data;
  },

  updateProject: async (projectId, payload) => {
    const response = await api.put(`/projects/${projectId}`, payload);
    return response.data;
  },

  deleteProject: async (projectId) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },
};
