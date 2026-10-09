const Task = require("../models/Task");
const Project = require("../models/Project");

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task title is required"
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: req.user.userId },
        { members: req.user.userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo,
      status: status || "todo",
      priority: priority || "medium",
      dueDate
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        task
      }
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid task data"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create task"
    });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: req.user.userId },
        { members: req.user.userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const tasks = await Task.find({
      project: projectId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: {
        tasks
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks"
    });
  }
};
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const project = await Project.findOne({
      _id: task.project,
      $or: [
        { owner: req.user.userId },
        { members: req.user.userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const {
      title,
      description,
      assignedTo,
      status,
      priority,
      dueDate
    } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: {
        task
      }
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid task data"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update task"
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const project = await Project.findOne({
      _id: task.project,
      $or: [
        { owner: req.user.userId },
        { members: req.user.userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    await Task.deleteOne({ _id: taskId });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: {}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete task"
    });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask
};