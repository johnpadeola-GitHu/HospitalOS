import { useEffect, useState } from "react";
import { listDocs } from "./sysAdminService";
import { PageHeader } from "../../lib/ui";

export default function Documents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listDocs().then((r) => { if (alive) { setRows(r); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const cats = [...new Set(rows.map((d) => d.category))];

  return (
    <div>
      <PageHeader group="Administration" title={<>Documents &amp; templates</>} icon="Files" />

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading templates…</div>
      ) : (
        cats.map((c) => (
          <div key={c} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{c}</div>
            <div style={grid}>
              {rows.filter((d) => d.category === c).map((d) => (
                <div key={d.id} style={card}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-strong)" }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Updated {d.updated}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 };
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" };
