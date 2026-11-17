
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { projectApi } from "../api/projectApi";
import { memberApi } from "../api/memberApi";

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

function ProjectAvatarGroup({ members = [] }) {
  return (
    <div className="flex items-center">
      {members.slice(0, 4).map((member, index) => {
        const name =
          typeof member === "object"
            ? member.name || member.email || "U"
            : String(member);

        const initial = name.charAt(0).toUpperCase();

        return (
          <div
            key={`${name}-${index}`}
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
            {initial}
          </div>
        );
      })}
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
      {isCompleted ? "Completed" : status}
    </span>
  );
}

function ProjectCard({ project }) {
  const members = Array.isArray(project.members)
    ? project.members
    : [];

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
              {project.description || "No description provided."}
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
          <p className="text-sm text-zinc-500">Project status</p>

          <p className="text-sm font-semibold capitalize text-zinc-950">
            {project.status}
          </p>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900"
            style={{
              width:
                project.status === "completed"
                  ? "100%"
                  : project.status === "active"
                  ? "60%"
                  : "25%",
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 divide-x divide-zinc-100 border-t border-zinc-100 pt-5">
        <div>
          <p className="text-xs text-zinc-400">Team</p>

          <div className="mt-1">
            <ProjectAvatarGroup members={members} />
          </div>
        </div>

        <div className="pl-4">
          <p className="text-xs text-zinc-400">Members</p>

          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {members.length}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Users size={14} />
          {members.length} members
        </div>

        <Link
          to={`/projects/${project._id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-950"
        >
          Open project
          <ArrowRight size={15} />
        </Link>
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        {project.updatedAt
          ? `Updated ${new Date(project.updatedAt).toLocaleString()}`
          : "No update information"}
      </p>
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await projectApi.createProject({
        name: name.trim(),
        description: description.trim(),
        status,
      });

      const project = result.data?.project;

      // Optional: add teammates (they must already have a SynapseOS account)
      const failed = [];
      let memberCount = 0;
      const list = emails
        .split(/[\s,;]+/)
        .map((e) => e.trim())
        .filter(Boolean);

      for (const email of list) {
        try {
          await memberApi.addMember(project._id, email);
          memberCount += 1;
        } catch (err) {
          failed.push(
            `${email} (${err.response?.data?.message || "failed"})`
          );
        }
      }

      onCreated({
        ...project,
        members: [...(project.members || []), ...Array(memberCount).fill("M")],
      });

      if (failed.length) {
        window.alert(
          "Project created, but these members could not be added:\n" +
            failed.join("\n")
        );
      }

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create the project."
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              New project
            </h2>

            <p className="mt-0.5 text-xs text-zinc-400">
              Create a workspace for your team.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="text-sm font-medium text-zinc-800">
              Project name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. SynapseOS"
              autoFocus
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What is this project about?"
              className="mt-2 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-800">
                Status
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-800">
                Team emails <span className="text-zinc-400">(optional)</span>
              </label>

              <input
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                placeholder="a@x.com, b@x.com"
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await projectApi.getProjects();

        setProjects(result.data?.projects || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load projects."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesFilter =
        activeFilter === "all" ||
        project.status === activeFilter;

      const matchesSearch =
        !normalizedSearch ||
        project.name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        project.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [projects, activeFilter, search]);

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
          onClick={() => setShowModal(true)}
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
                onClick={() =>
                  setActiveFilter(filter.key)
                }
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
          <Search
            size={17}
            className="shrink-0 text-zinc-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search projects..."
            className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            Loading projects...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Project count */}
      {!loading && !error && (
        <>
          <div className="mt-7 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing{" "}
              <span className="font-medium text-zinc-800">
                {filteredProjects.length}
              </span>{" "}
              {filteredProjects.length === 1
                ? "project"
                : "projects"}
            </p>

            <p className="text-xs text-zinc-400">
              Last updated across your workspace
            </p>
          </div>

          {/* Projects */}
          {filteredProjects.length > 0 ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
                <FolderKanban
                  size={20}
                  className="text-zinc-500"
                />
              </div>

              <h2 className="mt-4 text-base font-semibold text-zinc-900">
                No projects found
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Try changing your search or selecting another
                filter.
              </p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(project) =>
            setProjects((current) => [project, ...current])
          }
        />
      )}
    </div>
  );
}

export default Projects;
