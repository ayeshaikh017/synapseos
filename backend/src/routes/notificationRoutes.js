const express = require("express");

const {
  getNotifications,
  markNotificationRead,
  deleteNotification
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/notifications", authMiddleware, getNotifications);
router.put("/notifications/:notificationId/read", authMiddleware, markNotificationRead);
router.delete("/notifications/:notificationId", authMiddleware, deleteNotification);

module.exports = router;
