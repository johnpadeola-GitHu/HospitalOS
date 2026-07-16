import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { NAV_GROUPS } from "./navGroups";
import { alertCount } from "../modules/alerts/alertService";
import { useAuth } from "../auth/AuthContext";

function Icon({ name, size = 16, style }) {
  const C = Icons[name] || Icons.Circle;
  return <C size={size} strokeWidth={1.9} style={style} />;
}

function groupContainsPath(group, pathname) {
  return group.items.some((it) => it.path === pathname);
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { can } = useAuth();
  const [alerts, setAlerts] = useState(0);

  const visibleGroups = NAV_GROUPS.filter((g) => can(g.id));

  useEffect(() => {
    let alive = true;
    const load = () => alertCount().then((n) => alive && setAlerts(n));
    load();
    const t = setInterval(load, 8000);
    return () => { alive = false; clearInterval(t); };
  }, [pathname]);

  const [open, setOpen] = useState(() => {
    const initial = {};
    for (const g of visibleGroups) initial[g.id] = groupContainsPath(g, pathname);
    if (!Object.values(initial).some(Boolean)) initial.overview = true;
    return initial;
  });

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <aside style={S.aside}>
      <div style={S.brand}>
        <div style={S.brandMark}>
          <Icons.Cross size={16} strokeWidth={2.5} color="#fff" />
        </div>
        <div>
          <div style={S.brandText}>HospitalOS</div>
          <div style={S.brandSub}>Ibadan Teaching Hospital</div>
        </div>
      </div>

      <nav style={S.nav}>
        {visibleGroups.map((g) => {
          const isOpen = open[g.id];
          return (
            <div key={g.id} style={{ marginBottom: 3 }}>
              <button style={S.groupHeader} onClick={() => toggle(g.id)} aria-expanded={isOpen}>
                <Icon name={g.icon} size={15} style={{ color: "var(--charcoal)", flexShrink: 0 }} />
                <span style={S.groupLabel}>{g.label}</span>
                {g.comingSoon ? (
                  <span style={S.soonBadge}>Soon</span>
                ) : (
                  <span style={S.count}>{g.items.length}</span>
                )}
                <Icons.ChevronRight
                  size={13}
                  style={{
                    color: "var(--muted)", flexShrink: 0,
                    transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s",
                  }}
                />
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
                        style={({ isActive }) => ({ ...S.item, ...(isActive ? S.itemActive : null) })}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              name={it.icon}
                              size={14}
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
    width: 250, minWidth: 250, height: "100vh",
    background: "var(--sidebar)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  brand: {
    display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
    borderBottom: "1px solid var(--border)", flexShrink: 0,
    background: "var(--sidebar)",
  },
  brandMark: {
    width: 30, height: 30, borderRadius: 8,
    background: "linear-gradient(135deg, #33393F, #4B535B)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: "var(--shadow-sm)",
  },
  brandText: { fontSize: 14, fontWeight: 700, color: "var(--charcoal-strong)", letterSpacing: "-0.02em" },
  brandSub: { fontSize: 10, color: "var(--muted)" },
  nav: { padding: "8px 10px 12px", flex: 1, overflowY: "auto" },
  pinnedFooter: { flexShrink: 0, borderTop: "1px solid var(--border)", padding: "8px", background: "var(--sidebar)" },
  pinnedLink: {
    display: "flex", alignItems: "center", gap: 9, padding: "8px 9px",
    borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: "var(--ink)",
  },
  pinnedLinkActive: { background: "var(--accent-bg)", color: "var(--accent)" },
  groupHeader: {
    width: "100%", display: "flex", alignItems: "center", gap: 9,
    padding: "8px 8px", background: "none", border: "none", cursor: "pointer",
    font: "inherit", color: "var(--charcoal)", borderRadius: 8,
  },
  groupLabel: {
    flex: 1, textAlign: "left", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--charcoal)",
  },
  count: {
    fontSize: 10, fontWeight: 600, color: "var(--muted)",
    background: "var(--surface)", border: "1px solid var(--border)",
    minWidth: 18, textAlign: "center", padding: "1px 5px", borderRadius: 5,
  },
  soonBadge: {
    fontSize: 9, fontWeight: 700, color: "#FFFFFF",
    background: "var(--bad)", padding: "2px 6px", borderRadius: 4,
    letterSpacing: "0.03em", textTransform: "uppercase",
  },  // Indent: rail + content, so leaves sit clearly one level under the domain.
  subList: { display: "flex", gap: 9, paddingLeft: 15, paddingBottom: 5, paddingTop: 2 },
  rail: { width: 1.5, background: "var(--border)", borderRadius: 1, flexShrink: 0 },
  item: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6.5px 9px", margin: "1px 0", fontSize: 12.5,
    color: "var(--charcoal)", borderRadius: 7, fontWeight: 450,
  },
  itemActive: {
    color: "var(--charcoal-strong)", background: "var(--charcoal-bg)", fontWeight: 600,
  },
  alertBadge: {
    fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--bad)",
    minWidth: 17, height: 17, borderRadius: 999, display: "inline-flex",
    alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0,
  },
};
