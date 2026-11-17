
import { useEffect, useState, useSyncExternalStore } from "react";
import api from "../api/axios";
import { projectApi } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Brain,
  ChevronDown,
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

// Chat lives outside the component so it survives page navigation
const store = { ownerId: "", messages: [], loading: false, projectId: "" };
let snapshot = { messages: [], loading: false, projectId: "" };
const listeners = new Set();

const publish = () => {
  snapshot = { messages: store.messages, loading: store.loading, projectId: store.projectId };
};
const emit = () => {
  publish();
  listeners.forEach((l) => l());
};
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => snapshot;

const resetFor = (ownerId) => {
  if (store.ownerId === ownerId) return;
  store.ownerId = ownerId;
  store.messages = [];
  store.loading = false;
  store.projectId = "";
  publish();
};

const setProject = (id) => {
  store.projectId = id;
  emit();
};

const sendMessage = async (text) => {
  if (store.loading) return;
  const owner = store.ownerId;

  store.messages = [...store.messages, { type: "user", text }];
  store.loading = true;
  emit();

  let reply;
  try {
    const response = await api.post(
      "/ai/chat",
      {
        projectId: store.projectId || undefined,
        messages: store.messages.map((m) => ({ role: m.type, text: m.text })),
      },
      { timeout: 60000 }
    );
    reply = response.data?.data?.answer || "No answer was returned.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    reply =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED" ? "The request took too long. Please try again." : error.message) ||
      "Something went wrong.";
  }

  if (store.ownerId !== owner) return;
  store.messages = [...store.messages, { type: "assistant", text: reply }];
  store.loading = false;
  emit();
};

function AI() {
  const { user } = useAuth();
  resetFor(user?._id || user?.id || "");

  const { messages, loading, projectId } = useSyncExternalStore(subscribe, getSnapshot);
  const [question, setQuestion] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let cancelled = false;
    projectApi
      .getProjects()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.projects || [];
        setProjects(list);
        if (!store.projectId && list[0]) setProject(list[0]._id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const askQuestion = (customQuestion) => {
    const value = (customQuestion || question).trim();
    if (!value || loading) return;
    setQuestion("");
    setShowSuggestions(false);
    sendMessage(value);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-100px)] max-w-6xl flex-col">

      {/* Header */}
      <div className="shrink-0 pb-5">
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

      {/* Conversation Area */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">

        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Sparkles size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-950">
              Ask Synapse
            </h2>
            <p className="text-xs text-zinc-500">
              Your AI project assistant
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-b border-zinc-100 px-5 py-2 text-xs text-zinc-500">
          <span>Project:</span>
          <select
            value={projectId}
            onChange={(e) => setProject(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none"
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800">
                <Sparkles size={25} />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-zinc-900">
                How can I help you today?
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Ask Synapse about project management, sprint planning,
                development activities or anything related to your project.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
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
                    className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${
                      message.type === "user"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500">
                    Synapse is thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Input Area */}
      <div className="shrink-0 pt-4">

        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">

          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                askQuestion();
              }
            }}
            rows={3}
            disabled={loading}
            placeholder="Message Synapse..."
            className="w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-400"
          />

          <div className="flex items-center justify-between border-t border-zinc-100 pt-3">

            {/* Project Knowledge Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
              >
                <FileSearch size={16} />
                Project knowledge
                <ChevronDown
                  size={15}
                  className={`transition-transform ${
                    showSuggestions ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSuggestions && (
                <div className="absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">

                  <div className="border-b border-zinc-100 px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-900">
                      Project knowledge
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Choose an action to get started.
                    </p>
                  </div>

                  {suggestions.map((suggestion) => {
                    const Icon = suggestion.icon;

                    return (
                      <button
                        key={suggestion.title}
                        type="button"
                        disabled={loading}
                        onClick={() => askQuestion(suggestion.title)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <Icon
                          size={17}
                          className="mt-0.5 shrink-0 text-zinc-600"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900">
                            {suggestion.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {suggestion.description}
                          </p>
                        </div>

                        <ArrowRight
                          size={14}
                          className="mt-1 text-zinc-400"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => askQuestion()}
              disabled={loading || !question.trim()}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Send"}
              <Send size={14} />
            </button>

          </div>
        </div>

        <p className="mt-2 text-center text-xs text-zinc-400">
          Synapse AI can make mistakes. Verify important information.
        </p>
      </div>

    </div>
  );
}

export default AI;
