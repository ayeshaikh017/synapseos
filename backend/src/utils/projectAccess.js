const mongoose = require("mongoose");
const Project = require("../models/Project");

// Strict check: exactly a 24-char hex string / ObjectId.
const isValidId = (id) => mongoose.isObjectIdOrHexString(id);

// Same access rule used by the existing project/task controllers:
// the user must be the project owner OR a member.
// Returns the project, or null when it doesn't exist / user has no access.
const findAccessibleProject = async (projectId, userId) => {
  if (!isValidId(projectId)) return null;

  return Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }]
  });
};

const projectUserIds = (project) => [
  String(project.owner),
  ...project.members.map((m) => String(m))
];

module.exports = { isValidId, findAccessibleProject, projectUserIds };
