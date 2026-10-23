const express = require("express");
const { getProjectAnalytics } = require("../controllers/analyticsController");
const { getProjectMembers, addProjectMember } = require("../controllers/memberController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/projects/:projectId/analytics", authMiddleware, getProjectAnalytics);

// Project team (used by the Tasks page assignee list and "Add member")
router.get("/projects/:projectId/members", authMiddleware, getProjectMembers);
router.post("/projects/:projectId/members", authMiddleware, addProjectMember);

module.exports = router;
