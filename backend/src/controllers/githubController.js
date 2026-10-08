const GithubIntegration = require("../models/GithubIntegration");
const { parseRepositoryUrl, fetchRepository } = require("../services/github/githubService");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const { findAccessibleProject } = require("../utils/projectAccess");

const UPSTREAM_STATUS = { NOT_FOUND: 404, RATE_LIMITED: 503, UPSTREAM: 502 };

// GET /api/projects/:projectId/github
const getProjectGithub = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const integration = await GithubIntegration.findOne({ project: projectId });

    if (!integration) {
      return sendSuccess(res, 200, "No GitHub repository linked to this project", {
        linked: false,
        integration: null,
        repository: null
      });
    }

    try {
      const repository = await fetchRepository(
        integration.repositoryOwner,
        integration.repositoryName
      );

      return sendSuccess(res, 200, "GitHub repository fetched successfully", {
        linked: true,
        integration,
        repository
      });
    } catch (githubError) {
      const status = UPSTREAM_STATUS[githubError.code] || 502;
      return sendError(res, status, githubError.message);
    }
  } catch (error) {
    return handleError(res, error, "Failed to fetch GitHub repository");
  }
};

// PUT /api/projects/:projectId/github   body: { repositoryUrl }
const linkProjectGithub = async (req, res) => {
  try {
    const { projectId } = req.params;

    const parsed = parseRepositoryUrl(req.body.repositoryUrl);
    if (!parsed) {
      return sendError(
        res,
        400,
        "repositoryUrl must look like https://github.com/<owner>/<repository>"
      );
    }

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const integration = await GithubIntegration.findOneAndUpdate(
      { project: projectId },
      {
        project: projectId,
        repositoryUrl: parsed.repositoryUrl,
        repositoryOwner: parsed.owner,
        repositoryName: parsed.name,
        linkedBy: req.user.userId
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return sendSuccess(res, 200, "GitHub repository linked successfully", {
      integration
    });
  } catch (error) {
    return handleError(res, error, "Failed to link GitHub repository", "Invalid repository data");
  }
};

// DELETE /api/projects/:projectId/github
const unlinkProjectGithub = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const result = await GithubIntegration.deleteOne({ project: projectId });
    if (result.deletedCount === 0) {
      return sendError(res, 404, "No GitHub repository linked to this project");
    }

    return sendSuccess(res, 200, "GitHub repository unlinked successfully", {});
  } catch (error) {
    return handleError(res, error, "Failed to unlink GitHub repository");
  }
};

module.exports = { getProjectGithub, linkProjectGithub, unlinkProjectGithub };
