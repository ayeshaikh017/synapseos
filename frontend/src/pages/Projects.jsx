import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const projects = [
  {
    id: "project-1",
    name: "SynapseOS",
    description:
      "AI-powered workspace for project collaboration and intelligent project management.",
    status: "active",
    progress: 82,
    tasks: 22,
    completedTasks: 18,
    sprints: 3,
    members: ["A", "S", "D", "S"],
    updated: "Updated 32 minutes ago",
  },
  {
    id: "project-2",
    name: "Campus Connect",
    description:
      "Centralized platform for student collaboration, events and academic activities.",
    status: "active",
    progress: 64,
    tasks: 28,
    completedTasks: 18,
    sprints: 4,
    members: ["A", "D", "R"],
    updated: "Updated yesterday",
  },
  {
    id: "project-3",
    name: "StyleStudio",
    description:
      "Interactive web platform for exploring and organizing personal style ideas.",
    status: "active",
    progress: 48,
    tasks: 25,
    completedTasks: 12,
    sprints: 3,
    members: ["S", "D", "K", "A"],
    updated: "Updated 2 days ago",
  },
  {
    id: "project-4",
    name: "Dependency Health Checker",
    description:
      "Developer tool for analyzing dependency health, outdated packages and risks.",
    status: "completed",
    progress: 100,
    tasks: 19,
    completedTasks: 19,
    sprints: 2,
    members: ["S", "A"],
    updated: "Completed last week",
  },
];

const filters = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "active",
    label: "Active",
  },
  {
    key: "completed",
    label: "Completed",
  },
];

function ProjectAvatarGroup({ members }) {
  return (
    <div className="flex items-center">
      {members.map((member, index) => (
        <div
          key={`${member}-${index}`}
          className={`${
            index > 0 ? "-ml-2" : ""
          } flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold ${
            index === 0
              ? "bg-zinc-900 text-white"
              : index === 1
              ? "bg-zinc-700 text-white"
              : index === 2
              ? "bg-zinc-400 text-white"
              : "bg-zinc-200 text-zinc-700"
          }`}
        >
          {member}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const isCompleted = status === "completed";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isCompleted
          ? "bg-zinc-100 text-zinc-600"
          : "bg-zinc-900 text-white"
      }`}
    >
      {isCompleted && <CheckCircle2 size={12} />}
      {isCompleted ? "Completed" : "Active"}
    </span>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <FolderKanban size={18} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-zinc-950">
                {project.name}
              </h2>

              <StatusBadge status={project.status} />
            </div>

            <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
              {project.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">Progress</p>

          <p className="text-sm font-semibold text-zinc-950">
            {project.progress}%
          </p>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-zinc-100 border-t border-zinc-100 pt-5">
        <div>
          <p className="text-xs text-zinc-400">Tasks</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {project.completedTasks}/{project.tasks}
          </p>
        </div>

        <div className="pl-4">
          <p className="text-xs text-zinc-400">Sprints</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {project.sprints}
          </p>
        </div>

        <div className="pl-4">
          <p className="text-xs text-zinc-400">Team</p>
          <div className="mt-1">
            <ProjectAvatarGroup members={project.members} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Users size={14} />
          {project.members.length} members
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-950"
        >
          Open project
          <ArrowRight size={15} />
        </Link>
      </div>

      <p className="mt-3 text-xs text-zinc-400">{project.updated}</p>
    </div>
  );
}

function Projects() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesFilter =
        activeFilter === "all" || project.status === activeFilter;

      const matchesSearch =
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Projects
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage projects, progress and team activity from one place.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus size={16} />
          New project
        </button>
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 lg:max-w-sm">
          <Search size={17} className="shrink-0 text-zinc-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Project count */}
      <div className="mt-7 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Showing{" "}
          <span className="font-medium text-zinc-800">
            {filteredProjects.length}
          </span>{" "}
          {filteredProjects.length === 1 ? "project" : "projects"}
        </p>

        <p className="text-xs text-zinc-400">
          Last updated across your workspace
        </p>
      </div>

      {/* Projects */}
      {filteredProjects.length > 0 ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
            <FolderKanban size={20} className="text-zinc-500" />
          </div>

          <h2 className="mt-4 text-base font-semibold text-zinc-900">
            No projects found
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Try changing your search or selecting another filter.
          </p>
        </div>
      )}
    </div>
  );
}

export default Projects;