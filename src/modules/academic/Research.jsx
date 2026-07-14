import { useEffect, useState } from "react";
import { listResearch } from "./academicService";

const TINT = {
  ongoing: { bg: "#E6EFDF", fg: "#4A6329", label: "Ongoing" },
  recruiting: { bg: "#E3ECF7", fg: "#3A5170", label: "Recruiting" },
  analysis: { bg: "#FBF0DC", fg: "#8A5A17", label: "Analysis" },
  complete: { bg: "#EDEFF2", fg: "#6B7C96", label: "Complete" },
};

export default function Research() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let a = true; listResearch().then((r) => { if (a) { setRows(r); setLoading(false); } }); return () => { a = false; }; }, []);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Academic</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Research &amp; trials</h1>
      </div>
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading projects…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((p) => {
            const t = TINT[p.status] || TINT.ongoing;
            return (
              <div key={p.id} style={card}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>PI: {p.pi} · {p.dept}</div>
                </div>
                <span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>{t.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
const card = { display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
