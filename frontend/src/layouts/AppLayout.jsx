import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Layers3,
  FileText,
  Video,
  Bell,
  GitBranch,
  Sparkles,
  Settings,
  UserRound,
  LogOut,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { notificationApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { initialsOf } from "../utils/format";

const workspaceItems = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "Sprints",
    path: "/sprints",
    icon: Layers3,
  },
];

const collaborationItems = [
  {
    label: "Documents",
    path: "/documents",
    icon: FileText,
  },
  {
    label: "Meetings",
    path: "/meetings",
    icon: Video,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
];

const developmentItems = [
  {
    label: "GitHub",
    path: "/github",
    icon: GitBranch,
  },
];

const intelligenceItems = [
  {
    label: "AI Assistant",
    path: "/ai",
    icon: Sparkles,
  },
];

function NavigationItem({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`
      }
    >
      <Icon size={17} strokeWidth={1.8} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function SidebarSection({ title, items }) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <NavigationItem key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
}

function BottomNavigationItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`
      }
    >
      <Icon size={17} strokeWidth={1.8} />
      <span>{children}</span>
    </NavLink>
  );
}

function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    notificationApi
      .list(true)
      .then((data) => setUnread(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [location.pathname, refreshUnread]);

  useEffect(() => {
    const timer = setInterval(refreshUnread, 60000);
    window.addEventListener("notifications:changed", refreshUnread);
    return () => {
      clearInterval(timer);
      window.removeEventListener("notifications:changed", refreshUnread);
    };
  }, [refreshUnread]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
          {/* Brand */}
          <div className="flex h-16 items-center border-b border-zinc-100 px-5">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                SynapseOS
              </h1>

              <p className="text-[11px] text-zinc-400">
                Intelligent workspace
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <SidebarSection
              title="Workspace"
              items={workspaceItems}
            />

            <SidebarSection
              title="Collaboration"
              items={collaborationItems}
            />

            <SidebarSection
              title="Development"
              items={developmentItems}
            />

            <SidebarSection
              title="Intelligence"
              items={intelligenceItems}
            />
          </div>

          {/* Bottom navigation */}
          <div className="border-t border-zinc-100 p-3">
            <div className="space-y-1">
              <BottomNavigationItem
                to="/settings"
                icon={Settings}
              >
                Settings
              </BottomNavigationItem>

              <BottomNavigationItem
                to="/profile"
                icon={UserRound}
              >
                Profile
              </BottomNavigationItem>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur lg:px-8">
            {/* Search */}
            <div className="w-full max-w-md">
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-zinc-400">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search projects, tasks..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="ml-4 flex items-center gap-3">
              {/* Notifications */}
              <button
                type="button"
                onClick={() => navigate("/notifications")}
                className="relative rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <Bell size={18} strokeWidth={1.8} />

                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 border-l border-zinc-200 pl-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                  {initialsOf(user?.name)}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-zinc-900">
                    {user?.name || "User"}
                  </p>

                  <p className="text-[11px] text-zinc-400">
                    {user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : "Member"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log out"
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <LogOut size={17} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;