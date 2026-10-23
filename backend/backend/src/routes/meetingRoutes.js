const express = require("express");

const {
  createMeeting,
  getProjectMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting
} = require("../controllers/meetingController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/projects/:projectId/meetings", authMiddleware, createMeeting);
router.get("/projects/:projectId/meetings", authMiddleware, getProjectMeetings);
router.get("/meetings/:meetingId", authMiddleware, getMeetingById);
router.put("/meetings/:meetingId", authMiddleware, updateMeeting);
router.delete("/meetings/:meetingId", authMiddleware, deleteMeeting);

module.exports = router;
