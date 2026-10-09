// ============================================================
// STATUS: PLANNED / NOT IMPLEMENTED
// ------------------------------------------------------------
// Service interface for future RAG over project documents:
//   Documents -> chunking -> embeddings -> vector search -> LLM
// No embedding provider or vector index is configured, so every
// method below rejects with HTTP 501. Nothing is faked.
// ============================================================

const notImplemented = (what) => {
  const err = new Error(`${what} is PLANNED and not implemented yet`);
  err.statusCode = 501;
  throw err;
};

// Index (or re-index) one document's chunks for a project.
const indexDocument = async (/* projectId, document */) =>
  notImplemented("Document indexing");

// Remove a document's chunks from the index.
const removeDocument = async (/* projectId, documentId */) =>
  notImplemented("Index removal");

// Return the most relevant chunks for a query inside one project.
const search = async (/* projectId, query, { limit } */) =>
  notImplemented("Vector search");

const isConfigured = () => false;

module.exports = { indexDocument, removeDocument, search, isConfigured };
