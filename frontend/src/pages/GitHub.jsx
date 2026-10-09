import { useCallback, useEffect, useState } from "react";
import { CircleDot, ExternalLink, GitBranch, GitFork, RefreshCw, Star, Unlink } from "lucide-react";
import { githubApi } from "../api/services";
import { useProjects } from "../context/ProjectContext";
import { ErrorBanner, Field, Loading, NeedProject, PageHeader, PrimaryButton, ProjectPicker, SecondaryButton, inputClass } from "../components/ui";
import { errMsg, timeAgo } from "../utils/format";

function GitHub() {
  const { activeProjectId, loading: projectsLoading } = useProjects();
  const [state, setState] = useState(null); // { linked, integration, repository }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError("");
    setState(null);
    try {
      setState(await githubApi.get(activeProjectId));
    } catch (err) {
      // e.g. repo deleted or GitHub rate-limited: keep the form usable
      setError(errMsg(err, "Could not load repository"));
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => { load(); }, [load]);

  const link = async (event) => {
    event.preventDefault();
    if (!url.trim()) return setError("Paste a repository URL first");
    setSaving(true);
    setError("");
    try {
      await githubApi.link(activeProjectId, url.trim());
      setUrl("");
      await load();
    } catch (err) {
      setError(errMsg(err, "Could not link repository"));
    } finally {
      setSaving(false);
    }
  };

  const unlink = async () => {
    setSaving(true);
    setError("");
    try {
      await githubApi.unlink(activeProjectId);
      await load();
    } catch (err) {
      setError(errMsg(err, "Could not unlink repository"));
    } finally {
      setSaving(false);
    }
  };

  const repo = state?.repository;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Development"
        title="GitHub integration"
        text="Link a repository to the project and see its live details."
        actions={activeProjectId && (<><ProjectPicker /><SecondaryButton onClick={load}><RefreshCw size={16} />Refresh</SecondaryButton></>)}
      />

      {!activeProjectId ? <NeedProject loading={projectsLoading} /> : (
        <>
          <ErrorBanner message={error} />
          {loading ? <Loading label="Fetching repository..." /> : repo ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-900 text-white"><GitBranch size={19} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-zinc-950">{repo.fullName?.split("/")[1]}</h2>
                      <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-white">Connected</span>
                      {repo.isPrivate && <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600">Private</span>}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{repo.fullName}</p>
                    {repo.description && <p className="mt-2 max-w-xl text-sm text-zinc-600">{repo.description}</p>}
                    <p className="mt-2 text-xs text-zinc-400">
                      Default branch: {repo.defaultBranch}{repo.language ? ` · ${repo.language}` : ""} · Last push {timeAgo(repo.pushedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Open on GitHub<ExternalLink size={14} /></a>
                  <SecondaryButton onClick={unlink} disabled={saving}><Unlink size={14} />Unlink</SecondaryButton>
                </div>
              </div>
              <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-3">
                <div className="rounded-lg bg-zinc-50 p-4"><div className="flex items-center gap-2 text-sm text-zinc-500"><Star size={16} />Stars</div><p className="mt-2 text-2xl font-semibold text-zinc-950">{repo.stars}</p></div>
                <div className="rounded-lg bg-zinc-50 p-4"><div className="flex items-center gap-2 text-sm text-zinc-500"><GitFork size={16} />Forks</div><p className="mt-2 text-2xl font-semibold text-zinc-950">{repo.forks}</p></div>
                <div className="rounded-lg bg-zinc-50 p-4"><div className="flex items-center gap-2 text-sm text-zinc-500"><CircleDot size={16} />Open issues</div><p className="mt-2 text-2xl font-semibold text-zinc-950">{repo.openIssues}</p></div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-zinc-200 bg-white p-6">
              {state?.integration && (
                <div className="mb-5 flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  <span>Linked: {state.integration.repositoryUrl}</span>
                  <button type="button" onClick={unlink} className="font-medium underline underline-offset-2">Unlink</button>
                </div>
              )}
              <h2 className="text-base font-semibold text-zinc-950">Link a repository</h2>
              <p className="mt-1 text-sm text-zinc-500">One GitHub repository can be linked per project.</p>
              <form onSubmit={link} className="mt-5 space-y-4">
                <Field label="Repository URL" hint="Format: https://github.com/<owner>/<repository>">
                  <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} placeholder="https://github.com/ayeshaikh017/synapseos" />
                </Field>
                <PrimaryButton type="submit" disabled={saving}>{saving ? "Linking..." : "Link repository"}</PrimaryButton>
              </form>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default GitHub;
