const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["info", "task", "meeting", "project", "system"],
      default: "info"
    },
    isRead: { type: Boolean, default: false }
  },
  // Notifications are only created and marked read, never edited.
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Notification", notificationSchema);
