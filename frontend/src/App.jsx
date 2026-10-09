import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Tasks from "./pages/Tasks";
import Sprints from "./pages/Sprints";
import Documents from "./pages/Documents";
import Meetings from "./pages/Meetings";
import Notifications from "./pages/Notifications";
import GitHub from "./pages/GitHub";
import AI from "./pages/AI";
import { useAuth } from "./context/AuthContext";

function Placeholder({ title }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-950">
        {title}
      </h1>

      <p className="mt-1 text-sm text-zinc-500">
        SynapseOS workspace
      </p>
    </div>
  );
}

function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-zinc-950">Profile</h1>
      <p className="mt-1 text-sm text-zinc-500">Your SynapseOS account</p>

      <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {[
          ["Name", user?.name],
          ["Email", user?.email],
          ["Role", user?.role],
          ["User ID", user?._id],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-sm text-zinc-500">{label}</span>
            <span className="truncate text-sm font-medium text-zinc-900">{value || "—"}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-6 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Log out
      </button>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />

        <Route
          path="/projects"
          element={
            <AppLayout>
              <Projects />
            </AppLayout>
          }
        />

        <Route
          path="/projects/:projectId"
          element={
            <AppLayout>
              <ProjectWorkspace />
            </AppLayout>
          }
        />

        <Route
          path="/projects/:projectId/tasks"
          element={
            <AppLayout>
              <Tasks />
            </AppLayout>
          }
        />

        <Route
          path="/tasks"
          element={
            <AppLayout>
              <Tasks />
            </AppLayout>
          }
        />

        <Route
          path="/sprints"
          element={
            <AppLayout>
              <Sprints />
            </AppLayout>
          }
        />

        <Route
          path="/documents"
          element={
            <AppLayout>
              <Documents />
            </AppLayout>
          }
        />

        <Route
          path="/meetings"
          element={
            <AppLayout>
              <Meetings />
            </AppLayout>
          }
        />

        <Route
          path="/notifications"
          element={
            <AppLayout>
              <Notifications />
            </AppLayout>
          }
        />

        <Route
          path="/github"
          element={
            <AppLayout>
              <GitHub />
            </AppLayout>
          }
        />

        <Route
          path="/ai"
          element={
            <AppLayout>
              <AI />
            </AppLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <AppLayout>
              <Placeholder title="Settings" />
            </AppLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <AppLayout>
              <Profile />
            </AppLayout>
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;