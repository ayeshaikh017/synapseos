import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Brain, FileSearch, ListChecks, Send, Sparkles } from "lucide-react";
import { aiApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import { ProjectPicker } from "../components/ui";
import { errMsg } from "../utils/format";

const suggestions = [
  { title: "Summarize this sprint", description: "Get a concise summary of current sprint activity.", icon: ListChecks },
  { title: "Find overdue tasks", description: "Identify work that may affect delivery.", icon: AlertTriangle },
  { title: "Analyze project risks", description: "Review potential blockers and delivery risks.", icon: Brain },
  { title: "Search project knowledge", description: "Find relevant information from project documents.", icon: FileSearch },
];

function StatusPill({ label, feature }) {
  const ready = feature?.implemented;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${ready ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-emerald-400" : "bg-zinc-400"}`} />
      {label}: {feature?.status || "unknown"}
    </span>
  );
}

function AI() {
  const { activeProjectId } = useProjects();
  const [status, setStatus] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    aiApi.status().then(setStatus).catch(() => setStatus(null));
  }, []);

  const askQuestion = async () => {
    const value = question.trim();
    if (!value || asking) return;

    setMessages((cur) => [...cur, { type: "user", text: value }]);
    setQuestion("");

    if (!activeProjectId) {
      setMessages((cur) => [...cur, { type: "assistant", text: "Select or create a project first — AI search works inside one project." }]);
      return;
    }

    setAsking(true);
    try {
      const data = await aiApi.search(activeProjectId, value);
      const results = data.results || [];
      setMessages((cur) => [
        ...cur,
        { type: "assistant", text: results.length ? results.map((r) => r.text || r.content || JSON.stringify(r)).join("\n\n") : "No matching project knowledge found." },
      ]);
    } catch (err) {
      // The backend honestly answers 501 while LLM/RAG is not implemented.
      setMessages((cur) => [...cur, { type: "assistant", text: errMsg(err, "AI request failed") }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Intelligence</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">Project Intelligence</h1>
          <p className="mt-2 text-sm text-zinc-500">Ask questions about your project, tasks, documents and development activity.</p>
        </div>
        <ProjectPicker />
      </div>

      {status && (
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label="LLM" feature={status.llm} />
          <StatusPill label="RAG search" feature={status.rag} />
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white"><Sparkles size={18} /></div>
          <div>
            <h2 className="text-base font-semibold text-zinc-950">Ask Synapse</h2>
            <p className="text-xs text-zinc-400">Use project context to understand work, risks and documentation.</p>
          </div>
        </div>
        <div className="mt-5">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); } }}
            rows={4}
            placeholder="What are the current blockers?"
            className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-500"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-zinc-400">Enter to ask · Shift + Enter for a new line</p>
            <button type="button" onClick={askQuestion} disabled={asking} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60">
              {asking ? "Asking..." : "Ask Synapse"}<Send size={14} />
            </button>
          </div>
        </div>
      </section>

      <div>
        <h2 className="text-base font-semibold text-zinc-950">Project knowledge</h2>
        <p className="mb-4 text-xs text-zinc-400">Common actions you can use with project intelligence.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map(({ title, description, icon: Icon }) => (
            <button key={title} type="button" onClick={() => setQuestion(title)} className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"><Icon size={18} /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-zinc-900">{title}</p><p className="mt-0.5 text-xs text-zinc-500">{description}</p></div>
              <ArrowRight size={16} className="text-zinc-300 transition group-hover:text-zinc-600" />
            </button>
          ))}
        </div>
      </div>

      {messages.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4"><h2 className="text-base font-semibold text-zinc-950">Conversation</h2></div>
          <div className="space-y-4 p-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${m.type === "user" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"}`}>{m.text}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AI;
