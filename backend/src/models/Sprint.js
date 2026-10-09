const mongoose = require("mongoose");

const sprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    goal: { type: String, trim: true, default: "" },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    startDate: { type: Date },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || !this.startDate || value >= this.startDate;
        },
        message: "endDate must not be before startDate"
      }
    },
    status: {
      type: String,
      enum: ["planned", "active", "completed"],
      default: "planned"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sprint", sprintSchema);
