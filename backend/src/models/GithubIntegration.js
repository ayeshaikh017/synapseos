const mongoose = require("mongoose");

// One linked GitHub repository per project.
// Kept in its own collection so the existing Project schema is untouched.
// NOTE: no tokens are ever stored here.
const githubIntegrationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true
    },
    repositoryUrl: { type: String, required: true, trim: true },
    repositoryOwner: { type: String, required: true, trim: true },
    repositoryName: { type: String, required: true, trim: true },
    linkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GithubIntegration", githubIntegrationSchema);
