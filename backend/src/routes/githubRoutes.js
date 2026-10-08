const express = require("express");

const {
  getProjectGithub,
  linkProjectGithub,
  unlinkProjectGithub
} = require("../controllers/githubController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/projects/:projectId/github", authMiddleware, getProjectGithub);
router.put("/projects/:projectId/github", authMiddleware, linkProjectGithub);
router.delete("/projects/:projectId/github", authMiddleware, unlinkProjectGithub);

module.exports = router;
