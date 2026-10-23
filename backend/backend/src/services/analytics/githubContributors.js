// Optional: commit counts per GitHub contributor (public REST API).
// Never throws: returns null if GitHub is unreachable / rate-limited, so the
// analytics endpoint still works. GITHUB_TOKEN (server-side only) raises the limit.
const fetchContributors = async (owner, name) => {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "SynapseOS-Backend",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contributors?per_page=10`,
      { headers, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return rows
      .filter((r) => r && r.type !== "Bot")
      .map((r) => ({ login: r.login, commits: r.contributions, profileUrl: r.html_url, avatar: r.avatar_url }));
  } catch (e) {
    return null;
  }
};

module.exports = { fetchContributors };
