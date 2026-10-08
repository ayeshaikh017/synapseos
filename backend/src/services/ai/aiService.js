const llmClient = require("./llmClient");

// STATUS: PLANNED. Input validation is real; the LLM call is not.
// Once llmClient.generate() is implemented, build the prompt here and
// parse the model output into { priority, reasoning }.
const suggestTaskPriority = async ({ title, description, dueDate }) => {
  await llmClient.generate({
    purpose: "task-priority",
    input: { title, description, dueDate }
  });
  // Unreachable until the LLM integration exists.
};

module.exports = { suggestTaskPriority };
