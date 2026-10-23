const Task = require("../models/Task");
const Document = require("../models/Document");
const Meeting = require("../models/Meeting");
const Sprint = require("../models/Sprint");
const User = require("../models/User");
const GithubIntegration = require("../models/GithubIntegration");
const { buildAnalytics } = require("../services/analytics/analyticsService");
const { fetchContributors } = require("../services/analytics/githubContributors");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const { findAccessibleProject, projectUserIds } = require("../utils/projectAccess");

const ALLOWED_RANGES = { "7": 7, "30": 30, "90": 90, all: null };

// GET /api/projects/:projectId/analytics?range=7|30|90|all   (default 30)
const getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const rangeParam = String(req.query.range || "30");

    if (!(rangeParam in ALLOWED_RANGES)) {
      return sendError(res, 400, "range must be one of 7, 30, 90, all");
    }

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const [tasks, documents, meetings, sprints, integration] = await Promise.all([
      Task.find({ project: projectId }).lean(),
      Document.find({ project: projectId }).select("-content").lean(),
      Meeting.find({ project: projectId }).select("-notes").lean(),
      Sprint.find({ project: projectId }).lean(),
      GithubIntegration.findOne({ project: projectId }).lean()
    ]);

    // Every user that appears anywhere in this project (members + historic authors/assignees).
    const userIds = new Set(projectUserIds(project));
    const add = (v) => v && userIds.add(String(v));
    tasks.forEach((t) => add(t.assignedTo));
    documents.forEach((d) => { add(d.createdBy); add(d.updatedBy); });
    meetings.forEach((m) => { add(m.createdBy); (m.participants || []).forEach(add); });

    const users = await User.find({ _id: { $in: [...userIds] } })
      .select("name email avatar")
      .lean();

    const analytics = buildAnalytics({
      project: project.toObject(),
      users,
      tasks,
      documents,
      meetings,
      sprints,
      rangeDays: ALLOWED_RANGES[rangeParam]
    });

    analytics.project = { id: String(project._id), name: project.name, status: project.status };

    analytics.github = null;
    if (integration) {
      const contributors = await fetchContributors(integration.repositoryOwner, integration.repositoryName);
      analytics.github = {
        repository: `${integration.repositoryOwner}/${integration.repositoryName}`,
        contributors // null when GitHub could not be reached
      };
    }

    return sendSuccess(res, 200, "Project analytics fetched successfully", { analytics });
  } catch (error) {
    return handleError(res, error, "Failed to fetch project analytics");
  }
};

module.exports = { getProjectAnalytics };
