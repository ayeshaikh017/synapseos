const express = require("express");

const {
  getAiStatus,
  suggestTaskPriority,
  searchProjectKnowledge
} = require("../controllers/aiController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/status", authMiddleware, getAiStatus);
router.post("/task-priority", authMiddleware, suggestTaskPriority);
router.post("/search", authMiddleware, searchProjectKnowledge);

module.exports = router;
