const express = require("express");

const {
  createSprint,
  getProjectSprints,
  updateSprint,
  deleteSprint
} = require("../controllers/sprintController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/projects/:projectId/sprints", authMiddleware, createSprint);
router.get("/projects/:projectId/sprints", authMiddleware, getProjectSprints);
router.put("/sprints/:sprintId", authMiddleware, updateSprint);
router.delete("/sprints/:sprintId", authMiddleware, deleteSprint);

module.exports = router;
