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
              <Placeholder title="Profile" />
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