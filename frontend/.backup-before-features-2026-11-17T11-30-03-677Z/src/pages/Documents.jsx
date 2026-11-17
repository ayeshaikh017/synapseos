import { useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
} from "lucide-react";

const documents = [
  {
    id: "doc-1",
    title: "Project Requirements",
    description:
      "Functional requirements, project scope and system objectives for SynapseOS.",
    type: "Requirements",
    updated: "Updated 2 hours ago",
    author: "Ayesha",
    initials: "AS",
  },
  {
    id: "doc-2",
    title: "API Documentation",
    description:
      "API routes, request structures and integration notes for the project backend.",
    type: "Technical",
    updated: "Updated yesterday",
    author: "Simran",
    initials: "SS",
  },
  {
    id: "doc-3",
    title: "Sprint 04 Notes",
    description:
      "Current sprint goals, decisions, completed work and pending tasks.",
    type: "Sprint",
    updated: "Updated yesterday",
    author: "Shivangee",
    initials: "SP",
  },
  {
    id: "doc-4",
    title: "System Architecture",
    description:
      "Frontend, backend, database, AI and GitHub integration architecture.",
    type: "Technical",
    updated: "Updated 2 days ago",
    author: "Dolly",
    initials: "DP",
  },
  {
    id: "doc-5",
    title: "Meeting Notes — Project Review",
    description:
      "Discussion points, decisions and action items from the latest project review.",
    type: "Meeting",
    updated: "Updated 3 days ago",
    author: "Ayesha",
    initials: "AS",
  },
  {
    id: "doc-6",
    title: "AI & RAG Design",
    description:
      "Notes covering project knowledge retrieval, AI assistance and planned intelligent features.",
    type: "AI",
    updated: "Updated 4 days ago",
    author: "Shivangee",
    initials: "SP",
  },
];

const filters = [
  "All",
  "Requirements",
  "Technical",
  "Sprint",
  "Meeting",
  "AI",
];

function DocumentIcon({ type }) {
  const iconClass = "text-zinc-600";

  if (type === "Technical") {
    return <Folder size={18} className={iconClass} strokeWidth={1.8} />;
  }

  return <FileText size={18} className={iconClass} strokeWidth={1.8} />;
}

function DocumentRow({ document }) {
  return (
    <div className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-zinc-50 sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
        <DocumentIcon type={document.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-950">
            {document.title}
          </h2>

          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
            {document.type}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
          {document.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {document.updated}
          </span>

          <span className="flex items-center gap-1.5">
            <UserRound size={13} />
            {document.author}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="self-start rounded-md p-1.5 text-zinc-400 opacity-100 transition hover:bg-zinc-100 hover:text-zinc-700 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}

function Documents() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredDocuments = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesFilter =
        activeFilter === "All" ||
        document.type === activeFilter;

      const matchesSearch =
        !searchValue ||
        document.title.toLowerCase().includes(searchValue) ||
        document.description.toLowerCase().includes(searchValue) ||
        document.author.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Collaboration
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Documents
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Keep project knowledge, requirements and notes organized in one place.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus size={16} />
          New document
        </button>
      </div>

      {/* Search */}
      <div className="mt-8 flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
        <Search size={17} className="shrink-0 text-zinc-400" />

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search documentation..."
          className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Recent documents */}
      <div className="mt-8 flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Recent documents
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Project knowledge and team documentation.
          </p>
        </div>

        <p className="text-xs text-zinc-400">
          {filteredDocuments.length} documents
        </p>
      </div>

      {/* Document list */}
      <section className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {filteredDocuments.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {filteredDocuments.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
              <FileText
                size={20}
                className="text-zinc-500"
              />
            </div>

            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              No documents found
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Try a different search or document category.
            </p>
          </div>
        )}
      </section>

      {/* RAG knowledge note */}
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
            <FileText
              size={18}
              className="text-zinc-700"
              strokeWidth={1.8}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-950">
              Project knowledge
            </p>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
              Project documents can later be used by SynapseOS AI to retrieve
              relevant information and answer project-specific questions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Documents;