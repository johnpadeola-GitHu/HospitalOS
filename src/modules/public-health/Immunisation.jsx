import { useEffect, useState } from "react";
import { listImmunisation } from "./publicHealthService";

export default function Immunisation() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let a = true; listImmunisation().then((r) => { if (a) { setRows(r); setLoading(false); } }); return () => { a = false; }; }, []);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Public health</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Immunisation programmes</h1>
      </div>
      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading coverage…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((v) => (
            <div key={v.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-strong)" }}>{v.vaccine}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{v.given}/{v.target} · <b style={{ color: v.coverage >= 90 ? "#4A6329" : v.coverage >= 70 ? "#8A5A17" : "#B0281F" }}>{v.coverage}%</b></span>
              </div>
              <div style={track}><div style={{ ...fill, width: `${v.coverage}%`, background: v.coverage >= 90 ? "#4A6329" : v.coverage >= 70 ? "#C8860A" : "#B0281F" }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const card = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" };
const track = { height: 8, borderRadius: 999, background: "var(--surface)", overflow: "hidden" };
const fill = { height: "100%", borderRadius: 999 };
