import { Outlet, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import Sidebar from "../nav/Sidebar";
import { ALL_ROUTES } from "../nav/navGroups";
import { useAuth } from "../auth/AuthContext";
import Platform from "../modules/platform/Platform";
import GlobalSearch from "./GlobalSearch";
import TenantBrand from "./TenantBrand";
import NotificationBell from "./NotificationBell";

function useCrumb() {
  const { pathname } = useLocation();
  const match = ALL_ROUTES.find((r) => r.path === pathname);
  if (!match) return { group: "", label: "Not found" };
  return { group: match.groupLabel, label: match.label };
}

export default function AppLayout() {
  const crumb = useCrumb();
  const { user, roleLabel, signOut, isPlatformAdmin, view, setView } = useAuth();
  const initials = user.name.split(" ").map((p) => p[0]).slice(-2).join("");
  const platformMode = view === "platform";

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {!platformMode && <Sidebar />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {platformMode ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={platformMark}><Icons.ShieldCheck size={15} color="#fff" strokeWidth={2.2} /></div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)" }}>AgoroX Platform</span>
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                HospitalOS {crumb.group ? <>&rsaquo; {crumb.group}</> : null} &rsaquo;{" "}
                <span style={{ color: "var(--ink-strong)", fontWeight: 600 }}>{crumb.label}</span>
              </span>
            )}
          </div>

          {!platformMode && (
            <GlobalSearch />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isPlatformAdmin && (
              <div style={viewToggle}>
                <button
                  onClick={() => setView("tenant")}
                  style={{ ...toggleBtn, ...(!platformMode ? toggleActive : null) }}
                >
                  <Icons.Building2 size={13} /> Hospital
                </button>
                <button
                  onClick={() => setView("platform")}
                  style={{ ...toggleBtn, ...(platformMode ? toggleActive : null) }}
                >
                  <Icons.ShieldCheck size={13} /> Platform
                </button>
              </div>
            )}

            <span style={pill}><span style={dot} /> Online</span>
            <NotificationBell />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "right", lineHeight: 1.25 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-strong)", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{roleLabel}</div>
              </div>
              <div style={avatar}>{initials}</div>
              <button onClick={signOut} style={signOutBtn} title="Sign out">
                <Icons.LogOut size={15} />
              </button>
            </div>
            {!platformMode && <TenantBrand />}
          </div>
        </header>

        <main style={main}>
          <div style={container}>{platformMode ? <Platform /> : <Outlet />}</div>
          <footer style={footer}>
            <div style={footerInner}>
              <div>
                Powered by <b style={{ color: "var(--charcoal)" }}>AgoroX Technologies</b>
                <span style={dotSep}>·</span>v1.0.0
                <span style={dotSep}>·</span>&copy; 2026. All Rights Reserved.
              </div>
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                <a href="#" style={footLink}>Privacy Policy</a>
                <span style={dotSep}>·</span>
                <a href="#" style={footLink}>EULA</a>
                <span style={dotSep}>·</span>
                <a href="#" style={footLink}>IP Policy</a>
                <span style={dotSep}>·</span>
                <a href="#" style={footLink}>Contact Support</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

const topbar = {
  height: 58, minHeight: 58, display: "flex", alignItems: "center",
  justifyContent: "space-between", gap: 16, padding: "0 24px",
  background: "var(--surface-2)", borderBottom: "1px solid var(--border)",
};
// Generous padding on all four sides, with a max width so content breathes.
const main = { flex: 1, overflowY: "auto", background: "var(--bg)", padding: "28px 32px 0", display: "flex", flexDirection: "column" };
const container = { maxWidth: 1320, margin: "0 auto", width: "100%", flex: 1, paddingBottom: 36 };
const footer = { maxWidth: 1320, margin: "0 auto", width: "100%", borderTop: "1px solid var(--border)", padding: "16px 0 22px" };
const footerInner = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", fontSize: 11.5, color: "var(--muted)" };
const footLink = { color: "var(--muted)", fontWeight: 500 };
const dotSep = { margin: "0 7px", color: "var(--border-strong)" };
const searchBox = {
  display: "flex", alignItems: "center", gap: 8, flex: "0 1 380px",
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px",
};
const kbd = {
  fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)",
  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px",
};
const pill = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500,
  color: "var(--good)", background: "var(--good-bg)", padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap",
};
const dot = { width: 6, height: 6, borderRadius: "50%", background: "var(--good)" };
const avatar = {
  width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1E3A6E, #2F5FA8)",
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 11, fontWeight: 700, flexShrink: 0,
};
const platformMark = {
  width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #1E3A6E, #2F5FA8)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const viewToggle = {
  display: "flex", gap: 2, background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 9, padding: 2,
};
const toggleBtn = {
  display: "inline-flex", alignItems: "center", gap: 5, font: "inherit", fontSize: 11.5,
  fontWeight: 600, padding: "5px 10px", borderRadius: 7, border: "none",
  background: "none", color: "var(--muted)", cursor: "pointer",
};
const toggleActive = { background: "var(--surface-2)", color: "var(--accent)", boxShadow: "var(--shadow-sm)" };
const signOutBtn = {
  background: "none", border: "1px solid var(--border)", borderRadius: 8,
  padding: "6px 7px", cursor: "pointer", color: "var(--muted)", display: "flex",
};
