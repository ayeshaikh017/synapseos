// ============================================================
// STATUS: PLANNED / NOT IMPLEMENTED
// ------------------------------------------------------------
// This is the single place where a real LLM provider call will
// live. No provider SDK is installed and no request is made.
// The frontend must NEVER call an LLM provider directly.
// ============================================================

const isConfigured = () => Boolean(process.env.OPENAI_API_KEY);

const generate = async () => {
  const err = new Error(
    isConfigured()
      ? "LLM provider integration is PLANNED and not implemented yet"
      : "AI is not configured (no LLM API key) and the LLM integration is PLANNED"
  );
  err.statusCode = 501;
  throw err;
};

module.exports = { isConfigured, generate };
