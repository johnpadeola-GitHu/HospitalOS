import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { NAV_GROUPS } from "./navGroups";
import { alertCount } from "../modules/alerts/alertService";
import { useAuth } from "../auth/AuthContext";
import TenantBrand from "../layout/TenantBrand";

function Icon({ name, size = 16, style }) {
  const C = Icons[name] || Icons.Circle;
  return <C size={size} strokeWidth={1.9} style={style} />;
}

function groupContainsPath(group, pathname) {
  return group.items.some((it) => it.path === pathname);
}

const WIDTH_KEY = "hospitalos.sidebarWidth";
const MIN_WIDTH = 220;
const MAX_WIDTH = 380;
const DEFAULT_WIDTH = 258;

function loadWidth() {
  const saved = parseInt(localStorage.getItem(WIDTH_KEY), 10);
  if (Number.isFinite(saved) && saved >= MIN_WIDTH && saved <= MAX_WIDTH) return saved;
  return DEFAULT_WIDTH;
}

export default function Sidebar({ isOpen, onNavigate }) {
  const { pathname } = useLocation();
  const { can } = useAuth();
  const [alerts, setAlerts] = useState(0);
  const [width, setWidth] = useState(loadWidth);
  const [resizing, setResizing] = useState(false);

  // Drag-to-resize: the handle sits on the sidebar's right edge. Width is
  // clamped between MIN/MAX and persisted, so long group names like
  // "Patient care" never have to wrap or overflow \u2014 the user sets the
  // width that suits their own longest label once, and it stays.
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(next);
    };
    const onUp = () => {
      setResizing(false);
      setWidth((w) => { localStorage.setItem(WIDTH_KEY, String(w)); return w; });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing]);

  const visibleGroups = NAV_GROUPS.filter((g) => can(g.id));

  useEffect(() => {
    let alive = true;
    const load = () => alertCount().then((n) => { if (alive) setAlerts(n); }).catch((e) => console.error(e));
    load();
    const t = setInterval(load, 8000);
    return () => { alive = false; clearInterval(t); };
  }, [pathname]);

  const [open, setOpen] = useState(() => {
    const initial = {};
    for (const g of visibleGroups) initial[g.id] = g.noCollapse || groupContainsPath(g, pathname);
    if (!Object.values(initial).some(Boolean)) initial.overview = true;
    return initial;
  });

  const toggle = (id, noCollapse) => {
    if (noCollapse) return; // always-expanded groups ignore the toggle
    setOpen((o) => ({ ...o, [id]: !o[id] }));
  };

  return (
    <aside
      style={{ ...S.aside, width, minWidth: width }}
      className={`no-print app-sidebar${isOpen ? " is-open" : ""}`}
    >
      <div style={S.brand}>
        <TenantBrand />
      </div>

      {/* Drag handle: resizes the sidebar so long group names like "Patient
          care" never wrap or overflow. Width is remembered per browser. */}
      <div
        className="sidebar-resize-handle"
        style={{ ...S.resizeHandle, ...(resizing ? S.resizeHandleActive : null) }}
        onMouseDown={(e) => { e.preventDefault(); setResizing(true); }}
        onDoubleClick={() => { setWidth(DEFAULT_WIDTH); localStorage.setItem(WIDTH_KEY, String(DEFAULT_WIDTH)); }}
        title="Drag to resize \u00b7 double-click to reset"
      />

      <nav style={S.nav}>
        {visibleGroups.map((g) => {
          const isOpen = open[g.id];
          const isActiveGroup = groupContainsPath(g, pathname);
          return (
            <div key={g.id} style={{ marginBottom: 1 }}>
              <button
                style={{ ...S.groupHeader, ...(isActiveGroup ? S.groupHeaderActive : null), ...(g.noCollapse ? S.groupHeaderStatic : null) }}
                onClick={() => toggle(g.id, g.noCollapse)}
                aria-expanded={isOpen}
                disabled={g.noCollapse}
              >
                <Icon name={g.icon} size={17} style={{ color: isActiveGroup ? "var(--accent)" : "var(--charcoal)", flexShrink: 0 }} />
                <span style={S.groupLabel}>{g.label}</span>
                {g.comingSoon ? (
                  <span style={S.soonBadge}>Soon</span>
                ) : (
                  <span style={S.count}>{g.items.length}</span>
                )}
                {!g.noCollapse && (
                  <Icons.ChevronRight
                    size={13}
                    style={{
                      color: "var(--muted)", flexShrink: 0,
                      transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s",
                    }}
                  />
                )}
              </button>

              {isOpen && (
                <div style={S.subList}>
                  {/* Vertical rail marks the hierarchy level */}
                  <div style={S.rail} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {g.items.map((it) => (
                      <NavLink
                        key={it.id}
                        to={it.path}
                        end={it.path === "/"}
                        onClick={onNavigate}
                        style={({ isActive }) => ({ ...S.item, ...(isActive ? S.itemActive : null) })}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              name={it.icon}
                              size={16}
                              style={{ color: isActive ? "var(--charcoal-strong)" : "var(--muted)", flexShrink: 0 }}
                            />
                            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {it.label}
                            </span>
                            {it.path === "/alerts" && alerts > 0 && <span style={S.alertBadge}>{alerts}</span>}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Pinned, always visible — Help is a standalone engine, not a
          workflow-group item, so it lives outside the scrollable list. */}
      <div style={S.pinnedFooter}>
        <NavLink
          to="/help"
          onClick={onNavigate}
          style={({ isActive }) => ({ ...S.pinnedLink, ...(isActive ? S.pinnedLinkActive : null) })}
        >
          <Icon name="BookOpen" size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Help &amp; documentation</span>
          <Icons.ChevronRight size={13} style={{ color: "var(--muted)" }} />
        </NavLink>
      </div>
    </aside>
  );
}

const S = {
  aside: {
    height: "100vh", position: "relative",
    background: "var(--sidebar)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    flexShrink: 0,
  },
  resizeHandle: {
    position: "absolute", top: 0, right: -3, width: 6, height: "100%",
    cursor: "col-resize", zIndex: 20, background: "transparent",
  },
  resizeHandleActive: {
    background: "var(--accent)", opacity: 0.35,
  },
  brand: {
    display: "flex", alignItems: "center", gap: 10, padding: "16px 18px",
    borderBottom: "1px solid var(--border)", flexShrink: 0,
    background: "var(--sidebar)",
  },
  nav: { padding: "10px 12px 14px", flex: 1, overflowY: "auto" },
  pinnedFooter: { flexShrink: 0, borderTop: "1px solid var(--border)", padding: "10px 12px", background: "var(--sidebar)" },
  pinnedLink: {
    display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
    borderRadius: 9, fontSize: 13.5, fontWeight: 500, color: "var(--ink)",
  },
  pinnedLinkActive: { background: "var(--accent-bg)", color: "var(--accent)" },
  groupHeader: {
    width: "100%", display: "flex", alignItems: "center", gap: 12,
    padding: "8px 12px", background: "none", border: "none", cursor: "pointer",
    font: "inherit", color: "var(--charcoal-strong)", borderRadius: 9,
  },
  groupHeaderStatic: {
    cursor: "default", opacity: 1,
  },
  // Active/open group: soft fill only, no left accent bar.
  groupHeaderActive: {
    background: "var(--accent-bg)",
  },
  groupLabel: {
    flex: 1, textAlign: "left", fontSize: 12.5, fontWeight: 600,
    letterSpacing: "0.04em", color: "var(--charcoal-strong)", textTransform: "uppercase",
  },
  count: {
    fontSize: 11, fontWeight: 600, color: "var(--muted)",
    background: "var(--surface)", border: "1px solid var(--border)",
    minWidth: 20, textAlign: "center", padding: "1px 6px", borderRadius: 999,
  },
  soonBadge: {
    fontSize: 9, fontWeight: 700, color: "#FFFFFF",
    background: "var(--bad)", padding: "2px 7px", borderRadius: 999,
    letterSpacing: "0.03em", textTransform: "uppercase",
  },
  // Indent: rail + content, so leaves sit clearly one level under the domain.
  subList: { display: "flex", gap: 10, paddingLeft: 20, paddingBottom: 6, paddingTop: 3 },
  rail: { width: 1.5, background: "var(--border)", borderRadius: 1, flexShrink: 0 },
  item: {
    display: "flex", alignItems: "center", gap: 11,
    padding: "9px 11px", margin: "1px 0", fontSize: 13.5,
    color: "var(--charcoal)", borderRadius: 8, fontWeight: 450,
  },
  itemActive: {
    color: "var(--accent)", background: "var(--accent-bg)", fontWeight: 600,
  },
  alertBadge: {
    fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--bad)",
    minWidth: 20, height: 20, borderRadius: 999, display: "inline-flex",
    alignItems: "center", justifyContent: "center", padding: "0 6px", flexShrink: 0,
  },
};
