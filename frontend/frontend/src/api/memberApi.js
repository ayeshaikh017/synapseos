import api from "./axios";

export const memberApi = {
  getMembers: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },

  // Adds an already-registered user (by email) to the project. Owner only.
  addMember: async (projectId, email) => {
    const response = await api.post(`/projects/${projectId}/members`, { email });
    return response.data;
  },
};
