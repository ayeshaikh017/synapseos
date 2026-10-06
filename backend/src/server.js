const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

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
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`SynapseOS backend running on port ${PORT}`);
  });
};

startServer();