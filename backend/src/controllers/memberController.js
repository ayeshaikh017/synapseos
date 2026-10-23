const Project = require("../models/Project");
const User = require("../models/User");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const { findAccessibleProject, projectUserIds } = require("../utils/projectAccess");

const listMembers = async (project) => {
  const ownerId = String(project.owner);
  const users = await User.find({ _id: { $in: projectUserIds(project) } })
    .select("name email avatar")
    .lean();

  return users
    .map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      avatar: u.avatar || "",
      projectRole: String(u._id) === ownerId ? "owner" : "member"
    }))
    .sort((a, b) => (a.projectRole === "owner" ? -1 : b.projectRole === "owner" ? 1 : a.name.localeCompare(b.name)));
};

// GET /api/projects/:projectId/members
const getProjectMembers = async (req, res) => {
  try {
    const project = await findAccessibleProject(req.params.projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    return sendSuccess(res, 200, "Project members fetched successfully", {
      members: await listMembers(project)
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch project members");
  }
};

// POST /api/projects/:projectId/members   body: { email }   (project owner only)
const addProjectMember = async (req, res) => {
  try {
    const project = await findAccessibleProject(req.params.projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    if (String(project.owner) !== String(req.user.userId)) {
      return sendError(res, 403, "Only the project owner can add members");
    }

    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) return sendError(res, 400, "email is required");

    const user = await User.findOne({ email }).select("_id");
    if (!user) return sendError(res, 404, "No registered user with that email");

    if (projectUserIds(project).includes(String(user._id))) {
      return sendError(res, 409, "That user is already in this project");
    }

    await Project.updateOne({ _id: project._id }, { $addToSet: { members: user._id } });

    const updated = await findAccessibleProject(req.params.projectId, req.user.userId);
    return sendSuccess(res, 201, "Member added successfully", {
      members: await listMembers(updated)
    });
  } catch (error) {
    return handleError(res, error, "Failed to add project member");
  }
};

module.exports = { getProjectMembers, addProjectMember };
