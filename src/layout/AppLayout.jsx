import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import Sidebar from "../nav/Sidebar";
import { ALL_ROUTES } from "../nav/navGroups";
import { useAuth } from "../auth/AuthContext";
import Platform from "../modules/platform/Platform";
import GlobalSearch from "./GlobalSearch";
import TenantBrand from "./TenantBrand";
import NotificationBell from "./NotificationBell";
import DemoBanner from "./DemoBanner";

function useCrumb() {
  const { pathname } = useLocation();
  if (pathname === "/help") return { group: "Help", label: "Help & documentation" };
  const match = ALL_ROUTES.find((r) => r.path === pathname);
  if (!match) return { group: "", label: "Not found" };
  return { group: match.groupLabel, label: match.label };
}
export default function AppLayout() {
  const crumb = useCrumb();
  const { pathname } = useLocation();
  const { user, roleLabel, signOut, isPlatformAdmin, view, setView } = useAuth();
  const initials = user.name.split(" ").map((p) => p[0]).slice(-2).join("");
  const platformMode = view === "platform";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // A tap on any nav link, or a route change from anywhere else, closes the
  // mobile drawer automatically — no one wants to navigate and then have to
  // separately dismiss the menu that got them there.
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {!platformMode && <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />}
      {!platformMode && sidebarOpen && (
        <div className="app-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={topbar} className="no-print app-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {!platformMode && (
              <button className="app-hamburger" style={hamburgerBtn} onClick={() => setSidebarOpen((v) => !v)} aria-label="Open menu">
                <Icons.Menu size={19} />
              </button>
            )}
            {platformMode ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={platformMark}><Icons.ShieldCheck size={15} color="#fff" strokeWidth={2.2} /></div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)" }}>AgoroX Platform</span>
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <TenantBrand />
                <span className="app-topbar-crumb" style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {crumb.group ? <>&rsaquo; {crumb.group}</> : null} &rsaquo;{" "}
                  <span style={{ color: "var(--ink-strong)", fontWeight: 600 }}>{crumb.label}</span>
                </span>
              </span>
            )}
          </div>

          {!platformMode && (
            <GlobalSearch />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isPlatformAdmin && (
              <button
                type="button"
                role="switch"
                aria-checked={platformMode}
                aria-label={`Switch to ${platformMode ? "Hospital" : "Platform"} view`}
                title={`Currently viewing: ${platformMode ? "Platform" : "Hospital"} \u2014 click to switch`}
                onClick={() => setView(platformMode ? "tenant" : "platform")}
                style={{ ...viewSwitchTrack, ...(platformMode ? viewSwitchTrackOn : null) }}
              >
                <Icons.Building2 size={11} style={{ position: "absolute", left: 5, color: platformMode ? "var(--muted)" : "#fff", zIndex: 1 }} />
                <Icons.ShieldCheck size={11} style={{ position: "absolute", right: 5, color: platformMode ? "#fff" : "var(--muted)", zIndex: 1 }} />
                <span style={{ ...viewSwitchThumb, ...(platformMode ? viewSwitchThumbOn : null) }} />
              </button>
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
          </div>
        </header>

        <DemoBanner />

        <main style={main}>
          <div style={container} className="app-content-container">{platformMode ? <Platform /> : <Outlet />}</div>
          <footer style={footer} className="no-print">
            <div style={footerInner} className="app-footer-inner">
              <div style={footerBrandRow}>
                <div style={footerLogo}><Icons.Cross size={11} strokeWidth={2.5} color="#fff" /></div>
                <span style={footerBrand}>HospitalOS</span>
                <span style={footerBy}>by AgoroX Africa</span>
              </div>
              <nav style={footerLinks}>
                <a href="#" style={footLink}>Privacy Policy</a>
                <a href="#" style={footLink}>EULA</a>
                <a href="#" style={footLink}>IP Policy</a>
                <a href="#" style={footLink}>Contact Support</a>
              </nav>
              <div style={footerMeta}>v1.0.0 &nbsp;&middot;&nbsp; &copy; 2026 AgoroX Africa. All rights reserved.</div>
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
const hamburgerBtn = {
  display: "none", alignItems: "center", justifyContent: "center",
  width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--charcoal-strong)", cursor: "pointer", flexShrink: 0,
};
// Generous padding on all four sides, with a max width so content breathes.
const main = { flex: 1, overflowY: "auto", background: "var(--bg)", padding: "28px 32px 0", display: "flex", flexDirection: "column" };
const container = { maxWidth: 1320, margin: "0 auto", width: "100%", flex: 1, paddingBottom: 36 };
const footer = { maxWidth: 1320, margin: "0 auto", width: "100%", borderTop: "1px solid var(--border)", padding: "18px 0 22px" };
const footerInner = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
  flexWrap: "wrap", fontSize: 11.5, color: "var(--muted)",
};
const footerBrandRow = { display: "flex", alignItems: "center", gap: 7, flexShrink: 0 };
const footerLogo = { width: 18, height: 18, borderRadius: 5, background: "var(--bad)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const footerBrand = { fontSize: 12.5, fontWeight: 700, color: "var(--charcoal-strong)" };
const footerBy = { fontSize: 11, color: "var(--muted)" };
const footerLinks = { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" };
const footLink = { color: "var(--muted)", fontWeight: 500, whiteSpace: "nowrap" };
const footerMeta = { fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 };
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
const viewSwitchTrack = {
  position: "relative", display: "flex", alignItems: "center",
  width: 48, height: 24, borderRadius: 999, border: "1px solid var(--border-strong)",
  background: "var(--surface)", cursor: "pointer", padding: 0, flexShrink: 0,
  transition: "background 0.15s ease",
};
const viewSwitchTrackOn = { background: "var(--accent)", borderColor: "var(--accent)" };
const viewSwitchThumb = {
  position: "absolute", top: 2, left: 2, width: 18, height: 18, borderRadius: "50%",
  background: "#fff", boxShadow: "0 1px 3px rgba(22,35,59,0.25)",
  transition: "transform 0.15s ease",
};
const viewSwitchThumbOn = { transform: "translateX(24px)" };
const signOutBtn = {
  background: "none", border: "1px solid var(--border)", borderRadius: 8,
  padding: "6px 7px", cursor: "pointer", color: "var(--muted)", display: "flex",
};
