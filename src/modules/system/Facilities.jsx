import { useEffect, useState, useCallback } from "react";
import { listSites, toggleSite } from "./sysAdminService";
import { Button, PageHeader } from "../../lib/ui";

export default function Facilities() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSites(await listSites());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (id) => { await toggleSite(id); await refresh(); };

  return (
    <div>
      <PageHeader group="Administration" title={<>Facilities &amp; sites</>} icon="Hospital" />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading sites…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sites.map((s) => (
            <div key={s.id} style={{ ...card, opacity: s.active ? 1 : 0.6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.type}{s.beds > 0 ? ` · ${s.beds} beds` : ""}</div>
              </div>
              <span style={s.active ? activePill : inactivePill}>{s.active ? "Active" : "Inactive"}</span>
              <Button onClick={() => toggle(s.id)}>{s.active ? "Deactivate" : "Activate"}</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const card = { display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const activePill = { fontSize: 11, fontWeight: 500, color: "#4A6329", background: "#E6EFDF", padding: "2px 9px", borderRadius: 999 };
const inactivePill = { fontSize: 11, fontWeight: 500, color: "var(--muted)", background: "var(--surface)", padding: "2px 9px", borderRadius: 999 };
