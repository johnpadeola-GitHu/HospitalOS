import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_GROUPS } from "./navGroups";
import { alertCount } from "../modules/alerts/alertService";
import { useAuth } from "../auth/AuthContext";

function groupContainsPath(group, pathname) {
  return group.items.some((it) => it.path === pathname);
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { can } = useAuth();
  const [alerts, setAlerts] = useState(0);

  // Only show groups the current role can access.
  const visibleGroups = NAV_GROUPS.filter((g) => can(g.id));

  // Poll the active alert count so the badge reflects critical values
  // raised elsewhere without needing to open the Alerts screen.
  useEffect(() => {
    let alive = true;
    const load = () => alertCount().then((n) => alive && setAlerts(n));
    load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pathname]);

  // Open the group that contains the current route by default.
  const [open, setOpen] = useState(() => {
    const initial = {};
    for (const g of visibleGroups) {
      initial[g.id] = groupContainsPath(g, pathname);
    }
    if (!Object.values(initial).some(Boolean)) initial.overview = true;
    return initial;
  });

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <aside style={S.aside}>
      <div style={S.brand}>
        <div style={S.brandIcon}>H</div>
        <span style={S.brandText}>HospitalOS</span>
      </div>

      <nav style={S.nav}>
        {visibleGroups.map((g) => {
          const isOpen = open[g.id];
          return (
            <div key={g.id}>
              <button
                style={S.groupHeader}
                onClick={() => toggle(g.id)}
                aria-expanded={isOpen}
              >
                <span style={S.groupLabel}>{g.label}</span>
                {g.comingSoon ? (
                  <span style={S.soonBadge}>Soon</span>
                ) : (
                  <span style={S.count}>{g.items.length}</span>
                )}
                <span style={S.chevron}>{isOpen ? "\u2013" : "+"}</span>
              </button>

              {isOpen && (
                <div style={S.subList}>
                  {g.items.map((it) => (
                    <NavLink
                      key={it.id}
                      to={it.path}
                      end={it.path === "/"}
                      style={({ isActive }) => ({
                        ...S.item,
                        ...(isActive ? S.itemActive : null),
                      })}
                    >
                      <span>{it.label}</span>
                      {it.path === "/alerts" && alerts > 0 && (
                        <span style={S.alertBadge}>{alerts}</span>
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
    width: 264,
    minWidth: 264,
    height: "100vh",
    background: "var(--surface-2)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "16px 18px",
    borderBottom: "1px solid var(--border)",
  },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    background: "var(--accent-bg)",
    color: "var(--ink-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: 14,
  },
  brandText: { fontSize: 15, fontWeight: 600, color: "var(--ink-strong)" },
  nav: { padding: "6px 0" },
  groupHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 18px",
    background: "none",
    border: "none",
    cursor: "pointer",
    font: "inherit",
    color: "var(--ink)",
  },
  groupLabel: { flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600 },
  count: { fontSize: 11, color: "var(--muted)" },
  soonBadge: {
    fontSize: 10,
    fontWeight: 500,
    color: "var(--ink-strong)",
    background: "var(--accent-bg)",
    padding: "2px 6px",
    borderRadius: 5,
  },
  chevron: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--muted)",
    width: 12,
    textAlign: "center",
  },
  subList: { paddingBottom: 4 },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 18px 7px 34px",
    fontSize: 13,
    color: "var(--muted)",
    borderLeft: "2px solid transparent",
  },
  alertBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    background: "#B0281F",
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
  },
  itemActive: {
    color: "var(--ink-strong)",
    background: "var(--accent-bg)",
    fontWeight: 500,
    borderLeft: "2px solid var(--ink-strong)",
  },
};
