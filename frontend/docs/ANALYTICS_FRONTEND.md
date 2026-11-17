# Analytics (frontend) - manual steps, only if the auto-patch could not find a spot

1. `src/App.jsx`: `import Analytics from "./pages/Analytics";` and add
   `<Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />` inside the ProtectedRoute block.
2. `src/layouts/AppLayout.jsx`: import `ChartColumn` from `lucide-react` and add
   `{ label: "Analytics", path: "/analytics", icon: ChartColumn }` to `workspaceItems`.
3. `src/pages/ProjectWorkspace.jsx` (optional tab): `<Link to={`/analytics?project=${projectId}`}>Analytics</Link>`.

Requires the backend analytics update (`GET /api/projects/:projectId/analytics`).
