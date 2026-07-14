import { useEffect, useState } from "react";
import { listSurveillance } from "./publicHealthService";

const TREND = { up: { c: "#B0281F", s: "▲" }, down: { c: "#4A6329", s: "▼" }, flat: { c: "var(--muted)", s: "▬" } };

export default function Surveillance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let a = true; listSurveillance().then((r) => { if (a) { setRows(r); setLoading(false); } }); return () => { a = false; }; }, []);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Public health</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)" }}>Disease surveillance</h1>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Notifiable diseases with a rising trend raise an alert.</div>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Disease", "Cases (this week)", "Trend", "Notifiable"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={emptyCell}>Loading…</td></tr> :
              rows.map((d) => {
                const t = TREND[d.trend];
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{d.disease}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{d.cases}</td>
                    <td style={{ ...td, color: t.c, fontWeight: 600 }}>{t.s} {d.trend}</td>
                    <td style={td}>{d.notifiable ? <span style={notif}>Notifiable</span> : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const tableWrap = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th = { textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", padding: "11px 14px", background: "var(--surface)" };
const td = { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" };
const emptyCell = { padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 };
const notif = { fontSize: 11, fontWeight: 500, color: "#8A5A17", background: "#FBF0DC", padding: "2px 9px", borderRadius: 999 };
