const Notification = require("../models/Notification");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const { isValidId } = require("../utils/projectAccess");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filter = { user: userId };

    if (req.query.unreadOnly === "true") filter.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(100),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);

    return sendSuccess(res, 200, "Notifications fetched successfully", {
      notifications,
      unreadCount
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch notifications");
  }
};

// The query always includes `user`, so another user's notification
// is indistinguishable from a missing one (404, no information leak).
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!isValidId(notificationId)) {
      return sendError(res, 404, "Notification not found");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) return sendError(res, 404, "Notification not found");

    return sendSuccess(res, 200, "Notification marked as read", { notification });
  } catch (error) {
    return handleError(res, error, "Failed to update notification");
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!isValidId(notificationId)) {
      return sendError(res, 404, "Notification not found");
    }

    const result = await Notification.deleteOne({
      _id: notificationId,
      user: req.user.userId
    });

    if (result.deletedCount === 0) {
      return sendError(res, 404, "Notification not found");
    }

    return sendSuccess(res, 200, "Notification deleted successfully", {});
  } catch (error) {
    return handleError(res, error, "Failed to delete notification");
  }
};

module.exports = { getNotifications, markNotificationRead, deleteNotification };
