import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { projectApi } from "../api/services";
import { useAuth } from "./AuthContext";
import { errMsg } from "../utils/format";

const ProjectContext = createContext(null);

const STORAGE_KEY = "activeProjectId";

export function ProjectProvider({ children }) {
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeProjectId, setActiveId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await projectApi.list();
      const list = data.projects || [];
      setProjects(list);

      setActiveId((current) => {
        const stillExists = list.some((p) => p._id === current);
        const next = stillExists ? current : list[0]?._id || "";
        if (next) localStorage.setItem(STORAGE_KEY, next);
        else localStorage.removeItem(STORAGE_KEY);
        return next;
      });

      return list;
    } catch (err) {
      setError(errMsg(err, "Could not load projects"));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setProjects([]);
      setActiveId("");
      return;
    }

    refreshProjects();
  }, [authLoading, isAuthenticated, user?._id, refreshProjects]);

  const setActiveProjectId = useCallback((id) => {
    setActiveId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p._id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  const value = useMemo(
    () => ({
      projects,
      loading,
      error,
      activeProjectId,
      activeProject,
      setActiveProjectId,
      refreshProjects,
    }),
    [projects, loading, error, activeProjectId, activeProject, setActiveProjectId, refreshProjects]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjects must be used inside ProjectProvider");
  }

  return context;
}
