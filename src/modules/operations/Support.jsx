import { useEffect, useState } from "react";
import { listSupport } from "./opsAdminService";
import { PageHeader } from "../../lib/ui";

export default function Support() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listSupport().then((r) => { if (alive) { setRows(r); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <PageHeader group="Operations" title={<>Catering, laundry &amp; mortuary</>} icon="UtensilsCrossed" />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading support services…</div>
      ) : (
        <div style={grid}>
          {rows.map((s) => (
            <div key={s.id} style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)" }}>{s.service}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--ink-strong)", margin: "6px 0 2px" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.metric}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 };
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
