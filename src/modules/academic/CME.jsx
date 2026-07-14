import { useEffect, useState } from "react";
import { listCME } from "./academicService";
import { PageHeader } from "../../lib/ui";

export default function CME() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let a = true; listCME().then((r) => { if (a) { setRows(r); setLoading(false); } }); return () => { a = false; }; }, []);
  return (
    <div>
      <PageHeader group="Academic" title={<>CME</>} icon="Award" />
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading activities…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((c) => (
            <div key={c.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.date} · {c.category}</div>
              </div>
              <span style={credits}>{c.credits} credits</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const card = { display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const credits = { fontSize: 11, fontWeight: 600, color: "#1E3350", background: "#D3E1F8", padding: "3px 10px", borderRadius: 999 };
