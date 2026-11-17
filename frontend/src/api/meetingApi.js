import api from "./axios";

export const meetingApi = {
  getProjectMeetings: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/meetings`);
    return response.data;
  },

  createMeeting: async (projectId, payload) => {
    const response = await api.post(`/projects/${projectId}/meetings`, payload);
    return response.data;
  },

  updateMeeting: async (meetingId, payload) => {
    const response = await api.put(`/meetings/${meetingId}`, payload);
    return response.data;
  },

  deleteMeeting: async (meetingId) => {
    const response = await api.delete(`/meetings/${meetingId}`);
    return response.data;
  },

  generateSummary: async (meetingId) => {
    const response = await api.post(`/meetings/${meetingId}/summary`, {}, { timeout: 60000 });
    return response.data;
  },
};
