import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  CircleDot,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const commits = [
  {
    hash: "8f2a91",
    message: "Add authentication middleware",
    author: "Ayesha",
    time: "2 hours ago",
  },
  {
    hash: "91ac42",
    message: "Create project API",
    author: "Simran",
    time: "5 hours ago",
  },
  {
    hash: "5bd812",
    message: "Connect MongoDB configuration",
    author: "Dolly",
    time: "Yesterday",
  },
  {
    hash: "32ce10",
    message: "Initialize backend project",
    author: "Shivangee",
    time: "2 days ago",
  },
];

const issues = [
  {
    title: "Connect GitHub repository to project",
    label: "feature",
  },
  {
    title: "Handle expired JWT token",
    label: "bug",
  },
  {
    title: "Add document search endpoint",
    label: "feature",
  },
];

function GitHub() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Development
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            GitHub integration
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Track repository activity without leaving the project workspace.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Repository */}
      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <GitBranch size={19} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-950">
                  synapseos
                </h2>

                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
                  Connected
                </span>
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                Shivangee56 / synapseos
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                Default branch: main
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950"
          >
            Open on GitHub
            <ExternalLink size={14} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-100 p-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <GitCommit size={16} />
              <span className="text-xs">Commits</span>
            </div>

            <p className="mt-2 text-xl font-semibold text-zinc-950">
              24
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 p-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <CircleDot size={16} />
              <span className="text-xs">Open issues</span>
            </div>

            <p className="mt-2 text-xl font-semibold text-zinc-950">
              6
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 p-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <GitPullRequest size={16} />
              <span className="text-xs">Open PRs</span>
            </div>

            <p className="mt-2 text-xl font-semibold text-zinc-950">
              3
            </p>
          </div>
        </div>
      </section>

      {/* Activity */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">
              Recent commits
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Latest development activity.
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {commits.map((commit) => (
              <div
                key={commit.hash}
                className="flex gap-4 px-5 py-4"
              >
                <GitCommit
                  size={17}
                  className="mt-0.5 shrink-0 text-zinc-400"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {commit.message}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {commit.hash} · {commit.author} · {commit.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">
              Open issues
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Issues that need attention.
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {issues.map((issue) => (
              <div key={issue.title} className="px-5 py-4">
                <p className="text-sm font-medium leading-5 text-zinc-900">
                  {issue.title}
                </p>

                <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
                  {issue.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default GitHub;