import { useEffect, useState } from "react";
import { listEthics, ETHICS_TINT } from "./academicService";
import { PageHeader } from "../../lib/ui";

export default function Ethics() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let a = true; listEthics().then((r) => { if (a) { setRows(r); setLoading(false); } }); return () => { a = false; }; }, []);
  return (
    <div>
      <PageHeader group="Academic" title={<>Ethics committee</>} icon="Scale" />
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Ref", "Study", "Submitted", "Status"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={emptyCell}>Loading…</td></tr> :
              rows.map((e) => {
                const t = ETHICS_TINT[e.status];
                return (
                  <tr key={e.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{e.ref}</td>
                    <td style={{ ...td, fontWeight: 500, color: "var(--ink-strong)" }}>{e.title}</td>
                    <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{e.submitted}</td>
                    <td style={td}><span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999 }}>{t.label}</span></td>
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
