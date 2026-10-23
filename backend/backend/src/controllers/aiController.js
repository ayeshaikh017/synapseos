const aiService = require("../services/ai/aiService");
const llmClient = require("../services/ai/llmClient");
const ragService = require("../services/rag/ragService");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const { isValidId, findAccessibleProject } = require("../utils/projectAccess");

// Service stubs signal "PLANNED" with statusCode 501.
const handleServiceError = (res, error, fallback) => {
  if (error && error.statusCode === 501) {
    return sendError(res, 501, error.message);
  }
  return handleError(res, error, fallback);
};

// GET /api/ai/status  – honest feature report for the frontend.
const getAiStatus = (req, res) =>
  sendSuccess(res, 200, "AI feature status", {
    llm: {
      keyConfigured: llmClient.isConfigured(),
      implemented: false,
      status: "PLANNED"
    },
    rag: { implemented: false, status: "PLANNED" }
  });

// POST /api/ai/task-priority
// body: { title, description?, dueDate?, projectId? }
const suggestTaskPriority = async (req, res) => {
  try {
    const { title, description, dueDate, projectId } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return sendError(res, 400, "title is required");
    }
    if (description !== undefined && typeof description !== "string") {
      return sendError(res, 400, "description must be a string");
    }
    if (dueDate !== undefined && Number.isNaN(new Date(dueDate).getTime())) {
      return sendError(res, 400, "dueDate must be a valid date");
    }

    if (projectId !== undefined) {
      const project = await findAccessibleProject(projectId, req.user.userId);
      if (!project) return sendError(res, 404, "Project not found");
    }

    const result = await aiService.suggestTaskPriority({ title, description, dueDate });

    return sendSuccess(res, 200, "Task priority suggested", result);
  } catch (error) {
    return handleServiceError(res, error, "AI request failed");
  }
};

// POST /api/ai/search
// body: { projectId, query }
const searchProjectKnowledge = async (req, res) => {
  try {
    const { projectId, query } = req.body;

    if (!projectId || !isValidId(projectId)) {
      return sendError(res, 400, "A valid projectId is required");
    }
    if (!query || typeof query !== "string" || !query.trim()) {
      return sendError(res, 400, "query is required");
    }

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const results = await ragService.search(projectId, query.trim());

    return sendSuccess(res, 200, "Search completed", { results });
  } catch (error) {
    return handleServiceError(res, error, "Search request failed");
  }
};

module.exports = { getAiStatus, suggestTaskPriority, searchProjectKnowledge };
