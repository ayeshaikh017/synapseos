import api from "./axios";

export const documentApi = {
  getProjectDocuments: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/documents`);
    return response.data;
  },

  createDocument: async (projectId, payload) => {
    const response = await api.post(`/projects/${projectId}/documents`, payload);
    return response.data;
  },

  updateDocument: async (documentId, payload) => {
    const response = await api.put(`/documents/${documentId}`, payload);
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },
};
