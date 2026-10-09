import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, FileText, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { documentApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import {
  ConfirmDelete,
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  Modal,
  NeedProject,
  PageHeader,
  PrimaryButton,
  ProjectPicker,
  SecondaryButton,
  inputClass,
} from "../components/ui";
import { errMsg, timeAgo } from "../utils/format";

function DocumentForm({ doc, projectId, onClose, onSaved }) {
  const [title, setTitle] = useState(doc?.title || "");
  const [content, setContent] = useState(doc?.content || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return setError("Document title is required");

    setSaving(true);
    setError("");
    try {
      const payload = { title: title.trim(), content };
      if (doc) await documentApi.update(doc._id, payload);
      else await documentApi.create(projectId, payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err, "Could not save document"));
      setSaving(false);
    }
  };

  return (
    <Modal title={doc ? "Edit document" : "New document"} subtitle="Project knowledge, requirements and notes." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <ErrorBanner message={error} />
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. API Documentation" /></Field>
        <Field label="Content"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className={`${inputClass} resize-y font-mono text-[13px]`} placeholder="Write your document..." /></Field>
        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : doc ? "Save changes" : "Create document"}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function Documents() {
  const { user } = useAuth();
  const { activeProjectId, loading: projectsLoading } = useProjects();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError("");
    try {
      const data = await documentApi.list(activeProjectId);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(errMsg(err, "Could not load documents"));
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await documentApi.remove(deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(errMsg(err, "Could not delete document"));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => !q || d.title.toLowerCase().includes(q) || (d.content || "").toLowerCase().includes(q));
  }, [documents, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Collaboration"
        title="Documents"
        text="Keep project knowledge, requirements and notes organized in one place."
        actions={activeProjectId && (<><ProjectPicker /><PrimaryButton onClick={() => setEditing("new")}><Plus size={16} />New document</PrimaryButton></>)}
      />

      {!activeProjectId ? <NeedProject loading={projectsLoading} /> : (
        <>
          <ErrorBanner message={error} onRetry={load} />
          <div className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 lg:max-w-md">
            <Search size={17} className="shrink-0 text-zinc-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documentation..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" />
          </div>

          <div className="flex items-end justify-between">
            <div><h2 className="text-base font-semibold text-zinc-950">Recent documents</h2><p className="text-xs text-zinc-400">Project knowledge and team documentation.</p></div>
            <p className="text-sm text-zinc-500">{filtered.length} document{filtered.length === 1 ? "" : "s"}</p>
          </div>

          {loading && documents.length === 0 ? <Loading label="Loading documents..." /> : filtered.length === 0 ? (
            <EmptyState icon={FileText} title={documents.length === 0 ? "No documents yet" : "No documents found"} text={documents.length === 0 ? "Create the first document for this project." : "Try a different search."} action={documents.length === 0 && <PrimaryButton onClick={() => setEditing("new")}><Plus size={16} />New document</PrimaryButton>} />
          ) : (
            <section className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {filtered.map((doc) => (
                <div key={doc._id} className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100"><FileText size={18} className="text-zinc-600" strokeWidth={1.8} /></div>
                  <button type="button" onClick={() => setViewing(doc)} className="min-w-0 flex-1 text-left">
                    <h3 className="truncate text-sm font-semibold text-zinc-950">{doc.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">{doc.content || "Empty document"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />Updated {timeAgo(doc.updatedAt)}</span>
                      <span className="inline-flex items-center gap-1.5"><UserRound size={13} />{doc.createdBy === user?._id ? "You" : "Teammate"}</span>
                    </div>
                  </button>
                  <div className="flex shrink-0">
                    <button type="button" onClick={() => setEditing(doc)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><Pencil size={16} /></button>
                    <button type="button" onClick={() => setDeleting(doc)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {viewing && (
        <Modal title={viewing.title} subtitle={`Updated ${timeAgo(viewing.updatedAt)}`} onClose={() => setViewing(null)}>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-700">{viewing.content || "This document is empty."}</pre>
          <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-5">
            <SecondaryButton onClick={() => setViewing(null)}>Close</SecondaryButton>
            <PrimaryButton onClick={() => { setEditing(viewing); setViewing(null); }}><Pencil size={14} />Edit</PrimaryButton>
          </div>
        </Modal>
      )}
      {editing && <DocumentForm doc={editing === "new" ? null : editing} projectId={activeProjectId} onClose={() => setEditing(null)} onSaved={load} />}
      {deleting && <ConfirmDelete what={deleting.title} busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

export default Documents;
