import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { projectApi } from "../api/projectApi";

const STORAGE_KEY = "synapse.projectId";

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

// Loads the user's projects and keeps one selected.
// Order of preference: ?project=<id> in the URL -> last used -> first project.
export function useProjectSelection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    projectApi
      .getProjects()
      .then((result) => {
        if (!cancelled) setProjects(result.data?.projects || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load your projects.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fromUrl = searchParams.get("project") || "";
  const candidates = [fromUrl, readStored()];
  const projectId =
    candidates.find((id) => id && projects.some((p) => p._id === id)) ||
    projects[0]?._id ||
    "";

  const setProjectId = useCallback(
    (id) => {
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        /* storage unavailable - selection still works for this page */
      }
      setSearchParams({ project: id }, { replace: true });
    },
    [setSearchParams]
  );

  return { projects, projectId, setProjectId, loading, error, searchParams, setSearchParams };
}

export const errorText = (err, fallback) => err?.response?.data?.message || fallback;

export const initialsOf = (name = "?") => {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

export const timeAgo = (value) => {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
