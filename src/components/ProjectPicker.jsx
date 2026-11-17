function ProjectPicker({ projects, projectId, onChange }) {
  if (projects.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-500">
      <span className="hidden sm:inline">Project</span>
      <select
        value={projectId}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[16rem] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-zinc-400"
      >
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ProjectPicker;
