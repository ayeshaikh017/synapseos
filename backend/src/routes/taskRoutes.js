const express = require("express");

const {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/projects/:projectId/tasks",
  authMiddleware,
  createTask
);

router.get(
  "/projects/:projectId/tasks",
  authMiddleware,
  getProjectTasks
);

router.put(
  "/tasks/:taskId",
  authMiddleware,
  updateTask
);

router.delete(
  "/tasks/:taskId",
  authMiddleware,
  deleteTask
);

module.exports = router;