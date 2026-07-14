import { useEffect, useState } from "react";
import { listTraining } from "./academicService";
import { PageHeader } from "../../lib/ui";

export default function Training() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let a = true; listTraining().then((r) => { if (a) { setRows(r); setLoading(false); } }); return () => { a = false; }; }, []);

  return (
    <div>
      <PageHeader group="Academic" title={<>Training &amp; rotations</>} icon="GraduationCap" />
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading programmes…</div> : (
        <div style={grid}>
          {rows.map((t) => (
            <div key={t.id} style={card}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-strong)" }}>{t.programme}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{t.level} · Lead: {t.lead}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--ink-strong)", marginTop: 8 }}>{t.trainees}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>trainees enrolled</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 };
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" };
