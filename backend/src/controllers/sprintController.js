const Sprint = require("../models/Sprint");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const { isValidId, findAccessibleProject } = require("../utils/projectAccess");

const FIELDS = ["name", "goal", "startDate", "endDate", "status"];

const pick = (body) => {
  const out = {};
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) out[f] = body[f];
  });
  return out;
};

const createSprint = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return sendError(res, 400, "Sprint name is required");
    }

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const sprint = await Sprint.create({ ...pick(req.body), project: projectId });

    return sendSuccess(res, 201, "Sprint created successfully", { sprint });
  } catch (error) {
    return handleError(res, error, "Failed to create sprint", "Invalid sprint data");
  }
};

const getProjectSprints = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const sprints = await Sprint.find({ project: projectId }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Sprints fetched successfully", { sprints });
  } catch (error) {
    return handleError(res, error, "Failed to fetch sprints");
  }
};

// Loads a sprint and verifies the user can access its project.
const loadSprint = async (req) => {
  const { sprintId } = req.params;
  if (!isValidId(sprintId)) return null;

  const sprint = await Sprint.findById(sprintId);
  if (!sprint) return null;

  const project = await findAccessibleProject(sprint.project, req.user.userId);
  return project ? sprint : null;
};

const updateSprint = async (req, res) => {
  try {
    const sprint = await loadSprint(req);
    if (!sprint) return sendError(res, 404, "Sprint not found");

    if (
      req.body.name !== undefined &&
      (typeof req.body.name !== "string" || !req.body.name.trim())
    ) {
      return sendError(res, 400, "Sprint name cannot be empty");
    }

    // `project` is deliberately not updatable.
    Object.assign(sprint, pick(req.body));
    await sprint.save();

    return sendSuccess(res, 200, "Sprint updated successfully", { sprint });
  } catch (error) {
    return handleError(res, error, "Failed to update sprint", "Invalid sprint data");
  }
};

const deleteSprint = async (req, res) => {
  try {
    const sprint = await loadSprint(req);
    if (!sprint) return sendError(res, 404, "Sprint not found");

    await Sprint.deleteOne({ _id: sprint._id });

    return sendSuccess(res, 200, "Sprint deleted successfully", {});
  } catch (error) {
    return handleError(res, error, "Failed to delete sprint");
  }
};

module.exports = { createSprint, getProjectSprints, updateSprint, deleteSprint };
