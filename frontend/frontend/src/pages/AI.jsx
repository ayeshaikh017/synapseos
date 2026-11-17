import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  FileSearch,
  ListChecks,
  Send,
  Sparkles,
} from "lucide-react";

const suggestions = [
  {
    title: "Summarize this sprint",
    description: "Get a concise summary of current sprint activity.",
    icon: ListChecks,
  },
  {
    title: "Find overdue tasks",
    description: "Identify work that may affect delivery.",
    icon: AlertTriangle,
  },
  {
    title: "Analyze project risks",
    description: "Review potential blockers and delivery risks.",
    icon: Brain,
  },
  {
    title: "Search project knowledge",
    description: "Find relevant information from project documents.",
    icon: FileSearch,
  },
];

function AI() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const askQuestion = () => {
    const value = question.trim();

    if (!value) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        type: "user",
        text: value,
      },
      {
        type: "assistant",
        text:
          "This is the SynapseOS AI workspace. Once the backend AI/RAG endpoint is connected, this area will return project-specific answers using your tasks, documents and development activity.",
      },
    ]);

    setQuestion("");
  };

  const useSuggestion = (title) => {
    setQuestion(title);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-medium text-zinc-400">
          Intelligence
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
          Project Intelligence
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Ask questions about your project, tasks, documents and development activity.
        </p>
      </div>

      {/* Ask area */}
      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Sparkles size={18} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Ask Synapse
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Use project context to understand work, risks and documentation.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                askQuestion();
              }
            }}
            rows={4}
            placeholder="What are the current blockers?"
            className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400"
          />

          <div className="flex items-center justify-between border-t border-zinc-200 px-2 pt-2">
            <p className="px-2 text-xs text-zinc-400">
              Enter to ask · Shift + Enter for a new line
            </p>

            <button
              type="button"
              onClick={askQuestion}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Ask Synapse
              <Send size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Suggestions */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-zinc-950">
          Project knowledge
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Common actions you can use with project intelligence.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;

            return (
              <button
                key={suggestion.title}
                type="button"
                onClick={() => useSuggestion(suggestion.title)}
                className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-left transition hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-950">
                    {suggestion.title}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-zinc-500">
                    {suggestion.description}
                  </p>
                </div>

                <ArrowRight
                  size={16}
                  className="mt-1 text-zinc-300 transition group-hover:text-zinc-700"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      {messages.length > 0 && (
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">
              Conversation
            </h2>
          </div>

          <div className="space-y-4 p-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-6 ${
                    message.type === "user"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AI;