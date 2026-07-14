import { Outlet, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import Sidebar from "../nav/Sidebar";
import { ALL_ROUTES } from "../nav/navGroups";
import { useAuth } from "../auth/AuthContext";

function useCrumb() {
  const { pathname } = useLocation();
  const match = ALL_ROUTES.find((r) => r.path === pathname);
  if (!match) return { group: "", label: "Not found", icon: "Circle" };
  return { group: match.groupLabel, label: match.label, icon: match.icon };
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
              HospitalOS {crumb.group ? <>&rsaquo; {crumb.group}</> : null} &rsaquo;{" "}
              <span style={{ color: "var(--ink-strong)", fontWeight: 600 }}>{crumb.label}</span>
            </span>
          </div>

          <div style={searchBox}>
            <Icons.Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: "var(--muted)", flex: 1 }}>
              Search patients, orders, records…
            </span>
            <kbd style={kbd}>Ctrl K</kbd>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={pill}>
              <span style={dot} /> Online
            </span>
            <Icons.Bell size={16} style={{ color: "var(--muted)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "right", lineHeight: 1.25 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-strong)", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{roleLabel}</div>
              </div>
              <div style={avatar}>{initials}</div>
              <select aria-label="Switch user" style={switcher} value={user.id} onChange={(e) => switchUser(e.target.value)}>
                {devUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "22px 26px 40px", background: "var(--bg)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const topbar = {
  height: 56, minHeight: 56, display: "flex", alignItems: "center",
  justifyContent: "space-between", gap: 16, padding: "0 20px",
  background: "var(--surface-2)", borderBottom: "1px solid var(--border)",
};
const searchBox = {
  display: "flex", alignItems: "center", gap: 8, flex: "0 1 380px",
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "7px 10px",
};
const kbd = {
  fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)",
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: 4, padding: "2px 5px",
};
const pill = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11,
  fontWeight: 500, color: "var(--good)", background: "var(--good-bg)",
  padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap",
};
const dot = { width: 6, height: 6, borderRadius: "50%", background: "var(--good)" };
const avatar = {
  width: 32, height: 32, borderRadius: "50%",
  background: "linear-gradient(135deg, #1E3A6E, #2F5FA8)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 11, fontWeight: 700, flexShrink: 0,
};
const switcher = {
  font: "inherit", fontSize: 11, padding: "4px 6px", borderRadius: 7,
  border: "1px solid var(--border)", background: "var(--surface-2)",
  color: "var(--ink)", maxWidth: 120,
};
