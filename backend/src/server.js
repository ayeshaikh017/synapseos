const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const sprintRoutes = require("./routes/sprintRoutes");
const documentRoutes = require("./routes/documentRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const githubRoutes = require("./routes/githubRoutes");
const aiRoutes = require("./routes/aiRoutes");

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", sprintRoutes);
app.use("/api", documentRoutes);
app.use("/api", meetingRoutes);
app.use("/api", notificationRoutes);
app.use("/api", githubRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SynapseOS Backend is running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SynapseOS API is healthy"
  });
});
app.get("/api/protected-test", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are authenticated",
    user: req.user
  });
});
app.get(
    "/api/admin-test",
    protect,
    roleMiddleware("admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Admin access granted",
            data: {
                userId: req.user.userId,
                role: req.user.role
            }
        });
    }
);

// Unknown routes -> JSON 404 (same error format as the rest of the API)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Last-resort error handler (e.g. malformed JSON body). Never leaks details.
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body"
    });
  }

  console.error("Unhandled error:", err && err.message);

  return res.status(500).json({
    success: false,
    message: "Server error"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`SynapseOS backend running on port ${PORT}`);
  });
};

startServer();