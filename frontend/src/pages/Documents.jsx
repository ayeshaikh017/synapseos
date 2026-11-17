import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Folder,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { documentApi } from "../api/documentApi";
import Modal from "../components/Modal";
import ProjectPicker from "../components/ProjectPicker";
import { errorText, timeAgo, useProjectSelection } from "../hooks/useProjectSelection";

const TYPES = ["General", "Requirements", "Technical", "Sprint", "Meeting", "AI"];
const FILTERS = ["All", ...TYPES];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

const authorName = (doc) => doc.createdBy?.name || "Team member";
const preview = (doc) =>
  doc.description || (doc.content ? doc.content.replace(/\s+/g, " ").slice(0, 160) : "No description");

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

function DocumentIcon({ type }) {
  const cls = "text-zinc-600";
  return type === "Technical" ? (
    <Folder size={18} className={cls} strokeWidth={1.8} />
  ) : (
    <FileText size={18} className={cls} strokeWidth={1.8} />
  );
}

/* ---------- Create / edit modal ---------- */

function DocumentModal({ projectId, document: existing, onClose, onSaved, onDeleted }) {
  const isEdit = Boolean(existing);

  const [title, setTitle] = useState(existing?.title || "");
  const [type, setType] = useState(existing?.type || "General");
  const [description, setDescription] = useState(existing?.description || "");
  const [content, setContent] = useState(existing?.content || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) return setError("Please enter a document title.");

    setSaving(true);
    try {
      const payload = { title: title.trim(), type, description: description.trim(), content };
      if (isEdit) {
        await documentApi.updateDocument(existing._id, payload);
      } else {
        await documentApi.createDocument(projectId, payload);
      }
      onSaved(isEdit ? "Document saved." : "Document created.");
    } catch (err) {
      setError(errorText(err, "Could not save the document."));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${existing.title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await documentApi.deleteDocument(existing._id);
      onDeleted();
    } catch (err) {
      setError(errorText(err, "Could not delete the document."));
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={isEdit ? "Edit document" : "New document"}
      subtitle={isEdit ? `Last updated ${timeAgo(existing.updatedAt)}` : "Add knowledge for your team."}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Title">
              <input
                autoFocus
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. API documentation"
                maxLength={150}
              />
            </Field>
          </div>
          <Field label="Category">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Short description (optional)">
          <input
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One line about this document"
            maxLength={300}
          />
        </Field>

        <Field label="Content">
          <textarea
            rows={10}
            className={`${inputClass} font-mono text-[13px] leading-6`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write or paste the document content here..."
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {isEdit ? (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={15} />
              Delete
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create document"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Page ---------- */

function Documents() {
  const { projects, projectId, setProjectId, loading, error, searchParams, setSearchParams } =
    useProjectSelection();

  const [documents, setDocuments] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    if (!projectId) return;
    setDataLoading(true);
    setDataError("");
    try {
      const result = await documentApi.getProjectDocuments(projectId);
      setDocuments(result.data?.documents || []);
    } catch (err) {
      setDataError(errorText(err, "Could not load documents."));
    } finally {
      setDataLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Deep link from a notification: /documents?project=..&doc=..
  const linkedDoc = searchParams.get("doc") || "";
  useEffect(() => {
    if (!linkedDoc) return;
    const found = documents.find((d) => d._id === linkedDoc);
    if (found) setEditing(found);
  }, [linkedDoc, documents]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const closeModals = () => {
    setEditing(null);
    setCreating(false);
    if (searchParams.get("doc")) setSearchParams({ project: projectId }, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesFilter = activeFilter === "All" || doc.type === activeFilter;
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.description || "").toLowerCase().includes(q) ||
        (doc.content || "").toLowerCase().includes(q) ||
        authorName(doc).toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [documents, activeFilter, search]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Collaboration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">Documents</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Keep project knowledge, requirements and notes organized in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProjectPicker projects={projects} projectId={projectId} onChange={setProjectId} />

          <button
            type="button"
            disabled={!projectId}
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus size={16} />
            New document
          </button>
        </div>
      </div>

      {toast && (
        <p className="mt-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">{toast}</p>
      )}
      {(error || dataError) && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || dataError}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-zinc-500">Loading...</p>
      ) : projects.length === 0 && !error ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-800">Create a project first</p>
          <p className="mt-1 text-sm text-zinc-500">Documents belong to a project. Create one from the Projects page.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
            <Search size={17} className="shrink-0 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documentation..."
              className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">Recent documents</h2>
              <p className="mt-1 text-sm text-zinc-500">Project knowledge and team documentation.</p>
            </div>
            <p className="text-xs text-zinc-400">
              {filtered.length} document{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          <section className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {dataLoading && documents.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-zinc-500">Loading documents...</div>
            ) : filtered.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {filtered.map((doc) => (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => setEditing(doc)}
                    className="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-zinc-50 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <DocumentIcon type={doc.type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-zinc-950">{doc.title}</h2>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
                          {doc.type}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">{preview(doc)}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          Updated {timeAgo(doc.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserRound size={13} />
                          {authorName(doc)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
                  <FileText size={20} className="text-zinc-500" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-zinc-900">
                  {documents.length === 0 ? "No documents yet" : "No documents found"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {documents.length === 0
                    ? 'Click "New document" to add your first one.'
                    : "Try a different search or document category."}
                </p>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <FileText size={18} className="text-zinc-700" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950">Project knowledge</p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                  Project documents can later be used by SynapseOS AI to retrieve relevant information and answer
                  project-specific questions.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {(creating || editing) && (
        <DocumentModal
          key={editing?._id || "new"}
          projectId={projectId}
          document={editing}
          onClose={closeModals}
          onSaved={(message) => {
            closeModals();
            setToast(message);
            load();
          }}
          onDeleted={() => {
            closeModals();
            setToast("Document deleted.");
            load();
          }}
        />
      )}
    </div>
  );
}

export default Documents;
