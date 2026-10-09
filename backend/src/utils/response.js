// Small helpers that keep every response in the project's fixed format.

const sendSuccess = (res, status, message, data = {}) =>
  res.status(status).json({ success: true, message, data });

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// Maps unexpected errors to safe responses. Raw database errors are never
// sent to the client; they are only logged (message only, no stack/query).
const handleError = (res, error, fallbackMessage, invalidMessage = "Invalid data") => {
  if (error && (error.name === "ValidationError" || error.name === "CastError")) {
    return sendError(res, 400, invalidMessage);
  }
  console.error(`${fallbackMessage}:`, error && error.message);
  return sendError(res, 500, fallbackMessage);
};

module.exports = { sendSuccess, sendError, handleError };
