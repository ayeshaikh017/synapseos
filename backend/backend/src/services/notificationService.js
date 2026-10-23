const Notification = require("../models/Notification");

// Creates notifications for a list of user ids.
// Never throws: a notification failure must not break the main request.
const notifyUsers = async (userIds, { title, message = "", type = "info" }) => {
  try {
    const unique = [...new Set(userIds.map(String))];
    if (unique.length === 0) return;

    await Notification.insertMany(
      unique.map((user) => ({ user, title, message, type }))
    );
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

module.exports = { notifyUsers };
