import api from "./axios";

export const analyticsApi = {
  // range: "7" | "30" | "90" | "all"
  getProjectAnalytics: async (projectId, range = "30") => {
    const response = await api.get(`/projects/${projectId}/analytics`, {
      params: { range },
    });
    return response.data;
  },
};
