import api from "./axios";

export const authApi = {
  register: async (payload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  login: async (payload) => {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },

  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};