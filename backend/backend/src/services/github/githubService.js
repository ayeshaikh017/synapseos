// Backend-only GitHub helper. Uses GitHub's public REST API.
// GITHUB_TOKEN (optional, server-side only) just raises the rate limit.
// The token is never returned to the frontend.

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;

// Accepts https://github.com/<owner>/<repo>[.git][/]; returns null if invalid.
const parseRepositoryUrl = (input) => {
  if (typeof input !== "string") return null;

  let url;
  try {
    url = new URL(input.trim());
  } catch (error) {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (!["github.com", "www.github.com"].includes(url.hostname)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;

  const owner = parts[0];
  const name = parts[1].replace(/\.git$/i, "");

  if (!OWNER_RE.test(owner) || !NAME_RE.test(name)) return null;
  if (name === "." || name === "..") return null;

  return {
    owner,
    name,
    repositoryUrl: `https://github.com/${owner}/${name}`
  };
};

const makeError = (code, message) => {
  const err = new Error(message);
  err.code = code;
  return err;
};

// owner/name are validated by parseRepositoryUrl before reaching here,
// so the outgoing URL can only ever point at api.github.com/repos/...
const fetchRepository = async (owner, name) => {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "SynapseOS-Backend",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      { headers, signal: AbortSignal.timeout(8000) }
    );
  } catch (error) {
    throw makeError("UPSTREAM", "Could not reach GitHub");
  }

  if (response.status === 404) {
    throw makeError("NOT_FOUND", "Repository not found on GitHub");
  }
  if (response.status === 403 || response.status === 429) {
    throw makeError("RATE_LIMITED", "GitHub rate limit reached. Try again later");
  }
  if (!response.ok) {
    throw makeError("UPSTREAM", "GitHub returned an unexpected response");
  }

  const repo = await response.json();

  return {
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    defaultBranch: repo.default_branch,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    isPrivate: repo.private,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at
  };
};

module.exports = { parseRepositoryUrl, fetchRepository };
