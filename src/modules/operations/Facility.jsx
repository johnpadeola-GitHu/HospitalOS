import { useEffect, useState, useCallback } from "react";
import { listFacility, setFacilityStatus } from "./opsAdminService";
import { Button, PageHeader } from "../../lib/ui";

const TINT = {
  operational: { bg: "#E6EFDF", fg: "#4A6329", label: "Operational" },
  attention: { bg: "#FBF0DC", fg: "#8A5A17", label: "Needs attention" },
  down: { bg: "#F7E4E2", fg: "#B0281F", label: "Down" },
};

export default function Facility() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listFacility());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const cycle = async (f) => {
    const next = f.status === "operational" ? "attention" : f.status === "attention" ? "down" : "operational";
    await setFacilityStatus(f.id, next);
    await refresh();
  };

  return (
    <div>
      <PageHeader group="Operations" title={<>Facility &amp; waste</>} icon="Building2" />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading facility status…</div>
      ) : (
        <div style={grid}>
          {rows.map((f) => {
            const t = TINT[f.status];
            return (
              <div key={f.id} style={{ ...card, ...(f.status !== "operational" ? { borderColor: t.bg === "#F7E4E2" ? "#E4B6B2" : "var(--border)" } : null) }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{f.area}</span>
                  <span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>{t.label}</span>
                </div>
                {f.note && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{f.note}</div>}
                <div style={{ marginTop: 10 }}>
                  <Button onClick={() => cycle(f)}>Change status</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 };
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
