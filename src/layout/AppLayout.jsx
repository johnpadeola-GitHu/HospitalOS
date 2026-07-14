import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../nav/Sidebar";
import { ALL_ROUTES } from "../nav/navGroups";
import { useAuth } from "../auth/AuthContext";

function useCrumb() {
  const { pathname } = useLocation();
  const match = ALL_ROUTES.find((r) => r.path === pathname);
  if (!match) return { group: "", label: "Not found" };
  return { group: match.groupLabel, label: match.label };
}

export default function AppLayout() {
  const crumb = useCrumb();
  const { user, roleLabel, devUsers, switchUser } = useAuth();
  const initials = user.name.split(" ").map((p) => p[0]).slice(-2).join("");
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={topbar}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {crumb.group ? `${crumb.group} \u203a ` : ""}
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{crumb.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right", lineHeight: 1.25 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-strong)" }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{roleLabel}</div>
            </div>
            <div style={avatar}>{initials}</div>
            <select
              aria-label="Switch user"
              style={switcher}
              value={user.id}
              onChange={(e) => switchUser(e.target.value)}
              title="Switch user (demo)"
            >
              {devUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "var(--bg)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const topbar = {
  height: 52,
  minHeight: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  background: "var(--surface-2)",
  borderBottom: "1px solid var(--border)",
};

const avatar = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "var(--accent-bg)",
  color: "var(--ink-strong)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 600,
};

const switcher = {
  font: "inherit",
  fontSize: 12,
  padding: "5px 8px",
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--ink)",
  maxWidth: 150,
};
