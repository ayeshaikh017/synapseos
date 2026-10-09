const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/:projectId", authMiddleware, getProjectById);
router.put("/:projectId", authMiddleware, updateProject);
router.delete("/:projectId", authMiddleware, deleteProject);

module.exports = router;