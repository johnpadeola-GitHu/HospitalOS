import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { NAV_GROUPS } from "./navGroups";
import { alertCount } from "../modules/alerts/alertService";
import { useAuth } from "../auth/AuthContext";

// Resolve a lucide icon by name, with a safe fallback.
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
            <div key={g.id} style={{ marginBottom: 2 }}>
              <button style={S.groupHeader} onClick={() => toggle(g.id)} aria-expanded={isOpen}>
                <Icon name={g.icon} size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
                <span style={S.groupLabel}>{g.label}</span>
                {g.comingSoon && <span style={S.soonBadge}>Soon</span>}
                <Icons.ChevronRight
                  size={13}
                  style={{ color: "var(--muted)", flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}
                />
              </button>

              {isOpen && (
                <div style={S.subList}>
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
                            size={15}
                            style={{ color: isActive ? "var(--accent)" : "var(--muted)", flexShrink: 0 }}
                          />
                          <span style={{ flex: 1 }}>{it.label}</span>
                          {it.path === "/alerts" && alerts > 0 && <span style={S.alertBadge}>{alerts}</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

const S = {
  aside: {
    width: 246, minWidth: 246, height: "100vh",
    background: "var(--sidebar)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", overflowY: "auto",
  },
  brand: {
    display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
    borderBottom: "1px solid var(--border)", position: "sticky", top: 0,
    background: "var(--sidebar)", zIndex: 2,
  },
  brandMark: {
    width: 30, height: 30, borderRadius: 8,
    background: "linear-gradient(135deg, #1E3A6E, #2F5FA8)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    boxShadow: "var(--shadow-sm)",
  },
  brandText: { fontSize: 14, fontWeight: 700, color: "var(--ink-strong)", letterSpacing: "-0.02em" },
  brandSub: { fontSize: 10, color: "var(--muted)" },
  nav: { padding: "8px 8px 20px" },
  groupHeader: {
    width: "100%", display: "flex", alignItems: "center", gap: 9,
    padding: "8px 8px", background: "none", border: "none", cursor: "pointer",
    font: "inherit", color: "var(--ink)", borderRadius: 8,
  },
  groupLabel: {
    flex: 1, textAlign: "left", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)",
  },
  soonBadge: {
    fontSize: 9, fontWeight: 600, color: "var(--accent)", background: "var(--accent-bg)",
    padding: "2px 5px", borderRadius: 4, letterSpacing: 0,
  },
  subList: { paddingBottom: 4 },
  item: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "7px 9px 7px 10px", margin: "1px 0", fontSize: 12.5,
    color: "var(--ink)", borderRadius: 8, fontWeight: 450,
  },
  itemActive: {
    color: "var(--accent)", background: "var(--accent-bg)", fontWeight: 600,
  },
  alertBadge: {
    fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--bad)",
    minWidth: 17, height: 17, borderRadius: 999, display: "inline-flex",
    alignItems: "center", justifyContent: "center", padding: "0 5px",
  },
};
