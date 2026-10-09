const DocumentModel = require("../models/Document");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const { isValidId, findAccessibleProject } = require("../utils/projectAccess");

const createDocument = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return sendError(res, 400, "Document title is required");
    }

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const document = await DocumentModel.create({
      title,
      content,
      project: projectId,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    return sendSuccess(res, 201, "Document created successfully", { document });
  } catch (error) {
    return handleError(res, error, "Failed to create document", "Invalid document data");
  }
};

const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const documents = await DocumentModel.find({ project: projectId }).sort({
      updatedAt: -1
    });

    return sendSuccess(res, 200, "Documents fetched successfully", { documents });
  } catch (error) {
    return handleError(res, error, "Failed to fetch documents");
  }
};

const loadDocument = async (req) => {
  const { documentId } = req.params;
  if (!isValidId(documentId)) return null;

  const document = await DocumentModel.findById(documentId);
  if (!document) return null;

  const project = await findAccessibleProject(document.project, req.user.userId);
  return project ? document : null;
};

const getDocumentById = async (req, res) => {
  try {
    const document = await loadDocument(req);
    if (!document) return sendError(res, 404, "Document not found");

    return sendSuccess(res, 200, "Document fetched successfully", { document });
  } catch (error) {
    return handleError(res, error, "Failed to fetch document");
  }
};

const updateDocument = async (req, res) => {
  try {
    const document = await loadDocument(req);
    if (!document) return sendError(res, 404, "Document not found");

    const { title, content } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return sendError(res, 400, "Document title cannot be empty");
      }
      document.title = title;
    }
    if (content !== undefined) document.content = content;
    document.updatedBy = req.user.userId;

    await document.save();

    return sendSuccess(res, 200, "Document updated successfully", { document });
  } catch (error) {
    return handleError(res, error, "Failed to update document", "Invalid document data");
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await loadDocument(req);
    if (!document) return sendError(res, 404, "Document not found");

    await DocumentModel.deleteOne({ _id: document._id });

    return sendSuccess(res, 200, "Document deleted successfully", {});
  } catch (error) {
    return handleError(res, error, "Failed to delete document");
  }
};

module.exports = {
  createDocument,
  getProjectDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
};
