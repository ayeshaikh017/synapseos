const express = require("express");

const {
  createDocument,
  getProjectDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
} = require("../controllers/documentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/projects/:projectId/documents", authMiddleware, createDocument);
router.get("/projects/:projectId/documents", authMiddleware, getProjectDocuments);
router.get("/documents/:documentId", authMiddleware, getDocumentById);
router.put("/documents/:documentId", authMiddleware, updateDocument);
router.delete("/documents/:documentId", authMiddleware, deleteDocument);

module.exports = router;
