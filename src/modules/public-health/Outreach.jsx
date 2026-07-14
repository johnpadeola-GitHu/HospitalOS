import { useEffect, useState } from "react";
import { listOutreach } from "./publicHealthService";
import { PageHeader } from "../../lib/ui";

const TINT = { planned: { bg: "#E3ECF7", fg: "#3A5170", label: "Planned" }, completed: { bg: "#E6EFDF", fg: "#4A6329", label: "Completed" } };

export default function Outreach() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let a = true; listOutreach().then((r) => { if (a) { setRows(r); setLoading(false); } }); return () => { a = false; }; }, []);
  return (
    <div>
      <PageHeader group="Public health" title={<>Outreach &amp; community</>} icon="Users" />
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading activities…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((o) => {
            const t = TINT[o.status];
            return (
              <div key={o.id} style={card}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{o.activity}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{o.date} · {o.team}{o.reached > 0 ? ` · ${o.reached} reached` : ""}</div>
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
