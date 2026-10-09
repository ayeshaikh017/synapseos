const Project = require("../models/Project");

const createProject = async (req, res) => {
  try {
    const { name, description, members, status, startDate, endDate } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user.userId,
      members: members || [],
      status: status || "planning",
      startDate,
      endDate
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        project
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create project"
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    const projects = await Project.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      data: {
        projects
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects"
    });
  }
};
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: userId },
        { members: userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project fetched successfully",
      data: {
        project
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project"
    });
  }
};
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const { name, description, members, status, startDate, endDate } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: userId },
        { members: userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (members !== undefined) project.members = members;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: {
        project
      }
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project data"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update project"
    });
  }
};
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findOne({
      _id: projectId,
      owner: userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you are not the owner"
      });
    }

    await Project.deleteOne({ _id: projectId });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: {}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete project"
    });
  }
};
module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};